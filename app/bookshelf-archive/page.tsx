import type { Metadata } from "next";
import { Bookshelf } from "../bookshelf/bookshelf";

export const metadata: Metadata = {
  title: "Bookshelf Archive — Akshat Kadam",
  description: "The preserved carousel Bookshelf concept from Akshat Kadam's personal archive.",
};

export default function BookshelfArchivePage() {
  return <Bookshelf />;
}
