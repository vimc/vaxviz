<template>
  <p>CSV file paths</p>
  <ul>
    <li v-for="path in histDataPaths" :key="path">{{ path }}</li>
  </ul>
  <h1>Area</h1>
  <div class="chart" ref="chartContainer" id="chartContainer"></div>
</template>

<style>
.chart {
  width: 1000px;
  height: 500px;
}

.chart-responsive {
  width: 60vw;
  height: 55vh;
}
</style>

<script setup lang="ts">
import { PointWithMetadata, ScatterPoints, Point } from "@/reside-ic/skadi-chart/types";
import { Chart, Lines, Scales } from "@reside-ic/skadi-chart";
import { computed, onMounted, ref, watch } from "vue";

enum BurdenMetrics {
  DALYS = "dalys",
  DEATHS = "deaths"
}
enum Scales {
  LOG = "log",
  LINEAR = "linear"
}

enum LocResolutions {
  GLOBAL = "global",
  SUBREGION = "subregion",
  COUNTRY = "country",
}

// Dimensions are ways of data slicing that can be assigned to categorical or colour axes; each will have a filter.
enum Dimensions {
  LOCATION = "location",
  DISEASE = "disease",
  ACTIVITY_TYPE = "activity_type",
}

const overlapOfYCategoricalAxis = ref(3);
const scale = ref(Scales.LOG);
const burdenMetric = ref(BurdenMetrics.DALYS);
const yCategoricalAxis = ref<Dimensions>(Dimensions.LOCATION);
const xCategoricalAxis = ref<Dimensions | null>(null);
const colorAxis = ref<Dimensions | null>(Dimensions.DISEASE);
const dimensionsInUse = computed(() => [yCategoricalAxis.value, xCategoricalAxis.value, colorAxis.value].filter(d => !!d));

const maxGeographicalResolution = ref<LocResolutions>(LocResolutions.SUBREGION);
// This will ultimately be replaced by a 'meta-filter' UI control that populates the location filter with locations
// in any combination of geographical resolutions. For now we will just infer it from a 'maxGeographicalResolution'.
const geographicalResolutionsInUse = computed(() => {
  switch (maxGeographicalResolution.value) {
    case LocResolutions.COUNTRY:
      return [LocResolutions.COUNTRY, LocResolutions.SUBREGION, LocResolutions.GLOBAL];
    case LocResolutions.SUBREGION:
      return [LocResolutions.SUBREGION, LocResolutions.GLOBAL];
    default:
      return [LocResolutions.GLOBAL];
  }
});
const dataDir = "/data/20251028-145142-d415bc78/json"
const histDataPaths = computed(() => {
  // When we are using multiple geographical resolutions, we need to load multiple data files, to be merged together later.
  const geogs = geographicalResolutionsInUse.value;
  if (geogs.length === 0) {
    geogs.push(LocResolutions.GLOBAL);
  }
  return geogs.map((geog) => {
    const fileNameParts = ["hist_counts", burdenMetric.value, "disease"];
    if (dimensionsInUse.value.includes(Dimensions.LOCATION) && geog === LocResolutions.SUBREGION) {
      fileNameParts.push(LocResolutions.SUBREGION);
    }
    if (dimensionsInUse.value.includes(Dimensions.ACTIVITY_TYPE)) {
      fileNameParts.push(Dimensions.ACTIVITY_TYPE);
    }
    if (dimensionsInUse.value.includes(Dimensions.LOCATION) && geog === LocResolutions.COUNTRY) {
      fileNameParts.push(LocResolutions.COUNTRY);
    }
    if (scale.value === Scales.LOG) {
      fileNameParts.push("log");
    }
    return `${dataDir}/${fileNameParts.join("_")}.json`
    // NB files containing 'global' data simply omit location from the file name (as they have no location stratification).
  });
});

