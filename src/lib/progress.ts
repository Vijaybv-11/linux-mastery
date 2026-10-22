import { lessons } from "./lessons";
import { initialState, type ShellState } from "./shell";

export const STORAGE_KEY = "linux-mastery-v1";
export const STORY_SEEN_KEY = "linux-mastery-story-seen";
/** Session key used for the free-play playground. */
export const PLAYGROUND = -1;

export type LogType = "command" | "result" | "error" | "success" | "info";
export interface LogLine {
  type: LogType;
  text: string;
  path?: string;
}
export interface Session {
  shell: ShellState;
  history: string[];
  logs: LogLine[];
  hints: number;
  count: number;
  cleared: boolean;
}
export interface Progress {
  completed: number[];
  sessions: Record<string, Session>;
}

export const emptyProgress = (): Progress => ({ completed: [], sessions: {} });

export function sanitizeProgress(value: unknown): Progress {
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as Progress).completed) &&
    (value as Progress).sessions &&
    typeof (value as Progress).sessions === "object"
  ) {
    const v = value as Progress;
    return {
      completed: [...new Set(v.completed.filter((n) => Number.isInteger(n) && n >= 0 && n < lessons.length))],
      sessions: v.sessions,
    };
  }
  return emptyProgress();
}

export function readGuestProgress(): Progress {
  try {
    return sanitizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    return emptyProgress();
  }
}

export function newSession(i: number): Session {
  return {
    shell: initialState(i),
    history: [],
    logs: [
      {
        text:
          i === PLAYGROUND
            ? "Welcome to your playground.\nTry help for commands, or make a little mess.\nReset whenever you want a fresh start."
            : "A fresh workspace, just for this mission.\nType help if you get curious.",
        type: "info",
      },
    ],
    hints: 0,
    count: 0,
    cleared: false,
  };
}

export function validSession(value: unknown): value is Session {
  const v = value as Session | undefined;
  return (
    !!v &&
    !!v.shell?.fs &&
    typeof v.shell.cwd === "string" &&
    v.shell.fs[v.shell.cwd]?.type === "dir" &&
    Array.isArray(v.logs) &&
    Array.isArray(v.history) &&
    Number.isInteger(v.count)
  );
}

export const totalXp = (completed: number[]) => completed.reduce((sum, i) => sum + (lessons[i]?.xp ?? 0), 0);

/**
 * Missions unlock in order: the playground and the first mission are always open,
 * and every other mission opens only once the one before it is completed.
 */
export function isUnlocked(index: number, completed: number[]): boolean {
  if (index === PLAYGROUND || index <= 0) return true;
  return completed.includes(index - 1);
}

export function rankFor(count: number) {
  if (count === lessons.length)
    return { title: "At home in the terminal", description: "A whole new world is waiting at your prompt." };
  if (count >= 5) return { title: "Curious explorer", description: "Look how far a little curiosity has taken you." };
  return { title: "Terminal newcomer", description: "Every expert started with a first command." };
}
