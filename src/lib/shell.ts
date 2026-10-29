/**
 * Linux practice shell — a pure, deterministic simulation of a small
 * POSIX-like shell over an in-memory filesystem. Ported verbatim (with types)
 * from the original vanilla Linux Mastery implementation.
 */
export const HOME = "/home/explorer";

export interface FsNode {
  type: "dir" | "file";
  mode: string;
  owner?: string;
  group?: string;
  content?: string;
}
export type FileSystem = Record<string, FsNode>;
export interface ShellState {
  cwd: string;
  fs: FileSystem;
  /** Octal umask (3 digits, e.g. "022") applied to newly created files/dirs. */
  umask?: string;
}
export interface ShellEvent {
  command?: string;
  path?: string;
  listed?: string[];
  read?: string[];
  written?: string;
  source?: string;
  target?: string;
  options?: string[];
  /** Every command name in a pipeline, in order (a lone command is a pipeline of one). */
  pipeline?: string[];
  /** What the last command printed, captured before any > or >> redirect. */
  stdout?: string;
}
export interface RunResult {
  state: ShellState;
  output: string;
  event: ShellEvent;
  ok: boolean;
  clear?: boolean;
}
interface Token {
  value: string;
  operator: boolean;
}

/** Stage 3 web-server log: 14 requests, 5 of them 404s, and one visitor (203.0.113.9) far busier than the rest. */
export const ACCESS_LOG = [
  '10.0.0.5 - - [27/Oct/2026:09:00:01 +0000] "GET / HTTP/1.1" 200 512',
  '203.0.113.9 - - [27/Oct/2026:09:00:03 +0000] "GET /wp-login.php HTTP/1.1" 404 153',
  '198.51.100.4 - - [27/Oct/2026:09:00:07 +0000] "GET /about HTTP/1.1" 200 1024',
  '203.0.113.9 - - [27/Oct/2026:09:00:08 +0000] "GET /.env HTTP/1.1" 404 153',
  '10.0.0.5 - - [27/Oct/2026:09:00:12 +0000] "GET /docs HTTP/1.1" 200 2048',
  '203.0.113.9 - - [27/Oct/2026:09:00:13 +0000] "GET /admin HTTP/1.1" 404 153',
  '192.0.2.17 - - [27/Oct/2026:09:00:21 +0000] "GET /favicon.ico HTTP/1.1" 404 153',
  '203.0.113.9 - - [27/Oct/2026:09:00:22 +0000] "POST /login HTTP/1.1" 401 87',
  '198.51.100.4 - - [27/Oct/2026:09:00:30 +0000] "GET /docs HTTP/1.1" 200 2048',
  '203.0.113.9 - - [27/Oct/2026:09:00:31 +0000] "GET /backup.zip HTTP/1.1" 404 153',
  '10.0.0.5 - - [27/Oct/2026:09:00:45 +0000] "GET /status HTTP/1.1" 200 64',
  '203.0.113.9 - - [27/Oct/2026:09:00:46 +0000] "POST /login HTTP/1.1" 401 87',
  '192.0.2.17 - - [27/Oct/2026:09:00:52 +0000] "GET / HTTP/1.1" 200 512',
  '198.51.100.4 - - [27/Oct/2026:09:00:58 +0000] "GET /contact HTTP/1.1" 200 768',
].join("\n") + "\n";

/** Stage 3 application log: repeated ERROR lines, unsorted, for sort | uniq -c. */
export const APP_LOG = [
  "INFO server started",
  "INFO request served",
  "ERROR db: connection refused",
  "WARN cache miss",
  "ERROR login: too many attempts from 203.0.113.9",
  "ERROR db: connection refused",
  "INFO request served",
  "ERROR disk: quota exceeded",
  "ERROR login: too many attempts from 203.0.113.9",
  "ERROR db: connection refused",
  "INFO backup finished",
].join("\n") + "\n";

const dir = (): FsNode => ({ type: "dir", mode: "755" });
const file = (content: string): FsNode => ({ type: "file", content, mode: "644" });

