import Link from "next/link";
import { RegisterForm } from "./auth-form";

export const metadata = { title: "Create your Rec Room" };

export default function RegisterPage() {
  return <main className="auth-page"><header><Link className="issue-mark" href="/"><img src="/favicon.svg" alt="Rec Room" /></Link><Link href="/login">LOG IN</Link></header><section><div className="auth-intro"><span>ROOM KEY / NEW TENANT</span><h1>Make a room<br />of your own.</h1><p>Choose your address, then curate the books, films, games, writing, and internet discoveries that make the room yours.</p></div><RegisterForm /></section></main>;
}
