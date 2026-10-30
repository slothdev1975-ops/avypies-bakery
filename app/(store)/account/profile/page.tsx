import { requireCustomer } from "@/lib/auth";
import { safeNext } from "@/lib/format";
import { ProfileForm } from "./ProfileForm";
import type { Profile } from "@/lib/types";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; next?: string }>;
}) {
  const { welcome, next } = await searchParams;
  const { profile } = await requireCustomer("/account/profile");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl">{welcome ? "Welcome" : "Your details"}</h1>
      <p className="mt-3 text-ink-soft">
        {welcome
          ? "Add your details so we can deliver your orders. You only need to do this once."
          : "We use these details for delivery and on your invoices."}
      </p>
      <ProfileForm profile={profile as Profile} next={safeNext(next) ?? (welcome ? "/" : "")} />
    </div>
  );
}