const summaryTableDataPaths = computed(() => {
  // Similar logic to histDataPaths, but we need to exclude stratification by the color axis,
  // since we are using these summary tables to sort the categorical axes' categories.
  // Thus we are only interested in getting the tables stratified by the categorical axes' dimensions.
  const geogs = geographicalResolutionsInUse.value;
  if (geogs.length === 0) {
    geogs.push(LocResolutions.GLOBAL);
  }
  return geogs.map((geog) => {
    const fileNameParts = ["summary_table", burdenMetric.value, "disease"];
    const categoricalAxesDimensions = [yCategoricalAxis.value, xCategoricalAxis.value].filter(d => !!d);
    if (categoricalAxesDimensions.includes(Dimensions.LOCATION) && geog === LocResolutions.SUBREGION) {
      fileNameParts.push(LocResolutions.SUBREGION);
    }
    if (categoricalAxesDimensions.includes(Dimensions.ACTIVITY_TYPE)) {
      fileNameParts.push(Dimensions.ACTIVITY_TYPE);
    }
    if (categoricalAxesDimensions.includes(Dimensions.LOCATION) && geog === LocResolutions.COUNTRY) {
      fileNameParts.push(LocResolutions.COUNTRY);
    }
    return `${dataDir}/${fileNameParts.join("_")}.json`
    // NB files containing 'global' data simply omit location from the file name (as they have no location stratification).
  });
})

type DataRow = Record<string, string | number>;

// TODO: cacheing of JSON processing?

// Fetch and parse JSONs
const loadData = async (paths: string[]) => {
  const allData: DataRow[] = [];
  // Merge together all data from multiple JSONs (collapsing all location columns into one)
  await Promise.all(paths.map(async (path) => {
    const response = await fetch(path);
    const rows = await response.json();
    for (const row of rows) {
      // Collapse all location columns into one 'location' column
      if (row[LocResolutions.COUNTRY]) {
        row[Dimensions.LOCATION] = row[LocResolutions.COUNTRY];
        delete row[LocResolutions.COUNTRY];
      } else if (row[LocResolutions.SUBREGION]) {
        row[Dimensions.LOCATION] = row[LocResolutions.SUBREGION];
        delete row[LocResolutions.SUBREGION];
      }
      allData.push(row);
    }
  }));

  // Sort all rows
  allData.sort((a, b) => {
    if (a["lower_bound"]! < b["lower_bound"]!) {
      return -1;
    } else {
      return 1;
    }
  });

  return allData;
}












const chartContainer = ref<HTMLDivElement | null>(null);

// const pointPropsBasic = {
//   n: 1000,
//   ampScaling: 1e6,
//   opacityRange: 0.5,
//   opacityOffset: 0.5,
//   radiusRange: 2,
//   radiusOffset: 0.5,
// }
// const propsBasic = {
//   nX: 1000,
//   nL: 10,
//   ampScaling: 1e6,
//   freqRange: 0.1,
//   freqOffset: 0.95,
//   phaseRange: 0.5,
//   phaseOffset: 0.25,
//   opacityRange: 0.2,
//   opacityOffset: 0.8,
//   strokeWidthRange: 0.1,
//   strokeWidthOffset: 0.9,
// }

// rainbow
const colors = [ "#e81416", "#ffa500", "#faeb36", "#79c314", "#487de7", "#4b369d", "#70369d" ];

// const randomIndex = (length: number) => {
//   return Math.floor(Math.random() * length);
// };

// type Metadata = { color: string }

// const makeRandomPoints = (props: typeof pointPropsBasic) => {
//   const xPoints = Array.from({length: props.n + 1}, () => Math.random());
//   const points: ScatterPoints<Metadata> = [];
//   const y = () => {
//     const rand = (Math.random() - 0.5) * 2;
//     const e = rand * rand * rand;
//     return Math.atan(1/e) * props.ampScaling;
//   };

//   for (let i = 0; i < props.n; i++) {
//     const color = colors[randomIndex(colors.length)];
//     const scatterPoint: ScatterPoints<Metadata>[number] = {
//       x: xPoints[i], y: y(),
//       style: {
//         radius: Math.random() * props.radiusRange + props.radiusOffset,
//         color,
//         opacity: Math.random() * props.opacityRange + props.opacityOffset
//       },
//       metadata: { color }
//     };
//     points.push(scatterPoint);
//   }
//   return points;
// };

