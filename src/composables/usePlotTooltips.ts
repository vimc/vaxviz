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

  const convertToScientificNotation = (num: number): string => {
    if (!appStore.logScaleEnabled) {
      return num.toFixed(2);
    }
    if (num === 0) return "0";
    const exponent = Math.floor(Math.log10(Math.abs(num)));
    const coefficient = (num / Math.pow(10, exponent)).toFixed(2);
    return `${coefficient} × 10<sup>${exponent}</sup>`;
  };

  // Generate HTML for tooltips on ridgeline plot points.
  // This callback is passed to skadi-chart, and is invoked when hovering over the chart.
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

    // Find the summary table row whose values for the plot row and band
    // dimensions (and column, if set) match the values of the tooltip point 
    const summaryDataRow = summaryTableData.find(d => {
      return Object.entries(dimensions).every(([axis, dim]) => {
        return !dim || d[dim] === point.metadata?.[axis as Axis];
      });
    });

    // NB regardless of whether log scale is enabled, the summary table data are provided in non-log scale.
    const [mean, ciLower, ciUpper] = [
      SummaryTableColumn.MEAN,
      SummaryTableColumn.CI_LOWER,
      SummaryTableColumn.CI_UPPER,
    ].map(col => summaryDataRow?.[col]);

    let ciLowerStr;
    let ciUpperStr;
    if (appStore.logScaleEnabled) {
      ciUpperStr = convertToScientificNotation(ciUpper!);
      ciLowerStr = convertToScientificNotation(ciLower!);
    } else {
      const includePositiveSign = ciLower! < 0;
      const ciUpperSign = (includePositiveSign && ciUpper! > 0) ? '+' : '';
      ciUpperStr = `${ciUpperSign}${ciUpper?.toFixed(2)}`;
      ciLowerStr = ciLower?.toFixed(2);
    }

    const meanStr = appStore.logScaleEnabled ? convertToScientificNotation(mean!) : mean?.toFixed(2)

    return `<div class="tooltip text-xs flex flex-col gap-1 w-75">
      <div class="flex gap-1 h-6 items-center">
        <span style="color: ${strokeColor}; font-size: 1.5rem;">●</span>
        <span class="mt-1">
          ${sentenceCase(colorDimension)}: <b>${colorDimensionLabel}</b>
        </span>
      </div>
      ${dimensions.row !== colorDimension ? `<span>
        ${sentenceCase(dimensions.row)}: <b>${rowOptionLabel}</b>
      </span>` : ''}
      ${dimensions.column && dimensions.column !== colorDimension ? `<span>
        ${sentenceCase(dimensions.column)}: <b>${columnOptionLabel}</b>
      </span>` : ''}
      <p class="mt-1">
        Mean: <b>${meanStr}</b><br/>
      </p>
      <p>
        95% confidence interval: <b>${ciLowerStr}</b> — <b>${ciUpperStr}</b>
      </p>
    </div>`
  }

  return { tooltipCallback };
}
