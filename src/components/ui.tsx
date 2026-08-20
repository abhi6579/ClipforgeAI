"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ---------------- Toasts ---------------- */

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
const ToastCtx = createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-pop rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur",
              t.tone === "success" && "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
              t.tone === "error" && "border-rose-400/30 bg-rose-500/15 text-rose-100",
              t.tone === "info" && "border-white/10 bg-ink-800/90 text-slate-100",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Primitives ---------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "soft";
  size?: "sm" | "md";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
        variant === "primary" &&
          "bg-gradient-to-r from-brand-600 to-fuchsia-500 text-white shadow-lg shadow-brand-600/25 hover:brightness-110",
        variant === "soft" && "bg-white/8 text-slate-100 hover:bg-white/14",
        variant === "outline" && "border border-white/12 text-slate-200 hover:border-white/25 hover:bg-white/5",
        variant === "ghost" && "text-slate-300 hover:bg-white/8 hover:text-white",
        variant === "danger" && "bg-rose-500/15 text-rose-200 hover:bg-rose-500/25",
        className,
      )}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass rounded-2xl", className)}>{children}</div>;
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "violet" | "green" | "amber" | "sky" | "rose";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-white/8 text-slate-300 border-white/10",
    violet: "bg-brand-500/15 text-brand-400 border-brand-500/25",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    sky: "bg-sky-500/15 text-sky-300 border-sky-500/25",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

const fieldStyle =
  "w-full rounded-xl border border-white/10 bg-ink-900/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldStyle, props.className)} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldStyle, "min-h-24 resize-y", props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldStyle, "appearance-none pr-8", props.className)} />;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={cn(
          "animate-pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-ink-850 p-6 shadow-2xl sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/8 hover:text-white">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-16 text-center">
      <div className="animate-floaty mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-600/30 to-fuchsia-500/20 text-3xl">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-400">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-20 rounded-2xl" />
      ))}
    </div>
  );
}

export function ScoreRing({ value, size = 56 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 80 ? "#34d399" : pct >= 65 ? "#a78bfa" : "#fbbf24";
  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
      }}
    >
      <div className="grid place-items-center rounded-full bg-ink-850" style={{ width: size - 10, height: size - 10 }}>
        <span className="text-xs font-semibold text-white">{Math.round(pct)}</span>
      </div>
    </div>
  );
}

export function useCopy() {
  const toast = useToast();
  return useMemo(
    () => async (text: string, label = "Copied to clipboard") => {
      try {
        await navigator.clipboard.writeText(text);
        toast(label, "success");
      } catch {
        toast("Could not copy", "error");
      }
    },
    [toast],
  );
}
