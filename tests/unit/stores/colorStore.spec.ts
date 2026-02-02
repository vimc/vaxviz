import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { it, expect, describe, beforeEach, vi } from 'vitest';

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
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  describe('colorDimension', () => {
    it('returns the withinBand dimension when there are multiple filtered values on that axis', () => {
      const appStore = useAppStore();
      appStore.dimensions.withinBand = 'location';
      appStore.dimensions.row = 'disease';
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
      appStore.dimensions.row = 'disease';
      appStore.filters = {
        location: ['AFG'],
        disease: ['Cholera', 'Rubella'],
      };

      const colorStore = useColorStore();
      expect(colorStore.colorDimension).toBe('disease');
    });
  });

  it("when the color dimension is location, it sets colors depending on lines' unique locations, and has the correct global option color", async () => {
    const appStore = useAppStore();
    appStore.dimensions.withinBand = 'location';
    appStore.dimensions.column = 'activity_type';
    appStore.dimensions.row = 'disease';
    appStore.filters = {
      location: ['AFG', 'CHN', globalOption.value],
      disease: ['Cholera'],
    };

    const colorStore = useColorStore();
    expect(colorStore.colorDimension).toBe('location');

    colorStore.setColors([
      { metadata: { withinBand: 'CHN', row: 'Cholera', column: 'campaign' } },
      { metadata: { withinBand: 'AFG', row: 'Cholera', column: 'routine' } },
      { metadata: { withinBand: 'AFG', row: 'Cholera', column: 'campaign' } },
      { metadata: { withinBand: 'global', row: 'Cholera', column: 'campaign' } },
    ]);

    expect(colorStore.colorMapping.size).toBe(3);
    // Assert the order of the colors is the same as the order of first appearance in the call to setColors.
    expect(Array.from(colorStore.colorMapping.keys())).toEqual(['CHN', 'AFG', 'global']);

    expect(
      colorStore.getColorsForLine({ withinBand: 'global', row: 'Cholera', column: 'campaign' }).fillColor
    ).toEqual("rgba(105, 41, 196, 0.2)"); // purple70
    expect(
      colorStore.getColorsForLine({ withinBand: 'CHN', row: 'Cholera', column: 'campaign' }).fillColor
    ).toEqual("rgba(17, 146, 232, 0.2)"); // cyan50
    expect(
      colorStore.getColorsForLine({ withinBand: 'AFG', row: 'Cholera', column: 'routine' }).fillColor
    ).toEqual("rgba(238, 83, 139, 0.2)"); // magenta50
  });

  it("when the color dimension is disease, it sets colors depending on lines' unique diseases", () => {
    const appStore = useAppStore();
    appStore.dimensions.withinBand = 'location';
    appStore.dimensions.column = 'activity_type';
    appStore.dimensions.row = 'disease';
    appStore.filters = {
      location: ['AFG'],
      disease: ['Cholera', 'Rubella'],
    };

    const colorStore = useColorStore();
    expect(colorStore.colorDimension).toBe('disease');
    colorStore.setColors([
      { metadata: { withinBand: 'AFG', row: 'Cholera', column: 'campaign' } },
      { metadata: { withinBand: 'AFG', row: 'Rubella', column: 'campaign' } },
      { metadata: { withinBand: 'AFG', row: 'Rubella', column: 'routine' } },
    ]);

    expect(colorStore.colorMapping.size).toBe(2);
    // Assert the order of the colors is the same as the order of first appearance in the call to setColors.
    expect(Array.from(colorStore.colorMapping.keys())).toEqual(['Cholera', 'Rubella']);

    expect(
      colorStore.getColorsForLine({ withinBand: 'AFG', row: 'Cholera', column: 'campaign' }).fillColor
    ).toEqual("rgba(105, 41, 196, 0.2)"); // purple70
    expect(
      colorStore.getColorsForLine({ withinBand: 'AFG', row: 'Rubella', column: 'campaign' }).fillColor
    ).toEqual("rgba(0, 157, 154, 0.2)"); // teal50
  });

  it('chooses the color palette depending on number of unique values', () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    appStore.dimensions.column = 'activity_type';

    const assignColorsByLocation = () => {
      expect(colorStore.colorDimension).toBe('location');
      const lines = appStore.filters.location.flatMap((loc) => {
        return ["campaign", "routine"].map((activity) => ({
          metadata: {
            column: activity,
            row: appStore.filters.disease[0],
            withinBand: loc,
          },
        }));
      })
      colorStore.setColors(lines);
    };

    appStore.dimensions.withinBand = 'location';
    appStore.dimensions.row = 'disease';
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
      const lines = appStore.filters.disease.flatMap((disease) => {
        return ["campaign", "routine"].map((activity) => ({
          metadata: {
            column: activity,
            row: appStore.filters.location[0],
            withinBand: disease,
          },
        }));
      })
      colorStore.setColors(lines);
    }

    appStore.dimensions.withinBand = 'disease';
    appStore.dimensions.row = 'location';
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
    expect(colorStore.getColorsForLine({ row: 'AFG', withinBand: diseaseWithWhiteColor })).toEqual({
      fillColor: "rgba(255, 255, 255, 0.2)",
      fillOpacity: 1,
      strokeColor: colors.black,
      strokeOpacity: 1,
    });
  });
});
