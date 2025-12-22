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
  white: "#ffffff",
  black: "#000000",
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

  describe('getColorsForLine', () => {
    it("when the color dimension is location, it returns colors depending on line's location, and has the correct global option color", () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.x = 'activity_type';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG', 'CHN', globalOption.value],
        disease: ['Cholera'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('location');

      colorStore.resetColorMapping();
      colorStore.getColorsForLine({ withinBand: 'CHN', y: 'Cholera', x: 'campaign' });
      colorStore.getColorsForLine({ withinBand: 'AFG', y: 'Cholera', x: 'campaign' });
      colorStore.getColorsForLine({ withinBand: 'AFG', y: 'Cholera', x: 'routine' });
      colorStore.getColorsForLine({ withinBand: 'global', y: 'Cholera', x: 'campaign' });

      expect(colorStore.colorMapping.size).toBe(3);
      expect(colorStore.colorMapping.get(globalOption.value)).toEqual(colors.purple70);
      expect(colorStore.colorMapping.get('CHN')).toEqual(colors.cyan50);
      expect(colorStore.colorMapping.get('AFG')).toEqual(colors.magenta50);
    });

    it("when the color dimension is disease, it returns colors depending on line's disease", () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.x = 'activity_type';
      appStore.dimensions.y = 'disease';
      appStore.filters = {
        location: ['AFG'],
        disease: ['Cholera', 'Rubella'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('disease');
      colorStore.resetColorMapping();
      colorStore.getColorsForLine({ withinBand: 'AFG', y: 'Cholera', x: 'campaign' });
      colorStore.getColorsForLine({ withinBand: 'AFG', y: 'Rubella', x: 'campaign' });
      colorStore.getColorsForLine({ withinBand: 'AFG', y: 'Rubella', x: 'routine' });

      expect(colorStore.colorMapping.size).toBe(2);
      expect(colorStore.colorMapping.get('Cholera')).toEqual(colors.purple70);
      expect(colorStore.colorMapping.get('Rubella')).toEqual(colors.teal50);
    });

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
      colorStore.getColorsForLine({ withinBand: 'AFG', y: 'Cholera' });
      colorStore.getColorsForLine({ withinBand: 'CHN', y: 'Cholera' });
      colorStore.getColorsForLine({ withinBand: 'global', y: 'Cholera' });
      // Should return only 1 disease-color mapping
      expect(colorStore.colorMapping.size).toBe(1);
      expect(colorStore.colorMapping.get("Cholera")).toEqual(colors.purple70);
    });
  });

  it('chooses the color palette depending on number of categories in filter', () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    appStore.dimensions.x = 'activity_type';

    const assignColorsByLocation = () => {
      expect(colorStore.colorDimension).toBe('location');
      colorStore.resetColorMapping();
      appStore.filters.location.forEach((loc) => {
        ["campaign", "routine"].forEach((activity) => colorStore.getColorsForLine({
          x: activity,
          y: appStore.filters.disease[0],
          withinBand: loc,
        }));
      })
    };

    appStore.dimensions.withinBand = 'location';
    appStore.dimensions.y = 'disease';
    appStore.filters = {
      location: ['AFG', 'CHN', globalOption.value],
      disease: ['Cholera'],
    };
    assignColorsByLocation();

    expect(colorStore.colorMapping.size).toEqual(3);
    expect(colorStore.colorMapping.get(globalOption.value)).toEqual(colors.purple70);
    expect(Array.from(colorStore.colorMapping.values())).toEqual(
      expect.arrayContaining([colors.magenta50, colors.cyan50, colors.purple70])
    );

    appStore.filters.location = ['AFG', globalOption.value];
    assignColorsByLocation();

    expect(colorStore.colorMapping.size).toEqual(2);
    expect(colorStore.colorMapping.get(globalOption.value)).toEqual(colors.purple70);
    expect(Array.from(colorStore.colorMapping.values())).toEqual(
      expect.arrayContaining([colors.purple70, colors.teal50])
    );

    const assignColorsByDisease = () => {
      expect(colorStore.colorDimension).toBe('disease');
      colorStore.resetColorMapping();
      appStore.filters.disease.forEach((disease) => {
        ["campaign", "routine"].forEach((activity) => colorStore.getColorsForLine({
          x: activity,
          y: appStore.filters.location[0],
          withinBand: disease,
        }));
      })
    }

    appStore.dimensions.withinBand = 'disease';
    appStore.dimensions.y = 'location';
    appStore.filters = {
      location: [globalOption.value],
      disease: ['Cholera', 'Rubella', 'Measles', 'Rota'],
    };
    assignColorsByDisease();

    expect(colorStore.colorMapping.size).toEqual(4);
    expect(Array.from(colorStore.colorMapping.values())).toEqual(
      expect.arrayContaining([colors.purple70, colors.cyan90, colors.teal50, colors.magenta50])
    );

    appStore.filters.disease.push('Typhoid');
    assignColorsByDisease();

    expect(colorStore.colorMapping.size).toEqual(5);
    expect(Array.from(colorStore.colorMapping.values())).toEqual(
      expect.arrayContaining([colors.purple70, colors.cyan50, colors.teal70, colors.magenta70, colors.red90])
    );

    appStore.filters.disease.push('HPV');
    assignColorsByDisease();

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
    assignColorsByDisease();

    expect(colorStore.colorMapping.size).toEqual(16);
    expect(Array.from(colorStore.colorMapping.values())).toEqual(
      expect.arrayContaining(Object.values(colors))
    );
    expect(Array.from(colorStore.colorMapping.values())).not.toContain(undefined);
    const diseaseWithWhiteColor = diseaseOptions.map(o => o.value).at(-1);
    expect(colorStore.getColorsForLine({ y: 'AFG', withinBand: diseaseWithWhiteColor })).toEqual({
      fillColor: colors.white,
      strokeColor: colors.black,
    });
  });
});
