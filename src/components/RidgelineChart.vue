<template>
  <div class="chart-container">
    <div ref="chartContainer" id="chartContainer"></div>
    <div style="width: fit-content; flex: 1; padding-left: 20px;">
      <h2 v-if="colorAxis">{{ titleCase(colorAxis) }} legend</h2>
      <ul>
        <template v-for="([category, color]) in colorsForKey" :key="category">
          <li style="padding-right: 10px; margin-right: 10px;">
            <span :style="{ backgroundColor: color, display: 'inline-block', width: '10px', height: '10px', marginRight: '10px' }">
            </span>
            {{ category }}
          </li>
        </template>
      </ul>
      <div>
        <h3>Developer controls</h3>
        <!-- Max geographic resolution -->
        <label for="maxGeographicalResolution">Max geographical resolution:</label>
        <select id="maxGeographicalResolution" v-model="appStore.maxGeographicalResolution">
          <option :value="'global'">Global</option>
          <option :value="'subregion'">Subregion</option>
          <option :value="'country'">Country</option>
        </select>
        <br />
        <h4>Axes</h4>
        <label for="yCategoricalAxis">Rows:</label>
        <select id="yCategoricalAxis" v-model="appStore.yCategoricalAxis">
          <option :value="null">None</option>
          <option :value="'location'">Location</option>
          <option :value="'disease'">Disease</option>
          <option :value="'activity_type'">Activity Type</option>
        </select>
        <br />
        <label for="xCategoricalAxis">Columns:</label>
        <select id="xCategoricalAxis" v-model="appStore.xCategoricalAxis">
          <option :value="null">None</option>
          <option :value="'location'">Location</option>
          <option :value="'disease'">Disease</option>
          <option :value="'activity_type'">Activity Type</option>
        </select>
        <br />
        <label for="withinBandAxis">Within band:</label>
        <select id="withinBandAxis" v-model="appStore.withinBandAxis">
          <option :value="null">None</option>
          <option :value="'location'">Location</option>
          <option :value="'disease'">Disease</option>
          <option :value="'activity_type'">Activity Type</option>
        </select>
      </div>
    </div>
  </div>
  {{ yAxisRanking }}
  <p>CSV file paths</p>
  <ul>
    <li v-for="path in histDataPaths" :key="path">{{ path }}</li>
  </ul>
  <p>Appstore filters</p>
  <pre>{{ {
    locationFilter: appStore.locationFilter,
    diseaseFilter: appStore.diseaseFilter,
  } }}</pre>
  <p>Number of filtered lines</p>
  <pre>{{ filteredLines.length.toString() }}</pre>
  <p>All (filtered) lines combos</p>
  <ul>
    <li v-for="(line, index) in filteredLines" :key="index">
      <ul>
        <li>X cat: {{ line.bands?.x }}</li>
        <li>Y cat: {{ line.bands?.y }}</li>
        <li>Within band cat: {{ line.metadata?.withinBandAxisValue }}</li>
      </ul>
      <br/>
    </li>
  </ul>
</template>

<style>
.chart-container {
  width: 100dvw;
  height: 70dvh;
  display: flex;

  #chartContainer {
    width: 100%;
    height: 100%;
    flex: 5;
  }
}
</style>

<script setup lang="ts">
import { useAppStore } from "@/stores/appStore";
import { Dimensions, LocResolutions } from "@/types";
import loadData from "@/utils/loadData";
import titleCase from "@/utils/titleCase";
import { getCountryName } from "@/utils/regions";
import { Chart, type Lines } from "@reside-ic/skadi-chart";
import { debounce } from "perfect-debounce";
import type { LineConfig } from "types";
import { computed, onMounted, ref, watch } from "vue";

const xCategories = ref<Set<string>>(new Set());
const yCategories = ref<Set<string>>(new Set());
type SummaryTableDataRow = Record<Dimensions, string> & { mean_value: number };
const summaryTablesData = ref<SummaryTableDataRow[]>([]);
const xAxisRanking = ref<string[]>(["routine", "campaign"]);

