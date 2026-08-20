import { UnauthorizedError } from "@/lib/auth";

export function ok<T>(data: T, init?: number) {
  return Response.json(data, { status: init ?? 200 });
}

export function fail(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof UnauthorizedError) return fail("You need to sign in.", 401);
    // Malformed request bodies are the caller's fault, not a server crash.
    if (err instanceof SyntaxError) return fail("Malformed request body.", 400);
    console.error("[api]", err);
    return fail("Something went wrong on our side.", 500);
  }
}

export function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}

export function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Basic email sanity check — good enough without pulling a dependency. */
export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}
