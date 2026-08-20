"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [email, setEmail] = useState(isLogin ? "demo@clipforge.ai" : "");
  const [password, setPassword] = useState(isLogin ? "demo1234" : "");
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, niche }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!isLogin && (
        <>
          <Field label="Creator name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" required />
          </Field>
          <Field label="Your niche" hint="Used to personalise AI ideas.">
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Fitness, tech reviews, cooking…" />
          </Field>
        </>
      )}
      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
          required
        />
      </Field>
      <Field label="Password">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
        />
      </Field>

      {error && (
        <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {isLogin ? "Sign in to studio" : "Create free account"}
      </Button>

      <p className="text-center text-sm text-slate-400">
        {isLogin ? (
          <>
            New here?{" "}
            <Link href="/register" className="text-brand-400 hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-brand-400 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
