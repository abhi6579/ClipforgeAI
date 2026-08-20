"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  plan: string;
  credits: number;
  streak: number;
  niche: string;
  avatarHue: number;
};

type Ctx = {
  user: SessionUser;
  setCredits: (n: number) => void;
  setPlan: (p: string) => void;
};

const UserCtx = createContext<Ctx | null>(null);

export function UserProvider({ value, children }: { value: SessionUser; children: ReactNode }) {
  const [user, setUser] = useState(value);
  return (
    <UserCtx.Provider
      value={{
        user,
        setCredits: (n) => setUser((u) => ({ ...u, credits: n })),
        setPlan: (p) => setUser((u) => ({ ...u, plan: p })),
      }}
    >
      {children}
    </UserCtx.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
