import { createPinia, setActivePinia } from 'pinia';
import { it, expect, describe, beforeEach } from 'vitest';

import diseaseOptions from '@/data/options/diseaseOptions.json';
import { globalOption } from '@/utils/options';
import { useAppStore } from '@/stores/appStore';
import { useColorStore } from '@/stores/colorStore';

const colors = {
  purple70: "#6929c4",
  cyan50: "#1192e8",
  teal70: "#005d5d",
  magenta70: "#9f1853",
  red50: "#fa4d56",
  red90: "#570408",
  green60: "#198038",
  blue80: "#002d9c",
  magenta50: "#ee538b",
  yellow50: "#b28600",
  teal50: "#009d9a",
  cyan90: "#012749",
  orange70: "#8a3800",
  purple50: "#a56eff",
};

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
    it('when the color dimension is location, it maps one color per location, and has the correct global option color', () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG', 'CHN', globalOption.value],
        disease: ['Cholera'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('location');

      expect(colorStore.colorMapping.size).toBe(3);
      expect(colorStore.colorMapping.get(globalOption.value)).toEqual(colors.purple70);
      expect(colorStore.colorMapping.get('AFG')).toBe(colors.cyan50);
      expect(colorStore.colorMapping.get('CHN')).toBe(colors.magenta50);
    });

    it('when the color dimension is disease, it maps one color per disease', () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG'],
        disease: ['Cholera', 'Rubella'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('disease');

      expect(colorStore.colorMapping.size).toBe(2);
      expect(colorStore.colorMapping.get('Cholera')).toEqual(colors.purple70);
      expect(colorStore.colorMapping.get('Rubella')).toBe(colors.teal50);
    });
  });

  describe('getColorForLine', () => {
    it("when the color dimension is disease, it returns colors depending on line's disease", () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG'],
        disease: ['Cholera', 'Rubella'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('disease');

      expect(colorStore.getColorForLine({ withinBand: 'AFG', y: 'Cholera' })).toBe(colors.purple70);
      expect(colorStore.getColorForLine({ withinBand: 'AFG', y: 'Rubella' })).toBe(colors.teal50);
    });

    it("when the color dimension is location, it returns colors depending on line's location", () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG', 'CHN', globalOption.value],
        disease: ['Cholera'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('location');

      expect(colorStore.getColorForLine({ withinBand: globalOption.value, y: 'Cholera' })).toBe(colors.purple70);
      expect(colorStore.getColorForLine({ withinBand: 'CHN', y: 'Cholera' })).toBe(colors.magenta50);
      expect(colorStore.getColorForLine({ withinBand: 'AFG', y: 'Cholera' })).toBe(colors.cyan50);
    });
  });

  it('when filters change, it sets the color mapping depending on no. of categories in filter', () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();

    appStore.dimensions.withinBand = 'location';
    appStore.dimensions.y = 'disease';
    appStore.filters = {
      location: ['AFG', 'CHN', globalOption.value],
      disease: ['Cholera'],
    };

    expect(colorStore.colorDimension).toBe('location');
    expect(colorStore.colorMapping.size).toEqual(3);
    expect(colorStore.colorMapping.get(globalOption.value)).toEqual(colors.purple70);
    expect(Array.from(colorStore.colorMapping.values())).toEqual(
      expect.arrayContaining([colors.magenta50, colors.cyan50, colors.purple70])
    );

    appStore.filters.location = ['AFG', globalOption.value];

    expect(colorStore.colorDimension).toBe('location');
    expect(colorStore.colorMapping.size).toEqual(2);
    expect(colorStore.colorMapping.get(globalOption.value)).toEqual(colors.purple70);
    expect(Array.from(colorStore.colorMapping.values())).toEqual(
      expect.arrayContaining([colors.purple70, colors.teal50])
    );

    appStore.dimensions.withinBand = 'disease';
    appStore.dimensions.y = 'location';
    appStore.filters = {
      location: [globalOption.value],
      disease: ['Cholera', 'Rubella', 'Measles', 'Rota'],
    };

    expect(colorStore.colorDimension).toBe('disease');
    expect(colorStore.colorMapping.size).toEqual(4);
    expect(Array.from(colorStore.colorMapping.values())).toEqual(
      expect.arrayContaining([colors.purple70, colors.cyan90, colors.teal50, colors.magenta50])
    );

    appStore.filters.disease.push('Typhoid');

    expect(colorStore.colorMapping.size).toEqual(5);
    expect(Array.from(colorStore.colorMapping.values())).toEqual(
      expect.arrayContaining([colors.purple70, colors.cyan50, colors.teal70, colors.magenta70, colors.red90])
    );

    appStore.filters.disease.push('HPV');

    expect(colorStore.colorMapping.size).toEqual(6);
    expect(Array.from(colorStore.colorMapping.values())).toEqual(
      expect.arrayContaining([
        colors.purple70,
        colors.cyan50,
        colors.teal70,
        colors.magenta70,
        colors.red50,
        colors.red90,
      ])
    );

    appStore.filters.disease = diseaseOptions.map(o => o.value);
    expect(colorStore.colorMapping.size).toEqual(16);
    expect(Array.from(colorStore.colorMapping.values())).toEqual(
      expect.arrayContaining(Object.values(colors))
    );
    expect(Array.from(colorStore.colorMapping.values())).not.toContain(undefined);
  });
});
