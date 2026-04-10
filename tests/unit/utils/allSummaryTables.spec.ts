import { describe, it, expect } from 'vitest';
import { allPossibleSummaryTables } from "@/utils/allSummaryTables";

describe('allSummaryTables utility', () => {
  it('should calculate all possible summary tables', () => {
    expect(allPossibleSummaryTables).toEqual(expect.arrayContaining([
      "summary_table_deaths_disease",
      "summary_table_deaths_disease_activity_type",
      "summary_table_deaths_disease_subregion",
      "summary_table_deaths_disease_subregion_activity_type",
      "summary_table_deaths_disease_country",
      "summary_table_deaths_disease_activity_type_country",
      "summary_table_dalys_disease",
      "summary_table_dalys_disease_activity_type",
      "summary_table_dalys_disease_subregion",
      "summary_table_dalys_disease_subregion_activity_type",
      "summary_table_dalys_disease_country",
      "summary_table_dalys_disease_activity_type_country",
    ]));
    expect(allPossibleSummaryTables.length).toBe(12);
  });
});
