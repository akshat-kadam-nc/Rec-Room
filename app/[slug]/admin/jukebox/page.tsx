import { JukeboxStudio } from "@/app/admin/jukebox-studio";
import { getDatabase } from "@/lib/mongodb";
import type { RoomPlaylist } from "@/lib/playlists";
import { requireTenantMembership } from "@/lib/tenants";
import { redirect } from "next/navigation";

type Context = { params: Promise<{ slug: string }> };
export const metadata = { title: "Jukebox Studio | Rec Room", robots: { index: false, follow: false } };

export default async function JukeboxAdminPage({ params }: Context) {
  const { slug } = await params;
  const access = await requireTenantMembership(slug);
  if (!access) redirect(`/login?next=/${slug}/admin/jukebox`);
  const db = await getDatabase();
  const document = await db.collection("roomPlaylists").findOne({ tenantId: access.tenant._id });
  return <JukeboxStudio slug={slug} initialDraft={(document?.draft ?? []) as RoomPlaylist[]} initialPublished={(document?.playlists ?? []) as RoomPlaylist[]} initialHasDraft={Array.isArray(document?.draft)} />;
}