const appStore = useAppStore();

// This will ultimately be replaced by a 'meta-filter' UI control that populates the location filter with locations
// in any combination of geographical resolutions. For now we will just infer it from a 'maxGeographicalResolution'.
const geographicalResolutionsInUse = computed(() => {
  if (!appStore.dimensionsInUse.includes(Dimensions.LOCATION)) {
    return [LocResolutions.GLOBAL];
  }
  switch (appStore.maxGeographicalResolution) {
    case LocResolutions.COUNTRY:
      return [LocResolutions.COUNTRY, LocResolutions.SUBREGION, LocResolutions.GLOBAL];
    case LocResolutions.SUBREGION:
      return [LocResolutions.SUBREGION, LocResolutions.GLOBAL];
    default:
      return [LocResolutions.GLOBAL];
  }
});
const histDataPaths = computed(() => {
  // When we are using multiple geographical resolutions, we need to load multiple data files, to be merged together later.
  return geographicalResolutionsInUse.value.map((geog) => {
    const fileNameParts = ["hist_counts", appStore.burdenMetric, "disease"];
    if (appStore.dimensionsInUse.includes(Dimensions.LOCATION) && geog === LocResolutions.SUBREGION) {
      fileNameParts.push(LocResolutions.SUBREGION);
    }
    if (appStore.dimensionsInUse.includes(Dimensions.ACTIVITY_TYPE)) {
      fileNameParts.push(Dimensions.ACTIVITY_TYPE);
    }
    if (appStore.dimensionsInUse.includes(Dimensions.LOCATION) && geog === LocResolutions.COUNTRY) {
      fileNameParts.push(LocResolutions.COUNTRY);
    }
    if (appStore.useLogScale) {
      fileNameParts.push("log");
    }
    return `${fileNameParts.join("_")}.json`
    // NB files containing 'global' daWta simply omit location from the file name (as they have no location stratification).
  });
});

const summaryTableDataPaths = computed(() => {
  // Similar logic to histDataPaths, but we need to exclude stratification by the within-band axis,
  // since we are using these summary tables to sort the categorical axes' categories.
  // Thus we are only interested in getting the tables stratified by the categorical axes' dimensions.
  return geographicalResolutionsInUse.value.map((geog) => {
    const fileNameParts = ["summary_table", appStore.burdenMetric, "disease"];
    const categoricalAxesDimensions = [appStore.yCategoricalAxis, appStore.xCategoricalAxis].filter(d => !!d);
    if (categoricalAxesDimensions.includes(Dimensions.LOCATION) && geog === LocResolutions.SUBREGION) {
      fileNameParts.push(LocResolutions.SUBREGION);
    }
    if (categoricalAxesDimensions.includes(Dimensions.ACTIVITY_TYPE)) {
      fileNameParts.push(Dimensions.ACTIVITY_TYPE);
    }
    if (categoricalAxesDimensions.includes(Dimensions.LOCATION) && geog === LocResolutions.COUNTRY) {
      fileNameParts.push(LocResolutions.COUNTRY);
    }
    return `${fileNameParts.join("_")}.json`
    // NB files containing 'global' data simply omit location from the file name (as they have no location stratification).
  });
})

const chartContainer = ref<HTMLDivElement | null>(null);

// The IBM categorical palette (maximises accessibility, specifically in this sequence):
// https://carbondesignsystem.com/data-visualization/color-palettes/#categorical-palettes
const colors = ["#6929c4", "#1192e8", "#005d5d", "#9f1853", "#fa4d56", "#570408", "#198038", "#002d9c", "#ee538b", "#b28600", "#009d9a", "#012749", "#8a3800", "#a56eff"];

type LineMetadata = {
  withinBandAxisValue: string;
};

enum HistCols {
  LOWER_BOUND = "lower_bound",
  UPPER_BOUND = "upper_bound",
  COUNTS = "Counts",
}

const linesRef = ref<Lines<LineMetadata>>([]);

