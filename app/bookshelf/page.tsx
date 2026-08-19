import type { Metadata } from "next";
import { RecRoom } from "./rec-room";

export const metadata: Metadata = {
  title: "The Rec Room — Akshat Kadam",
  description: "Akshat Kadam's interactive recreation room for writing, recommendations, games, and collected curiosities.",
};

export default function BookshelfPage() {
  return <RecRoom />;
}
