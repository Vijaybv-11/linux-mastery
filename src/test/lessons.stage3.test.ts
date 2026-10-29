import { describe, expect, test } from "vitest";
import { initialState, runCommand, type ShellState } from "~/lib/shell";
import { groups, lessons } from "~/lib/lessons";

/** Canonical solving command for each Stage 3 mission (lesson indices 17–22), run from ~/server/logs. */
const canonical: Record<number, string> = {
  17: "cat access.log | wc -l",
  18: "grep 404 access.log | wc -l",
  19: 'cut -d " " -f 1 access.log',
  20: 'cut -d " " -f 1 access.log | sort | uniq -c',
  21: 'cut -d " " -f 1 access.log | sort | uniq -c | sort -rn | head -n 1',
  22: "grep ERROR app.log | sort | uniq -c > ~/server/report.txt",
};

/** Other reasonable ways a learner might solve each mission. */
const altPaths: Record<number, string[]> = {
  17: ["grep '' access.log | wc -l", "head -n 20 access.log | wc -l"],
  18: ["cat access.log | grep 404 | wc -l", "grep ' 404 ' access.log | wc -l"],
  19: ["cut -d' ' -f1 access.log", 'cat access.log | cut -d " " -f 1'],
  20: ['cat access.log | cut -d " " -f 1 | sort | uniq -c'],
  21: [
    "cut -d' ' -f1 access.log | sort | uniq -c | sort -nr | head -1",
    'cut -d " " -f 1 access.log | sort | uniq -c | sort -n | tail -n 1',
  ],
  22: [
    "grep ERROR app.log | sort | uniq -c | sort -rn > ../report.txt",
    "cat app.log | grep ERROR | sort | uniq -c > /home/explorer/server/report.txt",
  ],
};

/** Commands that look close but should not clear the mission. */
const nearMisses: Record<number, string[]> = {
  17: ["wc -l access.log", "cat access.log | head -n 3 | wc -l"],
  18: ["grep 404 access.log", "grep 200 access.log | wc -l"],
  19: ['cut -d " " -f 2 access.log', "cat access.log"],
  20: ['cut -d " " -f 1 access.log | uniq -c', 'cut -d " " -f 1 access.log | sort'],
  21: ['cut -d " " -f 1 access.log | sort | uniq -c | sort -n | head -n 1'],
  22: ["grep ERROR app.log | sort | uniq -c", "grep ERROR app.log > ~/server/report.txt"],
};

/** The exact command spelled out in each mission's second hint (absolute, so it works from anywhere). */
const hintCommand: Record<number, string> = {
  17: "cat ~/server/logs/access.log | wc -l",
  18: "grep 404 ~/server/logs/access.log | wc -l",
  19: 'cut -d " " -f 1 ~/server/logs/access.log',
  20: 'cut -d " " -f 1 ~/server/logs/access.log | sort | uniq -c',
  21: 'cut -d " " -f 1 ~/server/logs/access.log | sort | uniq -c | sort -rn | head -n 1',
  22: "grep ERROR ~/server/logs/app.log | sort | uniq -c > ~/server/report.txt",
};

const clears = (i: number, command: string, start: ShellState = initialState(i)) => {
  const r = runCommand(start, command);
  expect(r.ok, `${command}: ${r.output}`).toBe(true);
  return lessons[i]!.check(r.state, r.event);
};

describe("Stage 3: Pipes & text missions", () => {
  test("the Pipes & text stage is unlocked and lists missions 18–23", () => {
    const stage = groups.find((g) => g.title === "Pipes & text")!;
    expect(stage.locked).toBeFalsy();
    expect(stage.lessons).toEqual([17, 18, 19, 20, 21, 22]);
    expect(lessons).toHaveLength(23);
  });

  for (let i = 17; i <= 22; i++) {
    test(`mission ${i + 1} begins unsolved and is solved by its canonical command`, () => {
      expect(lessons[i]!.check(initialState(i), {}), `Mission ${i + 1} must begin unsolved`).toBe(false);
      expect(clears(i, canonical[i]!)).toBe(true);
    });

    test(`mission ${i + 1} accepts alternate solutions`, () => {
      for (const alt of altPaths[i]!) expect(clears(i, alt), alt).toBe(true);
    });

    test(`mission ${i + 1} rejects near misses`, () => {
      for (const miss of nearMisses[i]!) expect(clears(i, miss), miss).toBe(false);
    });

    test(`mission ${i + 1}'s hint command is in hint[1] and works after wandering off`, () => {
      expect(lessons[i]!.hints[1]).toContain(hintCommand[i]!);
      const wandered = runCommand(initialState(i), "cd ~/Documents").state;
      expect(clears(i, hintCommand[i]!, wandered)).toBe(true);
    });
  }
});
