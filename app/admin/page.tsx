import { notFound } from "next/navigation";
import { AdminStudio } from "./studio";

export const metadata = { title: "Archive Studio | Akshat Kadam", robots: { index: false, follow: false } };

export default function AdminPage() {
  if (process.env.NODE_ENV === "production" && process.env.ADMIN_PREVIEW !== "true") notFound();
  return <AdminStudio />;
}
