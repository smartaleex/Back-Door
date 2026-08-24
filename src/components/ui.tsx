import Link from "next/link";
import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm shadow-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground";

export const labelClass = "block text-sm font-medium mb-1";

export const buttonClass =
  "inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-md border border-black/15 dark:border-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10";

export const dangerButtonClass =
  "inline-flex items-center justify-center rounded-md border border-red-500/30 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-foreground/60">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-black/10 bg-black/[0.015] p-5 dark:border-white/10 dark:bg-white/[0.03] ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <p className="text-sm text-foreground/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-foreground/50">{hint}</p> : null}
    </Card>
  );
}

export function EmptyState({ message, cta, href }: { message: string; cta?: string; href?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-black/15 p-10 text-center dark:border-white/20">
      <p className="text-sm text-foreground/60">{message}</p>
      {cta && href ? (
        <Link href={href} className={`${buttonClass} mt-4`}>
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

export function formatPercent(value: number | null) {
  if (value === null) return "—";
  return `${value.toFixed(1)}%`;
}
