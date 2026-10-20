"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { lessons } from "~/lib/lessons";
import {
  emptyProgress,
  newSession,
  readGuestProgress,
  STORAGE_KEY,
  STORY_SEEN_KEY,
  totalXp,
  validSession,
  type Progress,
  type Session,
} from "~/lib/progress";
import { runCommand } from "~/lib/shell";

/** Saves progress somewhere other than localStorage (the signed-in account). */
export type RemoteSaver = (progress: Progress) => void;

interface GameContextValue {
  hydrated: boolean;
  progress: Progress;
  completed: number[];
  xp: number;
  /** Index of the first unfinished mission, or -1 when the path is complete. */
  nextLesson: number;
  getSession: (index: number) => Session;
  /** Runs one command in a mission (index ≥ 0) or the playground (-1). */
  runInput: (index: number, command: string) => void;
  pushInfo: (index: number, text: string) => void;
  clearLogs: (index: number) => void;
  revealHint: (index: number, count: number) => void;
  resetSession: (index: number) => void;
  resetAll: () => void;
  replaceProgress: (progress: Progress) => void;
  restoreGuest: () => void;
  setRemoteSaver: (saver: RemoteSaver | null) => void;
  storySeen: (index: number) => boolean;
  markStorySeen: (index: number) => void;
  toast: (message: string) => void;
  toastMessage: string | null;
  celebrationKey: number;
  guideOpen: boolean;
  setGuideOpen: (open: boolean) => void;
  accountOpen: boolean;
  setAccountOpen: (open: boolean) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [hydrated, setHydrated] = useState(false);
  const [seen, setSeen] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const remoteRef = useRef<RemoteSaver | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const skipPersist = useRef(true);

  const toast = useCallback((message: string) => {
    setToastMessage(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Hydrate from the browser once; the static export renders an empty guest on the server.
  useEffect(() => {
    setProgress(readGuestProgress());
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORY_SEEN_KEY) ?? "null");
      if (Array.isArray(value)) setSeen(value.filter((n): n is number => Number.isInteger(n)));
    } catch {
      /* ignore unreadable storage */
    }
    setHydrated(true);
  }, []);

  // Persist after every change: to the account when signed in, otherwise to this browser.
  useEffect(() => {
    if (!hydrated) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    if (remoteRef.current) {
      remoteRef.current(progress);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      toast("Browser storage is unavailable. Progress will last for this visit.");
    }
  }, [progress, hydrated, toast]);

  const getSession = useCallback(
    (index: number): Session => {
      const s = progress.sessions[String(index)];
      return validSession(s) ? s : newSession(index);
    },
    [progress.sessions],
  );

  const updateSession = useCallback((index: number, fn: (s: Session, p: Progress) => Session | void) => {
    setProgress((p) => {
      const current = p.sessions[String(index)];
      const base: Session = validSession(current) ? structuredClone(current) : newSession(index);
      const draft: Progress = { completed: [...p.completed], sessions: p.sessions };
      const result = fn(base, draft) ?? base;
      return { completed: draft.completed, sessions: { ...p.sessions, [String(index)]: result } };
    });
  }, []);

  const runInput = useCallback(
    (index: number, command: string) => {
      let cleared = false;
      updateSession(index, (session, p) => {
        const before = session.shell.cwd;
        const result = runCommand(session.shell, command);
        session.history = [...session.history, command].slice(-100);
        session.count++;
        session.shell = result.state;
        if (result.clear) session.logs = [];
        else {
          session.logs.push({ type: "command", path: shortCwd(before), text: command });
          if (result.output)
            session.logs.push({ type: result.ok ? "result" : "error", text: result.output.replace(/\n$/, "") });
        }
        const lesson = lessons[index];
        if (result.ok && lesson && !session.cleared && lesson.check(result.state, result.event)) {
          session.cleared = true;
          cleared = true;
          const already = p.completed.includes(index);
          if (!already) p.completed.push(index);
          session.logs.push({
            type: "success",
            text: already
              ? "✓ Mission cleared again. Nicely done."
              : "✓ Mission cleared! +" + lesson.xp + " XP\n" + lesson.success,
          });
        }
        session.logs = session.logs.slice(-180);
      });
      // The updater runs synchronously inside setState batching, so read the flag after a tick.
      queueMicrotask(() => {
        if (cleared) setCelebrationKey((k) => k + 1);
      });
    },
    [updateSession],
  );

  const pushInfo = useCallback(
    (index: number, text: string) =>
      updateSession(index, (s) => {
        s.logs = [...s.logs, { type: "info" as const, text }].slice(-180);
      }),
    [updateSession],
  );
  const clearLogs = useCallback((index: number) => updateSession(index, (s) => void (s.logs = [])), [updateSession]);
  const revealHint = useCallback(
    (index: number, count: number) => updateSession(index, (s) => void (s.hints = count)),
    [updateSession],
  );

  const resetSession = useCallback(
    (index: number) => {
      setProgress((p) => ({ ...p, sessions: { ...p.sessions, [String(index)]: newSession(index) } }));
      toast("Fresh workspace. Your earned XP is safe.");
    },
    [toast],
  );

  const resetAll = useCallback(() => {
    setProgress(emptyProgress());
    toast("All progress reset. A fresh start awaits.");
  }, [toast]);

  const replaceProgress = useCallback((next: Progress) => {
    skipPersist.current = true;
    setProgress(next);
  }, []);
  const restoreGuest = useCallback(() => {
    skipPersist.current = true;
    setProgress(readGuestProgress());
  }, []);
  const setRemoteSaver = useCallback((saver: RemoteSaver | null) => {
    remoteRef.current = saver;
  }, []);

  const markStorySeen = useCallback((index: number) => {
    setSeen((prev) => {
      if (prev.includes(index)) return prev;
      const next = [...prev, index];
      try {
        localStorage.setItem(STORY_SEEN_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<GameContextValue>(() => {
    const completed = progress.completed;
    return {
      hydrated,
      progress,
      completed,
      xp: totalXp(completed),
      nextLesson: lessons.findIndex((_, i) => !completed.includes(i)),
      getSession,
      runInput,
      pushInfo,
      clearLogs,
      revealHint,
      resetSession,
      resetAll,
      replaceProgress,
      restoreGuest,
      setRemoteSaver,
      storySeen: (i) => seen.includes(i),
      markStorySeen,
      toast,
      toastMessage,
      celebrationKey,
      guideOpen,
      setGuideOpen,
      accountOpen,
      setAccountOpen,
    };
  }, [
    hydrated, progress, getSession, runInput, pushInfo, clearLogs, revealHint, resetSession, resetAll,
    replaceProgress, restoreGuest, setRemoteSaver, seen, markStorySeen, toast, toastMessage, celebrationKey,
    guideOpen, accountOpen,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

import { shortPath as shortCwd } from "~/lib/shell";

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
