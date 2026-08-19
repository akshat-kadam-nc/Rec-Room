"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({ email: String(form.get("email") || ""), password: String(form.get("password") || ""), rememberMe: true });
    if (result.error) { setError("Invalid email or password."); setPending(false); return; }
    const next = params.get("next");
    if (next?.startsWith("/")) {
      router.push(next);
      router.refresh();
      return;
    }
    const tenantResponse = await fetch("/api/tenants", { cache: "no-store" });
    const tenant = await tenantResponse.json();
    if (!tenantResponse.ok || !tenant.slug) {
      setError(tenant.error || "Your account is signed in, but no room was found.");
      setPending(false);
      return;
    }
    router.push(`/${tenant.slug}`);
    router.refresh();
  }
  return <form className="auth-form" onSubmit={submit}>
    <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
    <label><span>Password</span><div className="password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required /><button type="button" aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? "HIDE" : "SHOW"}</button></div></label>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button type="submit" disabled={pending}>{pending ? "OPENING…" : "ENTER MY ROOM"}</button>
    <p>Need a room? <Link href="/register">Register</Link></p>
  </form>;
}
