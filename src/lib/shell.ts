/**
 * Linux practice shell — a pure, deterministic simulation of a small
 * POSIX-like shell over an in-memory filesystem. Ported verbatim (with types)
 * from the original vanilla Linux Mastery implementation.
 */
export const HOME = "/home/explorer";

export interface FsNode {
  type: "dir" | "file";
  mode: string;
  content?: string;
}
export type FileSystem = Record<string, FsNode>;
export interface ShellState {
  cwd: string;
  fs: FileSystem;
}
export interface ShellEvent {
  command?: string;
  path?: string;
  listed?: string[];
  read?: string[];
  written?: string;
  source?: string;
  target?: string;
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
  return { cwd: HOME, fs };
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
    if (["|", ";", "&", "<"].includes(c))
      throw Error(
        "This practice shell supports one command at a time. Pipes and advanced shell syntax come in a future chapter.",
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
  "pwd", "ls", "cd", "mkdir", "touch", "echo", "cat", "cp", "mv", "rm",
  "rmdir", "head", "tail", "wc", "grep", "find", "chmod", "whoami", "clear", "help",
];

const PRINTING = ["echo", "cat", "pwd", "ls", "whoami", "head", "tail", "wc", "grep", "find", "help"];

export function permission(mode: string): string {
  return mode
    .split("")
    .map((d) => [4, 2, 1].map((bit, i) => (Number(d) & bit ? "rwx"[i] : "-")).join(""))
    .join("");
}

export function runCommand(state: ShellState, input: string): RunResult {
  const next: ShellState = structuredClone(state);
  let output = "";
  let event: ShellEvent = {};
  let clear = false;
  try {
    const tokens = tokenize(input.trim());
    if (!tokens.length) return { state: next, output: "", event: {}, ok: true };
    const redirects = tokens.map((t, i) => (t.operator ? i : -1)).filter((i) => i >= 0);
    let redirect: { append: boolean; path: string } | null = null;
    if (redirects.length) {
      const i = redirects[0]!;
      if (redirects.length !== 1 || i === 0 || i !== tokens.length - 2 || tokens[i + 1]!.operator)
        throw Error("Use one output file after > or >>.");
      redirect = { append: tokens[i]!.value === ">>", path: resolvePath(tokens[i + 1]!.value, next.cwd) };
      tokens.splice(i);
    }
    const [cmd = "", ...args] = tokens.map((t) => t.value);
    const fs = next.fs;
    const path = (p: string) => resolvePath(p, next.cwd);
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
    event = { command: cmd };

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
      const names =
        n.type === "file"
          ? [p]
          : children(fs, p).filter((c) => all || !c.split("/").pop()!.startsWith("."));
      output =
        names
          .map((q) => {
            const node = fs[q]!;
            const name = q.split("/").pop()! + (node.type === "dir" ? "/" : "");
            if (!long) return name;
            return (
              (node.type === "dir" ? "d" : "-") +
              permission(node.mode) +
              "  explorer explorer  " +
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
            if (fs[current] && fs[current].type !== "dir") throw Error(current + ": Not a directory");
            fs[current] ??= dir();
          }
        } else {
          requireParent(p);
          fs[p] = dir();
        }
      }
    } else if (cmd === "touch") {
      if (!args.length) throw Error("touch: missing file name.");
      noOptions();
      for (const name of args) {
        const p = path(name);
        requireParent(p);
        fs[p] ??= file("");
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
      arity(1, 100);
      noOptions();
      const paths = args.map(path);
      output = paths.map((p) => requireFile(p).content).join("");
      event.read = paths;
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
        if (next.cwd === source || next.cwd.startsWith(source + "/"))
          next.cwd = target + next.cwd.slice(source.length);
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
      }
      if (operands.length !== 1 || operands[0]!.startsWith("-")) throw Error("Usage: " + cmd + " [-n count] file");
      const content = requireFile(path(operands[0]!)).content;
      const lines = content.replace(/\n$/, "").split("\n");
      const selected = count === 0 ? [] : cmd === "head" ? lines.slice(0, count) : lines.slice(-count);
      output = selected.join("\n") + (selected.length ? "\n" : "");
    } else if (cmd === "wc") {
      const lineOnly = args[0] === "-l";
      const operands = lineOnly ? args.slice(1) : args;
      if (operands.length !== 1 || operands[0]!.startsWith("-")) throw Error("Usage: wc [-l] file");
      const content = requireFile(path(operands[0]!)).content;
      const lines = (content.match(/\n/g) ?? []).length;
      output =
        (lineOnly
          ? lines
          : [
              lines,
              content.trim() ? content.trim().split(/\s+/).length : 0,
              new TextEncoder().encode(content).length,
            ].join("  ")) +
        " " +
        operands[0] +
        "\n";
    } else if (cmd === "grep") {
      const ignore = args[0] === "-i";
      const operands = ignore ? args.slice(1) : args;
      if (operands.length !== 2 || operands[0]!.startsWith("-")) throw Error("Usage: grep [-i] pattern file");
      let pattern: RegExp;
      try {
        pattern = new RegExp(operands[0]!, ignore ? "i" : "");
      } catch {
        throw Error("grep: invalid regular expression.");
      }
      output = requireFile(path(operands[1]!))
        .content.split("\n")
        .filter((l) => pattern.test(l))
        .join("\n");
      if (output) output += "\n";
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
              (k === p || k.startsWith(p === "/" ? "/" : p + "/")) &&
              (!pattern || pattern.test(k.split("/").pop()!)),
          )
          .sort()
          .join("\n") + "\n";
    } else if (cmd === "chmod") {
      arity(2);
      const n = requireNode(path(args[1]!));
      if (/^[0-7]{3}$/.test(args[0]!)) n.mode = args[0]!;
      else if (args[0] === "+x")
        n.mode = n.mode
          .split("")
          .map((d) => String(Number(d) | 1))
          .join("");
      else throw Error("chmod: use three octal digits, such as 755, or +x.");
    } else if (cmd === "clear") {
      arity(0);
      clear = true;
    } else if (cmd === "help") {
      arity(0);
      output =
        "Your practice shell\n\n" +
        commandNames.join("  ") +
        "\n\nUse > to write output to a file, or >> to append.\nQuote names containing spaces. Try ls -la or cat Documents/welcome.txt.\n\nOpen the Field guide for syntax and examples.\nThis chapter supports one command at a time.\n";
    } else throw Error(cmd + ": command not found. Type help to see what this practice shell supports.");

    if (redirect) {
      if (!PRINTING.includes(cmd))
        throw Error("Output redirection is supported for commands that print text in this practice shell.");
      requireParent(redirect.path);
      if (fs[redirect.path]?.type === "dir") throw Error(redirect.path + ": Is a directory");
      const before = fs[redirect.path];
      fs[redirect.path] = {
        ...(before ?? file("")),
        content: (redirect.append ? (before?.content ?? "") : "") + output,
      };
      output = "";
      event.written = redirect.path;
    }
    return { state: next, output, event, ok: true, clear };
  } catch (e) {
    return { state: structuredClone(state), output: (e as Error).message, event: {}, ok: false };
  }
}
