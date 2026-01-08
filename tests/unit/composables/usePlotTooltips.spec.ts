import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { it, expect, describe, beforeEach, vi } from 'vitest';
import { nextTick } from "vue";

import usePlotTooltips from '@/composables/usePlotTooltips';
import { useAppStore } from '@/stores/appStore';
import { useColorStore } from '@/stores/colorStore';
import { Axes, Dimensions, type PointWithMetadata } from '@/types';

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
      const afgPointMetadata = { metadata: { [Axes.WITHIN_BAND]: 'AFG', [Axes.ROW]: 'Cholera', [Axes.COLUMN]: '' } };
      const globalPointMetadata = { metadata: { [Axes.WITHIN_BAND]: 'global', [Axes.ROW]: 'Cholera', [Axes.COLUMN]: '' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();

      // Set up store state for location-based coloring
      appStore.filters = {
        [Dimensions.LOCATION]: ['AFG', 'global'],
        [Dimensions.DISEASE]: ['Cholera'],
      };
      expect(colorStore.colorDimension).toBe(Dimensions.LOCATION);

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

    it('generates tooltip HTML for location dimension', () => {
      const choleraPointMetadata = { metadata: { [Axes.WITHIN_BAND]: 'AFG', [Axes.ROW]: 'Cholera', [Axes.COLUMN]: '' } };
      const measlesPointMetadata = { metadata: { [Axes.WITHIN_BAND]: 'AFG', [Axes.ROW]: 'Measles', [Axes.COLUMN]: '' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();

      // Set up store state for disease-based coloring
      appStore.filters = {
        [Dimensions.LOCATION]: ['AFG'],
        [Dimensions.DISEASE]: ['Cholera', 'Measles'],
      };
      expect(colorStore.colorDimension).toBe(Dimensions.DISEASE);

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
      const routinePointMetadata = { metadata: { [Axes.WITHIN_BAND]: 'AFG', [Axes.ROW]: 'Cholera', [Axes.COLUMN]: 'routine' } };
      const campaignPointMetadata = { metadata: { [Axes.WITHIN_BAND]: 'AFG', [Axes.ROW]: 'Cholera', [Axes.COLUMN]: 'campaign' } };

      const appStore = useAppStore();
      const colorStore = useColorStore();

      appStore.splitByActivityType = true;
      await nextTick();
      expect(appStore.dimensions.column).toBe(Dimensions.ACTIVITY_TYPE);

      // Set up store state for disease-based coloring (single location)
      appStore.filters = {
        [Dimensions.LOCATION]: ['AFG'],
        [Dimensions.DISEASE]: ['Cholera'],
        [Dimensions.ACTIVITY_TYPE]: ['routine', 'campaign'],
      };
      expect(colorStore.colorDimension).toBe(Dimensions.DISEASE);

      colorStore.setColors([routinePointMetadata, campaignPointMetadata]);

      const { tooltipCallback } = usePlotTooltips();

      const routineTooltip = tooltipCallback({ x: 1, y: 2, metadata: routinePointMetadata.metadata! });
      expect(routineTooltip).toContain('Disease: <strong>Cholera</strong>');
      expect(routineTooltip).toContain('Activity type: <strong>Routine</strong>');
      expect(routineTooltip).toContain('style="color: #6929c4'); // purple70
      expect(routineTooltip).not.toContain('Location');

      const campaignTooltip = tooltipCallback({ x: 1, y: 2, metadata: campaignPointMetadata.metadata! });

      expect(campaignTooltip).toContain('Disease: <strong>Cholera</strong>');
      expect(routineTooltip).toContain('Activity type: <strong>Routine</strong>');
      expect(campaignTooltip).toContain('style="color: #6929c4'); // purple70
      expect(campaignTooltip).not.toContain('Location');
    });
  });
});
