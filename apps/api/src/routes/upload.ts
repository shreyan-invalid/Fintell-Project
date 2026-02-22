import { Router } from "express";
import multer from "multer";
import { readFile } from "node:fs/promises";
import { prisma } from "../db/prisma.js";
import { authorize } from "../middlewares/authorize.js";
import { getS3ReportObject, isLocalStorageKey, toLocalStoragePath, uploadReport } from "../services/s3.js";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
]);

type ServiceErrorLike = {
  name?: string;
  Code?: string;
  code?: string;
};

function isStorageCredentialError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybe = error as ServiceErrorLike;
  return maybe.name === "InvalidAccessKeyId" || maybe.Code === "InvalidAccessKeyId";
}

function isMissingTableError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as ServiceErrorLike).code === "P2021";
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "ENOENT";
}

function isMissingS3ObjectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const maybe = error as ServiceErrorLike;
  return maybe.name === "NoSuchKey" || maybe.Code === "NoSuchKey";
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("Unsupported file type"));
      return;
    }
    cb(null, true);
  }
});

export const uploadRouter = Router();

uploadRouter.get("/", async (_req, res) => {
  const tenantId = res.locals.tenantId as string;

  try {
    const reports = await prisma.reportArchive.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        fileName: true,
        s3Key: true,
        uploadedBy: true,
        createdAt: true
      }
    });

    res.json({
      reports: reports.map((report) => ({
        ...report,
        createdAt: report.createdAt.toISOString()
      }))
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      res.json({ reports: [] });
      return;
    }

    res.status(500).json({ error: "Unable to load report archive" });
  }
});

uploadRouter.get("/:id/download", authorize("OWNER", "CFO", "ANALYST"), async (req, res) => {
  const tenantId = res.locals.tenantId as string;
  const reportId = req.params.id;

  try {
    const report = await prisma.reportArchive.findFirst({
      where: { id: reportId, tenantId },
      select: {
        fileName: true,
        s3Key: true
      }
    });

    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const safeFileName = report.fileName.replace(/["\\]/g, "_");
    res.setHeader("Content-Disposition", `attachment; filename=\"${safeFileName}\"`);

    if (isLocalStorageKey(report.s3Key)) {
      try {
        const filePath = toLocalStoragePath(report.s3Key);
        const fileBuffer = await readFile(filePath);
        res.setHeader("Content-Type", "application/octet-stream");
        res.send(fileBuffer);
        return;
      } catch (error) {
        if (isMissingFileError(error)) {
          res.status(404).json({ error: "Stored file not found" });
          return;
        }
        res.status(500).json({ error: "Unable to read stored file" });
        return;
      }
    }

    try {
      const object = await getS3ReportObject(report.s3Key);
      const body = object.Body as { transformToByteArray?: () => Promise<Uint8Array> } | undefined;

      if (!body?.transformToByteArray) {
        res.status(500).json({ error: "Unable to stream stored file" });
        return;
      }

      const bytes = await body.transformToByteArray();
      if (object.ContentType) {
        res.setHeader("Content-Type", object.ContentType);
      } else {
        res.setHeader("Content-Type", "application/octet-stream");
      }
      res.send(Buffer.from(bytes));
      return;
    } catch (error) {
      if (isStorageCredentialError(error)) {
        res.status(502).json({ error: "File storage is not configured correctly" });
        return;
      }
      if (isMissingS3ObjectError(error)) {
        res.status(404).json({ error: "Stored file not found" });
        return;
      }
      res.status(500).json({ error: "Unable to fetch stored file" });
      return;
    }
  } catch (error) {
    if (isMissingTableError(error)) {
      res.status(503).json({ error: "Database not initialized" });
      return;
    }

    res.status(500).json({ error: "Unable to process download" });
  }
});

uploadRouter.post("/upload", authorize("OWNER", "CFO", "ANALYST"), upload.single("file"), async (req, res) => {
  const tenantId = res.locals.tenantId as string;

  if (!req.file) {
    res.status(400).json({ error: "File is required" });
    return;
  }

  try {
    const uploadedBy = req.user?.sub ?? "system";
    const s3Key = await uploadReport(
      req.file.originalname,
      req.file.mimetype,
      req.file.buffer,
      tenantId,
      uploadedBy
    );

    await prisma.reportArchive.create({
      data: {
        tenantId,
        fileName: req.file.originalname,
        s3Key,
        uploadedBy
      }
    });

    res.status(201).json({ s3Key });
  } catch (error) {
    if (isStorageCredentialError(error)) {
      res.status(502).json({ error: "File storage is not configured correctly" });
      return;
    }

    res.status(500).json({ error: "Unable to upload report" });
  }
});
