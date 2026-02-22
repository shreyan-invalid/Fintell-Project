import { jest } from "@jest/globals";
import express from "express";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { uploadRouter } from "../src/routes/upload.js";
import { prisma } from "../src/db/prisma.js";

type ReportRecord = {
  id: string;
  fileName: string;
  s3Key: string;
  uploadedBy: string;
  createdAt: Date;
};

type RequestUser = {
  sub: string;
  tenantId?: string;
  role: "OWNER" | "CFO" | "ANALYST" | "VIEWER";
  email?: string;
};

function buildApp(userRole: RequestUser["role"]) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = {
      sub: "user-1",
      tenantId: "tenant-1",
      role: userRole,
      email: "demo@example.com"
    };
    res.locals.tenantId = "tenant-1";
    next();
  });
  app.use("/api/v1/reports", uploadRouter);
  return app;
}

describe("reports routes", () => {
  const reportArchive = prisma.reportArchive as unknown as {
    findMany: (args?: unknown) => Promise<ReportRecord[]>;
    findFirst: (args?: unknown) => Promise<{ fileName: string; s3Key: string } | null>;
  };

  const originalFindMany = reportArchive.findMany;
  const originalFindFirst = reportArchive.findFirst;

  afterEach(() => {
    reportArchive.findMany = originalFindMany;
    reportArchive.findFirst = originalFindFirst;
    jest.restoreAllMocks();
  });

  it("lists report archive rows for current tenant", async () => {
    reportArchive.findMany = jest.fn().mockResolvedValue([
      {
        id: "r1",
        fileName: "sample.csv",
        s3Key: "local://tenant-1/123-sample.csv",
        uploadedBy: "user-1",
        createdAt: new Date("2026-02-22T10:00:00.000Z")
      }
    ]);

    const app = buildApp("ANALYST");
    const res = await request(app).get("/api/v1/reports");

    expect(res.status).toBe(200);
    expect(res.body.reports).toHaveLength(1);
    expect(res.body.reports[0]).toMatchObject({
      id: "r1",
      fileName: "sample.csv",
      uploadedBy: "user-1"
    });
  });

  it("downloads local stored report bytes for authorized role", async () => {
    const localKey = "local://tenant-1/fixture-download.csv";
    const localDir = "/tmp/finintel-uploads/tenant-1";
    const localPath = path.join(localDir, "fixture-download.csv");
    const contents = "revenue,expenses\n100,50\n";

    await mkdir(localDir, { recursive: true });
    await writeFile(localPath, contents, "utf8");

    reportArchive.findFirst = jest.fn().mockResolvedValue({
      fileName: "fixture-download.csv",
      s3Key: localKey
    });

    const app = buildApp("ANALYST");
    const res = await request(app)
      .get("/api/v1/reports/r1/download")
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.toString("utf8")).toBe(contents);
  });

  it("rejects viewer role for download", async () => {
    const app = buildApp("VIEWER");
    const res = await request(app).get("/api/v1/reports/r1/download");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });
});
