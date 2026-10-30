"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PROMO_FLAG } from "@/components/PromoPopup";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function sendCode(e?: { preventDefault: () => void }) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    if (error || !data.user) {
      setBusy(false);
      return setError("That code is incorrect or has expired. Check the latest email, or send a new code.");
    }

    const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", data.user.id).single();
    sessionStorage.setItem(PROMO_FLAG, "1");
    router.replace(profile?.first_name ? next : `/account/profile?welcome=1&next=${encodeURIComponent(next)}`);
    router.refresh();
  }

  if (step === "email") {
    return (
      <form onSubmit={sendCode} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </div>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <button disabled={busy} className="btn btn-primary w-full">
          {busy ? "Sending code…" : "Send code"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="mt-8 space-y-4">
      <p className="text-sm">
        We sent a code to <strong>{email}</strong>.
      </p>
      <div>
        <label htmlFor="code" className="label">
          Code from the email
        </label>
        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,10}"
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="field text-center text-2xl tracking-[0.4em]"
        />
      </div>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <button disabled={busy} className="btn btn-primary w-full">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <div className="flex justify-between text-sm">
        <button type="button" className="underline" onClick={() => setStep("email")}>
          Use a different email
        </button>
        <button type="button" className="underline" onClick={() => sendCode()} disabled={busy}>
          Send a new code
        </button>
      </div>
    </form>
  );
}