const doLoadData = () => {
  // TODO: Work out if there are any dependencies between the things that depend on the data loads.
  // If there are not, we can wrap them in a single Promise.all to be processed concurrently.
  loadData(summaryTableDataPaths.value).then(data => {
    summaryTablesData.value = data as SummaryTableDataRow[];
  }).then(() => {
    xCategories.value = new Set();
    yCategories.value = new Set();
    loadData(histDataPaths.value).then(data => {
      const lines: Lines<LineMetadata> = [];
      for (let i = 0; i < data.length; i++) {
        const d = data[i]!;

        if (typeof d[HistCols.LOWER_BOUND] !== "number" || typeof d[HistCols.UPPER_BOUND] !== "number" || typeof d[HistCols.COUNTS] !== "number") {
          console.error("Skipping row with missing bounds or counts:", d);
          continue;
        }

        // Every line needs to be told its category for each categorical axis in use.
        // A missing column for the location dimension implies 'global' category
        const xCat = appStore.xCategoricalAxis
          ? d[appStore.xCategoricalAxis] as string ?? LocResolutions.GLOBAL
          : undefined;
        const yCat = appStore.yCategoricalAxis
          ? d[appStore.yCategoricalAxis] as string ?? LocResolutions.GLOBAL
          : undefined;
        const withinBandCat = appStore.withinBandAxis
          ? d[appStore.withinBandAxis] as string ?? LocResolutions.GLOBAL
          : undefined;

        if (i > 0) {
          const prevRowXCat = appStore.xCategoricalAxis
            ? data[i - 1] ?.[appStore.xCategoricalAxis] as string ?? LocResolutions.GLOBAL
            : undefined;
          const prevRowYCat = appStore.yCategoricalAxis
            ? data[i - 1] ?.[appStore.yCategoricalAxis] as string ?? LocResolutions.GLOBAL
            : undefined;
          const prevRowwithinBandCat = appStore.withinBandAxis
            ? data[i - 1] ?.[appStore.withinBandAxis] as string ?? LocResolutions.GLOBAL
            : undefined;

          if (xCat === prevRowXCat && yCat === prevRowYCat && withinBandCat === prevRowwithinBandCat) {
            if ((d[HistCols.LOWER_BOUND] as number) < (data[i - 1]![HistCols.LOWER_BOUND] as number)) {
              console.warn("Histogram data not sorted by lower bounds; this may cause rendering issues.", d, data[i - 1]);
              throw new Error("Histogram data not sorted by lower bounds");
            }

            if ((d[HistCols.LOWER_BOUND] as number) < (data[i - 1]![HistCols.UPPER_BOUND] as number)) {
              console.warn("Histogram data overlaps; this may cause rendering issues, and also suggests you are trying to do something strange (e.g. combine many diseases into one line).")
              console.warn("this lower", d[HistCols.LOWER_BOUND] as number, "prev upper", data[i - 1]![HistCols.UPPER_BOUND] as number);
              if (Math.abs((data[i - 1]![HistCols.UPPER_BOUND] as number) - (d[HistCols.LOWER_BOUND] as number)) > 0.1) {
                console.warn(`Overlap is significant (${Math.abs((data[i - 1]![HistCols.UPPER_BOUND] as number) - (d[HistCols.LOWER_BOUND] as number))}), throwing error to avoid misleading rendering.`);
                throw new Error("Histogram data overlaps significantly");
              }
              // console.warn(d, data[i - 1]);
              // Setting lower bound to previous upper bound:
              // d[HistCols.LOWER_BOUND] = data[i - 1]![HistCols.UPPER_BOUND] as number;
              // continue;
            }
          }
        }

        const lowerBound = d[HistCols.LOWER_BOUND];
        const upperBound = d[HistCols.UPPER_BOUND];

        const histogramTopLeftPoint = { x: lowerBound, y: d[HistCols.COUNTS] };
        const histogramTopRightPoint = { x: upperBound, y: d[HistCols.COUNTS] };

        // A point at y=0 to close off the histogram bar, in case it ends up being the last bar in the line or there is a data gap until the next bar
        const closeOffPoint = { x: upperBound, y: 0 };
        
        // We need to plot at most one line for each of the combinations of dimensions in use.
        const line = lines.find(({ bands, metadata }: Lines<LineMetadata>[0]) => {
          return bands?.x === xCat && bands?.y === yCat && metadata?.withinBandAxisValue === withinBandCat
        });
        
        if (!line) {
          // The line does not already exist, so create it.

          // TODO: persist color on changing the axes etc, where applicable.
          const bands = {
            ...(xCat ? { x: xCat } : {}),
            ...(yCat ? { y: yCat } : {}),
          };
          lines.push({
            points: [
              { x: lowerBound, y: 0 },
              histogramTopLeftPoint,
              histogramTopRightPoint,
              closeOffPoint,
            ],
            bands,
            style: {
              strokeWidth: 0.5,
              opacity: 1,
              fillOpacity: 0.3,
            },
            metadata: withinBandCat ? { withinBandAxisValue: withinBandCat } : undefined,
            fill: true,
          });

          if (xCat) {
            xCategories.value.add(xCat);
          }
          if (yCat) {
            yCategories.value.add(yCat);
          }
        } else {
          // Append points to existing line
          const previousPoint = line.points[line.points.length - 1];
          if (previousPoint && previousPoint.x === lowerBound) { // to cope with overlapping histogram bars use >= instead of ===
            // If the last bar's upper bound is the same as this bar's lower bound,
            // we can remove the previous close-off point, as we are continuing the line directly from the previous bar to this bar.
            line.points.pop();
          } else if (previousPoint) {
            line.points.push({ x: Math.max(lowerBound, previousPoint.x), y: 0 });
          }
          line.points.push(histogramTopLeftPoint, histogramTopRightPoint, closeOffPoint);
        }
      }

      let outOfOrderPoints = 0;

      lines.forEach(l => l.points.forEach((p, i) => {
        if (i > 0 && p.x < l.points[i - 1]!.x) {
          outOfOrderPoints++;
        }
      }));
      console.log("outOfOrderPoints", outOfOrderPoints);

      linesRef.value = lines;
    });
  });
};

