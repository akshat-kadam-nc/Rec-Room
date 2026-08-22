import { AdminStudio } from "@/app/admin/studio";
import { LogoutButton } from "@/components/logout-button";
import { getDatabase } from "@/lib/mongodb";
import { requireTenantMembership } from "@/lib/tenants";
import { redirect } from "next/navigation";

type Context = { params: Promise<{ slug: string }> };

export const metadata = { title: "Rec Room Studio", robots: { index: false, follow: false } };

export default async function TenantAdminPage({ params }: Context) {
  const { slug } = await params;
  const access = await requireTenantMembership(slug);
  if (!access) redirect(`/login?next=/${slug}/admin`);
  const db = await getDatabase();
  const [configuration, content, playlistDocument, profile] = await Promise.all([
    db.collection("roomConfigurations").findOne({ tenantId: access.tenant._id }),
    db.collection("curatedContent").findOne({ tenantId: access.tenant._id }),
    db.collection("roomPlaylists").findOne({ tenantId: access.tenant._id }),
    db.collection("tenantProfiles").findOne({ tenantId: access.tenant._id }),
  ]);
  const safeContent = content ? JSON.parse(JSON.stringify(content)) : undefined;
  const safeConfiguration = configuration ? JSON.parse(JSON.stringify(configuration)) : undefined;
  const safePlaylists = playlistDocument ? JSON.parse(JSON.stringify(playlistDocument)) : undefined;
  const safeProfile = profile ? JSON.parse(JSON.stringify(profile)) : undefined;
  return <><AdminStudio slug={slug} ownerName={configuration?.ownerName || access.session.user.name} initialContent={safeContent} initialConfiguration={safeConfiguration} initialPlaylists={safePlaylists} initialProfile={safeProfile} /><div className="studio-logout"><LogoutButton /></div></>;
}
