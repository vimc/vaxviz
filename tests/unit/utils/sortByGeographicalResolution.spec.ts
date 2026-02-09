import { describe, it, expect } from "vitest";
import sortByGeographicalResolution from "@/utils/sortByGeographicalResolution";
import { LocResolution } from "@/types";

describe("sortByGeographicalResolution", () => {
  it("sorts by LocResolution order descending", () => {
    expect(sortByGeographicalResolution([
      LocResolution.GLOBAL,
      LocResolution.COUNTRY,
    ])).toEqual([
      LocResolution.COUNTRY,
      LocResolution.GLOBAL,
    ]);
  });

  it("does not mutate the original array", () => {
    const input = [
      LocResolution.GLOBAL,
      LocResolution.COUNTRY,
    ];
    const copy = [...input];
    sortByGeographicalResolution(input);
    expect(input).toEqual(copy);
  });
});
