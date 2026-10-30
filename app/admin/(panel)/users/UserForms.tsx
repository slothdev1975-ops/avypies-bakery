"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/FormMessage";
import type { FormState } from "@/lib/types";
import { addAdmin, changeOwnPassword } from "./actions";

export function AddAdminForm() {
  const [state, action, pending] = useActionState(addAdmin, {} as FormState);
  return (
    <form action={action} className="panel space-y-4">
      <h2 className="font-display text-xl">Add an admin</h2>
      <p className="text-sm text-ink-soft">
        Admins sign in with email and password. If the email already has a customer account, it gets admin access.
      </p>
      <div>
        <label htmlFor="new-email" className="label">Email</label>
        <input id="new-email" name="email" type="email" required defaultValue={state.values?.email ?? ""} className="field" />
      </div>
      <div>
        <label htmlFor="new-password" className="label">Password</label>
        <input id="new-password" name="password" type="password" required minLength={10} autoComplete="new-password" className="field" />
        <p className="mt-1 text-xs text-ink-soft">At least 10 characters. Share it with them securely.</p>
      </div>
      <FormMessage state={state} />
      <button disabled={pending} className="btn btn-primary">{pending ? "Adding…" : "Add admin"}</button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, {} as FormState);
  return (
    <form action={action} className="panel space-y-4">
      <h2 className="font-display text-xl">Change your password</h2>
      <div>
        <label htmlFor="pw" className="label">New password</label>
        <input id="pw" name="password" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </div>
      <div>
        <label htmlFor="pw2" className="label">Repeat new password</label>
        <input id="pw2" name="confirm" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </div>
      <FormMessage state={state} />
      <button disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}
