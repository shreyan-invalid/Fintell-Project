import { Router } from "express";
import multer from "multer";
import { prisma } from "../db/prisma.js";
import { uploadReport } from "../services/s3.js";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
]);

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

uploadRouter.post("/upload", upload.single("file"), async (req, res) => {
  const tenantId = res.locals.tenantId as string;

  if (!req.file) {
    res.status(400).json({ error: "File is required" });
    return;
  }

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
});
