"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useGame } from "~/contexts/GameContext";
import { sanitizeProgress, type Progress } from "~/lib/progress";

export interface AccountUser {
  id: string;
  name: string;
  email: string;
}
type SaveStatus = "guest" | "saved" | "saving" | "error" | "offline";

interface AuthContextValue {
  user: AccountUser | null;
  available: boolean;
  saveStatus: SaveStatus;
  submit: (mode: "login" | "register", payload: { email: string; password: string; name?: string; importGuest?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function request<T>(path: string, method = "GET", payload?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

/** Port of dist/accounts.js: local email/password accounts served by server.py. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { hydrated, progress, replaceProgress, restoreGuest, setRemoteSaver, toast } = useGame();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [available, setAvailable] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("guest");
  const pending = useRef<Promise<void>>(Promise.resolve());

  const save = useCallback((snapshot: Progress) => {
    setSaveStatus("saving");
    pending.current = pending.current
      .then(() => request("/api/progress", "PUT", { progress: snapshot }))
      .then(() => setSaveStatus("saved"))
      .catch(() => setSaveStatus("error"));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    request<{ user: AccountUser | null; progress: unknown }>("/api/me")
      .then(data => {
        setAvailable(true);
        if (data.user) {
          setUser(data.user);
          replaceProgress(sanitizeProgress(data.progress));
          setSaveStatus("saved");
        }
      })
      .catch(() => setSaveStatus("offline"));
    // Run once after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    setRemoteSaver(user ? save : null);
    return () => setRemoteSaver(null);
  }, [user, save, setRemoteSaver]);

  const submit = useCallback<AuthContextValue["submit"]>(
    async (mode, { email, password, name, importGuest }) => {
      const payload: Record<string, unknown> = { email, password };
      if (mode === "register") {
        payload.name = name ?? "";
        if (importGuest) payload.progress = progress;
      }
      const data = await request<{ user: AccountUser; progress: unknown }>("/api/auth/" + mode, "POST", payload);
      setUser(data.user);
      replaceProgress(sanitizeProgress(data.progress));
      setSaveStatus("saved");
      toast(mode === "register" ? "Account created. Your progress now saves to it." : "Welcome back. Your progress is loaded.");
    },
    [progress, replaceProgress, toast],
  );

  const logout = useCallback(async () => {
    await pending.current;
    await request("/api/auth/logout", "POST", {}).catch(() => undefined);
    setUser(null);
    setSaveStatus("guest");
    restoreGuest();
    toast("Logged out. Back to your guest workspace.");
  }, [restoreGuest, toast]);

  const value = useMemo(() => ({ user, available, saveStatus, submit, logout }), [user, available, saveStatus, submit, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
