import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { it, expect, describe, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { Axis, Dimension, HistColumn } from '@/types';
import useHistogramLines from '@/composables/useHistogramLines';

describe('useHistogramLines', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  it('does not compute lines until data is ready', () => {
    const dataIsReady = ref(false);
    const data = ref([{
      [Dimension.DISEASE]: "Malaria",
      [Dimension.LOCATION]: "Djibouti",
      [HistColumn.LOWER_BOUND]: 1,
      [HistColumn.UPPER_BOUND]: 10,
      [HistColumn.COUNTS]: 5,
    }]);
    const axisDimension = () => ({
      [Axis.COLUMN]: Dimension.DISEASE,
      [Axis.ROW]: Dimension.LOCATION,
      [Axis.WITHIN_BAND]: Dimension.LOCATION,
    });

    const { ridgeLines } = useHistogramLines(
      dataIsReady,
      data,
      axisDimension,
      () => "category",
      () => "label",
    );

    expect(ridgeLines.value).toHaveLength(0);

    dataIsReady.value = true;

    expect(ridgeLines.value).toHaveLength(1);
  });
});
