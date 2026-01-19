import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { it, expect, describe, beforeEach, vi } from 'vitest';
import { nextTick } from "vue";

import usePlotTooltips from '@/composables/usePlotTooltips';
import { useAppStore } from '@/stores/appStore';
import { useColorStore } from '@/stores/colorStore';
import { useDataStore } from '@/stores/dataStore';
import { Axis, Dimension, SummaryTableColumn, type PointWithMetadata, type SummaryTableDataRow } from '@/types';

describe('usePlotTooltips', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  describe('tooltipCallback', () => {
    it('returns empty string when point has no metadata', () => {
      const { tooltipCallback } = usePlotTooltips();
      const point: PointWithMetadata = { x: 1, y: 2 };

      expect(tooltipCallback(point)).toBe('');
    });

    it('generates tooltip HTML for location dimension', () => {
      const afgPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Cholera', [Axis.COLUMN]: '' } };
      const globalPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'global', [Axis.ROW]: 'Cholera', [Axis.COLUMN]: '' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();

      // Set up store state for location-based coloring
      appStore.filters = {
        [Dimension.LOCATION]: ['AFG', 'global'],
        [Dimension.DISEASE]: ['Cholera'],
      };
      expect(colorStore.colorDimension).toBe(Dimension.LOCATION);

      // Set colors so colorStore has the mapping
      colorStore.setColors([afgPointMetadata, globalPointMetadata]);

      const { tooltipCallback } = usePlotTooltips();

      const afgTooltip = tooltipCallback({ x: 1, y: 2, metadata: afgPointMetadata.metadata! });

      expect(afgTooltip).toContain('Location: <strong>Afghanistan</strong>');
      expect(afgTooltip).toContain('style="color: #009d9a'); // teal50
      // Row dimension (disease) is shown because it's different from color dimension (location)
      expect(afgTooltip).toContain('Disease: <strong>Cholera</strong>');
      expect(afgTooltip).not.toContain('Activity type');

      const globalTooltip = tooltipCallback({ x: 1, y: 2, metadata: globalPointMetadata.metadata! });

      expect(globalTooltip).toContain('Location: <strong>All 117 VIMC countries</strong>');
      expect(globalTooltip).toContain('style="color: #6929c4'); // purple70
      // Row dimension (disease) is shown because it's different from color dimension (location)
      expect(globalTooltip).toContain('Disease: <strong>Cholera</strong>');
      expect(globalTooltip).not.toContain('Activity type');
    });

    it('generates tooltip HTML for disease dimension', () => {
      const choleraPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Cholera', [Axis.COLUMN]: '' } };
      const measlesPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Measles', [Axis.COLUMN]: '' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();

      // Set up store state for disease-based coloring
      appStore.filters = {
        [Dimension.LOCATION]: ['AFG'],
        [Dimension.DISEASE]: ['Cholera', 'Measles'],
      };
      expect(colorStore.colorDimension).toBe(Dimension.DISEASE);
      // Row dimension is DISEASE by default, same as colorDimension
      expect(appStore.dimensions.row).toBe(Dimension.DISEASE);

      colorStore.setColors([choleraPointMetadata, measlesPointMetadata]);

      const { tooltipCallback } = usePlotTooltips();

      const choleraTooltip = tooltipCallback({ x: 1, y: 2, metadata: choleraPointMetadata.metadata! });

      expect(choleraTooltip).toContain('Disease: <strong>Cholera</strong>');
      expect(choleraTooltip).toContain('style="color: #6929c4'); // purple70
      // Row dimension (disease) is NOT shown separately because it's the same as color dimension
      expect(choleraTooltip.match(/Disease:/g)?.length).toBe(1);
      expect(choleraTooltip).not.toContain('Activity type');

      const measlesTooltip = tooltipCallback({ x: 1, y: 2, metadata: measlesPointMetadata.metadata! });

      expect(measlesTooltip).toContain('Disease: <strong>Measles</strong>');
      expect(measlesTooltip).toContain('style="color: #009d9a'); // teal50
      // Row dimension (disease) is NOT shown separately because it's the same as color dimension
      expect(measlesTooltip.match(/Disease:/g)?.length).toBe(1);
      expect(measlesTooltip).not.toContain('Activity type');
    });

    it('handles activity type dimension', async () => {
      const routinePointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Cholera', [Axis.COLUMN]: 'routine' } };
      const campaignPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Cholera', [Axis.COLUMN]: 'campaign' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();

      appStore.splitByActivityType = true;
      await nextTick();
      expect(appStore.dimensions.column).toBe(Dimension.ACTIVITY_TYPE);

      // Set up store state for disease-based coloring (single location)
      appStore.filters = {
        [Dimension.LOCATION]: ['AFG'],
        [Dimension.DISEASE]: ['Cholera'],
        [Dimension.ACTIVITY_TYPE]: ['routine', 'campaign'],
      };
      expect(colorStore.colorDimension).toBe(Dimension.DISEASE);

      colorStore.setColors([routinePointMetadata, campaignPointMetadata]);

      const { tooltipCallback } = usePlotTooltips();

      const routineTooltip = tooltipCallback({ x: 1, y: 2, metadata: routinePointMetadata.metadata! });
      expect(routineTooltip).toContain('Disease: <strong>Cholera</strong>');
      expect(routineTooltip).toContain('Activity type: <strong>Routine</strong>');
      expect(routineTooltip).toContain('style="color: #6929c4'); // purple70

      const campaignTooltip = tooltipCallback({ x: 1, y: 2, metadata: campaignPointMetadata.metadata! });

      expect(campaignTooltip).toContain('Disease: <strong>Cholera</strong>');
      expect(campaignTooltip).toContain('Activity type: <strong>Campaign</strong>');
      expect(campaignTooltip).toContain('style="color: #6929c4'); // purple70
    });

    it('displays summary data (median, mean, and 95% confidence interval) in tooltip', () => {
      const afgPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Cholera', [Axis.COLUMN]: '' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();
      const dataStore = useDataStore();

      // Set up store state for location-based coloring
      appStore.filters = {
        [Dimension.LOCATION]: ['AFG'],
        [Dimension.DISEASE]: ['Cholera'],
      };

      colorStore.setColors([afgPointMetadata]);

      // Set up summary table data with test values
      dataStore.summaryTableData = [
        {
          [Dimension.LOCATION]: 'AFG',
          [Dimension.DISEASE]: 'Cholera',
          [SummaryTableColumn.MEDIAN]: 1234.56,
          [SummaryTableColumn.MEAN]: 1456.78,
          [SummaryTableColumn.CI_LOWER]: 789.12,
          [SummaryTableColumn.CI_UPPER]: 2345.67,
        } as SummaryTableDataRow,
      ];

      const { tooltipCallback } = usePlotTooltips();

      const tooltip = tooltipCallback({ x: 1, y: 2, metadata: afgPointMetadata.metadata! });

      // Check that median and mean are displayed with proper formatting
      expect(tooltip).toContain('Median: <strong>1234.56</strong>');
      expect(tooltip).toContain('Mean: <strong>1456.78</strong>');
      // Check 95% confidence interval is displayed
      expect(tooltip).toContain('95% confidence interval:');
      expect(tooltip).toContain('<strong>789.12</strong>');
      expect(tooltip).toContain('<strong>2345.67</strong>');
    });

    it('handles negative confidence interval values with appropriate sign', () => {
      const afgPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Cholera', [Axis.COLUMN]: '' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();
      const dataStore = useDataStore();

      // Set up store state for location-based coloring
      appStore.filters = {
        [Dimension.LOCATION]: ['AFG'],
        [Dimension.DISEASE]: ['Cholera'],
      };

      colorStore.setColors([afgPointMetadata]);

      // Set up summary table data with negative lower bound (crossing zero)
      dataStore.summaryTableData = [
        {
          [Dimension.LOCATION]: 'AFG',
          [Dimension.DISEASE]: 'Cholera',
          [SummaryTableColumn.MEDIAN]: 50.00,
          [SummaryTableColumn.MEAN]: 55.00,
          [SummaryTableColumn.CI_LOWER]: -100.50,
          [SummaryTableColumn.CI_UPPER]: 200.75,
        } as SummaryTableDataRow,
      ];

      const { tooltipCallback } = usePlotTooltips();

      const tooltip = tooltipCallback({ x: 1, y: 2, metadata: afgPointMetadata.metadata! });

      // Check that the values are displayed correctly
      expect(tooltip).toContain('Median: <strong>50.00</strong>');
      expect(tooltip).toContain('Mean: <strong>55.00</strong>');
      // Check negative lower bound and positive upper bound with + sign when interval crosses zero
      expect(tooltip).toContain('<strong>-100.50</strong>');
      expect(tooltip).toContain('<strong>+200.75</strong>');
    });

    it('handles undefined summary data gracefully', () => {
      const afgPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Cholera', [Axis.COLUMN]: '' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();
      const dataStore = useDataStore();

      // Set up store state
      appStore.filters = {
        [Dimension.LOCATION]: ['AFG'],
        [Dimension.DISEASE]: ['Cholera'],
      };

      colorStore.setColors([afgPointMetadata]);

      // Empty summary table data - no matching row will be found
      dataStore.summaryTableData = [];

      const { tooltipCallback } = usePlotTooltips();

      const tooltip = tooltipCallback({ x: 1, y: 2, metadata: afgPointMetadata.metadata! });

      // The tooltip should still render, but values will be undefined
      expect(tooltip).toContain('Median:');
      expect(tooltip).toContain('Mean:');
      expect(tooltip).toContain('95% confidence interval:');
      // Should contain undefined formatted values
      expect(tooltip).toContain('<strong>undefined</strong>');
    });
  });
});
