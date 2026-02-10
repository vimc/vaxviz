import { LocResolution } from "@/types";

// To be used in sorting by geographical resolution, with the order defined by the enum order of LocResolution
export const compareLocResolution = (aLocRes?: LocResolution, bLocRes?: LocResolution) => {
  const [aRank, bRank] = [
    aLocRes ? Object.values(LocResolution).indexOf(aLocRes) : -1,
    bLocRes ? Object.values(LocResolution).indexOf(bLocRes) : -1,
  ];
  return bRank - aRank;
}
