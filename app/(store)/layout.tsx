import Link from "next/link";
import { getCompany } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { addressLines, publicImageUrl } from "@/lib/format";
import { CartProvider } from "@/components/CartProvider";
import { CartLink } from "@/components/CartLink";

const navLink = "rounded-full px-3 py-2 hover:bg-mist";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [company, { user, profile }] = await Promise.all([getCompany(), getSession()]);
  const logo = publicImageUrl(company.logo_path);

  return (
    <CartProvider>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            {logo ? <img src={logo} alt="" className="h-11 w-auto max-w-[140px] object-contain" /> : null}
            <span className="font-display text-xl">{company.name}</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {user ? (
              <>
                <Link href="/account/orders" className={navLink}>
                  My orders
                </Link>
                <Link href="/account/profile" className={navLink}>
                  Profile
                </Link>
                {profile?.role === "admin" ? (
                  <Link href="/admin/orders" className={navLink}>
                    Admin
                  </Link>
                ) : null}
                <form action="/auth/signout" method="post">
                  <button className={navLink}>Sign out</button>
                </form>
              </>
            ) : (
              <Link href="/login" className={navLink}>
                Sign in
              </Link>
            )}
            <CartLink />
          </nav>
        </div>
      </header>

      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-10 sm:px-6">{children}</main>

      <footer className="border-t border-line bg-mist">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-ink-soft sm:grid-cols-3 sm:px-6">
          <div>
            <p className="font-display text-base text-ink">{company.legal_name || company.name}</p>
            {company.vat_number ? <p>VAT no. {company.vat_number}</p> : null}
          </div>
          <address className="not-italic">
            {addressLines(company).map((l) => (
              <p key={l}>{l}</p>
            ))}
          </address>
          <div>
            {company.phone ? <p>{company.phone}</p> : null}
            {company.email ? <p>{company.email}</p> : null}
          </div>
        </div>
      </footer>
    </CartProvider>
  );
}