export function initialState(lesson = -1): ShellState {
  const fs: FileSystem = {
    "/": dir(),
    "/home": dir(),
    [HOME]: dir(),
    [HOME + "/Documents"]: dir(),
    [HOME + "/Downloads"]: dir(),
    [HOME + "/.welcome"]: file("Curiosity looks good on you.\n"),
    [HOME + "/Documents/welcome.txt"]: file(
      "Welcome to Linux Mastery!\nSmall commands open big possibilities.\n",
    ),
    [HOME + "/Documents/notes.txt"]: file("Keep exploring.\nYou can always reset and try again.\n"),
    [HOME + "/Downloads/old.tmp"]: file("A temporary file, ready to be cleared away.\n"),
  };
  if ([4, 5, 7, 8].includes(lesson)) fs[HOME + "/projects"] = dir();
  if (lesson === 8) fs[HOME + "/projects/draft.txt"] = file("A small command. A new possibility.\n");
  if (lesson >= 10 && lesson <= 22) {
    const S = HOME + "/server";
    fs[S] = { type: "dir", mode: "755" };
    fs[S + "/backup.sh"] = { type: "file", mode: "644", content: '#!/bin/sh\necho "Backing up the project..."\n' };
    fs[S + "/secrets.env"] = {
      type: "file",
      mode: "644",
      content: "API_KEY=keep-this-private\nDB_PASSWORD=change-me\n",
    };
    fs[S + "/handover.md"] = {
      type: "file",
      mode: "644",
      owner: "explorer",
      group: "explorer",
      content: "Shared server handover notes.\n",
    };
    fs[S + "/notes.txt"] = {
      type: "file",
      mode: "644",
      content: "Remember to lock down the secrets file.\n",
    };
    fs[S + "/project"] = { type: "dir", mode: "755", group: "explorer" };
    fs[S + "/uploads"] = { type: "dir", mode: "755" };
    fs[S + "/logs"] = { type: "dir", mode: "755" };
    fs[S + "/logs/app.log"] = { type: "file", mode: "644", content: "server started\n" };
    if (lesson >= 17) {
      fs[S + "/logs/access.log"] = file(ACCESS_LOG);
      fs[S + "/logs/app.log"] = file(APP_LOG);
      return { cwd: S + "/logs", fs };
    }
    return { cwd: S, fs };
  }
  return { cwd: HOME, fs };
}

/** Users and groups the practice shell recognizes for chown/chgrp. */
export const CHOWN_USERS = ["explorer", "maya", "root", "deploy", "www-data"];
export const CHOWN_GROUPS = ["explorer", "developers", "deploy", "www-data", "staff"];

/** Standard login-shell default umask. */
export const DEFAULT_UMASK = "022";

/** Apply an octal umask to a base mode (666 for files, 777 for dirs) → 3-digit octal string. */
export function umaskMode(base: number, umask = DEFAULT_UMASK): string {
  const mask = parseInt(umask, 8) & 0o777;
  return ((base & ~mask) & 0o777).toString(8).padStart(3, "0");
}

export function resolvePath(value = "~", cwd = HOME): string {
  if (value === "~") value = HOME;
  else if (value.startsWith("~/")) value = HOME + value.slice(1);
  if (!value.startsWith("/")) value = cwd + "/" + value;
  const parts: string[] = [];
  for (const part of value.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return "/" + parts.join("/");
}

export function shortPath(path: string): string {
  return path === HOME ? "~" : path.startsWith(HOME + "/") ? "~" + path.slice(HOME.length) : path;
}

export function children(fs: FileSystem, path: string): string[] {
  return Object.keys(fs)
    .filter((p) => p !== "/" && p.slice(0, p.lastIndexOf("/")) === (path === "/" ? "" : path))
    .sort((a, b) => a.localeCompare(b));
}

export function tokenize(input: string): Token[] {
  const result: Token[] = [];
  let value = "";
  let quote: string | null = null;
  let started = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i]!;
    if (c === "\\" && quote !== "'") {
      if (i + 1 === input.length) throw Error("A trailing backslash needs another character.");
      // Inside double quotes, bash keeps the backslash unless it escapes $ ` " or \ (so "a\|b" stays a\|b).
      if (quote === '"' && !'$`"\\'.includes(input[i + 1]!)) value += c;
      value += input[++i];
      started = true;
      continue;
    }
    if (quote) {
      if (c === quote) quote = null;
      else value += c;
      started = true;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      started = true;
      continue;
    }
    if (/\s/.test(c)) {
      if (started) {
        result.push({ value, operator: false });
        value = "";
        started = false;
      }
      continue;
    }
    if (c === "|") {
      if (input[i + 1] === "|")
        throw Error("|| (run if the first command fails) isn't supported here. Use a single | to pipe.");
      if (started) {
        result.push({ value, operator: false });
        value = "";
        started = false;
      }
      result.push({ value: "|", operator: true });
      continue;
    }
    if ([";", "&", "<"].includes(c))
      throw Error(
        "This practice shell supports pipes (|) and output redirects (> and >>). Other shell syntax such as ;, & and < comes in a later chapter.",
      );
    if (c === ">") {
      if (started) {
        result.push({ value, operator: false });
        value = "";
        started = false;
      }
      let op = ">";
      if (input[i + 1] === ">") {
        op = ">>";
        i++;
      }
      result.push({ value: op, operator: true });
      continue;
    }
    value += c;
    started = true;
  }
  if (quote) throw Error("That quote is still open. Add a matching " + quote + " to finish your command.");
  if (started) result.push({ value, operator: false });
  return result;
}

