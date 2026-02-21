import { parseFilters } from "../src/routes/financial.js";

describe("financial route query parsing", () => {
  it("accepts valid filters", () => {
    const parsed = parseFilters({ months: "12", source: "ERP", from: "2025-01-01", to: "2025-12-31" });
    expect(parsed).toEqual({ months: 12, source: "ERP", from: "2025-01-01", to: "2025-12-31" });
  });

  it("drops invalid filters", () => {
    const parsed = parseFilters({ months: "500", source: "UNKNOWN" });
    expect(parsed).toEqual({});
  });
});
