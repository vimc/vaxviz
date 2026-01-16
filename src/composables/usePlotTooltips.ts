import { useAppStore } from "@/stores/appStore";
import { useColorStore } from "@/stores/colorStore";
import { useDataStore } from "@/stores/dataStore";
import { Axis, SummaryTableColumn, type PointWithMetadata } from "@/types";
import { dimensionOptionLabel } from "@/utils/options";
import sentenceCase from "@/utils/sentenceCase";

export default () => {
  const colorStore = useColorStore();
  const appStore = useAppStore();
  const dataStore = useDataStore();

  // Generate HTML for tooltips on ridgeline plot points.
  const tooltipCallback = (point: PointWithMetadata) => {
    if (!point.metadata) return "";

    const { strokeColor } = colorStore.getColorsForLine(point.metadata)
    const { colorAxis, colorDimension } = colorStore;
    const { dimensions } = appStore;

    const valueForColorDimension = point.metadata[colorAxis];

    const colorDimensionLabel = dimensionOptionLabel(colorDimension, valueForColorDimension);
    const rowOptionLabel = dimensionOptionLabel(dimensions.row, point.metadata[Axis.ROW]);
    const columnOptionLabel = dimensionOptionLabel(dimensions.column, point.metadata[Axis.COLUMN]);

    const { summaryTableData } = dataStore;

    const summaryDataRow = summaryTableData.find(d => {
      return Object.entries(dimensions).every(([axis, dim]) => {
        return !dim || d[dim] === point.metadata?.[axis as Axis];
      });
    });

    // NB regardless of whether log scale is enabled, the summary table data are expressed in non-log scale.
    const [median, mean, ciLower, ciUpper] = [
      SummaryTableColumn.MEDIAN,
      SummaryTableColumn.MEAN,
      SummaryTableColumn.CI_LOWER,
      SummaryTableColumn.CI_UPPER,
    ].map(col => summaryDataRow?.[col]);

    const includePositiveSign = ciLower && ciLower < 0;
    const ciLowerMaybeWithSign = ciLower?.toFixed(2);
    const ciUpperMaybeWithSign = `${includePositiveSign ? `${ciUpper && ciUpper > 0 ? '+' : ''}` : ''}${ciUpper?.toFixed(2)}`;

    return `<div class="tooltip text-xs flex flex-col gap-1 w-75">
      <div class="flex gap-1 h-6 items-center">
        <span style="color: ${strokeColor}; font-size: 1.5rem;">●</span>
        <span class="mt-1">
          ${sentenceCase(colorDimension)}: <strong>${colorDimensionLabel}</strong>
        </span>
      </div>
      ${dimensions.row !== colorDimension ? `<span>
        ${sentenceCase(dimensions.row)}: <strong>${rowOptionLabel}</strong>
      </span>` : ''}
      ${dimensions.column && dimensions.column !== colorDimension ? `<span>
        ${sentenceCase(dimensions.column)}: <strong>${columnOptionLabel}</strong>
      </span>` : ''}
      <p class="mt-1">
        Median: <strong>${median?.toFixed(2)}</strong>, Mean: <strong>${mean?.toFixed(2)}</strong><br/>
      </p>
      <p>
        95% confidence interval: <strong>${ciLowerMaybeWithSign}</strong> — <strong>${ciUpperMaybeWithSign}</strong>
      </p>
    </div>`
  }

  return { tooltipCallback };
}