// const makeRandomPointsForCategoricalAxis = (domain: string[], axis: "x" | "y"): ScatterPoints<Metadata> => {
//   return makeRandomPoints(pointPropsBasic).map((point, index) => {
//     const band = domain[index % domain.length];
//     const color = colors[index % domain.length];
//     return {
//       ...point,
//       bands: { [axis]: band },
//       style: { ...point.style, color },
//       metadata: { ...point.metadata, color }
//     }
//   });
// };

// const makeRandomCurves = (props: typeof propsBasic) => {
//   const xPoints = Array.from({length: props.nX + 1}, (_, i) => i / props.nX);
//   const lines: Lines<Metadata> = [];
//   const makeYFunc = () => {
//     const amp1 = Math.random();
//     const amp2 = Math.random();
//     const amp3 = Math.random();
//     const amp4 = Math.random();
//     const freq1 = Math.random() * props.freqRange + props.freqOffset;
//     const freq2 = Math.random() * props.freqRange + props.freqOffset;
//     const freq3 = Math.random() * props.freqRange + props.freqOffset;
//     const freq4 = Math.random() * props.freqRange + props.freqOffset;
//     const phase1 = Math.random() * props.phaseRange + props.phaseOffset;
//     const phase2 = Math.random() * props.phaseRange + props.phaseOffset;
//     const phase3 = Math.random() * props.phaseRange + props.phaseOffset;
//     const phase4 = Math.random() * props.phaseRange + props.phaseOffset;
//     return (x: number) => {
//       return amp1 * Math.sin(freq1 * 53 * x + phase1)
//         + amp2 * Math.cos(freq2 * 31 * x + phase2)
//         + amp3 * Math.sin(freq3 * 26 * x + phase3)
//         + amp4 * Math.cos(freq4 * 67 * x + phase4)
//     };
//   };

//   for (let l = 0; l < props.nL; l++) {
//     const color = colors[randomIndex(colors.length)];
//     const line: Lines<Metadata>[number] = {
//       points: [],
//       style: {
//         opacity: Math.random() * props.opacityRange + props.opacityOffset,
//         strokeColor: color,
//         strokeWidth: Math.random() * 1
//       },
//       metadata: { color }
//     };
//     const yfunc = makeYFunc();
//     for (let i = 0; i < props.nX + 1; i++) {
//       line.points.push({ x: xPoints[i], y: yfunc(xPoints[i]) * props.ampScaling });
//     }
//     lines.push(line);
//   }
//   return lines;
// };

// const makeRandomCurvesForCategoricalAxis = (domain: string[], axis: "x" | "y"): Lines<Metadata> => {
//   return makeRandomCurves(propsBasic).map((line, index) => {
//     const band = domain[index % domain.length];
//     const color = colors[index % domain.length];

//     return {
//       ...line,
//       points: line.points.map((p, i) => {
//         let y = p.y;
//         // Make one line be an increasing line in the positive part of the band, to ensure that the positive part
//         // is on the right side of 0, and so are the axis ticks, and that the scale increases in the expected direction.
//         if (index === 0) { y = 1e3 * i; }
//         // Make another line near 0 to check that the scale/ticks are in the right place.
//         else if (index === 1) { y = 1; }
//         return { ...p, y };
//       }),
//       bands: { [axis]: band },
//       style: { ...line.style, strokeColor: color },
//       metadata: { ...line.metadata, color }
//     }
//   })
// };

// const tooltipHtmlCallback = (point: PointWithMetadata<Metadata>) => {
//   return `<div style="color: ${point.metadata?.color || "black"};">X: ${point.x.toFixed(3)}, Y: ${point.y.toFixed(3)}`
//     + (point.bands?.x ? `<br/>Band X: ${point.bands?.x}` : ``)
//     + (point.bands?.y ? `<br/>Band Y: ${point.bands?.y}` : ``)
//     + `</div>`
// };

