import type { FormState } from "@/lib/types";

export function FormMessage({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="rounded-lg bg-sage/10 px-3 py-2 text-sm text-sage">
        {state.ok}
      </p>
    );
  return null;
}
