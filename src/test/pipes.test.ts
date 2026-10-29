import { describe, expect, test } from "vitest";
import { HOME, initialState, runCommand, type ShellState } from "~/lib/shell";

const LOGS = HOME + "/server/logs";
const out = (state: ShellState, command: string) => {
  const r = runCommand(state, command);
  expect(r.ok, `${command}: ${r.output}`).toBe(true);
  return r.output;
};

describe("pipes", () => {
  const state = initialState(17);

  test("stage 3 starts in ~/server/logs with both logs", () => {
    expect(state.cwd).toBe(LOGS);
    expect(out(state, "ls")).toBe("access.log\napp.log\n");
  });

  test("a pipe feeds one command's output into the next", () => {
    expect(out(state, "cat access.log | wc -l")).toBe("14\n");
    expect(out(state, "grep 404 access.log | wc -l")).toBe("5\n");
    expect(out(state, "cat access.log | grep POST | head -n 1")).toContain("203.0.113.9");
    expect(out(state, "echo hello | cat")).toBe("hello\n");
  });

  test("wc prints a file name only when it read a named file", () => {
    expect(out(state, "wc -l access.log")).toBe("14 access.log\n");
    expect(out(state, "echo one two | wc")).toBe("1  2  8\n");
  });

  test("grep supports -v and reads stdin", () => {
    expect(out(state, "grep -v INFO app.log | wc -l")).toBe("7\n");
    expect(out(state, "cat app.log | grep -i warn")).toBe("WARN cache miss\n");
    expect(out(state, "grep nothing-matches app.log | wc -l")).toBe("0\n");
  });

  test("cut selects fields by delimiter", () => {
    expect(out(state, 'cut -d " " -f 1 access.log | head -n 2')).toBe("10.0.0.5\n203.0.113.9\n");
    expect(out(state, "cut -d' ' -f1 access.log | head -1")).toBe("10.0.0.5\n");
    expect(out(state, 'echo "a,b,c,d" | cut -d , -f 2-3')).toBe("b,c\n");
    expect(out(state, 'echo "a,b,c,d" | cut -d , -f 1,4')).toBe("a,d\n");
    expect(out(state, 'echo "a,b,c,d" | cut -d , -f 3-')).toBe("c,d\n");
    expect(out(state, 'echo "no delimiter" | cut -d , -f 2')).toBe("no delimiter\n");
    expect(runCommand(state, "cut -f 1 access.log").ok).toBe(true); // tab is the default delimiter
    expect(runCommand(state, "cut -d , access.log").ok).toBe(false);
    expect(runCommand(state, 'cut -d ", " -f 1 access.log').ok).toBe(false);
    expect(runCommand(state, "cut -d , -f 0 access.log").ok).toBe(false);
  });

  test("sort orders bytewise by default, numerically with -n, reversed with -r, unique with -u", () => {
    let t = initialState(17);
    for (const v of ["10", "9", "b", "B", "2", "9"]) t = runCommand(t, `echo ${v} >> nums.txt`).state;
    expect(out(t, "sort nums.txt")).toBe("10\n2\n9\n9\nB\nb\n");
    expect(out(t, "sort -n nums.txt")).toBe("B\nb\n2\n9\n9\n10\n");
    expect(out(t, "sort -rn nums.txt")).toBe("10\n9\n9\n2\nb\nB\n");
    expect(out(t, "sort -u nums.txt")).toBe("10\n2\n9\nB\nb\n");
    expect(runCommand(t, "sort -k 2 nums.txt").ok).toBe(false);
  });

  test("uniq collapses only adjacent duplicates, which is why you sort first", () => {
    const unsorted = out(state, 'cut -d " " -f 1 access.log | uniq -c');
    expect(unsorted.trim().split("\n")).toHaveLength(14);
    expect(out(state, 'cut -d " " -f 1 access.log | sort | uniq -c')).toBe(
      "      3 10.0.0.5\n      2 192.0.2.17\n      3 198.51.100.4\n      6 203.0.113.9\n",
    );
    expect(out(state, 'cut -d " " -f 1 access.log | sort | uniq -c | sort -rn | head -n 1')).toBe(
      "      6 203.0.113.9\n",
    );
  });

  test("a redirect at the end saves the pipeline's final output", () => {
    const r = runCommand(state, "grep ERROR app.log | sort | uniq -c > ../report.txt");
    expect(r.ok).toBe(true);
    expect(r.output).toBe("");
    expect(r.event.written).toBe(HOME + "/server/report.txt");
    expect(r.event.stdout).toContain("ERROR db");
    expect(r.state.fs[HOME + "/server/report.txt"]!.content).toBe(
      "      3 ERROR db: connection refused\n      1 ERROR disk: quota exceeded\n      2 ERROR login: too many attempts from 203.0.113.9\n",
    );
  });

  test("the event records the whole pipeline", () => {
    const r = runCommand(state, "cat access.log | grep 404 | wc -l");
    expect(r.event.pipeline).toEqual(["cat", "grep", "wc"]);
    expect(r.event.command).toBe("wc");
    expect(r.event.read).toEqual([LOGS + "/access.log"]);
    expect(runCommand(state, "pwd").event.pipeline).toEqual(["pwd"]);
  });

  test("cd and umask inside a pipeline don't change the shell, as in bash", () => {
    const r = runCommand(state, "cd .. | pwd");
    expect(r.ok).toBe(true);
    expect(r.state.cwd).toBe(LOGS);
    expect(runCommand(state, "umask 077 | cat").state.umask).toBeUndefined();
  });

  test("malformed pipelines fail without changing anything", () => {
    for (const command of [
      "| wc -l",
      "cat access.log |",
      "cat access.log | | wc -l",
      "cat access.log || wc -l",
      "cat access.log > x.txt | wc -l",
      "wc -l",
      "cat",
      "touch made.txt | cat missing",
    ]) {
      const r = runCommand(state, command);
      expect(r.ok, command).toBe(false);
      expect(r.state, command).toEqual(state);
    }
  });

  test("a quoted pipe character is just text", () => {
    expect(out(state, 'echo "a | b"')).toBe("a | b\n");
    expect(out(state, "grep '|' access.log | wc -l")).toBe("0\n");
  });

  test("grep patterns are basic regular expressions, as in real grep", () => {
    // In a BRE, | + ? ( ) { } are literal; a backslash makes them special (GNU extension).
    expect(out(state, "grep 'GET|POST' access.log | wc -l")).toBe("0\n");
    expect(out(state, "grep 'GET\\|POST' access.log | wc -l")).toBe("14\n");
    expect(out(state, "grep 'php?' access.log | wc -l")).toBe("0\n");
    expect(out(state, "grep '^203' access.log | wc -l")).toBe("6\n");
    expect(out(state, "grep '\\.env' access.log | wc -l")).toBe("1\n");
    expect(out(state, "grep '4[0-9]1' access.log | wc -l")).toBe("2\n");
  });
});