// const categoricalYAxis = ["A", "B", "C", "D", "E"];
// const categoricalXAxis = ["Left", "Right"];
// const chartCategoricalYAxis = ref<HTMLDivElement | null>(null);
// const chartCategoricalXAxis = ref<HTMLDivElement | null>(null);
// const curvesAxesLabelGridZoomAndLogScale = makeRandomCurves(propsBasic);
// curvesAxesLabelGridZoomAndLogScale.forEach(l => l.points.forEach(p => p.x -= 0.5));
// const pointsAxesLabelGridZoomAndLogScale = makeRandomPoints(pointPropsBasic);
// pointsAxesLabelGridZoomAndLogScale.forEach(p => p.x -= 0.5);
// const curvesArea = makeRandomCurves(propsBasic);
// curvesArea.forEach(c => {
//   c.fill = true;
//   c.style.fillColor = c.style.strokeColor;
//   c.style.fillOpacity = (c.style.opacity || 1) / 10;
// });
// const curvesCategoricalXAxis = makeRandomCurvesForCategoricalAxis(categoricalXAxis, "x");
// const curvesCategoricalYAxis = makeRandomCurvesForCategoricalAxis(categoricalYAxis, "y");
// const pointsCategoricalXAxis = makeRandomPointsForCategoricalAxis(categoricalXAxis, "x");
// const pointsCategoricalYAxis = makeRandomPointsForCategoricalAxis(categoricalYAxis, "y");

// const scales: Scales = { x: {start: 0, end: 1}, y: {start: -3e6, end: 3e6} };

// const categoricalYAxisLogScaleX = ref<boolean>(false);
// const categoricalYAxisLogScaleY = ref<boolean>(false);

// const drawChartCategoricalYAxis = () => {
//   new Chart({ logScale: { x: categoricalYAxisLogScaleX.value, y: categoricalYAxisLogScaleY.value }})
//     .addAxes({ x: "Time", y: "Category" })
//     .addTraces(curvesCategoricalYAxis)
//     .addScatterPoints(pointsCategoricalYAxis)
//     .addZoom()
//     .addTooltips(tooltipHtmlCallback)
//     .appendTo(chartCategoricalYAxis.value!, scales, {}, { y: categoricalYAxis });
// };

// watch([categoricalYAxisLogScaleX, categoricalYAxisLogScaleY], () => {
//   drawChartCategoricalYAxis();
// });

// const categoricalXAxisLogScaleX = ref<boolean>(false);
// const categoricalXAxisLogScaleY = ref<boolean>(false);

// const drawChartCategoricalXAxis = () => {
//   new Chart({ logScale: { x: categoricalXAxisLogScaleX.value, y: categoricalXAxisLogScaleY.value }})
//     .addAxes({ x: "Category", y: "Value" })
//     .addTraces(curvesCategoricalXAxis)
//     .addScatterPoints(pointsCategoricalXAxis)
//     .addZoom()
//     .addTooltips(tooltipHtmlCallback)
//     .appendTo(chartCategoricalXAxis.value!, scales, {}, { x: categoricalXAxis });
// };

// watch([categoricalXAxisLogScaleX, categoricalXAxisLogScaleY], () => {
//   drawChartCategoricalXAxis();
// });

type Metadata = {
  colorAxisValue: string;
};

enum HistCols {
  LOWER_BOUND = "lower_bound",
  UPPER_BOUND = "upper_bound",
  COUNTS = "Counts",
}

