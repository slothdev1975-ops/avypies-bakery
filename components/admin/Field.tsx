type Props = {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
  max?: string;
  hint?: string;
  textarea?: boolean;
  className?: string;
};

export function Field({ label, name, defaultValue, type = "text", required, step, min, max, hint, textarea, className }: Props) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {textarea ? (
        <textarea id={id} name={name} rows={4} defaultValue={defaultValue ?? ""} required={required} className="field" />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          step={step}
          min={min}
          max={max}
          required={required}
          defaultValue={defaultValue ?? ""}
          className="field"
        />
      )}
      {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}
