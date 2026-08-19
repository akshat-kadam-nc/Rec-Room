"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return <button className="logout-button" type="button" onClick={async () => { await authClient.signOut(); router.push("/"); router.refresh(); }}>LOG OUT</button>;
}