export const commandNames = [
  "pwd", "ls", "cd", "mkdir", "touch", "echo", "cat", "cp", "mv", "rm", "rmdir", "head", "tail", "wc", "grep",
  "sort", "uniq", "cut", "find", "chmod", "chown", "chgrp", "umask", "whoami", "clear", "help",
];

const PRINTING = [
  "echo", "cat", "pwd", "ls", "whoami", "head", "tail", "wc", "grep", "sort", "uniq", "cut", "find", "umask", "help",
];

/** Split text into lines, dropping the final newline ("" has no lines). */
const toLines = (text: string): string[] => (text === "" ? [] : text.replace(/\n$/, "").split("\n"));
const fromLines = (lines: string[]): string => (lines.length ? lines.join("\n") + "\n" : "");

/** Byte-order (C locale) comparison, so sort output never depends on the browser's locale. */
const byteCompare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Leading number of a line for sort -n: optional blanks, sign, digits, decimals; anything else is 0. */
const numericKey = (line: string) => {
  const m = /^\s*(-?\d*\.?\d+)/.exec(line);
  return m ? Number(m[1]) : 0;
};

/**
 * Translate a grep basic regular expression (BRE) into a JavaScript one. In a BRE, | + ? ( ) { }
 * are ordinary characters, and GNU grep makes them special only when backslashed — the reverse of JS.
 */
function breToRegExp(pattern: string): string {
  let result = "";
  let bracket = -1; // index where the current [...] expression opened, or -1 outside one
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!;
    if (bracket >= 0) {
      // A ] right after [ or [^ is a literal member, not the end of the bracket expression.
      const literalClose = i === bracket + 1 || (i === bracket + 2 && pattern[bracket + 1] === "^");
      if (c === "]" && literalClose) result += "\\]";
      else {
        if (c === "]") bracket = -1;
        result += c === "\\" ? "\\\\" : c;
      }
    } else if (c === "[") {
      bracket = i;
      result += c;
    } else if (c === "\\" && i + 1 < pattern.length) {
      const n = pattern[++i]!;
      result += "|+?(){}".includes(n) ? n : "\\" + n;
    } else result += "|+?(){}".includes(c) ? "\\" + c : c;
  }
  return result;
}

/** Parse a cut field list such as 1, 1,3, 2-4, 3- or -2 into a 1-based membership test. */
function fieldSelector(list: string): (n: number) => boolean {
  const ranges = list.split(",").map((part) => {
    const m = /^(\d*)-(\d*)$/.exec(part);
    if (/^\d+$/.test(part)) return [Number(part), Number(part)] as const;
    if (m && (m[1] || m[2])) return [m[1] ? Number(m[1]) : 1, m[2] ? Number(m[2]) : Infinity] as const;
    throw Error("cut: invalid field list: '" + list + "'");
  });
  if (ranges.some(([lo]) => lo < 1)) throw Error("cut: fields are numbered from 1");
  return (n) => ranges.some(([lo, hi]) => n >= lo && n <= hi);
}