const filteredLines = computed(() => {
  return linesRef.value.filter((line) => {
    let [xMatch, yMatch, withinBandMatch] = [true, true, true];
    if (appStore.xCategoricalAxis) {
      const xCat = line.bands?.x;
      switch (appStore.xCategoricalAxis) {
        case Dimensions.LOCATION:
          xMatch = !appStore.locationFilter.length || (!!xCat && appStore.locationFilter.includes(xCat))
          break;
        case Dimensions.DISEASE:
          xMatch = !appStore.diseaseFilter.length || (!!xCat && appStore.diseaseFilter.includes(xCat))
      }
    }
    if (appStore.yCategoricalAxis) {
      const yCat = line.bands?.y;
      switch (appStore.yCategoricalAxis) {
        case Dimensions.LOCATION:
          yMatch = !appStore.locationFilter.length || (!!yCat && appStore.locationFilter.includes(yCat))
          break;
        case Dimensions.DISEASE:
          yMatch = !appStore.diseaseFilter.length || (!!yCat && appStore.diseaseFilter.includes(yCat))
      }

    }
    if (appStore.withinBandAxis) {
      const withinBandCat = line.metadata?.withinBandAxisValue;
      switch (appStore.withinBandAxis) {
        case Dimensions.LOCATION:
          withinBandMatch = !appStore.locationFilter.length || (!!withinBandCat && appStore.locationFilter.includes(withinBandCat))
          break;
        case Dimensions.DISEASE:
          withinBandMatch = !appStore.diseaseFilter.length || (!!withinBandCat && appStore.diseaseFilter.includes(withinBandCat))
      }
    }
    return xMatch && yMatch && withinBandMatch;
  });
});

