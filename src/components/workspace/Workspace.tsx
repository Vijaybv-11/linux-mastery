"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, FolderTree, HelpCircle, RotateCcw, Shield } from "lucide-react";
import { gsap } from "gsap";
import { Button } from "~/components/ui/button";
import { useGame } from "~/contexts/GameContext";
import { lessons, pad2 } from "~/lib/lessons";
import { PLAYGROUND } from "~/lib/progress";
import { cn } from "~/lib/utils";
import { FileTree } from "./FileTree";
import { ProgressBar } from "./ProgressBar";
import { RequirementChecklist } from "./RequirementChecklist";
import { StoryDialog } from "./StoryDialog";
import { Terminal } from "./Terminal";

/** GitMastery level page: header, milestone bar, terminal + Challenge/Filesystem panel. */
export function Workspace({ index }: { index: number }) {
  const router = useRouter();
  const { hydrated, getSession, completed, xp, revealHint, storySeen, markStorySeen, resetSession, setGuideOpen, toast } = useGame();
  const lesson = lessons[index];
  const playground = index === PLAYGROUND;
  const session = getSession(index);
  const [tab, setTab] = useState<"challenge" | "files">(playground ? "files" : "challenge");
  const [hintsOpen, setHintsOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => { setTab(playground ? "files" : "challenge"); setHintsOpen(false); }, [index, playground]);
  useEffect(() => {
    if (hydrated && lesson && !storySeen(index)) { markStorySeen(index); setStoryOpen(true); }
  }, [hydrated, index, lesson, storySeen, markStorySeen]);
  useEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-anim=head] > *", { y: 16, opacity: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" });
      gsap.from("[data-anim=panel]", { y: 24, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.15, ease: "power3.out" });
    }, root);
    return () => ctx.revert();
  }, [index]);

  const shown = lesson ? Math.min(lesson.hints.length, Math.max(1, session.hints)) : 0;
  const toggleHints = () => { if (!hintsOpen && session.hints === 0) revealHint(index, 1); setHintsOpen(o => !o); };
  const tabs = [
    { id: "challenge" as const, label: playground ? "Explore" : "Challenge", icon: Shield },
    { id: "files" as const, label: "Filesystem", icon: FolderTree },
  ];
  const ordered = playground ? [...tabs].reverse() : tabs;

  return (
    <main ref={root} className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
      <div data-anim="head" className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-lm-orange">{lesson ? `MISSION ${pad2(index + 1)} / ${lessons.length}` : "FREE EXPLORATION"}</p>
          <p className="text-xs tracking-[0.15em] text-lm-ink-dim">{lesson ? "CHAPTER 01 · FIND YOUR FEET" : "NO OBJECTIVES. ALL POSSIBILITY."}</p>
          <h1 className="mt-1 font-display text-3xl text-lm-ink sm:text-4xl">{lesson?.title ?? "Go where curiosity takes you."}</h1>
        </div>
        {playground ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setGuideOpen(true)}><BookOpen className="size-4" />Field guide</Button>
            <Button variant="outline" size="sm" onClick={() => { resetSession(index); toast("Fresh workspace."); }}><RotateCcw className="size-4" />Reset</Button>
            <Button size="sm" asChild><Link href="/">Missions</Link></Button>
          </div>
        ) : (
          <nav className="flex gap-1.5" aria-label="Missions">
            {lessons.map((l, i) => (
              <Link key={i} href={`/mission/${i + 1}/`} title={l.title} aria-label={`Mission ${i + 1}: ${l.title}`} aria-current={i === index ? "step" : undefined}
                className={cn("size-3 rounded-full border transition-transform hover:scale-125", i === index ? "border-lm-orange bg-lm-orange" : completed.includes(i) ? "border-lm-lime-edge bg-lm-lime" : "border-lm-line bg-lm-deep")} />
            ))}
          </nav>
        )}
      </div>
      {!playground && <div data-anim="head"><ProgressBar done={completed.length} total={lessons.length} xp={xp} /></div>}

      <div className={cn("grid gap-5 lg:grid-cols-[1.15fr_1fr]", playground && "lg:grid-cols-[1fr_1.15fr]")}>
        <div data-anim="panel" className={cn(playground && "lg:order-2")}><Terminal index={index} /></div>
        <section data-anim="panel" className="lm-panel overflow-hidden rounded-2xl">
          <div role="tablist" className="flex border-b border-lm-line" aria-label="Workspace panels">
            {ordered.map(t => (
              <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={e => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { const n = t.id === "challenge" ? "files" : "challenge"; setTab(n); document.getElementById(`tab-${n}`)?.focus(); } }}
                className={cn("flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors", tab === t.id ? "border-b-2 border-lm-orange text-lm-ink" : "text-lm-ink-dim hover:text-lm-ink")}>
                <t.icon className="size-4" aria-hidden />{t.label}
              </button>
            ))}
          </div>
          <div className="p-5">
            {tab === "challenge" ? (
              <div id="panel-challenge" role="tabpanel" aria-labelledby="tab-challenge" className="space-y-4">
                <p className="text-lm-ink-soft">{lesson?.description ?? "Your own little Linux neighborhood. Create something, read something, move things around. This space is yours."}</p>
                <RequirementChecklist items={[{ text: lesson?.objective ?? "Explore at your own pace. Type help to see what’s possible.", done: !!lesson && session.cleared }]} />
                {lesson && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" aria-expanded={hintsOpen} aria-controls="hints-box" onClick={toggleHints}><HelpCircle className="size-4" />{hintsOpen ? "Hide Hints" : "Show Hints"}</Button>
                      <Button variant="outline" size="sm" onClick={() => setStoryOpen(true)}><BookOpen className="size-4" />Show Story</Button>
                    </div>
                    {hintsOpen && (
                      <div id="hints-box" className="space-y-2 rounded-xl border border-lm-violet/50 bg-lm-grape/15 p-4">
                        <div className="flex justify-between text-sm"><strong className="text-lm-violet">Hints</strong><span className="text-lm-ink-dim" aria-live="polite">Hint {shown} of {lesson.hints.length}</span></div>
                        <ul className="space-y-2 text-sm">
                          {lesson.hints.slice(0, shown).map((h, n) => (
                            <li key={n} className="flex gap-2"><span className="h-fit rounded bg-lm-deep px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-lm-violet uppercase">{n === 0 ? "Nudge" : "Example"}</span>{h}</li>
                          ))}
                        </ul>
                        {shown < lesson.hints.length && <Button variant="ghost" size="sm" onClick={() => revealHint(index, shown + 1)}>✳ Show an example</Button>}
                      </div>
                    )}
                  </>
                )}
                {lesson && session.cleared && (
                  <div className="rounded-xl border-2 border-lm-lime-edge bg-lm-lime/10 p-4">
                    <p className="font-display text-lm-lime">Mission cleared!</p>
                    <p className="text-sm text-lm-ink-soft">{lesson.success}</p>
                    <Button className="mt-3" size="sm" onClick={() => router.push(index === lessons.length - 1 ? "/" : `/mission/${index + 2}/`)}>
                      {index === lessons.length - 1 ? "Back to your path" : "Next mission"} <ArrowRight className="size-4" />
                    </Button>
                  </div>
                )}
                <div className="lm-inset rounded-xl p-4 text-sm">
                  <p className="mb-1 text-xs font-bold tracking-[0.15em] text-lm-cyan uppercase">{lesson ? "The command:" : "Ideas to try:"}</p>
                  {/* Trusted, authored-in-repo HTML containing only <code> tags. */}
                  <div className="[&_code]:rounded [&_code]:bg-lm-void [&_code]:px-1.5 [&_code]:font-code [&_code]:text-lm-lime"
                    dangerouslySetInnerHTML={{ __html: lesson?.concept ?? "<code>ls</code> is a good place to start. Try <code>cd Documents</code>, then <code>cat welcome.txt</code>." }} />
                </div>
                {lesson && <span className="inline-block rounded-full border border-lm-gold-edge bg-lm-gold/10 px-2.5 py-0.5 text-xs font-semibold text-lm-gold">{lesson.xp} XP</span>}
              </div>
            ) : (
              <div id="panel-files" role="tabpanel" aria-labelledby="tab-files"><FileTree shell={session.shell} /></div>
            )}
          </div>
        </section>
      </div>
      {lesson && <StoryDialog index={index} open={storyOpen} onOpenChange={setStoryOpen} />}
    </main>
  );
}
