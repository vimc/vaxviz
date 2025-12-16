import { dataDir } from "@/stores/dataStore"
import { http, HttpResponse } from "msw"

const jsonDataFiles = [
  "hist_counts_dalys_disease_activity_type_country_log",
  "hist_counts_dalys_disease_activity_type_country",
  "hist_counts_dalys_disease_activity_type_log",
  "hist_counts_dalys_disease_activity_type",
  "hist_counts_dalys_disease_country_log",
  "hist_counts_dalys_disease_country",
  "hist_counts_dalys_disease_log",
  "hist_counts_dalys_disease_subregion_activity_type_log",
  "hist_counts_dalys_disease_subregion_activity_type",
  "hist_counts_dalys_disease_subregion_log",
  "hist_counts_dalys_disease_subregion",
  "hist_counts_dalys_disease",
  "hist_counts_deaths_disease_activity_type_country_log",
  "hist_counts_deaths_disease_activity_type_country",
  "hist_counts_deaths_disease_activity_type_log",
  "hist_counts_deaths_disease_activity_type",
  "hist_counts_deaths_disease_country_log",
  "hist_counts_deaths_disease_country",
  "hist_counts_deaths_disease_log",
  "hist_counts_deaths_disease_subregion_activity_type_log",
  "hist_counts_deaths_disease_subregion_activity_type",
  "hist_counts_deaths_disease_subregion_log",
  "hist_counts_deaths_disease_subregion",
  "hist_counts_deaths_disease",
  "summary_table_dalys_disease_activity_type_country",
  "summary_table_dalys_disease_activity_type",
  "summary_table_dalys_disease_country",
  "summary_table_dalys_disease_subregion_activity_type",
  "summary_table_dalys_disease_subregion",
  "summary_table_dalys_disease",
  "summary_table_deaths_disease_activity_type_country",
  "summary_table_deaths_disease_activity_type",
  "summary_table_deaths_disease_country",
  "summary_table_deaths_disease_subregion_activity_type",
  "summary_table_deaths_disease_subregion",
  "summary_table_deaths_disease",
]

export const handlers = jsonDataFiles.map((filename) =>
  http.get(`${dataDir}/${filename}.json`, async () => {
    const dataModule = await import(`../../../public/data/json/${filename}.json`);
    const data = dataModule.default;
    return HttpResponse.json(data);
  })
);
