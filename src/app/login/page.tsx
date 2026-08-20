import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await ensureSeed();
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="grid-glow flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-lg font-black text-white">
            C
          </span>
          <span className="text-lg font-semibold text-white">ClipForge AI</span>
        </Link>
        <div className="glass animate-fade-up rounded-3xl p-7">
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-slate-400">
            Pick up where you left off — your clips are waiting.
          </p>
          <AuthForm mode="login" />
        </div>
        <p className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-center text-xs text-slate-400">
          Demo account is pre-filled: <span className="text-slate-200">demo@clipforge.ai</span> /{" "}
          <span className="text-slate-200">demo1234</span>
        </p>
      </div>
    </div>
  );
}
