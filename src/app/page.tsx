"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowUpRight, BookOpen, Check, Lock, TerminalSquare, Trophy, User } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeroDemo } from "~/components/home/HeroDemo";
import { Button } from "~/components/ui/button";
import { useGame } from "~/contexts/GameContext";
import { groups, lessons, pad2 } from "~/lib/lessons";
import { isUnlocked, rankFor } from "~/lib/progress";
import { cn } from "~/lib/utils";

const TICKER = ["pwd", "ls -la", "cd ~", "mkdir -p projects", "touch notes.txt", "echo \"hi\" > hello.txt", "cat file", "grep -i maya", "chmod +x run.sh", "find . -name \"*.txt\""];

export default function HomePage() {
  const { completed, xp, nextLesson, setGuideOpen } = useGame();
  const root = useRef<HTMLDivElement>(null);
  const rank = rankFor(completed.length);
  const startHref = `/mission/${(nextLesson === -1 ? 0 : nextLesson) + 1}/`;

  // GitMastery-style choreography: hero entry stagger, then scroll-triggered reveals per section.
  useEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from("[data-hero] > *", { y: 28, opacity: 0, duration: 0.7, stagger: 0.08 })
        .from("[data-hero-art]", { x: 40, opacity: 0, rotate: 3, duration: 0.8 }, "-=0.5");
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach(el => {
        gsap.from(el.children, { y: 32, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 82%", once: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={root}>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div data-hero className="space-y-6">
          <p className="text-xs font-semibold tracking-[0.25em] text-lm-orange">LEARN LINUX BY PLAYING</p>
          <h1 className="font-display text-5xl leading-[1.05] text-lm-ink sm:text-6xl">
            Learn the terminal. <span className="inline-block -rotate-2 rounded-xl border-2 border-lm-orange-edge bg-lm-orange px-3 text-lm-void">Play</span> your way in.
          </h1>
          <p className="max-w-xl text-lg text-lm-ink-muted">{lessons.length} bite-sized missions in a safe practice shell. Help Maya through her Linux shifts, one small command at a time.</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild><Link href={startHref}>{completed.length === lessons.length ? "Play again" : completed.length ? "Continue playing" : "Start playing"} <ArrowUpRight className="size-5" /></Link></Button>
            <Button size="lg" variant="secondary" onClick={() => setGuideOpen(true)}><BookOpen className="size-5" />Field guide</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("journey")?.scrollIntoView({ behavior: "smooth" })}>Difficulty <span className="rounded-full bg-lm-grape px-2 text-xs">Beginner</span></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/playground/"><TerminalSquare className="size-4" />Playground</Link></Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("player-panel")?.scrollIntoView({ behavior: "smooth" })}><Trophy className="size-4" />Your progress</Button>
          </div>
        </div>
        <div data-hero-art className="mx-auto w-full max-w-lg"><HeroDemo /></div>
      </section>

      <div className="relative -rotate-1 overflow-hidden border-y-[3px] border-lm-orange-edge bg-lm-orange py-3 text-[#3a1c28]" aria-hidden>
        <div className="lm-marquee flex w-max">
          {[0, 1].map(k => <span key={k} className="flex font-display text-lg uppercase">{TICKER.map(t => <span key={t} className="px-6">{t} ✦</span>)}</span>)}
        </div>
      </div>

      <section id="player-panel" data-reveal className="mx-auto grid max-w-7xl gap-5 px-4 py-16 sm:px-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Points", value: xp, tone: "text-lm-gold" },
            { label: "Completed", value: `${completed.length}/${lessons.length}`, tone: "text-lm-lime" },
            { label: "Next mission", value: nextLesson === -1 ? "✓" : pad2(nextLesson + 1), tone: "text-lm-orange" },
            { label: "Rank", value: rank.title, tone: "text-lm-violet text-base" },
          ].map(s => (
            <div key={s.label} className="lm-panel rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-1">
              <p className="text-xs tracking-[0.15em] text-lm-ink-dim uppercase">{s.label}</p>
              <p className={cn("mt-1 font-display text-2xl", s.tone)}>{s.value}</p>
            </div>
          ))}
          <p className="col-span-full text-sm text-lm-ink-muted">{rank.description}</p>
        </div>
        <div className="lm-panel space-y-3 rounded-2xl p-5">
          <p className="text-xs tracking-[0.15em] text-lm-ink-dim uppercase">Jump back in</p>
          <p className="font-semibold">{nextLesson === -1 ? "Path complete · Replay any mission" : `Mission ${pad2(nextLesson + 1)} · ${lessons[nextLesson]!.title}`}</p>
          <div className="h-2 overflow-hidden rounded-full bg-lm-void"><div className="h-full bg-lm-lime" style={{ width: `${(completed.length / lessons.length) * 100}%` }} /></div>
          <Button className="w-full" asChild><Link href={startHref}>Continue</Link></Button>
        </div>
      </section>

      <section id="journey" className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div data-reveal className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold tracking-[0.25em] text-lm-orange">YOUR PATH</p><h2 className="font-display text-4xl">Chapter 01</h2></div>
          <span className="rounded-full border border-lm-line px-3 py-1 text-sm text-lm-ink-muted">{completed.length} / {lessons.length} complete</span>
        </div>
        <div className="relative space-y-5 before:absolute before:top-6 before:bottom-6 before:left-6 before:w-0.5 before:bg-[repeating-linear-gradient(to_bottom,var(--color-lm-line)_0_6px,transparent_6px_12px)]">
          {groups.map((g, stage) => {
            const done = g.lessons.filter(i => completed.includes(i)).length;
            const current = g.lessons.includes(nextLesson);
            const cleared = !g.locked && done === g.lessons.length;
            return (
              <div key={g.title} data-reveal className={cn("relative grid gap-4 pl-16 sm:grid-cols-[1fr_auto] sm:items-center", g.locked && "opacity-60")}>
                <span className={cn("absolute top-1 left-0 grid size-12 place-items-center rounded-2xl border-2 font-display", cleared ? "border-lm-lime-edge bg-lm-lime text-lm-void" : current ? "border-lm-orange-edge bg-lm-orange text-lm-void" : "border-lm-line bg-lm-night text-lm-ink-dim")} aria-hidden>
                  {g.locked ? <Lock className="size-5" /> : cleared ? <Check className="size-5" /> : pad2(stage + 1)}
                </span>
                <div className={cn("lm-panel rounded-2xl p-5", current && "ring-2 ring-lm-orange")}>
                  <div className="flex items-center gap-3 text-xs text-lm-ink-dim">
                    <span>{pad2(stage + 1)}</span>
                    {current && <span className="rounded-full bg-lm-orange px-2 py-0.5 font-bold text-lm-void">YOU ARE HERE</span>}
                    {!g.locked && <span className="flex items-center gap-1"><User className="size-3" />{done}/{g.lessons.length}</span>}
                  </div>
                  <h3 className="mt-1 font-display text-xl">{g.title}</h3>
                  <p className="text-sm text-lm-ink-muted">{g.description}</p>
                  {!g.locked && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-lm-void" role="progressbar" aria-label={`${g.title} completion`} aria-valuemin={0} aria-valuemax={g.lessons.length} aria-valuenow={done}><div className="h-full bg-lm-lime" style={{ width: `${(done / g.lessons.length) * 100}%` }} /></div>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.lessons.map(i => {
                    const isDone = completed.includes(i);
                    const unlocked = isUnlocked(i, completed);
                    const tileClass = cn("grid size-12 place-items-center rounded-xl border-2 font-display transition-transform", isDone ? "border-lm-lime-edge bg-lm-lime text-lm-void" : i === nextLesson ? "border-lm-orange-edge bg-lm-orange text-lm-void shadow-[0_4px_0_var(--color-lm-orange-edge)]" : "border-lm-line bg-lm-night text-lm-ink");
                    return unlocked ? (
                      <Link key={i} href={`/mission/${i + 1}/`} title={`${lessons[i]!.title} · ${lessons[i]!.xp} XP`} aria-label={`Mission ${i + 1}: ${lessons[i]!.title}${isDone ? ", completed" : i === nextLesson ? ", up next" : ""}`}
                        className={cn(tileClass, "hover:-translate-y-0.5")}>
                        {i + 1}
                      </Link>
                    ) : (
                      <span key={i} title={`${lessons[i]!.title} — locked until you finish mission ${i}`} aria-label={`Mission ${i + 1}: ${lessons[i]!.title}, locked`} aria-disabled="true"
                        className={cn(tileClass, "cursor-not-allowed border-lm-line bg-lm-night text-lm-ink-dim opacity-60")}>
                        <Lock className="size-4" aria-hidden />
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section data-reveal className="mx-auto grid max-w-7xl gap-5 px-4 pb-24 sm:px-6 md:grid-cols-3">
        {[
          { t: "A real-feeling shell", d: "Twenty everyday commands in a safe, resettable sandbox." },
          { t: "A nudge when you need one", d: "Small missions, useful hints, and a field guide right beside you." },
          { t: "A story to follow", d: "Help Maya through her team's first Linux shift, mission by mission." },
        ].map(f => (
          <div key={f.t} className="lm-panel rounded-2xl p-6 transition-transform duration-200 hover:-translate-y-1"><h3 className="font-display text-xl">{f.t}</h3><p className="mt-2 text-lm-ink-muted">{f.d}</p></div>
        ))}
      </section>
    </main>
  );
}