const colorAxis = computed(() => {  
  const everyLineHasDifferentYCategory = filteredLines.value.map(l => l.bands?.y).filter(c => !!c).every((c, i, arr) => {
    return arr.findIndex((val) => val === c) === i;
  });
  
  if (appStore.xCategoricalAxis) {
    return appStore.xCategoricalAxis;
  } else if (!everyLineHasDifferentYCategory) {
    // If some lines have the same y-category, this implies they share a row and should be distinguishable by color.
    return appStore.withinBandAxis;
  } else {
    return appStore.yCategoricalAxis;
  };
});

const getColorAxisValueForLine = (line: LineConfig<LineMetadata>) => {
  switch (colorAxis.value) {
    case appStore.xCategoricalAxis:
      return line.bands?.x;
    case appStore.yCategoricalAxis:
      return line.bands?.y;
    case appStore.withinBandAxis:
      return line.metadata?.withinBandAxisValue;
  }
};

const colorsByCategory = computed(() => {
  const valueColors = new Map<string, string>();
  filteredLines.value.forEach((l) => {
    const axisVal = getColorAxisValueForLine(l);
    if (!axisVal) { return; }
    if (!valueColors.has(axisVal)) {
      const color = colors[valueColors.size % colors.length] as string;
      valueColors.set(axisVal, color);
    }
  });
  return valueColors;
})

const colorsForKey = computed(() => {
  const colorsByCat = Array.from(colorsByCategory.value).filter(([, color]) => !!color).map(([cat, color]) => {
    if (colorAxis.value === Dimensions.LOCATION && getCountryName(cat)) {
      return [getCountryName(cat) ?? cat, color];
    }
    return [cat, color];
  });
  if (![appStore.xCategoricalAxis, appStore.yCategoricalAxis].includes(colorAxis.value)) {
    return colorsByCat;
  }
  const ranking = colorAxis.value === appStore.xCategoricalAxis ? xAxisRanking : yAxisRanking;
  return colorsByCat.sort(([a], [b]) => {
    return ranking.value.indexOf(b as string) - ranking.value.indexOf(a as string);
  });
});

const filteredLinesWithColors = computed(() => {
  const lines = filteredLines.value;
  lines.forEach((l) => {
    const axisVal = getColorAxisValueForLine(l);
    if (!axisVal) { return; }
    const color = colorsByCategory.value.get(axisVal);
    l.style.strokeColor = color;
    l.style.fillColor = color;
  })
  return lines;
});

// TODO: I think the reason the ranking looks wrong may lie in the provided data rather than a bug here.
// E.g. if you compare values in `hist_counts_deaths_disease.csv` with equivalents in the log version
// of the same data file, `hist_counts_deaths_disease_log.csv`, the values bear no relation to each other.
// For example, the range of values for Typhoid in the log data is 10^-1.518 to 10^-0.3016
// (about 0.03 to 0.5), whereas in the non-log data it's 0.3 to 4.17. Thirdly, compare those against the mean value
// provided by `summary_table_deaths_disease.csv`, which is about 0.7: this means it's more likely the log data
// is wrong than the non-log.

const yAxisRanking = computed(() => {
  if (!appStore.yCategoricalAxis) {
    return [];
  }

// We want to have some vaguely sensible *ranking* of the y-categorical axis (i.e. plot-rows).
// We do this by taking the mean of the mean values for each category in the summary table data,
// excepting categories that have been filtered out.
  const meansByYCategory: Record<string, number[]> = {};
  for (let i = 0; i < summaryTablesData.value.length; i++) {
    const row = summaryTablesData.value[i]!;
    let yCat = row[appStore.yCategoricalAxis];
    if (!yCat && appStore.yCategoricalAxis === Dimensions.LOCATION) {
      yCat = "global";
    }
    if (meansByYCategory[yCat] === undefined) {
      meansByYCategory[yCat] = [];
    }
    if ((appStore.yCategoricalAxis === Dimensions.DISEASE && (appStore.diseaseFilter.includes(yCat) || appStore.diseaseFilter.length === 0))
    || (appStore.yCategoricalAxis === Dimensions.LOCATION && (appStore.locationFilter.includes(yCat) || appStore.locationFilter.length === 0))) {
      console.log(row.disease, row.mean_value)
      meansByYCategory[yCat]?.push(row.mean_value);
    }
  }
  const meansOfMeans = Object.fromEntries(
    Object.entries(meansByYCategory).map(([cat, rows]) => {
      const meanOfMeans = rows.reduce((a, b) => a + b, 0) / rows.length;
      return [cat, meanOfMeans];
    })
  );
  return Object.entries(meansOfMeans).sort((a, b) => a[1] - b[1]).map(([cat]) => cat);
});

