"use client";

import { useState, type FormEvent } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useAuth } from "~/contexts/AuthContext";
import { useGame } from "~/contexts/GameContext";

export function AccountDialog() {
  const { accountOpen, setAccountOpen } = useGame();
  const { submit } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [show, setShow] = useState(false);
  const [importGuest, setImportGuest] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const register = mode === "register";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (register && password.length < 10) return setError("Use at least 10 characters for your password.");
    setBusy(true);
    setError("");
    try {
      await submit(mode, { email: String(data.get("email") ?? ""), password, name: String(data.get("name") ?? ""), importGuest });
      setAccountOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={accountOpen} onOpenChange={open => { setAccountOpen(open); setError(""); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <p className="text-xs font-semibold tracking-[0.2em] text-lm-orange">YOUR NEXT CHAPTER</p>
          <DialogTitle className="font-display text-2xl">{register ? "Create your account" : "Welcome back"}<span className="text-lm-orange">.</span></DialogTitle>
          <DialogDescription>{register ? "Save your progress and pick up anywhere on this computer." : "Your next adventure is right where you left it."}</DialogDescription>
        </DialogHeader>
        <div role="note" className="rounded-xl border border-lm-gold-edge bg-lm-gold/10 p-3 text-sm text-lm-ink-soft">
          <strong className="text-lm-gold">No password recovery.</strong> Keep your password in a password manager.
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          {register && (<div className="space-y-1"><Label htmlFor="auth-name">Display name</Label><Input id="auth-name" name="name" maxLength={40} placeholder="What should we call you?" /></div>)}
          <div className="space-y-1"><Label htmlFor="auth-email">Email</Label><Input id="auth-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" /></div>
          <div className="space-y-1">
            <Label htmlFor="auth-password">Password</Label>
            <div className="flex gap-2">
              <Input id="auth-password" name="password" type={show ? "text" : "password"} required maxLength={128} autoComplete={register ? "new-password" : "current-password"} />
              <Button type="button" variant="outline" size="sm" className="h-11" aria-pressed={show} onClick={() => setShow(s => !s)}>{show ? "Hide" : "Show"}</Button>
            </div>
          </div>
          {register && (<label className="flex items-center gap-2 text-sm text-lm-ink-muted"><input type="checkbox" checked={importGuest} onChange={e => setImportGuest(e.target.checked)} />Bring my guest progress into this account</label>)}
          {error && <p role="alert" className="text-sm text-lm-coral">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "One moment…" : register ? "Create account →" : "Log in →"}</Button>
        </form>
        <p className="text-center text-sm text-lm-ink-dim">
          {register ? "Already have an account?" : "New around here?"}{" "}
          <button className="font-semibold text-lm-orange hover:underline" onClick={() => { setMode(register ? "login" : "register"); setError(""); }}>{register ? "Log in" : "Create an account"}</button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
