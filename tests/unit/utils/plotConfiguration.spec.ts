import { describe, it, expect } from 'vitest';
import { plotConfiguration } from '@/utils/plotConfiguration';
import { Dimension } from '@/types';

// Some lines share the same bands to test that categoricalScales extracts them correctly.
// No coordinates are 0 since we need to test that we sometimes override coordinates to become 0.
const lines = [
  {
    points: [{ x: 1, y: 2 }, { x: 5, y: 8 }, { x: 10, y: 3 }],
    bands: { x: 'campaign', y: 'Cholera' },
  },
  {
    points: [{ x: 2, y: 1 }, { x: 6, y: 12 }, { x: 15, y: 4 }],
    bands: { x: 'campaign', y: 'Measles' }, // same x band as first line
  },
  {
    points: [{ x: 3, y: 5 }, { x: 7, y: 6 }, { x: 20, y: 2 }],
    bands: { x: 'routine', y: 'Cholera' }, // same y band as first line
  },
];

describe('plotConfiguration', () => {
  describe('numerical scales', () => {
    it('calculates x.end and y.end from max values in lines', () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      const numScales = result.chartAppendConfig[0];

      expect(numScales.x?.end).toBe(20); // max of last x-points: 10, 15, 20
      expect(numScales.y?.end).toBe(12); // max y across all points
    });

    it('sets x.start to 0 when logScaleEnabled is false', () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      const numScales = result.chartAppendConfig[0];

      expect(numScales.x?.start).toBe(0);
    });

    it('sets x.start to min x value when logScaleEnabled is true', () => {
      const result = plotConfiguration(Dimension.DISEASE, true, lines);
      const numScales = result.chartAppendConfig[0];

      expect(numScales.x?.start).toBe(1); // min of first x points: 1, 2, 3
    });

    it('y.start is always 0 regardless of logScaleEnabled', () => {
      const resultLogOff = plotConfiguration(Dimension.DISEASE, false, lines);
      const resultLogOn = plotConfiguration(Dimension.DISEASE, true, lines);

      expect(resultLogOff.chartAppendConfig[0].y?.start).toBe(0);
      expect(resultLogOn.chartAppendConfig[0].y?.start).toBe(0);
    });
  });

  describe('categorical scales', () => {
    it('extracts bands.x and bands.y from lines, excluding duplicates', () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      const catScales = result.chartAppendConfig[2];

      expect(catScales.x).toEqual(['campaign', 'routine']);
      expect(catScales.y).toEqual(['Cholera', 'Measles']);
    });
  });

  describe('tick configuration including formatters', () => {
    it('sets correct numerical x tick properties when log scale is enabled', () => {
      const result = plotConfiguration(Dimension.DISEASE, true, lines);
      const xConfig = result.tickConfig.numerical?.x;

      expect(xConfig?.padding).toBe(10);
      expect(xConfig?.formatter).toBeDefined();
    });

    it('sets correct numerical x tick properties when log scale is disabled', () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      const xConfig = result.tickConfig.numerical?.x;

      expect(xConfig?.padding).toBe(10);
      expect(xConfig?.formatter).toBeUndefined();
    });

    it('sets correct categorical y tick properties when row dimension is location', () => {
      const result = plotConfiguration(Dimension.LOCATION, false, lines);
      const yConfig = result.tickConfig.categorical?.y;

      expect(yConfig?.padding).toBe(10);
      expect(yConfig?.formatter).toBeDefined();
    });

    it('sets correct categorical y tick properties when row dimension is disease', () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      const yConfig = result.tickConfig.categorical?.y;

      expect(yConfig?.padding).toBe(30);
      expect(yConfig?.formatter).toBeUndefined();
    });

    it("log scale numerical formatter returns '10^exponent' when the exponent is an integer", () => {
      const config = plotConfiguration(Dimension.DISEASE, true, lines);
      const formatter = config.tickConfig.numerical?.x?.formatter;
      expect(formatter(-2)).toBe('10⁻²');
      expect(formatter(10)).toBe('10¹⁰');
      expect(formatter(0)).toBe('10⁰');
    });

    it('log scale numerical formatter returns empty string when the exponent is not an integer', () => {
      const config = plotConfiguration(Dimension.DISEASE, true, lines);
      const formatter = config.tickConfig.numerical?.x?.formatter;
      expect(formatter(0.01)).toBe('');
    });


    describe('location tick formatter', () => {
      const getLocationFormatter = () => {
        const result = plotConfiguration(Dimension.LOCATION, false, lines);
        return result.tickConfig.categorical?.y?.formatter;
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
    it('sets y-axis label to sentence case of rowDimension', () => {
      const result = plotConfiguration(Dimension.ACTIVITY_TYPE, false, lines);
      expect(result.axisConfig[0].y).toBe('Activity type');
    });
  });

  describe('margins', () => {
    it('sets left margin to 170 when rowDimension is location', () => {
      const result = plotConfiguration(Dimension.LOCATION, false, lines);
      expect(result.chartAppendConfig[3].left).toBe(170);
    });

    it('sets left margin to 100 when rowDimension is not location', () => {
      const result = plotConfiguration(Dimension.DISEASE, false, lines);
      expect(result.chartAppendConfig[3].left).toBe(100);
    });
  });
});
