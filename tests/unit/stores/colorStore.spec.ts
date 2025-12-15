import { createPinia, setActivePinia } from 'pinia';
import { it, expect, describe, beforeEach } from 'vitest';

import { globalOption } from '@/utils/options';
import { useAppStore } from '@/stores/appStore';
import { useColorStore } from '@/stores/colorStore';

describe('color store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('colorDimension', () => {
    it('returns the withinBand dimension when there are multiple filtered values on that axis', () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG', 'CHN'],
        disease: ['Cholera'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('location');
    });

    it('returns the y dimension when there is a single filtered value on the withinBand axis', () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG'],
        disease: ['Cholera', 'Rubella'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('disease');
    });
  });

  describe('colorMapping', () => {
    it('when the color dimension is location, it returns the location color mapping', () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG', 'CHN', globalOption.value],
        disease: ['Cholera'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('location');

      colorStore.resetColorMapping();
      expect(colorStore.colorMapping.size).toBe(1);
      expect(colorStore.colorMapping.get(globalOption.value)).toEqual("#6929c4");

      colorStore.getColorForLine({ withinBand: 'AFG', y: 'Cholera' });

      expect(colorStore.colorMapping.size).toBe(2);
      expect(colorStore.colorMapping.get("AFG")).toEqual("#1192e8");
    });

    it('when the color dimension is disease, it returns the disease color mapping', () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG'],
        disease: ['Cholera', 'Rubella'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('disease');
      colorStore.resetColorMapping();

      expect(colorStore.colorDimension).toBe('disease');
      expect(colorStore.colorMapping.size).toBe(0);

      colorStore.getColorForLine({ withinBand: 'AFG', y: 'Cholera' });

      expect(colorStore.colorMapping.size).toBe(1);
      expect(colorStore.colorMapping.get("Cholera")).toEqual("#6929c4");
    });
  });

  describe('getColorForLine', () => {
    it('when the color has already been assigned, it returns that color, without assigning any more', () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG'],
        disease: ['Cholera', 'Rubella'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('disease');

      colorStore.resetColorMapping();
      expect(colorStore.colorMapping.size).toBe(0);
      expect(colorStore.getColorForLine({ withinBand: 'AFG', y: 'Cholera' })).toBe("#6929c4");
      expect(colorStore.getColorForLine({ withinBand: 'CHN', y: 'Cholera' })).toBe("#6929c4");
      expect(colorStore.getColorForLine({ withinBand: 'global', y: 'Cholera' })).toBe("#6929c4");
      // Should return only 1 disease-color mapping
      expect(colorStore.colorMapping.size).toBe(1);
      expect(colorStore.colorMapping.get("Cholera")).toEqual("#6929c4");
    });

    it('when the color has NOT already been assigned, it assigns the next color and returns it', () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG', 'CHN', globalOption.value],
        disease: ['Cholera'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('location');

      colorStore.resetColorMapping();
      expect(colorStore.getColorForLine({ withinBand: 'AFG', y: 'Cholera' })).toBe("#1192e8");
      expect(colorStore.getColorForLine({ withinBand: 'CHN', y: 'Cholera' })).toBe("#005d5d");
      expect(colorStore.getColorForLine({ withinBand: 'global', y: 'Cholera' })).toBe("#6929c4");
      expect(colorStore.colorMapping.size).toBe(3);
      expect(colorStore.colorMapping.get("AFG")).toEqual("#1192e8");
      expect(colorStore.colorMapping.get("CHN")).toEqual("#005d5d");
      expect(colorStore.colorMapping.get("global")).toEqual("#6929c4");
    });
  });

  it('resetColorMapping resets the color mapping, retaining the global option color', () => {
    const appStore = useAppStore();
    appStore.dimensions.withinBand = 'location';
    appStore.dimensions.y = 'disease';
    appStore.filters = {
      location: ['AFG', 'CHN', globalOption.value],
      disease: ['Cholera'],
    };

    const colorStore = useColorStore();
    expect(colorStore.colorDimension).toBe('location');
    expect(colorStore.colorMapping).not.toBeDefined();

    colorStore.resetColorMapping();
    colorStore.getColorForLine({ withinBand: 'AFG', y: 'Cholera' });
    colorStore.getColorForLine({ withinBand: 'CHN', y: 'Cholera' });

    expect(colorStore.colorMapping.size).toBe(3);
    // Should return location color mapping
    expect(colorStore.colorMapping.get(globalOption.value)).toEqual("#6929c4");
    expect(colorStore.colorMapping.get("AFG")).toEqual("#1192e8");
    expect(colorStore.colorMapping.get("CHN")).toEqual("#005d5d");

    appStore.filters = {
      location: ['AFG'],
      disease: ['Cholera', 'Rubella'],
    };

    colorStore.resetColorMapping();
    expect(colorStore.colorDimension).toBe('disease');
    colorStore.getColorForLine({ withinBand: 'AFG', y: 'Cholera' });
    colorStore.getColorForLine({ withinBand: 'CHN', y: 'Cholera' });
    // Should return disease color mapping
    expect(colorStore.colorMapping.size).toBe(1);
    expect(colorStore.colorMapping.get("Cholera")).toEqual("#6929c4");
  });
});
