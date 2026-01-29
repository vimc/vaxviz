import { describe, it, expect } from "vitest";

import checkIfCsvFileExists from "@/stores/utils/checkIfCsvFileExists";

describe("checkIfCsvFileExists", () => {
  it("does not throw for existing file", () => {
    expect(() => checkIfCsvFileExists("summary_table_deaths_disease.csv")).not.toThrow();
  });

  it("throws for non-existing file", () => {
    expect(() => checkIfCsvFileExists("non_existent_file.csv")).toThrowError(
      'The requested file "non_existent_file.csv" does not exist on the server.'
    );
  });
});