export function permission(mode: string): string {
  const digits = mode.split("").map(Number);
  const special = mode.length === 4 ? (digits[0] ?? 0) : 0;
  const [u = 0, g = 0, o = 0] = digits.slice(-3);
  const chars = [u, g, o]
    .map((d) => [4, 2, 1].map((bit, i) => (d & bit ? "rwx"[i] : "-")).join(""))
    .join("")
    .split("");
  if (special & 4) chars[2] = u & 1 ? "s" : "S"; // setuid → owner execute slot
  if (special & 2) chars[5] = g & 1 ? "s" : "S"; // setgid → group execute slot
  if (special & 1) chars[8] = o & 1 ? "t" : "T"; // sticky → others execute slot
  return chars.join("");
}

/**
 * Apply a chmod spec (octal, +x, or comma-separated symbolic clauses) to a mode
 * string and return the new mode (3 digits, or 4 when the special nibble is set).
 */
function applyChmod(mode: string, spec: string): string {
  if (/^[0-7]{4}$/.test(spec)) return spec;
  if (/^[0-7]{3}$/.test(spec)) return spec; // a 3-digit mode clears the special nibble
  if (spec === "+x") spec = "a+x"; // keep the existing shortcut working
  let special = mode.length === 4 ? Number(mode[0]) : 0;
  const ugo = (mode.length === 4 ? mode.slice(1) : mode).padStart(3, "0").slice(-3).split("").map(Number);
  const classIndex: Record<string, number> = { u: 0, g: 1, o: 2 };
  for (const clause of spec.split(",")) {
    const m = /^([ugoa]*)([+\-=])([rwxst]+)$/.exec(clause);
    if (!m) throw Error("chmod: invalid mode: '" + spec + "'");
    const [, whoRaw = "", op = "", perms = ""] = m;
    const who = new Set((!whoRaw || whoRaw.includes("a") ? "ugo" : whoRaw).split("").filter((c) => c in classIndex));
    const bits = (perms.includes("r") ? 4 : 0) | (perms.includes("w") ? 2 : 0) | (perms.includes("x") ? 1 : 0);
    for (const c of who) {
      const i = classIndex[c]!;
      if (op === "+") ugo[i]! |= bits;
      else if (op === "-") ugo[i]! &= ~bits;
      else ugo[i] = bits;
    }
    const applySpecial = (bit: number) => (op === "-" ? (special &= ~bit) : (special |= bit));
    if (perms.includes("s")) {
      if (who.has("u")) applySpecial(4);
      if (who.has("g")) applySpecial(2);
    }
    if (perms.includes("t")) applySpecial(1);
  }
  const body = ugo.join("");
  return special ? String(special) + body : body;
}

export function runCommand(state: ShellState, input: string): RunResult {
  const next: ShellState = structuredClone(state);
  try {
    const tokens = tokenize(input.trim());
    if (!tokens.length) return { state: next, output: "", event: {}, ok: true };
    const segments: Token[][] = [[]];
    for (const t of tokens) {
      if (t.operator && t.value === "|") segments.push([]);
      else segments.at(-1)!.push(t);
    }
    if (segments.some((s) => !s.length))
      throw Error("A pipe needs a command on both sides of |, like cat file.txt | wc -l.");
    let redirect: { append: boolean; path: string } | null = null;
    for (const [n, seg] of segments.entries()) {
      const redirects = seg.map((t, i) => (t.operator ? i : -1)).filter((i) => i >= 0);
      if (!redirects.length) continue;
      if (n !== segments.length - 1) throw Error("Put > or >> at the end of the pipeline, after the last command.");
      const i = redirects[0]!;
      if (redirects.length !== 1 || i === 0 || i !== seg.length - 2) throw Error("Use one output file after > or >>.");
      redirect = { append: seg[i]!.value === ">>", path: resolvePath(seg[i + 1]!.value, next.cwd) };
      seg.splice(i);
    }

    // Each command in a pipeline runs in turn, reading the previous command's output as its stdin.
    const piped = segments.length > 1;
    const { cwd: startCwd, umask: startUmask } = next;
    const pipeline: string[] = [];
    const read: string[] = [];
    let stdin: string | undefined;
    let last: { output: string; event: ShellEvent; clear: boolean } = { output: "", event: {}, clear: false };
    for (const seg of segments) {
      const [cmd = "", ...args] = seg.map((t) => t.value);
      last = exec(next, cmd, args, stdin);
      pipeline.push(cmd);
      read.push(...(last.event.read ?? []));
      stdin = last.output;
    }
    // Like bash, each pipeline command runs in a subshell: cd and umask there don't stick.
    if (piped) {
      if (next.fs[startCwd]?.type === "dir") next.cwd = startCwd;
      if (startUmask === undefined) delete next.umask;
      else next.umask = startUmask;
    }
    const cmd = pipeline.at(-1)!;
    let output = last.output;
    const event: ShellEvent = { ...last.event, pipeline, stdout: output };
    if (read.length) event.read = read;

    if (redirect) {
      const { append, path: target } = redirect;
      if (!PRINTING.includes(cmd))
        throw Error("Output redirection is supported for commands that print text in this practice shell.");
      const fs = next.fs;
      const parent = target.slice(0, target.lastIndexOf("/")) || "/";
      if (!fs[parent]) throw Error(parent + ": No such file or directory");
      if (fs[parent].type !== "dir") throw Error(parent + ": Not a directory");
      if (fs[target]?.type === "dir") throw Error(target + ": Is a directory");
      const before = fs[target];
      fs[target] = {
        ...(before ?? { type: "file", mode: umaskMode(0o666, next.umask) }),
        content: (append ? (before?.content ?? "") : "") + output,
      };
      output = "";
      event.written = target;
    }
    return { state: next, output, event, ok: true, clear: !piped && last.clear };
  } catch (e) {
    return { state: structuredClone(state), output: (e as Error).message, event: {}, ok: false };
  }
}

