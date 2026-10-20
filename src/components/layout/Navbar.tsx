"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Home, LogIn, LogOut, Sparkles, TerminalSquare } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useGame } from "~/contexts/GameContext";
import { useAuth } from "~/contexts/AuthContext";
import { lessons } from "~/lib/lessons";
import { cn } from "~/lib/utils";

/** GitMastery Navbar layout: brand · nav links · divider · utilities · account · CTA. */
export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { xp, completed, nextLesson, setGuideOpen, setAccountOpen } = useGame();
  const { user, available, saveStatus, logout } = useAuth();
  const links = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" || pathname.startsWith("/mission") },
    { href: "/playground/", label: "Playground", icon: TerminalSquare, active: pathname.startsWith("/playground") },
  ];
  const go = () => router.push(`/mission/${(nextLesson === -1 ? 0 : nextLesson) + 1}/`);

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-lm-line/70 bg-lm-void/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-lm-ink">
          <span className="grid size-9 place-items-center rounded-xl border-2 border-lm-orange-edge bg-lm-orange font-code text-sm font-bold text-lm-void">&gt;_</span>
          <span className="hidden sm:inline">Linux<span className="text-lm-orange">Mastery</span></span>
        </Link>
        <nav className="ml-2 flex items-center gap-1" aria-label="Main">
          {links.map(({ href, label, icon: Icon, active }) => (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-lm-ink-muted transition-colors hover:bg-lm-deep hover:text-lm-ink", active && "bg-lm-deep text-lm-ink")}>
              <Icon className="size-4" aria-hidden /><span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <span className="mx-1 hidden h-6 w-px bg-lm-line md:block" aria-hidden />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="Open field guide" onClick={() => setGuideOpen(true)}><BookOpen className="size-4" /></Button>
          <span className="hidden items-center gap-2 rounded-full border border-lm-line bg-lm-night px-3 py-1 text-xs font-semibold sm:flex" title="XP and missions complete">
            <Sparkles className="size-3.5 text-lm-gold" aria-hidden /><span className="text-lm-gold">{xp} XP</span>
            <span className="text-lm-ink-dim">·</span><span className="text-lm-lime">{completed.length}/{lessons.length}</span>
          </span>
          {available && (user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-lm-ink-dim lg:inline" aria-live="polite">{saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Save failed" : "Saved"}</span>
              <span className="grid size-8 place-items-center rounded-full bg-lm-grape text-xs font-bold" title={user.email}>{(user.name || user.email)[0]?.toUpperCase()}</span>
              <Button variant="ghost" size="sm" onClick={() => void logout()} aria-label="Log out"><LogOut className="size-4" /></Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAccountOpen(true)}><LogIn className="size-4" /><span className="hidden sm:inline">Log in</span></Button>
          ))}
          <Button size="sm" onClick={go} className="hidden sm:inline-flex">{completed.length ? "Continue" : "Start playing"}</Button>
        </div>
      </div>
    </header>
  );
}
