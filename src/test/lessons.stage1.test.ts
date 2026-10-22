import { describe, expect, test } from "vitest";
import { initialState, runCommand, type ShellState } from "~/lib/shell";
import { lessons } from "~/lib/lessons";

/** Canonical solving command for each Stage 1 (beginner) mission, lesson indices 0–9. */
const canonical: Record<number, string> = {
  0: "pwd",
  1: "ls -a",
  2: "cd Documents",
  3: "mkdir projects",
  4: "touch projects/hello.txt",
  5: 'echo "Hello Linux" > projects/hello.txt',
  6: "cat Documents/welcome.txt",
  7: "cp Documents/welcome.txt projects/guide.txt",
  8: "mv projects/draft.txt projects/launch.txt",
  9: "rm Downloads/old.tmp",
};

/** Alternate solving paths a learner might reasonably try that should also clear. */
const altPaths: Record<number, string[]> = {
  2: ["cd ~/Documents", "cd /home/explorer/Documents"],
  6: ["cat ~/Documents/welcome.txt"],
};

const solve = (i: number, command: string) => {
  const result = runCommand(initialState(i), command);
  expect(result.ok, `${command}: ${result.output}`).toBe(true);
  return result;
};

describe("Stage 1: Beginner missions", () => {
  for (let i = 0; i <= 9; i++) {
    test(`mission ${i + 1} begins unsolved and is solved by its canonical command`, () => {
      const s0: ShellState = initialState(i);
      expect(lessons[i]!.check(s0, {}), `Mission ${i + 1} must begin unsolved`).toBe(false);

      const result = solve(i, canonical[i]!);
      expect(lessons[i]!.check(result.state, result.event), `Mission ${i + 1} canonical`).toBe(true);
    });

    if (altPaths[i]) {
      test(`mission ${i + 1} also clears via reasonable alternate paths`, () => {
        for (const alt of altPaths[i]!) {
          const result = runCommand(initialState(i), alt);
          expect(result.ok, `${alt}: ${result.output}`).toBe(true);
          expect(lessons[i]!.check(result.state, result.event), `Mission ${i + 1} alt: ${alt}`).toBe(true);
        }
      });
    }
  }

  /**
   * The exact runnable command spelled out in each mission's second hint
   * ("Run ..."/"Type ..."). These are now anchored at ~ (or are cwd-independent)
   * so they clear the mission even if the learner has wandered away from the
   * starting directory — the "wandering trap" we fixed.
   */
  const hintCommand: Record<number, string> = {
    0: "pwd",
    1: "ls -a ~",
    2: "cd ~/Documents",
    3: "mkdir ~/projects",
    4: "touch ~/projects/hello.txt",
    5: 'echo "Hello Linux" > ~/projects/hello.txt',
    6: "cat ~/Documents/welcome.txt",
    7: "cp ~/Documents/welcome.txt ~/projects/guide.txt",
    8: "mv ~/projects/draft.txt ~/projects/launch.txt",
    9: "rm ~/Downloads/old.tmp",
  };

  test("each mission's spelled-out hint command actually appears in hint[1]", () => {
    for (let i = 0; i <= 9; i++) {
      expect(lessons[i]!.hints[1], `Mission ${i + 1} hint must contain its command`).toContain(hintCommand[i]!);
    }
  });

  test("hint commands clear the mission from its starting directory", () => {
    for (let i = 0; i <= 9; i++) {
      const result = runCommand(initialState(i), hintCommand[i]!);
      expect(result.ok, `Mission ${i + 1} hint "${hintCommand[i]}": ${result.output}`).toBe(true);
      expect(lessons[i]!.check(result.state, result.event), `Mission ${i + 1} hint should clear`).toBe(true);
    }
  });

  test("hint commands still clear the mission after the learner has wandered to /", () => {
    // Mission success text teaches `cd ..`, so a curious learner can end up at /.
    // Because the hint commands are ~-anchored, they must still work from there.
    // Mission 1 (pwd) is excluded: its whole purpose is to report the CURRENT
    // directory (check requires cwd === HOME), so it is cwd-dependent by design
    // and is also the very first mission, before any `cd` has been taught.
    for (let i = 1; i <= 9; i++) {
      const wandered = runCommand(initialState(i), "cd /");
      expect(wandered.ok, `Mission ${i + 1} cd /: ${wandered.output}`).toBe(true);
      expect(wandered.state.cwd, `Mission ${i + 1} should be at / after cd /`).toBe("/");
      const result = runCommand(wandered.state, hintCommand[i]!);
      expect(result.ok, `Mission ${i + 1} hint from /: "${hintCommand[i]}": ${result.output}`).toBe(true);
      expect(lessons[i]!.check(result.state, result.event), `Mission ${i + 1} hint from / should clear`).toBe(true);
    }
  });
});