/** Run one command against the (already cloned) state. Throws on error; runCommand rolls back. */
function exec(
  next: ShellState,
  cmd: string,
  args: string[],
  stdin: string | undefined,
): { output: string; event: ShellEvent; clear: boolean } {
  let output = "";
  let clear = false;
  const fs = next.fs;
  const path = (p: string) => resolvePath(p, next.cwd);
  const newFile = (content = ""): FsNode => ({ type: "file", mode: umaskMode(0o666, next.umask), content });
  const newDir = (): FsNode => ({ type: "dir", mode: umaskMode(0o777, next.umask) });
  const requireNode = (p: string): FsNode => {
    const n = fs[p];
    if (!n) throw Error(p + ": No such file or directory");
    return n;
  };
  const requireFile = (p: string): FsNode & { content: string } => {
    const n = requireNode(p);
    if (n.type !== "file") throw Error(p + ": Is a directory");
    n.content ??= "";
    return n as FsNode & { content: string };
  };
  const requireParent = (p: string) => {
    if (p === "/") throw Error("Cannot replace the root directory.");
    const parent = p.slice(0, p.lastIndexOf("/")) || "/";
    if (requireNode(parent).type !== "dir") throw Error(parent + ": Not a directory");
  };
  const arity = (min: number, max = min) => {
    if (args.length < min) throw Error(cmd + ": missing operand. Type help for examples.");
    if (args.length > max) throw Error(cmd + ": too many arguments.");
  };
  const noOptions = () => {
    if (args.some((a) => a.startsWith("-") && a !== "-"))
      throw Error(cmd + ": this option is not supported in the practice shell. Type help for supported forms.");
  };
  /** A file operand's contents, or stdin when the command sits after a pipe and names no file. */
  const readInput = (operands: string[], usage: string): string => {
    if (operands.length > 1 || operands[0]?.startsWith("-")) throw Error(usage);
    if (operands.length) return requireFile(path(operands[0]!)).content;
    if (stdin === undefined) throw Error(cmd + ": name a file, or pipe text in with |. (" + usage + ")");
    return stdin;
  };
  const event: ShellEvent = { command: cmd };

  if (cmd === "pwd") {
    arity(0);
    output = next.cwd + "\n";
    event.path = next.cwd;
  } else if (cmd === "whoami") {
    arity(0);
    output = "explorer\n";
  } else if (cmd === "ls") {
    const opts = args.filter((a) => a.startsWith("-"));
    if (opts.some((o) => !/^-[al1]+$/.test(o))) throw Error("ls: supported options are -a, -l, and -1.");
    const operands = args.filter((a) => !a.startsWith("-"));
    if (operands.length > 1) throw Error("ls: list one path at a time.");
    const p = path(operands[0] ?? ".");
    const n = requireNode(p);
    const all = opts.some((o) => o.includes("a"));
    const long = opts.some((o) => o.includes("l"));
    event.options = [
      ...new Set(
        opts
          .join("")
          .split("")
          .filter((c) => c !== "-"),
      ),
    ];
    const names = n.type === "file" ? [p] : children(fs, p).filter((c) => all || !c.split("/").pop()!.startsWith("."));
    output =
      names
        .map((q) => {
          const node = fs[q]!;
          const name = q.split("/").pop()! + (node.type === "dir" ? "/" : "");
          if (!long) return name;
          return (
            (node.type === "dir" ? "d" : "-") +
            permission(node.mode) +
            "  " +
            (node.owner ?? "explorer") +
            " " +
            (node.group ?? "explorer") +
            "  " +
            String(node.content?.length ?? 0).padStart(4) +
            "  " +
            name
          );
        })
        .join("\n") + (names.length ? "\n" : "");
    event.path = p;
    event.listed = names;
  } else if (cmd === "cd") {
    arity(0, 1);
    const p = path(args[0] ?? "~");
    if (requireNode(p).type !== "dir") throw Error(p + ": Not a directory");
    next.cwd = p;
    event.path = p;
  } else if (cmd === "mkdir") {
    const recursive = args[0] === "-p";
    const operands = recursive ? args.slice(1) : args;
    if (!operands.length) throw Error("mkdir: missing directory name.");
    if (operands.some((a) => a.startsWith("-"))) throw Error("mkdir: only -p is supported.");
    for (const name of operands) {
      const p = path(name);
      if (fs[p]) {
        if (recursive && fs[p].type === "dir") continue;
        throw Error(p + ": File exists");
      }
      if (recursive) {
        let current = "";
        for (const part of p.split("/").filter(Boolean)) {
          current += "/" + part;
          if (fs[current]?.type && fs[current]?.type !== "dir") throw Error(current + ": Not a directory");
          fs[current] ??= newDir();
        }
      } else {
        requireParent(p);
        fs[p] = newDir();
      }
    }
  } else if (cmd === "touch") {
    if (!args.length) throw Error("touch: missing file name.");
    noOptions();
    for (const name of args) {
      const p = path(name);
      requireParent(p);
      fs[p] ??= newFile();
    }
  } else if (cmd === "echo") {
    let values = args;
    let newline = true;
    if (args[0] === "-n") {
      values = args.slice(1);
      newline = false;
    } else if (args[0]?.startsWith("-")) throw Error("echo: only -n is supported.");
    output = values.join(" ") + (newline ? "\n" : "");
  } else if (cmd === "cat") {
    if (stdin === undefined || args.length) arity(1, 100);
    noOptions();
    const paths = args.map(path);
    output = paths.length ? paths.map((p) => requireFile(p).content).join("") : stdin!;
    if (paths.length) event.read = paths;
  } else if (cmd === "cp" || cmd === "mv") {
    arity(2);
    noOptions();
    const source = path(args[0]!);
    let target = path(args[1]!);
    const n = requireNode(source);
    if (source === "/" || source === HOME || source === "/home")
      throw Error("Keep the home and root directories in place. Try this command on your own files.");
    if (fs[target]?.type === "dir") target += "/" + source.split("/").pop();
    if (source === target) throw Error("Source and destination are the same file.");
    if (target.startsWith(source + "/")) throw Error("Cannot move a directory inside itself.");
    requireParent(target);
    if (cmd === "cp" && n.type === "dir") throw Error("cp: directory copying is not included in this chapter.");
    if (fs[target]?.type === "dir") throw Error(target + ": Is a directory");
    const paths = [source, ...Object.keys(fs).filter((p) => p.startsWith(source + "/"))];
    if (n.type === "dir" && fs[target]) throw Error("Destination already exists.");
    for (const p of paths) fs[target + p.slice(source.length)] = structuredClone(fs[p]!);
    if (cmd === "mv") {
      for (const p of paths) delete fs[p];
      if (next.cwd === source || next.cwd.startsWith(source + "/")) next.cwd = target + next.cwd.slice(source.length);
    }
    event.source = source;
    event.target = target;
  } else if (cmd === "rm" || cmd === "rmdir") {
    arity(1, 100);
    noOptions();
    for (const name of args) {
      const p = path(name);
      const n = requireNode(p);
      if (n.type === "dir") {
        if (cmd === "rm") throw Error(p + ": Is a directory. Use rmdir for an empty directory.");
        if (children(fs, p).length) throw Error(p + ": Directory not empty");
        if (p === next.cwd || next.cwd.startsWith(p + "/")) throw Error("Leave this directory before removing it.");
      } else if (cmd === "rmdir") throw Error(p + ": Not a directory");
      if (["/", HOME, "/home"].includes(p)) throw Error("Keep the home and root directories in place.");
      delete fs[p];
    }
  } else if (cmd === "head" || cmd === "tail") {
    let count = 10;
    let operands = args;
    if (args[0] === "-n") {
      count = Number(args[1]);
      operands = args.slice(2);
      if (!Number.isInteger(count) || count < 0) throw Error(cmd + ": -n needs a nonnegative line count.");
    } else if (/^-\d+$/.test(args[0] ?? "")) {
      count = Number(args[0]!.slice(1));
      operands = args.slice(1);
    }
    const lines = toLines(readInput(operands, "Usage: " + cmd + " [-n count] [file]"));
    output = fromLines(count === 0 ? [] : cmd === "head" ? lines.slice(0, count) : lines.slice(-count));
  } else if (cmd === "wc") {
    const lineOnly = args[0] === "-l";
    const operands = lineOnly ? args.slice(1) : args;
    const content = readInput(operands, "Usage: wc [-l] [file]");
    const lines = (content.match(/\n/g) ?? []).length;
    // Like real wc, the file name is printed only when the input came from a named file.
    output =
      (lineOnly
        ? String(lines)
        : [
            lines,
            content.trim() ? content.trim().split(/\s+/).length : 0,
            new TextEncoder().encode(content).length,
          ].join("  ")) +
      (operands.length ? " " + operands[0] : "") +
      "\n";
  } else if (cmd === "grep") {
    const flags = args[0] && /^-[iv]+$/.test(args[0]) ? args[0] : "";
    const operands = flags ? args.slice(1) : args;
    if (!operands.length || operands[0]!.startsWith("-")) throw Error("Usage: grep [-i] [-v] pattern [file]");
    let pattern: RegExp;
    try {
      pattern = new RegExp(breToRegExp(operands[0]!), flags.includes("i") ? "i" : "");
    } catch {
      throw Error("grep: invalid regular expression.");
    }
    const invert = flags.includes("v");
    const content = readInput(operands.slice(1), "Usage: grep [-i] [-v] pattern [file]");
    output = fromLines(toLines(content).filter((l) => pattern.test(l) !== invert));
  } else if (cmd === "sort") {
    const flags = args.filter((a) => a.startsWith("-") && a !== "-");
    if (flags.some((f) => !/^-[rnu]+$/.test(f))) throw Error("sort: supported options are -r, -n, and -u.");
    const opts = flags.join("");
    const content = readInput(
      args.filter((a) => !flags.includes(a)),
      "Usage: sort [-r] [-n] [-u] [file]",
    );
    const numeric = opts.includes("n");
    const key = (a: string, b: string) => (numeric ? numericKey(a) - numericKey(b) : byteCompare(a, b));
    // GNU sort breaks key ties by comparing whole lines (-r reverses both). With -u it skips that
    // tiebreak, sorts stably, and keeps the first line of each run of equal keys.
    const sign = opts.includes("r") ? -1 : 1;
    const unique = opts.includes("u");
    let lines = toLines(content).sort((a, b) => sign * (key(a, b) || (unique ? 0 : byteCompare(a, b))));
    if (unique) lines = lines.filter((l, i) => i === 0 || key(lines[i - 1]!, l) !== 0);
    output = fromLines(lines);
  } else if (cmd === "uniq") {
    const count = args[0] === "-c";
    const operands = count ? args.slice(1) : args;
    const runs: [line: string, n: number][] = [];
    for (const line of toLines(readInput(operands, "Usage: uniq [-c] [file]"))) {
      const prev = runs.at(-1);
      if (prev && prev[0] === line) prev[1]++;
      else runs.push([line, 1]);
    }
    output = fromLines(runs.map(([line, n]) => (count ? String(n).padStart(7) + " " + line : line)));
  } else if (cmd === "cut") {
    let delim = "\t";
    let fields: string | undefined;
    const operands: string[] = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i]!;
      if (a === "-d" || a === "-f") {
        if (i + 1 === args.length) throw Error("cut: " + a + " needs a value.");
        if (a === "-d") delim = args[++i]!;
        else fields = args[++i];
      } else if (a.startsWith("-d")) delim = a.slice(2);
      else if (a.startsWith("-f")) fields = a.slice(2);
      else if (a.startsWith("-")) throw Error("cut: supported options are -d and -f.");
      else operands.push(a);
    }
    if (delim.length !== 1) throw Error("cut: the delimiter must be a single character.");
    if (!fields) throw Error('cut: choose fields with -f, like cut -d " " -f 1 file');
    const keep = fieldSelector(fields);
    const content = readInput(operands, 'Usage: cut -d "delimiter" -f fields [file]');
    // Lines without the delimiter pass through untouched, as in GNU cut.
    output = fromLines(
      toLines(content).map((l) =>
        l.includes(delim)
          ? l
              .split(delim)
              .filter((_, i) => keep(i + 1))
              .join(delim)
          : l,
      ),
    );
  } else if (cmd === "find") {
    const rest = [...args];
    let start = ".";
    let pattern: RegExp | null = null;
    if (rest[0] && !rest[0].startsWith("-")) start = rest.shift()!;
    if (rest.length) {
      if (rest.length !== 2 || rest[0] !== "-name") throw Error('Usage: find [path] [-name "pattern"]');
      pattern = new RegExp(
        "^" +
          rest[1]!
            .split("*")
            .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join(".*") +
          "$",
      );
    }
    const p = path(start);
    requireNode(p);
    output =
      Object.keys(fs)
        .filter(
          (k) =>
            (k === p || k.startsWith(p === "/" ? "/" : p + "/")) && (!pattern || pattern.test(k.split("/").pop()!)),
        )
        .sort()
        .join("\n") + "\n";
  } else if (cmd === "chmod") {
    arity(2);
    const n = requireNode(path(args[1]!));
    n.mode = applyChmod(n.mode, args[0]!);
  } else if (cmd === "chown") {
    arity(2);
    const n = requireNode(path(args[1]!));
    const spec = args[0]!;
    if (spec.includes(":")) {
      const [newOwner, newGroup] = spec.split(":");
      if (newOwner) {
        if (!CHOWN_USERS.includes(newOwner)) throw Error("chown: invalid user: '" + newOwner + "'");
        n.owner = newOwner;
      }
      if (newGroup) {
        if (!CHOWN_GROUPS.includes(newGroup)) throw Error("chown: invalid group: '" + newGroup + "'");
        n.group = newGroup;
      }
    } else {
      if (!CHOWN_USERS.includes(spec)) throw Error("chown: invalid user: '" + spec + "'");
      n.owner = spec;
    }
  } else if (cmd === "chgrp") {
    arity(2);
    const n = requireNode(path(args[1]!));
    const newGroup = args[0]!;
    if (!CHOWN_GROUPS.includes(newGroup)) throw Error("chgrp: invalid group: '" + newGroup + "'");
    n.group = newGroup;
  } else if (cmd === "umask") {
    arity(0, 1);
    if (args.length === 0) {
      output = "0" + (next.umask ?? DEFAULT_UMASK) + "\n";
    } else {
      const spec = args[0]!;
      if (!/^[0-7]{1,4}$/.test(spec)) throw Error("umask: invalid mask. Use up to four octal digits, such as 027.");
      next.umask = ((parseInt(spec, 8) & 0o777) >>> 0).toString(8).padStart(3, "0");
    }
    event.options = [next.umask ?? DEFAULT_UMASK];
  } else if (cmd === "clear") {
    arity(0);
    clear = true;
  } else if (cmd === "help") {
    arity(0);
    output =
      "Your practice shell\n\n" +
      commandNames.join("  ") +
      "\n\nUse > to write output to a file, or >> to append.\nUse | to send one command's output into the next, like cat notes.txt | wc -l.\nQuote names containing spaces. Try ls -la or cat Documents/welcome.txt.\n\nOpen the Field guide for syntax and examples.\n";
  } else throw Error(cmd + ": command not found. Type help to see what this practice shell supports.");
  return { output, event, clear };
}