const categoricalScales = computed(() => {
  const xCategoricalScale = Array.from(xCategories.value).filter((cat) => {
    return filteredLinesWithColors.value.map(l => l.bands?.x).includes(cat);
  }).sort((a, b) => {
    return xAxisRanking.value.indexOf(a) - xAxisRanking.value.indexOf(b);
  });

  const yCategoricalScale = Array.from(yCategories.value).filter((cat) => {
    return filteredLinesWithColors.value.map(l => l.bands?.y).includes(cat);
  }).sort((a, b) => {
    return yAxisRanking.value.indexOf(a) - yAxisRanking.value.indexOf(b);
  });

  const categoricalScales = {
    ...(xCategoricalScale.length ? { x: xCategoricalScale } : {}),
    ...(yCategoricalScale.length ? { y: yCategoricalScale } : {}),
  };
  return categoricalScales;
});

const createChart = () => {
  if (!chartContainer.value || filteredLinesWithColors.value.length === 0) {
    return;
  }
  const minX = Math.min(...filteredLinesWithColors.value.flatMap(l => l.points![0]?.x ?? 0));
  const maxX = Math.max(...filteredLinesWithColors.value.flatMap(l => l.points[l.points.length - 1]!.x));
  const maxY = Math.max(...filteredLinesWithColors.value.flatMap(l => Math.max(...l.points.map(p => p.y))));

  const scales = { x: { start: appStore.useLogScale ? minX : 0, end: maxX }, y: { start: 0, end: maxY } };

  const chart = new Chart()
    .addAxes({ x: "Impact ratio", y: titleCase(appStore.yCategoricalAxis) })
    .addTraces(filteredLinesWithColors.value)
    .addArea()
    .addGridLines()
    .makeResponsive()

  if (Object.values(categoricalScales.value).length <= 1) {
    chart.addZoom();
  }

  chart.appendTo(chartContainer.value, scales, {}, categoricalScales.value);

  // NB this is a hack, that DOES NOT WORK if the chart is responsive and resized, nor if it's zoomed.
  // It also doesn't work when we add a categorical x axis.
  const interval = setInterval(() => {
    const plot = document.getElementById("chartContainer")?.getElementsByTagName("svg")[0];
    if (plot) {
      const xAxis = Array.from(plot.children).filter(c => c.tagName === "g")[1];
      if (xAxis) {
        if (appStore.useLogScale && !appStore.xCategoricalAxis) {
          Array.from(xAxis.getElementsByClassName("tick")).forEach((tick) => {
            const textElem = tick.getElementsByTagName("text")[0];
            if (textElem) {
              textElem.style.fontSize = "1rem";
              textElem.innerHTML = `10<tspan dy="-0.5rem" style="font-size: smaller; position: relative; top: 10px;"> ${textElem.textContent}</tspan>`;
            }
          });
        }
        clearInterval(interval);
      }
    }
  }, 100);

  setTimeout(() => {
    clearInterval(interval); // Ensure the interval stops after 2 seconds
  }, 2000);
}

watch([filteredLinesWithColors, chartContainer], createChart);

watch(histDataPaths, debounce(doLoadData, 25));

onMounted(async () => {
  if (!chartContainer.value) {
    return;
  }

  doLoadData();
});
</script>

