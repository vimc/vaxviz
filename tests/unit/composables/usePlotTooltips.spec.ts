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

      appStore.filters = {
        [Dimension.LOCATION]: ['AFG', 'global'],
        [Dimension.DISEASE]: ['Cholera'],
      };
      expect(colorStore.colorDimension).toBe(Dimension.LOCATION);
      expect(appStore.dimensions.row).toBe(Dimension.DISEASE);

      colorStore.setColors([afgPointMetadata, globalPointMetadata]);

      const { tooltipCallback } = usePlotTooltips();

      const afgTooltip = tooltipCallback({ x: 1, y: 2, metadata: afgPointMetadata.metadata! });

      expect(afgTooltip).toContain('Location: <b>Afghanistan</b>');
      expect(afgTooltip).toContain('style="color: #009d9a'); // teal50
      // Row dimension (disease) is shown because it's different from color dimension (location)
      expect(afgTooltip).toContain('Disease: <b>Cholera</b>');
      expect(afgTooltip).not.toContain('Activity type');

      const globalTooltip = tooltipCallback({ x: 1, y: 2, metadata: globalPointMetadata.metadata! });

      expect(globalTooltip).toContain('Location: <b>All 117 VIMC countries</b>');
      expect(globalTooltip).toContain('style="color: #6929c4'); // purple70
      expect(globalTooltip).toContain('Disease: <b>Cholera</b>');
      expect(globalTooltip).not.toContain('Activity type');
    });

    it('generates tooltip HTML for disease dimension', () => {
      const choleraPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Cholera', [Axis.COLUMN]: '' } };
      const measlesPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Measles', [Axis.COLUMN]: '' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();

      appStore.filters = {
        [Dimension.LOCATION]: ['AFG'],
        [Dimension.DISEASE]: ['Cholera', 'Measles'],
      };
      expect(colorStore.colorDimension).toBe(Dimension.DISEASE);
      expect(appStore.dimensions.row).toBe(Dimension.DISEASE);

      colorStore.setColors([choleraPointMetadata, measlesPointMetadata]);

      const { tooltipCallback } = usePlotTooltips();

      const choleraTooltip = tooltipCallback({ x: 1, y: 2, metadata: choleraPointMetadata.metadata! });

      expect(choleraTooltip).toContain('Disease: <b>Cholera</b>');
      expect(choleraTooltip).toContain('style="color: #6929c4'); // purple70
      // Row dimension (disease) is NOT shown separately because it's the same as color dimension
      expect(choleraTooltip.match(/Disease:/g)?.length).toBe(1);
      expect(choleraTooltip).not.toContain('Activity type');

      const measlesTooltip = tooltipCallback({ x: 1, y: 2, metadata: measlesPointMetadata.metadata! });

      expect(measlesTooltip).toContain('Disease: <b>Measles</b>');
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

      appStore.filters = {
        [Dimension.LOCATION]: ['AFG'],
        [Dimension.DISEASE]: ['Cholera'],
        [Dimension.ACTIVITY_TYPE]: ['routine', 'campaign'],
      };
      expect(colorStore.colorDimension).toBe(Dimension.DISEASE);
      expect(appStore.dimensions.row).toBe(Dimension.DISEASE);

      colorStore.setColors([routinePointMetadata, campaignPointMetadata]);

      const { tooltipCallback } = usePlotTooltips();

      const routineTooltip = tooltipCallback({ x: 1, y: 2, metadata: routinePointMetadata.metadata! });
      expect(routineTooltip).toContain('Disease: <b>Cholera</b>');
      expect(routineTooltip).toContain('Activity type: <b>Routine</b>');
      // Row dimension (disease) is NOT shown separately because it's the same as color dimension
      expect(routineTooltip.match(/Disease:/g)?.length).toBe(1);
      expect(routineTooltip).toContain('style="color: #6929c4'); // purple70

      const campaignTooltip = tooltipCallback({ x: 1, y: 2, metadata: campaignPointMetadata.metadata! });

      expect(campaignTooltip).toContain('Disease: <b>Cholera</b>');
      expect(campaignTooltip).toContain('Activity type: <b>Campaign</b>');
      // Row dimension (disease) is NOT shown separately because it's the same as color dimension
      expect(campaignTooltip.match(/Disease:/g)?.length).toBe(1);
      expect(campaignTooltip).toContain('style="color: #6929c4'); // purple70
    });

    it('displays summary data (mean, and 95% confidence interval) in tooltip', () => {
      const afgPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Cholera', [Axis.COLUMN]: '' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();
      const dataStore = useDataStore();

      appStore.filters = {
        [Dimension.LOCATION]: ['AFG'],
        [Dimension.DISEASE]: ['Cholera'],
      };

      colorStore.setColors([afgPointMetadata]);

      dataStore.summaryTableData = [
        {
          [Dimension.LOCATION]: 'AFG',
          [Dimension.DISEASE]: 'Cholera',
          [SummaryTableColumn.MEAN]: 1456.78,
          [SummaryTableColumn.CI_LOWER]: 789.12,
          [SummaryTableColumn.CI_UPPER]: 2345.67,
        } as SummaryTableDataRow,
      ];

      const { tooltipCallback } = usePlotTooltips();

      const tooltip = tooltipCallback({ x: 1, y: 2, metadata: afgPointMetadata.metadata! });

      expect(tooltip).toContain('Mean: <b>1456.78</b>');
      expect(tooltip).toContain('95% confidence interval:');
      expect(tooltip).toContain('<b>789.12</b>');
      expect(tooltip).toContain('<b>2345.67</b>');
    });

    it('handles negative confidence interval values with appropriate sign', () => {
      const afgPointMetadata = { metadata: { [Axis.WITHIN_BAND]: 'AFG', [Axis.ROW]: 'Cholera', [Axis.COLUMN]: '' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();
      const dataStore = useDataStore();

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
          [SummaryTableColumn.MEAN]: 55.00,
          [SummaryTableColumn.CI_LOWER]: -100.50,
          [SummaryTableColumn.CI_UPPER]: 200.75,
        } as SummaryTableDataRow,
      ];

      const { tooltipCallback } = usePlotTooltips();

      const tooltip = tooltipCallback({ x: 1, y: 2, metadata: afgPointMetadata.metadata! });

      expect(tooltip).toContain('Mean: <b>55.00</b>');
      // Check negative lower bound and positive upper bound with + sign when interval crosses zero
      expect(tooltip).toContain('<b>-100.50</b>');
      expect(tooltip).toContain('<b>+200.75</b>');
    });
  });
});
