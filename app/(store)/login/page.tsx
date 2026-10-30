import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { safeNext } from "@/lib/format";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const { user } = await getSession();
  if (user) redirect(safeNext(next) ?? "/");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-4xl">Sign in or create an account</h1>
      <p className="mt-3 text-ink-soft">
        Enter your email address and we&rsquo;ll send you a one-time code. No password needed.
      </p>
      <LoginForm next={safeNext(next) ?? "/"} />
    </div>
  );
}
