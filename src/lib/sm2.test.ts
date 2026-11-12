import { describe, it, expect } from "vitest";
import { calculateSM2 } from "./sm2";

describe("calculateSM2", () => {
  it("Again resets repetitions to 0 and interval to 1", () => {
    const result = calculateSM2({ interval: 6, easeFactor: 2.5, repetitions: 2 }, 0);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("Again never drops easeFactor below 1.3", () => {
    const result = calculateSM2({ interval: 1, easeFactor: 1.3, repetitions: 0 }, 0);
    expect(result.easeFactor).toBeCloseTo(1.3);
  });

  it("Good on new card (repetitions=0) sets interval to 1 and increments repetitions", () => {
    const result = calculateSM2({ interval: 1, easeFactor: 2.5, repetitions: 0 }, 2);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  it("Good on second repetition sets interval to 6", () => {
    const result = calculateSM2({ interval: 1, easeFactor: 2.5, repetitions: 1 }, 2);
    expect(result.interval).toBe(6);
  });

  it("Good on third+ repetition multiplies interval by easeFactor", () => {
    const result = calculateSM2({ interval: 6, easeFactor: 2.5, repetitions: 2 }, 2);
    expect(result.interval).toBe(Math.ceil(6 * 2.5));
  });

  it("Easy increases easeFactor by 0.15", () => {
    const result = calculateSM2({ interval: 6, easeFactor: 2.5, repetitions: 2 }, 3);
    expect(result.easeFactor).toBeCloseTo(2.65);
  });

  it("Hard decreases easeFactor by 0.15 but not below 1.3", () => {
    const result = calculateSM2({ interval: 6, easeFactor: 2.5, repetitions: 2 }, 1);
    expect(result.easeFactor).toBeCloseTo(2.35);
  });

  it("Hard interval is ceil(interval * 1.2)", () => {
    const result = calculateSM2({ interval: 6, easeFactor: 2.5, repetitions: 2 }, 1);
    expect(result.interval).toBe(Math.ceil(6 * 1.2));
  });

  it("interval is capped at 36500", () => {
    const result = calculateSM2({ interval: 30000, easeFactor: 2.5, repetitions: 10 }, 3);
    expect(result.interval).toBeLessThanOrEqual(36500);
  });

  it("dueDate is approximately interval days from now", () => {
    const before = Date.now();
    const result = calculateSM2({ interval: 1, easeFactor: 2.5, repetitions: 1 }, 2);
    // interval becomes 6 days
    const expectedMs = 6 * 24 * 60 * 60 * 1000;
    expect(result.dueDate.getTime()).toBeGreaterThanOrEqual(before + expectedMs - 1000);
    expect(result.dueDate.getTime()).toBeLessThanOrEqual(before + expectedMs + 2000);
  });
});
