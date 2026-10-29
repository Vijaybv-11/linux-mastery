import { execFileSync } from "child_process";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterAll, describe, expect, test } from "vitest";
import { ACCESS_LOG, APP_LOG, initialState, runCommand } from "~/lib/shell";

/**
 * "If the game ever disagrees with a real shell, the real shell wins." These tests run the same
 * text-processing commands through bash + GNU coreutils (C locale) and through the practice shell,
 * and require byte-identical output. They skip on machines without GNU tools (e.g. macOS's BSD sort).
 */
const gnu = (() => {
  try {
    return execFileSync("sort", ["--version"]).toString().includes("GNU");
  } catch {
    return false;
  }
})();

const NUMS = "10\n9\nb\nB\n2\n9\n-3\n1.5\n 7\nx 2\n";

describe.skipIf(!gnu)("parity with GNU coreutils", () => {
  const dir = mkdtempSync(join(tmpdir(), "linux-mastery-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, "access.log"), ACCESS_LOG);
  writeFileSync(join(dir, "app.log"), APP_LOG);
  writeFileSync(join(dir, "nums.txt"), NUMS);
  const start = initialState(17);
  const state = { ...start, fs: { ...start.fs, [start.cwd + "/nums.txt"]: { type: "file" as const, mode: "644", content: NUMS } } };

  const real = (command: string) =>
    execFileSync("bash", ["-c", command + "; true"], { cwd: dir, env: { ...process.env, LC_ALL: "C" } }).toString();

  test.each([
    // The Stage 3 missions
    "cat access.log | wc -l",
    "grep 404 access.log | wc -l",
    'cut -d " " -f 1 access.log',
    'cut -d " " -f 1 access.log | sort | uniq -c',
    'cut -d " " -f 1 access.log | sort | uniq -c | sort -rn | head -n 1',
    "grep ERROR app.log | sort | uniq -c",
    // Nearby variations a learner might try
    'cut -d " " -f 1 access.log | uniq -c',
    'cut -d " " -f 1 access.log | sort | uniq -c | sort -rn',
    "grep ERROR app.log | sort | uniq -c | sort -rn",
    "cat app.log | uniq | wc -l",
    "cat app.log | sort -u",
    "echo hello | wc -l",
    "tail -n 3 app.log | head -n 1",
    "head -3 access.log | cut -d ' ' -f 9",
    // sort ordering rules
    "sort nums.txt",
    "sort -r nums.txt",
    "sort -n nums.txt",
    "sort -rn nums.txt",
    "sort -u nums.txt",
    "sort -nu nums.txt",
    "sort -rnu nums.txt",
    "sort -ru nums.txt",
    // cut field lists
    "cut -d ' ' -f 4- access.log | head -n 3",
    "cut -d / -f 2,4 access.log | tail -n 2",
    "cut -d . -f -2 access.log",
    // grep basic regular expressions and quoting
    "grep 'GET|POST' access.log",
    "grep 'GET\\|POST' access.log | wc -l",
    'grep "GET\\|POST" access.log | wc -l',
    "grep 'php?' access.log",
    "grep '\\(db\\)' app.log",
    "grep '[]x]' nums.txt",
    "grep '[^]0-9]' nums.txt",
    "grep -v INFO app.log",
    "grep -iv error app.log",
  ])("%s", (command) => {
    const sim = runCommand(state, command);
    expect(sim.ok, sim.output).toBe(true);
    expect(sim.output).toBe(real(command));
  });
});
