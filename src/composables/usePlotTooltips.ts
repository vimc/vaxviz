import { useAppStore } from "@/stores/appStore";
import { useColorStore } from "@/stores/colorStore";
import { Axes, type PointWithMetadata } from "@/types";
import { dimensionOptionLabel } from "@/utils/options";
import sentenceCase from "@/utils/sentenceCase";

export default () => {
  const colorStore = useColorStore();
  const appStore = useAppStore();

  // Generate HTML for tooltips on ridgeline plot points.
  const tooltipCallback = (point: PointWithMetadata) => {
    if (!point.metadata) return "";

    const { fillColor } = colorStore.getColorsForLine(point.metadata)
    const { colorDimension } = colorStore;
    const { dimensions } = appStore;

    const rowOptionLabel = dimensionOptionLabel(colorDimension, point.metadata[colorStore.colorAxis]);
    const columnOptionLabel = dimensionOptionLabel(dimensions.column, point.metadata[Axes.COLUMN]);

    return `<div class="tooltip text-xs flex flex-col gap-1 w-75">
      <div class="flex gap-1 items-center">
        <span style="color: ${fillColor}; font-size: 1.3rem;" class=>●</span>
        <span class="mt-1 flex flex-wrap gap-5">
          <span>
            ${sentenceCase(colorDimension)}: <strong>${rowOptionLabel}</strong>
          </span>
          ${dimensions.column ? `<span>
            ${sentenceCase(dimensions.column)}: <strong>${columnOptionLabel}</strong>
          </span>` : ''}
        </span>
      </div>
      <p>Tooltip content is TBC.</p>
      <p>
        Option 1 of tooltips: Show the bounds and count for the bin. Option 2: Show the median/mean values and 95% confidence interval for the whole line.
      </p>
    </div>`
  }

  return { tooltipCallback };
}
