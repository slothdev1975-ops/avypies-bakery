import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  const company = await getCompany();

  return (
    <div className="min-h-screen bg-mist">
      <header className="no-print border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <span className="font-display text-lg">{company.name}</span>
          <AdminNav />
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="hidden text-ink-soft md:inline">{profile.email}</span>
            <Link href="/" className="underline">View store</Link>
            <form action="/auth/signout?to=/admin/login" method="post">
              <button className="underline">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