onMounted(async () => {
  if (!chartContainer.value) {
    console.log("No chart container");
    return;
  }
  console.log("Yes chart container");

  loadData(summaryTableDataPaths.value).then(summaryTablesData => {
    console.log("Loaded summary table data rows:", summaryTablesData.length);

    // We want to have some vaguely sensible ordering of the categorical axes (e.g. plot-rows).
    // NB 'the mean of the medians' is not the same as the overall median,
    // but this is sufficient for our purpose of ordering the categories.
    // TODO: Check that this really is sufficient! Alternatively we can ask for true medians to be calculated. 

    const rowsByYAxis: Record<string, number[]> = {};
    const rowsByXAxis: Record<string, number[]> = {};

    // TODO: Don't dynamically sort the activity type as it only has two values and we want a consistent order.

    // Iterate all rows and collect together medians by x/y category.
    // - For a y-axis of disease, if the x-axis is location and 'activity type' is the colour axis,
    //   collect rows by disease (y-axis), one row for each location, but do not stratify by activity type.
    // - For the x-axis in that same scenario,
    //   collect rows by location (x-axis), one row for each disease, but do not stratify by activity type.
    // - For a y-axis of location, if the x-axis is disease and 'activity type' is the colour axis,
    //   collect rows by location (y-axis), one row for each disease, but do not stratify by activity type.
    // - For the x-axis in that same scenario,
    //   collect rows by disease (x-axis), one row for each location, but do not stratify by activity type.
    // - For a y-axis of activity type, 
    // TODO: this iteration should skip out rows that are filtered out.
    for (let i = 0; i < summaryTablesData.length; i++) {
      const d = summaryTablesData[i]!;

      if (xCategoricalAxis.value && xCategoricalAxis.value !== Dimensions.ACTIVITY_TYPE) {
        let xCat = d[xCategoricalAxis.value];
        if (!xCat && xCategoricalAxis.value === Dimensions.LOCATION) {
          xCat = "global";
        }
        if (xCat) {
          if (rowsByXAxis[xCat] === undefined) {
            rowsByXAxis[xCat] = [];
          }
          rowsByXAxis[xCat] = [d["median_value"] as number];
        }
      }
      if (yCategoricalAxis.value && yCategoricalAxis.value !== Dimensions.ACTIVITY_TYPE) {
        let yCat = d[yCategoricalAxis.value];
        if (!yCat && yCategoricalAxis.value === Dimensions.LOCATION) {
          yCat = "global";
        }
        if (yCat) {
          if (rowsByYAxis[yCat] === undefined) {
            rowsByYAxis[yCat] = [];
          }
          rowsByYAxis[yCat] = [d["median_value"] as number];
        }
      }
    }
    const meanMedianByXAxis = Object.fromEntries(
      Object.entries(rowsByXAxis).map(([cat, rows]) => {
        const meanMedian = rows.reduce((a, b) => a + b, 0) / rows.length;
        return [cat, meanMedian];
      })
    );
    const xAxisRanking = xCategoricalAxis.value === Dimensions.ACTIVITY_TYPE
      ? ["routine", "campaign"]
      : Object.entries(meanMedianByXAxis).sort((a, b) => b[1] - a[1]).map(([cat, _]) => cat);
    const meanMedianByYAxis = Object.fromEntries(
      Object.entries(rowsByYAxis).map(([cat, rows]) => {
        const meanMedian = rows.reduce((a, b) => a + b, 0) / rows.length;
        return [cat, meanMedian];
      })
    );
    const yAxisRanking = yCategoricalAxis.value === Dimensions.ACTIVITY_TYPE
      ? ["routine", "campaign"]
      : Object.entries(meanMedianByYAxis).sort((a, b) => b[1] - a[1]).map(([cat, _]) => cat);

    return [xAxisRanking, yAxisRanking];
  }).then(([xAxisRanking, yAxisRanking]) => {
    loadData(histDataPaths.value).then(data => {
      console.log("Loaded data rows:", data.length);

      const lines: Lines<Metadata> = [];
      for (let i = 0; i < data.length; i++) {
        const d = data[i]!;

        if (typeof d[HistCols.LOWER_BOUND] !== "number" || typeof d[HistCols.UPPER_BOUND] !== "number" || typeof d[HistCols.COUNTS] !== "number") {
          console.error("Skipping row with missing bounds or counts:", d);
          continue;
        }

        if (i > 0 && (d[HistCols.LOWER_BOUND] as number) < (data[i - 1]![HistCols.LOWER_BOUND] as number)) {
          console.warn("Histogram data not sorted by lower bounds; this may cause rendering issues.", d, data[i - 1]);
          continue;
        }

        let histoOverlap = false;
        if (i > 0 && (d[HistCols.LOWER_BOUND] as number) < (data[i - 1]![HistCols.UPPER_BOUND] as number)) {
          histoOverlap = true;
          // console.warn("Histogram data overlaps; this may cause rendering issues.", d, data[i - 1]);
          continue;
        }

        const lowerBound = scale.value === Scales.LINEAR
          ? d[HistCols.LOWER_BOUND]
          : Math.pow(10, d[HistCols.LOWER_BOUND] as number);
        const upperBound = scale.value === Scales.LINEAR
          ? d[HistCols.UPPER_BOUND]
          : Math.pow(10, d[HistCols.UPPER_BOUND] as number);

        const pointsAtTopOfHistogramBar = [
          { x: lowerBound, y: d[HistCols.COUNTS] },
          { x: upperBound, y: d[HistCols.COUNTS] }
        ]

        // A point at y=0 to close off the histogram bar, in case it ends up being the last bar in the line or there is a data gap until the next bar
        const closeOffPoint = { x: upperBound, y: 0 };

        // A missing column for the location dimension implies 'global' category
        const xCat = xCategoricalAxis.value
          ? d[xCategoricalAxis.value] ?? LocResolutions.GLOBAL
          : undefined;
        const yCat = yCategoricalAxis.value
          ? d[yCategoricalAxis.value] ?? LocResolutions.GLOBAL
          : undefined;
        const colorCat = colorAxis.value
          ? d[colorAxis.value] ?? LocResolutions.GLOBAL
          : undefined;
        
        // We need to plot one line for each of the combinations of dimensions in use.
        const line = lines.find(({ bands, metadata }: Lines<Metadata>[0]) => bands.x === xCat && bands.y === yCat && metadata.colorAxisValue === colorCat);
        
        if (!line) {
          // The line does not already exist, so create it.

          const color = colorAxis.value
            ? lines.find(l => l.metadata.colorAxisValue === colorCat)?.style.fillColor ?? colors[lines.length % colors.length]
            : colors[lines.length % colors.length];
          const bands = {
            ...(xCat ? { x: xCat } : {}),
            ...(yCat ? { y: yCat } : {}),
          };
          lines.push({
            points: [
              { x: lowerBound, y: 0 },
              pointsAtTopOfHistogramBar[0],
              pointsAtTopOfHistogramBar[1],
              closeOffPoint,
            ],
            bands,
            style: {
              strokeColor: color,
              strokeWidth: 0.5,
              opacity: 0.5,
              fillColor: color,
            },
            metadata: {
              colorAxisValue: colorCat,
            },
            fill: true,
          });
        } else {
          // Append points to existing line
          const previousPoint = line.points[line.points.length - 1];
          if (previousPoint.x >= lowerBound) { // to cope with overlapping histograms use >= instead of ===
            // If the last bar's upper bound is the same as this bar's lower bound,
            // we can remove the previous close-off point, as we are continuing the line directly from the previous bar to this bar.
            line.points.pop();
          } else {
            console.log(Math.max(lowerBound, previousPoint.x), xCat, yCat, colorCat);
            line.points.push({ x: Math.max(lowerBound, previousPoint.x), y: 0 });
          }
          line.points.push(pointsAtTopOfHistogramBar[0], pointsAtTopOfHistogramBar[1], closeOffPoint);
        }
      }



      let outOfOrderPoints = 0;

      lines.forEach(l => l.points.forEach((_p, i) => {
        if (i > 0 && l.points[i].x < l.points[i - 1].x) {
          outOfOrderPoints++;
        }
      }));
      console.log("Created lines:", lines);
      console.log("outOfOrderPoints", outOfOrderPoints);

      const minX = Math.min(...lines.flatMap(l => l.points[0].x));
      const maxX = Math.max(...lines.flatMap(l => l.points.at(-1).x));
      const maxY = Math.max(...lines.flatMap(l => Math.max(...l.points.map(p => p.y))));

      const scales = { x: { start: scale.value === Scales.LINEAR ? 0 : minX, end: maxX }, y: { start: 0, end: maxY / overlapOfYCategoricalAxis.value } };
      console.log("scales", scales)
      const categoricalScales = {
        ...(xAxisRanking?.length ? { x: xAxisRanking } : {}),
        ...(yAxisRanking?.length ? { y: yAxisRanking } : {}),
      };
      console.log("categoricalScales", categoricalScales)

      new Chart({ logScale: { x: scale.value } })
        .addAxes({ x: "Impact ratio", y: yCategoricalAxis.value })
        .addZoom()
        .addTraces(lines)
        .addArea()
        .appendTo(chartContainer.value, scales, {}, categoricalScales);
    });
  });
});
</script>
