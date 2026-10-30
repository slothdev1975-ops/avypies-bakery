"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/company", label: "Company" },
  { href: "/admin/users", label: "Admins" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {LINKS.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 ${active ? "bg-ink text-white" : "hover:bg-mist"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
