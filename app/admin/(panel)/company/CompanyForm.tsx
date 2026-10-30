"use client";

import { useActionState } from "react";
import { Field } from "@/components/admin/Field";
import { FormMessage } from "@/components/FormMessage";
import { publicImageUrl } from "@/lib/format";
import type { Company, FormState } from "@/lib/types";
import { saveCompany } from "./actions";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="panel grid gap-6 md:grid-cols-[14rem_1fr]">
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-ink-soft">{hint}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function CompanyForm({ company }: { company: Company }) {
  const [state, action, pending] = useActionState(saveCompany, {} as FormState);
  const v = (k: keyof Company) => state.values?.[k] ?? (company[k] as string | number | null) ?? "";
  const logo = publicImageUrl(company.logo_path);

  return (
    <form action={action} className="space-y-6">
      <Section title="Business" hint="Shown in the store header and on invoices.">
        <Field label="Store name" name="name" defaultValue={v("name")} required />
        <Field label="Registered (legal) name" name="legal_name" defaultValue={v("legal_name")} hint="Printed on invoices if set." />
        <Field label="Tagline" name="tagline" defaultValue={v("tagline")} className="sm:col-span-2" hint="One line under the store name on the home page." />
        <Field label="Company registration no." name="registration_number" defaultValue={v("registration_number")} />
        <Field label="VAT number" name="vat_number" defaultValue={v("vat_number")} />
        <Field label="VAT %" name="vat_percent" type="number" step="0.01" min="0" max="100" defaultValue={v("vat_percent")} required hint="Applied to new orders. Existing orders keep their rate." />
        <Field label="Currency" name="currency" defaultValue={v("currency")} hint="3-letter code, e.g. ZAR." />
      </Section>

      <Section title="Address">
        <Field label="Street address" name="address_line1" defaultValue={v("address_line1")} className="sm:col-span-2" />
        <Field label="Address line 2" name="address_line2" defaultValue={v("address_line2")} className="sm:col-span-2" />
        <Field label="City" name="city" defaultValue={v("city")} />
        <Field label="Province" name="province" defaultValue={v("province")} />
        <Field label="Postal code" name="postal_code" defaultValue={v("postal_code")} />
        <Field label="Country" name="country" defaultValue={v("country")} />
      </Section>

      <Section title="Contact" hint="Order notifications are sent to this email.">
        <Field label="Email" name="email" type="email" defaultValue={v("email")} />
        <Field label="Phone" name="phone" type="tel" defaultValue={v("phone")} />
      </Section>

      <Section title="Payment details" hint="Customers see these after ordering so they can pay by EFT.">
        <Field label="Bank details" name="bank_details" textarea defaultValue={v("bank_details")} className="sm:col-span-2" />
      </Section>

      <Section title="Logo" hint="Shown in the store and on invoices. PNG, JPG or WebP, up to 4 MB.">
        <div className="sm:col-span-2 flex flex-wrap items-center gap-6">
          {logo ? (
            <img src={logo} alt="Current logo" className="h-20 w-auto max-w-[200px] rounded-lg border border-line object-contain p-2" />
          ) : (
            <p className="text-sm text-ink-soft">No logo uploaded yet.</p>
          )}
          <div className="space-y-2">
            <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" className="text-sm" aria-label="Upload a new logo" />
            {logo ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="remove_logo" /> Remove the current logo
              </label>
            ) : null}
          </div>
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Save changes"}
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
