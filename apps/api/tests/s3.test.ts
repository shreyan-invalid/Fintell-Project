import { getSha256, sanitizeFileName } from "../src/services/s3.js";

describe("s3 service utilities", () => {
  it("sanitizes unsafe filenames", () => {
    expect(sanitizeFileName("Q1 Report (final)#1.csv")).toBe("Q1_Report__final__1.csv");
  });

  it("creates deterministic sha256 checksum", () => {
    const checksum = getSha256(Buffer.from("finintel"));
    expect(checksum).toBe(getSha256(Buffer.from("finintel")));
    expect(checksum).toHaveLength(64);
  });
});
