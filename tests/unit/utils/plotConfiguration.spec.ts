import { describe, it, expect, beforeEach, vi } from 'vitest';
import { plotConfiguration } from '@/utils/plotConfiguration';
import { Dimension, SummaryTableColumn, type SummaryTableDataRow } from '@/types';
import { useDataStore } from '@/stores/dataStore';
import { setActivePinia, createPinia } from 'pinia';

// Some lines share the same bands to test that categoricalScales extracts them correctly.
// No coordinates are 0 since we need to test that we sometimes override coordinates to become 0.
const lines = [
  {
    points: [{ x: 1, y: 2 }, { x: 5, y: 8 }, { x: 10, y: 3 }],
    bands: { x: 'campaign', y: 'Cholera' },
    metadata: { row: 'Cholera', column: 'campaign', withinBand: 'global' },
  },
  {
    points: [{ x: 2, y: 1 }, { x: 6, y: 12 }, { x: 15, y: 4 }],
    bands: { x: 'campaign', y: 'Measles' }, // same x band as first line
    metadata: { row: 'Measles', column: 'campaign', withinBand: 'global' },
  },
  {
    points: [{ x: 3, y: 5 }, { x: 7, y: 6 }, { x: 20, y: 2 }],
    bands: { x: 'routine', y: 'Cholera' }, // same y band as first line
    metadata: { row: 'Cholera', column: 'routine', withinBand: 'global' },
  },
];

