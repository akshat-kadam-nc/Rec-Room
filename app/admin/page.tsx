import { redirect } from "next/navigation";

export const metadata = { title: "Archive Studio | Akshat Kadam", robots: { index: false, follow: false } };

export default function AdminPage() {
  redirect("/login");
}
