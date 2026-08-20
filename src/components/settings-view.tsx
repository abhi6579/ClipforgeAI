"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard-shell";
import { Button, Card, Field, Input, useToast } from "@/components/ui";
import { useUser } from "@/components/user-context";

export function SettingsView({ stats }: { stats: { projects: number; clips: number; ideas: number } }) {
  const { user } = useUser();
  const [name, setName] = useState(user.name);
  const [niche, setNiche] = useState(user.niche);
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, niche }),
    });
    const data = await res.json();
    setSavingProfile(false);
    if (!res.ok) return toast(data.error ?? "Could not save", "error");
    toast("Profile updated", "success");
    router.refresh();
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSavingPassword(false);
    if (!res.ok) return toast(data.error ?? "Could not change password", "error");
    setCurrentPassword("");
    setNewPassword("");
    toast("Password changed", "success");
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your creator profile powers how the AI writes hooks and ideas." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Profile</h2>
          <form onSubmit={saveProfile} className="mt-4 space-y-4">
            <Field label="Creator name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Niche" hint="Used by the AI idea burst.">
              <Input value={niche} onChange={(e) => setNiche(e.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={user.email} disabled />
            </Field>
            <Button type="submit" loading={savingProfile}>
              Save profile
            </Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Change password</h2>
            <form onSubmit={savePassword} className="mt-4 space-y-4">
              <Field label="Current password">
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </Field>
              <Field label="New password">
                <Input
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </Field>
              <Button type="submit" variant="soft" loading={savingPassword}>
                Update password
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Your library</h2>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Videos", value: stats.projects },
                { label: "Clips", value: stats.clips },
                { label: "Ideas", value: stats.ideas },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
