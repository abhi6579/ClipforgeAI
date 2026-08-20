"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Replace with Sentry.captureException(error) once DSN is configured.
    console.error("[app]", error);
  }, [error]);

  return (
    <div className="grid-glow flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/15 text-3xl">⚠️</div>
      <h1 className="mt-5 text-2xl font-bold text-white">Something broke on our end</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        Your work is saved — this screen just failed to render. Try again, and if it keeps happening let us know.
      </p>
      {error.digest && <p className="mt-3 font-mono text-[11px] text-slate-600">ref: {error.digest}</p>}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/25 hover:brightness-110"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/12 px-5 py-2.5 text-sm text-slate-200 hover:border-white/25 hover:bg-white/5"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
