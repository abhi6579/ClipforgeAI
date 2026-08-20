import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid-glow flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-7xl font-black text-white/10">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">That cut doesn&apos;t exist</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        The page you&apos;re looking for was moved, deleted, or never filmed in the first place.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/25 hover:brightness-110"
        >
          Back to dashboard
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-white/12 px-5 py-2.5 text-sm text-slate-200 hover:border-white/25 hover:bg-white/5"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
