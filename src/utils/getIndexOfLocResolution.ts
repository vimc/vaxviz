import { LocResolution } from "@/types";

// To be used in sorting by geographical resolution, with the order defined by the enum order of LocResolution
export default (resolution?: LocResolution) => {
  return resolution
    ? Object.values(LocResolution).indexOf(resolution)
    : -1;
}
