import { describe, expect, test } from "vitest";
import { groupOf, groups, isTierId, lessons, tierEntry, tierLessons, tierOf, tiers } from "~/lib/lessons";
import { isUnlocked, nextLessonFor, PLAYGROUND, tierProgress } from "~/lib/progress";

describe("Difficulty tiers", () => {
  test("there are Beginner, Intermediate and Advanced tiers, in that order", () => {
    expect(tiers.map((t) => t.id)).toEqual(["beginner", "intermediate", "advanced"]);
    expect(isTierId("intermediate")).toBe(true);
    expect(isTierId("expert")).toBe(false);
    expect(isTierId(null)).toBe(false);
  });

  test("every mission belongs to exactly one stage, and tiers cover them in play order", () => {
    const all = groups.flatMap((g) => g.lessons);
    expect(all).toEqual(lessons.map((_, i) => i));
    expect(tiers.flatMap((t) => tierLessons(t.id))).toEqual(all);
  });

  test("Beginner is missions 1–10, Intermediate is 11–23, Advanced has none yet", () => {
    expect(tierLessons("beginner")).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(tierLessons("intermediate")).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);
    expect(tierLessons("advanced")).toEqual([]);
    expect(tiers.find((t) => t.id === "advanced")!.comingSoon).toBe(true);
    expect(tierEntry("intermediate")).toBe(10);
    expect(tierEntry("advanced")).toBe(-1);
  });

  test("tierOf and groupOf look up a mission's tier and stage", () => {
    expect(tierOf(0)!.id).toBe("beginner");
    expect(tierOf(9)!.id).toBe("beginner");
    expect(tierOf(10)!.id).toBe("intermediate");
    expect(groupOf(17)!.title).toBe("Pipes & text");
    expect(tierOf(PLAYGROUND)).toBeUndefined();
    expect(tierOf(lessons.length)).toBeUndefined();
  });

  test("the first mission of each tier is open, so players can skip ahead", () => {
    expect(isUnlocked(0, [])).toBe(true);
    expect(isUnlocked(10, [])).toBe(true);
    // ...but the rest of a tier still opens one mission at a time.
    expect(isUnlocked(11, [])).toBe(false);
    expect(isUnlocked(11, [10])).toBe(true);
    expect(isUnlocked(5, [])).toBe(false);
  });

  test("the next mission follows the chosen tier, then falls back to anything unfinished", () => {
    expect(nextLessonFor("beginner", [])).toBe(0);
    expect(nextLessonFor("intermediate", [])).toBe(10);
    expect(nextLessonFor("intermediate", [10, 11])).toBe(12);
    const allIntermediate = tierLessons("intermediate");
    expect(nextLessonFor("intermediate", allIntermediate)).toBe(0);
    expect(nextLessonFor("advanced", [0, 1])).toBe(2);
    expect(nextLessonFor("beginner", lessons.map((_, i) => i))).toBe(-1);
  });

  test("tierProgress counts finished missions per tier", () => {
    expect(tierProgress("beginner", [0, 1, 10])).toEqual({ done: 2, total: 10 });
    expect(tierProgress("intermediate", [0, 1, 10])).toEqual({ done: 1, total: 13 });
    expect(tierProgress("advanced", [0])).toEqual({ done: 0, total: 0 });
  });
});
