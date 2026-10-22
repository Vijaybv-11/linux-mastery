import { describe, expect, test } from "vitest";
import { initialState, runCommand, type ShellState } from "~/lib/shell";
import { lessons } from "~/lib/lessons";

/** Canonical solving command for each Stage 2 mission (lesson indices 10–16). */
const canonical: Record<number, string> = {
  10: "ls -l",
  11: "chmod u+x backup.sh",
  12: "chmod 640 secrets.env",
  13: "chown maya handover.md",
  14: "chgrp developers project",
  15: "chmod +t uploads",
  16: "umask 027",
};

/** Optional alternate solving paths that should also clear the mission. */
const altPaths: Record<number, string> = {
  11: "chmod 744 backup.sh",
  15: "chmod 1777 uploads",
  16: "umask 0027",
};

const solve = (i: number, command: string) => {
  const result = runCommand(initialState(i), command);
  expect(result.ok, `${command}: ${result.output}`).toBe(true);
  return result;
};

describe("Stage 2: Permissions & Ownership missions", () => {
  for (let i = 10; i <= 16; i++) {
    test(`mission ${i + 1} begins unsolved and is solved by its canonical command`, () => {
      const s0: ShellState = initialState(i);
      // A fresh workspace must not already satisfy the check.
      expect(lessons[i]!.check(s0, {}), `Mission ${i + 1} must begin unsolved`).toBe(false);

      const result = solve(i, canonical[i]!);
      expect(lessons[i]!.check(result.state, result.event), `Mission ${i + 1} canonical`).toBe(true);
    });

    if (altPaths[i]) {
      test(`mission ${i + 1} is also solved by an alternate command`, () => {
        const result = solve(i, altPaths[i]!);
        expect(lessons[i]!.check(result.state, result.event), `Mission ${i + 1} alternate`).toBe(true);
      });
    }
  }

  test("mission 11 starts without the owner execute bit", () => {
    const s0 = initialState(11);
    // Plain inspection should not clear the mission.
    expect(lessons[11]!.check(runCommand(s0, "ls -l").state, {})).toBe(false);
  });

  test("mission 17 (umask) passes only for umask 027", () => {
    const start = initialState(16);
    expect(lessons[16]!.check(start, {})).toBe(false);
    // A different, valid mask must not clear the mission.
    expect(lessons[16]!.check(runCommand(start, "umask 022").state, {})).toBe(false);
    expect(lessons[16]!.check(runCommand(start, "umask 077").state, {})).toBe(false);
    // The required mask clears it, whether written as 027 or 0027.
    expect(lessons[16]!.check(runCommand(start, "umask 027").state, {})).toBe(true);
    expect(lessons[16]!.check(runCommand(start, "umask 0027").state, {})).toBe(true);
  });
});
