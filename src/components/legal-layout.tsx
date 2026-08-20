import Link from "next/link";
import type { ReactNode } from "react";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="grid-glow min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-lg font-black text-white">
            C
          </span>
          <span className="font-semibold text-white">ClipForge AI</span>
        </Link>
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← Home
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-20">
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated {updated}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300 [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
          {children}
        </div>
      </main>
      <footer className="border-t border-white/8 py-8 text-center text-xs text-slate-600">
        <Link href="/terms" className="hover:text-slate-400">
          Terms
        </Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-slate-400">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
