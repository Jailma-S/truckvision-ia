import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("card-3d reveal rounded-2xl p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-xs font-semibold tracking-[0.08em] text-muted uppercase", className)}
      {...props}
    />
  );
}

const buttonVariants = {
  primary: "btn-3d text-white",
  secondary:
    "border border-border bg-surface-2/70 text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_4px_12px_-6px_rgb(0_0_0/0.6)] hover:bg-surface-2 hover:border-accent/30",
  ghost: "text-muted hover:bg-white/5 hover:text-foreground",
} as const;

export function Button({
  className,
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

const field =
  "field-3d w-full rounded-lg border border-border px-3 text-sm text-foreground placeholder:text-muted/70 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-primary/30 [&>option]:bg-card";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(field, "h-9", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(field, "h-9", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "py-2", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1 block text-xs font-medium text-muted", className)} {...props} />;
}

export function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 text-[11px] font-semibold tracking-[0.18em] text-accent uppercase">TruckVision IA</p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white/[0.02] p-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}
