"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/FormMessage";
import type { FormState, Profile } from "@/lib/types";
import { updateProfile } from "./actions";

export function ProfileForm({ profile, next }: { profile: Profile; next: string }) {
  const [state, action, pending] = useActionState(updateProfile, {} as FormState);
  const v = (k: keyof Profile) => state.values?.[k] ?? (profile[k] as string | null) ?? "";

  const field = (name: keyof Profile, label: string, opts: { required?: boolean; autoComplete?: string; type?: string } = {}) => (
    <div>
      <label htmlFor={name} className="label">
        {label}
        {opts.required ? "" : <span className="font-normal text-ink-soft"> (optional)</span>}
      </label>
      <input
        id={name}
        name={name}
        type={opts.type ?? "text"}
        required={opts.required}
        autoComplete={opts.autoComplete}
        defaultValue={v(name)}
        className="field"
      />
    </div>
  );

  return (
    <form action={action} className="mt-8 space-y-6">
      <input type="hidden" name="next" value={next} />
      <div>
        <p className="label">Email</p>
        <p className="text-sm text-ink-soft">{profile.email}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("first_name", "First name", { required: true, autoComplete: "given-name" })}
        {field("last_name", "Last name", { required: true, autoComplete: "family-name" })}
        {field("phone", "Phone number", { required: true, autoComplete: "tel", type: "tel" })}
      </div>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-display text-xl">Delivery address</legend>
        <div className="sm:col-span-2">{field("address_line1", "Street address", { required: true, autoComplete: "address-line1" })}</div>
        <div className="sm:col-span-2">{field("address_line2", "Complex, unit or suburb", { autoComplete: "address-line2" })}</div>
        {field("city", "City or town", { required: true, autoComplete: "address-level2" })}
        {field("province", "Province", { autoComplete: "address-level1" })}
        {field("postal_code", "Postal code", { required: true, autoComplete: "postal-code" })}
      </fieldset>
      <FormMessage state={state} />
      <button disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}
