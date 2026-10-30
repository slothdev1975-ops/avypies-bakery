import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";
import { removeAdmin } from "./actions";
import { AddAdminForm, ChangePasswordForm } from "./UserForms";

export default async function AdminUsersPage() {
  const { user } = await requireAdmin();
  const { data } = await createAdminClient().from("profiles").select("*").eq("role", "admin").order("email");
  const admins = (data ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Admins</h1>
      <div className="panel p-0">
        <ul className="divide-y divide-line">
          {admins.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-6 py-3">
              <span className="flex-1">
                {a.email}
                {a.id === user.id ? <span className="ml-2 text-xs text-ink-soft">(you)</span> : null}
              </span>
              {a.id !== user.id ? (
                <form action={removeAdmin.bind(null, a.id)}>
                  <button className="text-sm underline">Remove admin access</button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AddAdminForm />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
