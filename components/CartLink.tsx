"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="btn btn-primary btn-sm ml-1">
      Cart
      {count > 0 ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-butter px-1 text-[11px] font-semibold text-ink">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
