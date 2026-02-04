import { LocResolution } from "@/types";

export default (arr: Array<string>) => {
  return arr.toSorted((a, b) => {
    const [aRank, bRank] = [
      a ? Object.values(LocResolution).indexOf(a as LocResolution) : -1,
      b ? Object.values(LocResolution).indexOf(b as LocResolution) : -1,
    ];
    return bRank - aRank;
  })
}
