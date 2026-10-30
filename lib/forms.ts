export function formValues(fd: FormData, keys: readonly string[]) {
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = String(fd.get(k) ?? "").trim();
  return out;
}

export function emptyToNull(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === "" ? null : v]));
}
