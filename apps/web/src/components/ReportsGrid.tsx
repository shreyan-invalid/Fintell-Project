import { Alert, Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import type { ColDef, RowClickedEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useRef, useState } from "react";
import { downloadReportFile, type ReportItem, uploadReportFile } from "../api/reports";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

type Props = {
  rows: ReportItem[];
  canUpload: boolean;
  onUploadComplete?: () => Promise<unknown>;
};

const columnDefs: ColDef<ReportItem>[] = [
  { field: "fileName", headerName: "File Name", minWidth: 220, filter: true },
  { field: "uploadedBy", headerName: "Uploaded By", minWidth: 220, filter: true },
  {
    field: "createdAt",
    headerName: "Uploaded At",
    minWidth: 220,
    valueFormatter: (p) => new Date(String(p.value)).toLocaleString()
  },
  { field: "s3Key", headerName: "Storage Key", minWidth: 420, filter: true }
];

export function ReportsGrid({ rows, canUpload, onUploadComplete }: Props) {
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rowData = useMemo(() => rows, [rows]);

  async function handleDownload(): Promise<void> {
    if (!selectedReport) {
      return;
    }

    setError("");
    setInfo("");
    setIsDownloading(true);

    try {
      await downloadReportFile(selectedReport.id, selectedReport.fileName);
    } catch {
      setError("Failed to download report");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleUploadFile(file: File): Promise<void> {
    setError("");
    setInfo("");
    setIsUploading(true);

    try {
      await uploadReportFile(file);
      setInfo("Report uploaded successfully");
      if (onUploadComplete) {
        await onUploadComplete();
      }
    } catch {
      setError("Failed to upload report");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRowClicked(event: RowClickedEvent<ReportItem>): void {
    setSelectedReport(event.data ?? null);
  }

  return (
    <Card sx={{ height: 520 }}>
      <CardContent sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6">Uploaded Reports</Typography>
          <Stack direction="row" spacing={1}>
            {canUpload ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.pdf,.xlsx,.xls,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleUploadFile(file);
                    }
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  disabled={isUploading}
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  {isUploading ? "Uploading..." : "Upload Report"}
                </Button>
              </>
            ) : null}
            <Button
              variant="outlined"
              size="small"
              disabled={!selectedReport || isDownloading}
              onClick={() => {
                void handleDownload();
              }}
            >
              {isDownloading ? "Downloading..." : "Download Selected"}
            </Button>
          </Stack>
        </Stack>

        <div className="ag-theme-quartz" style={{ height: "78%" }}>
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            animateRows
            pagination
            rowSelection="single"
            onRowClicked={handleRowClicked}
          />
        </div>

        <Box sx={{ mt: 1 }}>
          {selectedReport ? (
            <Typography variant="body2" color="text.secondary">
              Selected: {selectedReport.fileName}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Select a row to download the file.
            </Typography>
          )}

          {!canUpload ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Upload is available only for OWNER, CFO, or ANALYST roles.
            </Typography>
          ) : null}

          {info ? <Alert severity="success" sx={{ mt: 1 }}>{info}</Alert> : null}
          {error ? <Alert severity="warning" sx={{ mt: 1 }}>{error}</Alert> : null}
        </Box>
      </CardContent>
    </Card>
  );
}
