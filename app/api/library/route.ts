import { NextResponse } from "next/server";
import { findPublicTenant } from "@/lib/tenants";

const decodeXml = (value: string) => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const text = (item: string, tag: string) => decodeXml(item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1]?.trim() ?? "");
const plainText = (value: string) => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

type FeedSource = "medium" | "substack";

async function loadFeed(feedUrl: string, source: FeedSource) {
    const parsedUrl = new URL(feedUrl);
    if (parsedUrl.protocol !== "https:") throw new Error(`${source} feed URL must use HTTPS`);
    const response = await fetch(parsedUrl, { next: { revalidate: 900 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`${source} feed returned ${response.status}`);
    const xml = await response.text();
    if (xml.length > 2_000_000 || !/<(?:rss|feed)\b/i.test(xml)) throw new Error(`${source} feed response was not a valid RSS document`);
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 30).map((match) => {
      const item = match[1];
      const categories = [...item.matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi)].map((category) => plainText(decodeXml(category[1])).toLowerCase());
      const type = source === "medium" ? "articles" : categories.some((category) => category.includes("philosoph")) ? "philosophies" : categories.some((category) => category.includes("note")) ? "notes" : "essays";
      const link = text(item, "link");
      const safeLink = /^https:\/\//i.test(link) ? link : "";
      const content = plainText(text(item, "content:encoded") || text(item, "description"));
      return { title: plainText(text(item, "title")), link: safeLink, summary: content.slice(0, 280), content: content.slice(0, 20_000), publishedAt: text(item, "pubDate"), source, type };
    }).filter((post) => post.title && post.link);
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("tenant")?.toLowerCase() ?? "";
  const tenant = await findPublicTenant(slug);
  if (!tenant) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  // Akshat's existing feeds are the first migrated integrations. Other tenants
  // remain explicitly unconfigured until feed settings are added to the studio.
  const feeds = [
    { source: "substack" as const, url: slug === "akshat" ? process.env.SUBSTACK_FEED_URL : undefined },
    { source: "medium" as const, url: slug === "akshat" ? process.env.MEDIUM_FEED_URL : undefined },
  ];
  const configuredFeeds = feeds.filter((feed): feed is { source: FeedSource; url: string } => Boolean(feed.url));
  if (!configuredFeeds.length) return NextResponse.json({ configured: false, posts: [], sources: { substack: "missing", medium: "missing" } });

  const settled = await Promise.allSettled(configuredFeeds.map((feed) => loadFeed(feed.url, feed.source)));
  const posts = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const sources = Object.fromEntries(feeds.map((feed) => {
    if (!feed.url) return [feed.source, "missing"];
    const index = configuredFeeds.findIndex((configured) => configured.source === feed.source);
    return [feed.source, settled[index]?.status === "fulfilled" ? "ready" : "unavailable"];
  }));
  settled.forEach((result, index) => { if (result.status === "rejected") console.error(`Unable to load ${configuredFeeds[index].source} library feed`, result.reason); });
  return NextResponse.json({ configured: true, posts, sources, unavailable: settled.every((result) => result.status === "rejected") });
  }
