import { describe, expect, test } from "vitest";
import { HOME, initialState, resolvePath, runCommand, type ShellState } from "~/lib/shell";
import { lessons } from "~/lib/lessons";

const runAll = (state: ShellState, commands: string[]) => {
  for (const command of commands) {
    const r = runCommand(state, command);
    expect(r.ok, `${command}: ${r.output}`).toBe(true);
    state = r.state;
  }
  return state;
};

describe("practice shell", () => {
  test("all ten lessons can be solved from their own fresh workspace", () => {
    const solutions = [
      "pwd",
      "ls -la",
      "cd Documents",
      "mkdir projects",
      "touch projects/hello.txt",
      'echo "Hello Linux" > projects/hello.txt',
      "cat Documents/welcome.txt",
      "cp Documents/welcome.txt projects/guide.txt",
      "mv projects/draft.txt projects/launch.txt",
      "rm Downloads/old.tmp",
    ];
    solutions.forEach((command, i) => {
      const lesson = lessons[i]!;
      const start = initialState(i);
      expect(Boolean(lesson.check(start, {})), `Mission ${i + 1} must begin unsolved`).toBe(false);
      const result = runCommand(start, command);
      expect(result.ok, `${command}: ${result.output}`).toBe(true);
      expect(lesson.check(result.state, result.event), `Mission ${i + 1}`).toBe(true);
    });
  });

  test("alternate valid paths and multi-command solutions work", () => {
    const state = runAll(initialState(4), ["cd projects", "touch ./hello.txt"]);
    expect(lessons[4]!.check(state, {})).toBe(true);
    expect(resolvePath("../../../../../../tmp", HOME)).toBe("/tmp");
    expect(resolvePath("~/Documents/../projects")).toBe(HOME + "/projects");
  });

  test("quoted filenames, redirects, appends, and literal greater-than", () => {
    const state = runAll(initialState(), [
      'touch "a b.txt"',
      'echo "first > second" > "a b.txt"',
      'echo third >> "a b.txt"',
    ]);
    expect(state.fs[HOME + "/a b.txt"]!.content).toBe("first > second\nthird\n");
    expect(runCommand(state, 'cat "a b.txt"').output).toBe("first > second\nthird\n");
  });

  test("errors leave the filesystem unchanged, including partial multi-file failures", () => {
    const state = initialState();
    for (const command of [
      "touch made.txt missing/child",
      "rm Documents",
      "mv Documents Documents/nested",
      "cp Documents/welcome.txt Documents/welcome.txt",
      'echo "unclosed',
      "ls -z",
      "cat missing",
      "echo hi > missing/file",
      "ls | cat",
      "mkdir made missing/child",
      "rm Downloads/old.tmp missing",
    ]) {
      const before = JSON.stringify(state);
      const r = runCommand(state, command);
      expect(r.ok, command).toBe(false);
      expect(JSON.stringify(r.state), command).toBe(before);
      expect(JSON.stringify(state)).toBe(before);
    }
  });

  test("permissions, hidden listings, text utilities, and find work", () => {
    const state = initialState();
    expect(runCommand(state, "ls -a").output).toContain(".welcome");
    expect(runCommand(state, "ls").output).not.toContain(".welcome");
    const r = runCommand(state, "chmod +x Documents/welcome.txt");
    expect(r.state.fs[HOME + "/Documents/welcome.txt"]!.mode).toBe("755");
    expect(runCommand(state, "wc -l Documents/welcome.txt").output).toBe("2 Documents/welcome.txt\n");
    expect(runCommand(state, "head -n 1 Documents/welcome.txt").output).toBe("Welcome to Linux Mastery!\n");
    expect(runCommand(state, "tail -n 1 Documents/welcome.txt").output).toBe(
      "Small commands open big possibilities.\n",
    );
    expect(runCommand(state, "grep -i welcome Documents/welcome.txt").output.startsWith("Welcome")).toBe(true);
    expect(runCommand(state, 'find . -name "*.txt"').output.trim().split("\n")).toHaveLength(2);
  });

  test("moving a directory updates descendants and the current path", () => {
    let state = initialState();
    state = runCommand(state, "cd Documents").state;
    const r = runCommand(state, "mv ~/Documents ~/Archive");
    expect(r.ok).toBe(true);
    expect(r.state.cwd).toBe(HOME + "/Archive");
    expect(r.state.fs[HOME + "/Archive/welcome.txt"]!.type).toBe("file");
    expect(r.state.fs[HOME + "/Documents"]).toBeUndefined();
  });
});
