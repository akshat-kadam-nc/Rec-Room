import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecRoom } from "@/app/bookshelf/rec-room";
import type { LibraryVolume, RoomCollection } from "@/app/bookshelf/room-content";
import type { RoomHotspot } from "@/app/bookshelf/rec-room-diorama";
import { getTenantRoom } from "@/lib/tenants";

type Context = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const { slug } = await params;
  const room = await getTenantRoom(slug);
  if (!room) return { title: "Room not found | Rec Room" };
  return { title: `${room.configuration?.title || room.tenant.name} — ${room.configuration?.ownerName || room.tenant.name}`, description: `${room.configuration?.ownerName || room.tenant.name}'s personal corner of the internet.` };
}

export default async function TenantRoomPage({ params }: Context) {
  const { slug } = await params;
  const room = await getTenantRoom(slug);
  if (!room) notFound();
  const content = room.content as unknown as { libraryVolumes?: LibraryVolume[]; roomCollections?: Record<RoomHotspot, RoomCollection> } | null;
  return <RecRoom slug={slug} ownerName={room.configuration?.ownerName || room.tenant.name} roomTitle={room.configuration?.title || "The Rec Room"} locationLabel={room.configuration?.locationLabel} theme={room.configuration?.background?.theme} templateId={room.configuration?.background?.templateId} markerStyle={room.configuration?.objectVariation?.markers} enabledComponents={room.configuration?.objectVariation?.enabledComponents} volumes={content?.libraryVolumes} collections={content?.roomCollections} />;
}
