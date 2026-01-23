import { computed } from 'vue';
import { type Lines } from "@reside-ic/skadi-chart";
import { Dimension, type LineMetadata, SummaryTableColumn, type SummaryTableDataRow } from "@/types";
import { useDataStore } from "@/stores/dataStore";

/**
 * Calculate the mean of means for a given row value across all its ridgelines.
 */
const calculateMeanOfMeans = (
  rowValue: string,
  rowDimension: Dimension,
  lines: Lines<LineMetadata>,
  summaryTableData: SummaryTableDataRow[]
): number => {
  // Find all lines for this row value
  const linesForRow = lines.filter(l => l.bands?.y === rowValue);
  
  // Collect all mean values for this row
  const meanValues: number[] = [];
  
  for (const line of linesForRow) {
    const metadata = line.metadata;
    if (!metadata) continue;
    
    // Find matching summary data row
    const summaryRow = summaryTableData.find(row => {
      // Match based on row dimension
      if (rowDimension === Dimension.DISEASE) {
        // For disease rows, match disease and the within-band dimension (location or disease)
        const diseaseMatch = row[Dimension.DISEASE] === rowValue;
        const locationMatch = metadata.withinBand === 'global' 
          ? row[Dimension.LOCATION] === 'global'
          : row[Dimension.LOCATION] === metadata.withinBand || row.country === metadata.withinBand || row.subregion === metadata.withinBand;
        const activityMatch = !metadata.column || row[Dimension.ACTIVITY_TYPE] === metadata.column;
        return diseaseMatch && locationMatch && activityMatch;
      } else if (rowDimension === Dimension.LOCATION) {
        // For location rows, match location and within-band dimension (disease)
        const locationMatch = row[Dimension.LOCATION] === rowValue || row.country === rowValue || row.subregion === rowValue;
        const diseaseMatch = row[Dimension.DISEASE] === metadata.withinBand;
        const activityMatch = !metadata.column || row[Dimension.ACTIVITY_TYPE] === metadata.column;
        return locationMatch && diseaseMatch && activityMatch;
      } else if (rowDimension === Dimension.ACTIVITY_TYPE) {
        // For activity type rows, match activity type and within-band dimension (disease or location)
        const activityMatch = row[Dimension.ACTIVITY_TYPE] === rowValue;
        const diseaseMatch = row[Dimension.DISEASE] === metadata.withinBand;
        const locationMatch = !metadata.column || 
          metadata.column === 'global' 
          ? row[Dimension.LOCATION] === 'global'
          : row[Dimension.LOCATION] === metadata.column || row.country === metadata.column || row.subregion === metadata.column;
        return activityMatch && diseaseMatch && locationMatch;
      }
      return false;
    });
    
    if (!summaryRow) {
      throw new Error(
        `Missing summary table data for row category "${rowValue}" with metadata: ${JSON.stringify(metadata)}`
      );
    }
    
    meanValues.push(summaryRow[SummaryTableColumn.MEAN]);
  }
  
  if (meanValues.length === 0) {
    throw new Error(`No mean values found for row category "${rowValue}"`);
  }
  
  // Return the mean of means
  return meanValues.reduce((sum, val) => sum + val, 0) / meanValues.length;
};

/**
 * Get the ordered y categorical scale based on mean values (ascending order = descending on plot)
 */
export const getOrderedYCategoricalScale = (rowDimension: Dimension, lines: Lines<LineMetadata>): string[] => {
  const dataStore = useDataStore();
  const summaryTableData = dataStore.summaryTableData;
  
  const yCategoricalScaleUnsorted = [...new Set(lines.map(l => l.bands?.y).filter(c => !!c))] as string[];

  // If no summary table data is available, return unsorted (preserve original behavior)
  if (!summaryTableData || summaryTableData.length === 0) {
    return yCategoricalScaleUnsorted;
  }

  try {
    // Sort y categorical scale by mean of means (ascending order = descending on plot)
    const yCategoricalScale = yCategoricalScaleUnsorted.sort((a, b) => {
      const meanA = calculateMeanOfMeans(a, rowDimension, lines, summaryTableData);
      const meanB = calculateMeanOfMeans(b, rowDimension, lines, summaryTableData);
      
      // Sort ascending by mean (lowest at start, highest at end)
      // When equal, maintain stable alphabetical order
      if (meanA === meanB) {
        return a.localeCompare(b);
      }
      return meanA - meanB;
    });

    return yCategoricalScale;
  } catch (error) {
    // If ordering fails (e.g., missing summary data for some rows), fall back to unsorted
    console.warn('Failed to order categorical scale by mean values, using unsorted order:', error);
    return yCategoricalScaleUnsorted;
  }
};

/**
 * Composable that provides the ordered y categorical scale
 */
export const useCategoricalScaleOrdering = (rowDimension: () => Dimension, lines: () => Lines<LineMetadata>) => {
  const orderedYScale = computed(() => {
    return getOrderedYCategoricalScale(rowDimension(), lines());
  });

  return {
    orderedYScale,
  };
};
