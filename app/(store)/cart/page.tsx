import { getCompany } from "@/lib/data";
import { getSession, isProfileComplete } from "@/lib/auth";
import { CartView } from "./CartView";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [company, { user, profile }] = await Promise.all([getCompany(), getSession()]);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-display text-4xl">Your cart</h1>
      <CartView
        signedIn={!!user}
        profileComplete={isProfileComplete(profile)}
        vatPercent={Number(company.vat_percent)}
        currency={company.currency || "ZAR"}
      />
    </div>
  );
}
