import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { it, expect, describe, beforeEach, vi } from 'vitest';
import { nextTick } from "vue";

import usePlotTooltips from '@/composables/usePlotTooltips';
import { useAppStore } from '@/stores/appStore';
import { useColorStore } from '@/stores/colorStore';
import { Axis, Dimension, type PointWithMetadata } from '@/types';

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
      expect(afgTooltip).not.toContain('Disease');
      expect(afgTooltip).not.toContain('Activity type');

      const globalTooltip = tooltipCallback({ x: 1, y: 2, metadata: globalPointMetadata.metadata! });

      expect(globalTooltip).toContain('Location: <strong>All 117 VIMC countries</strong>');
      expect(globalTooltip).toContain('style="color: #6929c4'); // purple70
      expect(globalTooltip).not.toContain('Disease');
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

      colorStore.setColors([choleraPointMetadata, measlesPointMetadata]);

      const { tooltipCallback } = usePlotTooltips();

      const choleraTooltip = tooltipCallback({ x: 1, y: 2, metadata: choleraPointMetadata.metadata! });

      expect(choleraTooltip).toContain('Disease: <strong>Cholera</strong>');
      expect(choleraTooltip).toContain('style="color: #6929c4'); // purple70
      expect(choleraTooltip).not.toContain('Location');
      expect(choleraTooltip).not.toContain('Activity type');

      const measlesTooltip = tooltipCallback({ x: 1, y: 2, metadata: measlesPointMetadata.metadata! });

      expect(measlesTooltip).toContain('Disease: <strong>Measles</strong>');
      expect(measlesTooltip).toContain('style="color: #009d9a'); // teal50
      expect(measlesTooltip).not.toContain('Location');
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
      expect(routineTooltip).not.toContain('Location');

      const campaignTooltip = tooltipCallback({ x: 1, y: 2, metadata: campaignPointMetadata.metadata! });

      expect(campaignTooltip).toContain('Disease: <strong>Cholera</strong>');
      expect(campaignTooltip).toContain('Activity type: <strong>Campaign</strong>');
      expect(campaignTooltip).toContain('style="color: #6929c4'); // purple70
      expect(campaignTooltip).not.toContain('Location');
    });
  });
});
