import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./auth-form";

export const metadata = { title: "Log in to Rec Room" };

export default function LoginPage() {
  return <main className="auth-page"><header><Link className="issue-mark" href="/"><img src="/favicon.svg" alt="Rec Room" /></Link><Link href="/register">CREATE A ROOM</Link></header><section><div className="auth-intro"><span>ROOM KEY / RETURNING TENANT</span><h1>Welcome<br />back inside.</h1><p>Open the studio and keep arranging your corner of the internet.</p></div><Suspense><LoginForm /></Suspense></section></main>;
}
