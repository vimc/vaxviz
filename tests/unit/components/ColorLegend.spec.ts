import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia';

import ColorLegend from '@/components/ColorLegend.vue'
import { globalOption } from '@/utils/options';
import { useAppStore } from "@/stores/appStore";
import { useColorStore } from '@/stores/colorStore';

const expectCorrectMarginForRowDimension = (rowDimension: "disease" | "location", wrapper: ReturnType<typeof mount>) => {
  const leftMarginPx = rowDimension === "location" ? 170 : 110;
  expect(wrapper.find('ul').attributes('style')).toBe(`margin-left: ${leftMarginPx}px;`);
};

describe('RidgelinePlot component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the correct labels and colours when the color dimension is location, sorting them by resolution', async () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    const wrapper = mount(ColorLegend);
    appStore.dimensions.withinBand = 'location';
    appStore.dimensions.column = 'activity_type';
    appStore.dimensions.row = 'disease';
    appStore.filters = {
      location: ['Central and Southern Asia', globalOption.value, 'AFG'],
      disease: ['Cholera'],
    };
    expect(colorStore.colorDimension).toBe('location');

    colorStore.setColors([]);
    expect(colorStore.colorMapping.size).toBe(0);
    expect(wrapper.findAll(".legend-label").length).toBe(0);

    // No legend required if only one color
    colorStore.setColors([{ metadata: { withinBand: 'Central and Southern Asia', row: 'Cholera', column: 'campaign' } }]);
    expect(colorStore.colorMapping.size).toBe(1);
    expect(wrapper.findAll(".legend-label").length).toBe(0);

    colorStore.setColors([
      { metadata: { withinBand: 'Central and Southern Asia', row: 'Cholera', column: 'campaign' } },
      { metadata: { withinBand: 'AFG', row: 'Cholera', column: 'routine' } },
      { metadata: { withinBand: 'AFG', row: 'Cholera', column: 'campaign' } },
      { metadata: { withinBand: 'global', row: 'Cholera', column: 'campaign' } },
    ]);

    expect(colorStore.colorMapping.size).toBe(3);

    await vi.waitFor(() => {
      expect(wrapper.findAll(".legend-label").length).toBe(3);
    });

    const labels = wrapper.findAll(".legend-label");
    const colorBoxes = wrapper.findAll(".legend-color-box");

    expect(labels[0].text()).toBe('Afghanistan');
    expect(colorBoxes[0].element.style.borderColor).toBe("rgb(238, 83, 139)"); // magenta50
    expect(colorBoxes[0].element.style.backgroundColor).toBe("rgba(238, 83, 139, 0.2)");

    expect(labels[1].text()).toBe('Central and Southern Asia');
    expect(colorBoxes[1].element.style.borderColor).toBe("rgb(17, 146, 232)"); // cyan50
    expect(colorBoxes[1].element.style.backgroundColor).toBe("rgba(17, 146, 232, 0.2)");

    expect(labels[2].text()).toBe('All 117 VIMC countries');
    expect(colorBoxes[2].element.style.borderColor).toBe("rgb(105, 41, 196)"); // purple70
    expect(colorBoxes[2].element.style.backgroundColor).toBe("rgba(105, 41, 196, 0.2)");

    expectCorrectMarginForRowDimension("disease", wrapper);
  });

  it('renders the correct labels and colors when the color dimension is disease, in the order in which the colors were assigned', async () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    const wrapper = mount(ColorLegend);
    appStore.dimensions.withinBand = 'location';
    appStore.dimensions.column = 'activity_type';
    appStore.dimensions.row = 'disease';
    appStore.filters = {
      location: ['AFG'],
      disease: ['Cholera', 'Rubella'],
    };
    expect(colorStore.colorDimension).toBe('disease');

    colorStore.setColors([
      { metadata: { withinBand: 'AFG', row: 'Cholera', column: 'campaign' } },
      { metadata: { withinBand: 'AFG', row: 'Rubella', column: 'campaign' } },
      { metadata: { withinBand: 'AFG', row: 'Rubella', column: 'routine' } },
    ]);

    expect(colorStore.colorMapping.size).toBe(2);

    await vi.waitFor(() => {
      expect(wrapper.findAll(".legend-label").length).toBe(2);
    });

    const labels = wrapper.findAll(".legend-label");
    const colorBoxes = wrapper.findAll(".legend-color-box");

    expect(labels[0].text()).toBe('Rubella');
    expect(colorBoxes[0].element.style.borderColor).toBe("rgb(0, 157, 154)"); // teal50
    expect(colorBoxes[0].element.style.backgroundColor).toBe("rgba(0, 157, 154, 0.2)");

    expect(labels[1].text()).toBe('Cholera');
    expect(colorBoxes[1].element.style.borderColor).toBe("rgb(105, 41, 196)"); // purple70
    expect(colorBoxes[1].element.style.backgroundColor).toBe("rgba(105, 41, 196, 0.2)");

    expectCorrectMarginForRowDimension("disease", wrapper);
  });

  it('updates the legend when the data changes', async () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    const wrapper = mount(ColorLegend);
    appStore.dimensions.withinBand = 'location';
    appStore.dimensions.column = 'activity_type';
    appStore.dimensions.row = 'disease';
    appStore.filters = {
      location: ['Central and Southern Asia', globalOption.value, 'AFG'],
      disease: ['Cholera', 'Rubella'],
    };
    expect(colorStore.colorDimension).toBe('location');

    colorStore.setColors([
      { metadata: { withinBand: 'Central and Southern Asia', row: 'Cholera', column: 'campaign' } },
      { metadata: { withinBand: 'AFG', row: 'Cholera', column: 'routine' } },
      { metadata: { withinBand: 'AFG', row: 'Cholera', column: 'campaign' } },
      { metadata: { withinBand: 'global', row: 'Cholera', column: 'campaign' } },
    ]);

    expect(colorStore.colorMapping.size).toBe(3);
    // Assert the order of the colors is the same as the order of first appearance in the call to setColors.
    expect(Array.from(colorStore.colorMapping.keys())).toEqual(['Central and Southern Asia', 'AFG', 'global']);

    await vi.waitFor(() => {
      expect(wrapper.findAll(".legend-label").length).toBe(3);
    });

    const labels = wrapper.findAll(".legend-label");
    const colorBoxes = wrapper.findAll(".legend-color-box");

    expect(labels[0].text()).toBe('Afghanistan');
    expect(colorBoxes[0].element.style.borderColor).toBe("rgb(238, 83, 139)"); // magenta50
    expect(colorBoxes[0].element.style.backgroundColor).toBe("rgba(238, 83, 139, 0.2)");

    expect(labels[1].text()).toBe('Central and Southern Asia');
    expect(colorBoxes[1].element.style.borderColor).toBe("rgb(17, 146, 232)"); // cyan50
    expect(colorBoxes[1].element.style.backgroundColor).toBe("rgba(17, 146, 232, 0.2)");

    expect(labels[2].text()).toBe('All 117 VIMC countries');
    expect(colorBoxes[2].element.style.borderColor).toBe("rgb(105, 41, 196)"); // purple70
    expect(colorBoxes[2].element.style.backgroundColor).toBe("rgba(105, 41, 196, 0.2)");

    expectCorrectMarginForRowDimension("disease", wrapper);

    appStore.filters = {
      location: ['AFG'],
      disease: ['Cholera', 'Rubella'],
    };
    expect(colorStore.colorDimension).toBe('disease');

    colorStore.setColors([
      { metadata: { withinBand: 'AFG', row: 'Cholera', column: 'campaign' } },
      { metadata: { withinBand: 'AFG', row: 'Rubella', column: 'campaign' } },
      { metadata: { withinBand: 'AFG', row: 'Rubella', column: 'routine' } },
    ]);

    expect(colorStore.colorMapping.size).toBe(2);
    // Assert the order of the colors is the same as the order of first appearance in the call to setColors.
    expect(Array.from(colorStore.colorMapping.keys())).toEqual(['Cholera', 'Rubella']);

    await vi.waitFor(() => {
      expect(wrapper.findAll(".legend-label").length).toBe(2);
    });

    const diseaseLabels = wrapper.findAll(".legend-label");
    const diseaseColorBoxes = wrapper.findAll(".legend-color-box");

    expect(diseaseLabels[0].text()).toBe('Rubella');
    expect(diseaseColorBoxes[0].element.style.borderColor).toBe("rgb(0, 157, 154)"); // teal50
    expect(diseaseColorBoxes[0].element.style.backgroundColor).toBe("rgba(0, 157, 154, 0.2)");
    expect(diseaseLabels[1].text()).toBe('Cholera');
    expect(diseaseColorBoxes[1].element.style.borderColor).toBe("rgb(105, 41, 196)"); // purple70
    expect(diseaseColorBoxes[1].element.style.backgroundColor).toBe("rgba(105, 41, 196, 0.2)");
    expectCorrectMarginForRowDimension("disease", wrapper);
  });

  it('renders the correct labels and colours when the _row_ dimension is location (regardless of color dimension)', async () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    const wrapper = mount(ColorLegend);
    appStore.dimensions.withinBand = 'disease';
    appStore.dimensions.column = null;
    appStore.dimensions.row = 'location';
    appStore.filters = {
      location: ['AFG', 'global'],
      disease: ['Malaria'],
    };
    expect(colorStore.colorDimension).toBe('location');

    colorStore.setColors([
      { metadata: { withinBand: 'Malaria', row: 'AFG' } },
      { metadata: { withinBand: 'Malaria', row: 'global' } },
    ]);

    expect(colorStore.colorMapping.size).toBe(2);

    await vi.waitFor(() => {
      expect(wrapper.findAll(".legend-label").length).toBe(2);
    });

    const labels = wrapper.findAll(".legend-label");
    const colorBoxes = wrapper.findAll(".legend-color-box");

    // NB order of locations is _not_ determined by geographical resolution in this case, because the y-categorical scale
    // is location and thus the color legend order is intended to match that.
    expect(labels[0].text()).toBe('All 117 VIMC countries');
    expect(colorBoxes[0].element.style.borderColor).toBe("rgb(105, 41, 196)"); // purple70
    expect(colorBoxes[0].element.style.backgroundColor).toBe("rgba(105, 41, 196, 0.2)");

    expect(labels[1].text()).toBe('Afghanistan');
    expect(colorBoxes[1].element.style.borderColor).toBe("rgb(0, 157, 154)"); // teal50
    expect(colorBoxes[1].element.style.backgroundColor).toBe("rgba(0, 157, 154, 0.2)");

    expectCorrectMarginForRowDimension("location", wrapper);
  });
});
