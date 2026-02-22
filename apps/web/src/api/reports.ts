import { api } from "./client";

export type ReportItem = {
  id: string;
  fileName: string;
  s3Key: string;
  uploadedBy: string;
  createdAt: string;
};

type ReportsResponse = {
  reports: ReportItem[];
};

type UploadResponse = {
  s3Key: string;
};

function parseFileName(contentDisposition: string | undefined, fallback: string): string {
  if (!contentDisposition) return fallback;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return fallback;
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return fallback;
}

export async function fetchReports(): Promise<ReportItem[]> {
  const { data } = await api.get<ReportsResponse>("/v1/reports");
  return data.reports ?? [];
}

export async function uploadReportFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadResponse>("/v1/reports/upload", formData);
  return data.s3Key;
}

export async function downloadReportFile(reportId: string, fallbackFileName: string): Promise<void> {
  const response = await api.get<Blob>(`/v1/reports/${reportId}/download`, {
    responseType: "blob"
  });

  const fileName = parseFileName(
    typeof response.headers["content-disposition"] === "string"
      ? response.headers["content-disposition"]
      : undefined,
    fallbackFileName
  );

  const blob = response.data;
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}