// Setup summary table data for the test lines
const setupSummaryDataForLines = () => {
  const dataStore = useDataStore();
  dataStore.summaryTableData = [
    { disease: 'Cholera', activity_type: 'campaign', location: 'global', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
    { disease: 'Cholera', activity_type: 'routine', location: 'global', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
    { disease: 'Measles', activity_type: 'campaign', location: 'global', mean_value: 200, median_value: 190, lower_95: 150, upper_95: 250 },
  ] as SummaryTableDataRow[];
};

describe('plotConfiguration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('numerical scales', () => {
    beforeEach(() => {
      setupSummaryDataForLines();
    });

    it('calculates x.end and y.end from max values in lines', () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      const numScales = result.chartAppendConfig[0];

      expect(numScales.x?.end).toBe(20); // max of last x-points: 10, 15, 20
      expect(numScales.y?.end).toBe(12); // max y across all points
    });

    it('sets x.start to 0 when log scaled is disabled and no x value is negative', () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      const numScales = result.chartAppendConfig[0];

      expect(numScales.x?.start).toBe(0);
    });

    it('sets x.start to min x of first point when log scaled is disabled and there is a negative x value', () => {
      const dataStore = useDataStore();
      dataStore.summaryTableData.push(
        { disease: 'HepB', activity_type: 'routine', location: 'global', mean_value: 150, median_value: 140, lower_95: 100, upper_95: 200 } as SummaryTableDataRow
      );
      const result = plotConfiguration(Dimension.DISEASE, false, [...lines,
      {
        points: [{ x: -3, y: 5 }, { x: -2, y: 6 }, { x: 20, y: 2 }],
        bands: { x: 'routine', y: 'HepB' }, // same y band as first line
        metadata: { row: 'HepB', column: 'routine', withinBand: 'global' },
      },
      ]);
      const numScales = result.chartAppendConfig[0];

      expect(numScales.x?.start).toBe(-3);
    });

    it('sets x.start to min x of first point when log scale is enabled', () => {
      const result = plotConfiguration(Dimension.DISEASE, true, lines);
      const numScales = result.chartAppendConfig[0];

      expect(numScales.x?.start).toBe(1); // min of first x points: 1, 2, 3
    });

    it('y.start is always 0 regardless of log scale', () => {
      const resultLogOff = plotConfiguration(Dimension.DISEASE, false, lines);
      const resultLogOn = plotConfiguration(Dimension.DISEASE, true, lines);

      expect(resultLogOff.chartAppendConfig[0].y?.start).toBe(0);
      expect(resultLogOn.chartAppendConfig[0].y?.start).toBe(0);
    });
  });

  describe('categorical scales', () => {
    beforeEach(() => {
      setupSummaryDataForLines();
    });

    it('extracts bands.x and bands.y from lines, excluding duplicates', () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      const catScales = result.chartAppendConfig[2];

      expect(catScales.x).toEqual(['campaign', 'routine']);
      // Note: y scale is now sorted by mean - both have mean 100, so alphabetical order
      expect(catScales.y).toEqual(['Cholera', 'Measles']);
    });

    describe('ordering by mean values', () => {
      describe('simple mean (single ridgeline per row)', () => {
        it('orders disease rows by descending mean (highest mean at top/end of array)', () => {
          const dataStore = useDataStore();
          // Set up: Cholera mean=100, Measles mean=500, Rubella mean=250
          dataStore.summaryTableData = [
            { disease: 'Cholera', location: 'global', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
            { disease: 'Measles', location: 'global', mean_value: 500, median_value: 480, lower_95: 450, upper_95: 550 },
            { disease: 'Rubella', location: 'global', mean_value: 250, median_value: 240, lower_95: 200, upper_95: 300 },
          ] as SummaryTableDataRow[];

          const linesWithDiseaseRows = [
            { points: [{ x: 1, y: 2 }], bands: { y: 'Cholera' }, metadata: { row: 'Cholera', withinBand: 'global' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'Measles' }, metadata: { row: 'Measles', withinBand: 'global' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'Rubella' }, metadata: { row: 'Rubella', withinBand: 'global' } },
          ];

          const result = plotConfiguration(Dimension.DISEASE, false, linesWithDiseaseRows);
          const catScales = result.chartAppendConfig[2];

          // Expected y categorical scale (bottom-to-top in array, top-to-bottom on plot):
          // ['Cholera', 'Rubella', 'Measles'] - ascending mean order
          expect(catScales.y).toEqual(['Cholera', 'Rubella', 'Measles']);
        });

        it('orders location rows by descending mean (highest mean at top/end of array)', () => {
          const dataStore = useDataStore();
          // Set up: AFG mean=150, BGD mean=300, IND mean=100
          dataStore.summaryTableData = [
            { disease: 'Cholera', country: 'AFG', location: 'AFG', mean_value: 150, median_value: 140, lower_95: 100, upper_95: 200 },
            { disease: 'Cholera', country: 'BGD', location: 'BGD', mean_value: 300, median_value: 290, lower_95: 250, upper_95: 350 },
            { disease: 'Cholera', country: 'IND', location: 'IND', mean_value: 100, median_value: 95, lower_95: 80, upper_95: 120 },
          ] as SummaryTableDataRow[];

          const linesWithLocationRows = [
            { points: [{ x: 1, y: 2 }], bands: { y: 'AFG' }, metadata: { row: 'AFG', withinBand: 'Cholera' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'BGD' }, metadata: { row: 'BGD', withinBand: 'Cholera' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'IND' }, metadata: { row: 'IND', withinBand: 'Cholera' } },
          ];

          const result = plotConfiguration(Dimension.LOCATION, false, linesWithLocationRows);
          const catScales = result.chartAppendConfig[2];

          // Expected: ['IND', 'AFG', 'BGD'] - ascending mean order
          expect(catScales.y).toEqual(['IND', 'AFG', 'BGD']);
        });
      });

      describe('mean of means (multiple ridgelines per row)', () => {
        it('orders disease rows by average of disease means across locations', () => {
          const dataStore = useDataStore();
          // Cholera: AFG=100, global=200 → mean of means = 150
          // Measles: AFG=400, global=600 → mean of means = 500
          dataStore.summaryTableData = [
            { disease: 'Cholera', country: 'AFG', location: 'AFG', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
            { disease: 'Cholera', location: 'global', mean_value: 200, median_value: 190, lower_95: 150, upper_95: 250 },
            { disease: 'Measles', country: 'AFG', location: 'AFG', mean_value: 400, median_value: 390, lower_95: 350, upper_95: 450 },
            { disease: 'Measles', location: 'global', mean_value: 600, median_value: 590, lower_95: 550, upper_95: 650 },
          ] as SummaryTableDataRow[];

          const linesWithMultipleLocationsPerDisease = [
            { points: [{ x: 1, y: 2 }], bands: { y: 'Cholera' }, metadata: { row: 'Cholera', withinBand: 'AFG' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'Cholera' }, metadata: { row: 'Cholera', withinBand: 'global' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'Measles' }, metadata: { row: 'Measles', withinBand: 'AFG' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'Measles' }, metadata: { row: 'Measles', withinBand: 'global' } },
          ];

          const result = plotConfiguration(Dimension.DISEASE, false, linesWithMultipleLocationsPerDisease);
          const catScales = result.chartAppendConfig[2];

          // Expected: ['Cholera', 'Measles'] (ascending mean of means = descending on plot)
          expect(catScales.y).toEqual(['Cholera', 'Measles']);
        });

        it('orders disease rows by average across activity types (column split)', () => {
          const dataStore = useDataStore();
          // Cholera: campaign=100, routine=300 → mean of means = 200
          // Measles: campaign=200, routine=200 → mean of means = 200
          // Rubella: campaign=500, routine=100 → mean of means = 300
          dataStore.summaryTableData = [
            { disease: 'Cholera', activity_type: 'campaign', location: 'global', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
            { disease: 'Cholera', activity_type: 'routine', location: 'global', mean_value: 300, median_value: 290, lower_95: 250, upper_95: 350 },
            { disease: 'Measles', activity_type: 'campaign', location: 'global', mean_value: 200, median_value: 190, lower_95: 150, upper_95: 250 },
            { disease: 'Measles', activity_type: 'routine', location: 'global', mean_value: 200, median_value: 190, lower_95: 150, upper_95: 250 },
            { disease: 'Rubella', activity_type: 'campaign', location: 'global', mean_value: 500, median_value: 490, lower_95: 450, upper_95: 550 },
            { disease: 'Rubella', activity_type: 'routine', location: 'global', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
          ] as SummaryTableDataRow[];

          const linesWithActivityTypeSplit = [
            { points: [{ x: 1, y: 2 }], bands: { x: 'campaign', y: 'Cholera' }, metadata: { row: 'Cholera', column: 'campaign', withinBand: 'global' } },
            { points: [{ x: 1, y: 2 }], bands: { x: 'routine', y: 'Cholera' }, metadata: { row: 'Cholera', column: 'routine', withinBand: 'global' } },
            { points: [{ x: 1, y: 2 }], bands: { x: 'campaign', y: 'Measles' }, metadata: { row: 'Measles', column: 'campaign', withinBand: 'global' } },
            { points: [{ x: 1, y: 2 }], bands: { x: 'routine', y: 'Measles' }, metadata: { row: 'Measles', column: 'routine', withinBand: 'global' } },
            { points: [{ x: 1, y: 2 }], bands: { x: 'campaign', y: 'Rubella' }, metadata: { row: 'Rubella', column: 'campaign', withinBand: 'global' } },
            { points: [{ x: 1, y: 2 }], bands: { x: 'routine', y: 'Rubella' }, metadata: { row: 'Rubella', column: 'routine', withinBand: 'global' } },
          ];

          const result = plotConfiguration(Dimension.DISEASE, false, linesWithActivityTypeSplit);
          const catScales = result.chartAppendConfig[2];

          // Expected: ['Cholera', 'Measles', 'Rubella'] (ascending mean of means)
          // Note: Measles and Cholera both have mean of means 200, but test should be deterministic
          expect(catScales.y).toEqual(['Cholera', 'Measles', 'Rubella']);
        });

        it('orders location rows by average across diseases', () => {
          const dataStore = useDataStore();
          // AFG: Cholera=100, Measles=200 → mean of means = 150
          // BGD: Cholera=400, Measles=600 → mean of means = 500
          dataStore.summaryTableData = [
            { disease: 'Cholera', country: 'AFG', location: 'AFG', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
            { disease: 'Measles', country: 'AFG', location: 'AFG', mean_value: 200, median_value: 190, lower_95: 150, upper_95: 250 },
            { disease: 'Cholera', country: 'BGD', location: 'BGD', mean_value: 400, median_value: 390, lower_95: 350, upper_95: 450 },
            { disease: 'Measles', country: 'BGD', location: 'BGD', mean_value: 600, median_value: 590, lower_95: 550, upper_95: 650 },
          ] as SummaryTableDataRow[];

          const linesWithMultipleDiseasesPerLocation = [
            { points: [{ x: 1, y: 2 }], bands: { y: 'AFG' }, metadata: { row: 'AFG', withinBand: 'Cholera' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'AFG' }, metadata: { row: 'AFG', withinBand: 'Measles' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'BGD' }, metadata: { row: 'BGD', withinBand: 'Cholera' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'BGD' }, metadata: { row: 'BGD', withinBand: 'Measles' } },
          ];

          const result = plotConfiguration(Dimension.LOCATION, false, linesWithMultipleDiseasesPerLocation);
          const catScales = result.chartAppendConfig[2];

          // Expected: ['AFG', 'BGD'] (ascending mean of means)
          expect(catScales.y).toEqual(['AFG', 'BGD']);
        });
      });

      describe('edge cases', () => {
        it('handles two rows with identical mean of means deterministically', () => {
          const dataStore = useDataStore();
          // Both diseases have exactly the same mean
          dataStore.summaryTableData = [
            { disease: 'Cholera', location: 'global', mean_value: 200, median_value: 190, lower_95: 150, upper_95: 250 },
            { disease: 'Measles', location: 'global', mean_value: 200, median_value: 190, lower_95: 150, upper_95: 250 },
          ] as SummaryTableDataRow[];

          const linesWithSameMean = [
            { points: [{ x: 1, y: 2 }], bands: { y: 'Cholera' }, metadata: { row: 'Cholera', withinBand: 'global' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'Measles' }, metadata: { row: 'Measles', withinBand: 'global' } },
          ];

          const result = plotConfiguration(Dimension.DISEASE, false, linesWithSameMean);
          const catScales = result.chartAppendConfig[2];

          // Should maintain stable order (alphabetical by row value when means are equal)
          expect(catScales.y).toEqual(['Cholera', 'Measles']);
        });

        it('handles single row without breaking', () => {
          const dataStore = useDataStore();
          dataStore.summaryTableData = [
            { disease: 'Cholera', location: 'global', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
          ] as SummaryTableDataRow[];

          const linesWithSingleRow = [
            { points: [{ x: 1, y: 2 }], bands: { y: 'Cholera' }, metadata: { row: 'Cholera', withinBand: 'global' } },
          ];

          const result = plotConfiguration(Dimension.DISEASE, false, linesWithSingleRow);
          const catScales = result.chartAppendConfig[2];

          expect(catScales.y).toEqual(['Cholera']);
        });
      });

      describe('error cases', () => {
        it('falls back to unsorted order when summary data is missing for a row category', () => {
          const dataStore = useDataStore();
          // Only Cholera has summary data, but lines include Measles
          dataStore.summaryTableData = [
            { disease: 'Cholera', location: 'global', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
          ] as SummaryTableDataRow[];

          const linesWithMissingData = [
            { points: [{ x: 1, y: 2 }], bands: { y: 'Cholera' }, metadata: { row: 'Cholera', withinBand: 'global' } },
            { points: [{ x: 1, y: 2 }], bands: { y: 'Measles' }, metadata: { row: 'Measles', withinBand: 'global' } },
          ];

          // Should not throw, but fall back to unsorted order
          const result = plotConfiguration(Dimension.DISEASE, false, linesWithMissingData);
          const catScales = result.chartAppendConfig[2];
          
          // Returns unsorted order when data is missing
          expect(catScales.y).toEqual(['Cholera', 'Measles']);
        });
      });
    });
  });

  describe('tick configuration including formatters', () => {
    beforeEach(() => {
      setupSummaryDataForLines();
    });

    it('sets correct categorical y tick properties when row dimension is location', () => {
      const dataStore = useDataStore();
      // For location row dimension, create lines with locations as row values
      const locationLines = [
        {
          points: [{ x: 1, y: 2 }],
          bands: { y: 'AFG' },
          metadata: { row: 'AFG', withinBand: 'Cholera' },
        },
        {
          points: [{ x: 2, y: 1 }],
          bands: { y: 'BGD' },
          metadata: { row: 'BGD', withinBand: 'Cholera' },
        },
      ];
      dataStore.summaryTableData = [
        { disease: 'Cholera', country: 'AFG', location: 'AFG', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
        { disease: 'Cholera', country: 'BGD', location: 'BGD', mean_value: 200, median_value: 190, lower_95: 150, upper_95: 250 },
      ] as SummaryTableDataRow[];

      const result = plotConfiguration(Dimension.LOCATION, false, locationLines);
      const yConfig = result.constructorOptions.tickConfig.categorical?.y;

      expect(yConfig?.padding).toBe(10);
      expect(yConfig?.formatter).toBeDefined();
    });

    it('sets correct categorical y tick properties when row dimension is disease', () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      const yConfig = result.constructorOptions.tickConfig.categorical?.y;

      expect(yConfig?.padding).toBe(30);
      expect(yConfig?.formatter).toBeUndefined();
    });

    it("log scale numerical formatter returns '10^exponent' in LaTeX", () => {
      const result = plotConfiguration(Dimension.DISEASE, true, lines);
      const formatter = result.constructorOptions.tickConfig.numerical?.x?.formatter;
      expect(formatter(-2)).toBe('$10^{-2}$');
      expect(formatter(3.1)).toBe('$10^{3.1}$');
    });

    it("linear scale numerical formatter returns numbers in LaTeX", () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      const formatter = result.constructorOptions.tickConfig.numerical?.x?.formatter;
      expect(formatter(-2)).toBe('$-2$');
    });

    describe('location tick formatter', () => {
      const getLocationFormatter = () => {
        const dataStore = useDataStore();
        // For location row dimension, create lines with locations as row values
        const locationLines = [
          {
            points: [{ x: 1, y: 2 }],
            bands: { y: 'AFG' },
            metadata: { row: 'AFG', withinBand: 'Cholera' },
          },
          {
            points: [{ x: 2, y: 1 }],
            bands: { y: 'BGD' },
            metadata: { row: 'BGD', withinBand: 'Cholera' },
          },
        ];
        dataStore.summaryTableData = [
          { disease: 'Cholera', country: 'AFG', location: 'AFG', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
          { disease: 'Cholera', country: 'BGD', location: 'BGD', mean_value: 200, median_value: 190, lower_95: 150, upper_95: 250 },
        ] as SummaryTableDataRow[];

        const result = plotConfiguration(Dimension.LOCATION, false, locationLines);
        return result.constructorOptions.tickConfig.categorical?.y?.formatter;
      };

      it('applies " and " → " & " substitution', () => {
        const formatter = getLocationFormatter();
        expect(formatter('Trinidad and Tobago')).toBe('Trinidad & Tobago');
      });

      it('applies compass direction substitutions', () => {
        const formatter = getLocationFormatter();
        expect(formatter('South-Eastern Asia')).toBe('S.E. Asia');
        expect(formatter('Northern Europe')).toBe('N. Europe');
        expect(formatter('Central Africa')).toBe('C. Africa');
      });

      it('truncates long labels with ellipsis', () => {
        const formatter = getLocationFormatter();

        // "All 117 VIMC countries" is the globalOption.label which sets Y_TICK_LABEL_MAX_LENGTH
        expect(formatter("All 117 VIMC countries")).not.toContain('...');

        // Testing a very long string that exceeds that length
        const longLabel = 'A'.repeat(50);
        const result = formatter(longLabel);
        expect(result.endsWith('...')).toBe(true);
        expect(result.length).toBeLessThan(50); // Should be truncated
      });
    });
  });

  describe('axis configuration', () => {
    beforeEach(() => {
      setupSummaryDataForLines();
    });

    it('sets y-axis label to sentence case of rowDimension', () => {
      const dataStore = useDataStore();
      // For activity_type row dimension, create lines with activity types as row values
      const activityLines = [
        {
          points: [{ x: 1, y: 2 }],
          bands: { y: 'campaign' },
          metadata: { row: 'campaign', withinBand: 'Cholera' },
        },
        {
          points: [{ x: 2, y: 1 }],
          bands: { y: 'routine' },
          metadata: { row: 'routine', withinBand: 'Cholera' },
        },
      ];
      dataStore.summaryTableData = [
        { disease: 'Cholera', activity_type: 'campaign', location: 'global', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
        { disease: 'Cholera', activity_type: 'routine', location: 'global', mean_value: 200, median_value: 190, lower_95: 150, upper_95: 250 },
      ] as SummaryTableDataRow[];

      const result = plotConfiguration(Dimension.ACTIVITY_TYPE, false, activityLines);
      expect(result.axisConfig[0].y).toBe('Activity type');
    });
  });

  describe('margins', () => {
    beforeEach(() => {
      setupSummaryDataForLines();
    });

    it('sets left margin to 170 when rowDimension is location', () => {
      const dataStore = useDataStore();
      // For location row dimension, create lines with locations as row values
      const locationLines = [
        {
          points: [{ x: 1, y: 2 }],
          bands: { y: 'AFG' },
          metadata: { row: 'AFG', withinBand: 'Cholera' },
        },
        {
          points: [{ x: 2, y: 1 }],
          bands: { y: 'BGD' },
          metadata: { row: 'BGD', withinBand: 'Cholera' },
        },
      ];
      dataStore.summaryTableData = [
        { disease: 'Cholera', country: 'AFG', location: 'AFG', mean_value: 100, median_value: 90, lower_95: 50, upper_95: 150 },
        { disease: 'Cholera', country: 'BGD', location: 'BGD', mean_value: 200, median_value: 190, lower_95: 150, upper_95: 250 },
      ] as SummaryTableDataRow[];

      const result = plotConfiguration(Dimension.LOCATION, false, locationLines);
      expect(result.chartAppendConfig[3].left).toBe(170);
    });

    it('sets left margin to 110 when rowDimension is not location', () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      expect(result.chartAppendConfig[3].left).toBe(110);
    });
  });
});
