"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type FieldConfig = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder: string;
};

type AuthCardProps = {
  title: string;
  subtitle: string;
  fields: FieldConfig[];
  endpoint: "/api/auth/login" | "/api/auth/register";
  submitLabel: string;
  alternateLabel: string;
  alternateHref: string;
};

export function AuthCard({
  title,
  subtitle,
  fields,
  endpoint,
  submitLabel,
  alternateLabel,
  alternateHref,
}: AuthCardProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as {
      errors?: Record<string, string>;
      message?: string;
      redirectTo?: string;
    };

    if (!response.ok) {
      setErrors(payload.errors ?? {});
      setMessage(payload.message ?? "Die Eingabe konnte nicht verarbeitet werden.");
      return;
    }

    setErrors({});
    startTransition(() => {
      router.push(payload.redirectTo ?? "/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="theme-panel w-full max-w-xl rounded-[32px] p-8">
      <p className="theme-kicker">Workday Flow</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--foreground)]">{title}</h1>
      <p className="theme-copy mt-3 max-w-lg text-sm leading-6">{subtitle}</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className={field.name === "password" || fields.length <= 2 ? "sm:col-span-2" : ""}>
              <span className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">{field.label}</span>
              <input
                type={field.type ?? "text"}
                autoComplete={field.autoComplete}
                required
                value={values[field.name] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))
                }
                className={`theme-input rounded-2xl px-4 py-3 text-sm ${errors[field.name] ? "theme-input-error" : ""}`}
                placeholder={field.placeholder}
              />
              {errors[field.name] ? <span className="mt-2 block text-xs text-red-600">{errors[field.name]}</span> : null}
            </label>
          ))}
        </div>

        {message ? <div className="theme-message theme-message-error rounded-2xl px-4 py-3 text-sm">{message}</div> : null}

        <button
          type="submit"
          disabled={pending}
          className="theme-button-primary w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Bitte warten..." : submitLabel}
        </button>
      </form>

      <p className="theme-copy mt-6 text-center text-sm">
        <Link href={alternateHref} className="font-semibold text-[color:var(--primary)] transition hover:text-[color:var(--primary-strong)]">
          {alternateLabel}
        </Link>
      </p>
    </div>
  );
}
