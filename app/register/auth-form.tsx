"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const slug = String(form.get("slug") || "").trim().toLowerCase();
    const result = await authClient.signUp.email({ name, email, password });
    if (result.error) {
      setError(result.error.message || "Registration failed.");
      setPending(false);
      return;
    }
    const tenantResponse = await fetch("/api/tenants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, tenantName: `${name}'s Rec Room` }) });
    const tenantResult = await tenantResponse.json();
    if (!tenantResponse.ok) {
      setError(tenantResult.error || "Your account was created, but the room could not be created.");
      setPending(false);
      return;
    }
    router.push(`/${tenantResult.slug}/admin`);
    router.refresh();
  }

  return <form className="auth-form" onSubmit={submit}>
    <label><span>Your name</span><input name="name" autoComplete="name" required maxLength={80} /></label>
    <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
    <label><span>Password</span><input name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} /><small>At least 10 characters.</small></label>
    <label><span>Your room URL</span><div className="slug-field"><b>/</b><input name="slug" autoComplete="off" required minLength={3} maxLength={30} pattern="[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?" placeholder="your-name" /></div></label>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button type="submit" disabled={pending}>{pending ? "CREATING YOUR ROOM…" : "CREATE MY REC ROOM"}</button>
    <p>Already have a room? <Link href="/login">Log in</Link></p>
  </form>;
}
