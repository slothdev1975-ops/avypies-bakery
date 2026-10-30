import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCompany } from "@/lib/data";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const { profile } = await getSession();
  if (profile?.role === "admin") redirect("/admin/orders");
  const company = await getCompany();

  return (
    <div className="grid min-h-screen place-items-center bg-mist px-4">
      <div className="panel w-full max-w-sm">
        <p className="text-sm text-ink-soft">{company.name}</p>
        <h1 className="mt-1 font-display text-3xl">Admin sign in</h1>
        <AdminLoginForm />
      </div>
    </div>
  );
}
