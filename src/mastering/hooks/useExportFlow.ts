import { useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import type { ValidationRow } from "@/mastering/types/mastering";
import type { ValidationSummary } from "@/mastering/types/controller";

interface UseExportFlowParams {
  canPlay: boolean;
  loadedFileName: string | null;
  profileName: string;
  masterMode: "safe" | "loud";
  activePreset: string;
  integrated: number;
  shortTerm: number;
  truePeak: number;
  crest: number;
  correlation: number;
  validationRows: ValidationRow[];
  validationFailCount: number;
  validationSummary: ValidationSummary;
  setStatusNote: (text: string) => void;
}

export function useExportFlow({
  canPlay,
  loadedFileName,
  profileName,
  masterMode,
  activePreset,
  integrated,
  shortTerm,
  truePeak,
  crest,
  correlation,
  validationRows,
  validationFailCount,
  validationSummary,
  setStatusNote,
}: UseExportFlowParams) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState("Preparing export...");

  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const handleExportReport = () => {
    const payload = {
      createdAt: new Date().toISOString(),
      profile: profileName,
      masterMode,
      preset: activePreset,
      metrics: {
        integrated: Number(integrated.toFixed(2)),
        shortTerm: Number(shortTerm.toFixed(2)),
        truePeak: Number(truePeak.toFixed(2)),
        crest: Number(crest.toFixed(2)),
        correlation: Number(correlation.toFixed(3)),
      },
      summary: validationSummary,
      rows: validationRows,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "mastering-validation-report.json";
    link.click();
    URL.revokeObjectURL(href);

    setStatusNote("Validation report JSON exported successfully.");
  };

  const proceedExport = async () => {
    setIsExporting(true);
    setExportProgress(8);
    setExportMessage("Preparing the mastering chain...");
    setStatusNote("Rendering export WAV...");

    try {
      await wait(80);
      setExportProgress(24);
      setExportMessage("Rendering the processed audio offline...");

      const blob = await audioEngine.exportProcessedWav();

      setExportProgress(82);
      setExportMessage("Encoding the rendered master as WAV...");
      await wait(120);

      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const sourceName = loadedFileName ?? "mastered-output";
      const baseName = sourceName.replace(/\.[^/.]+$/, "");

      setExportProgress(96);
      setExportMessage("Preparing automatic download...");

      link.href = href;
      link.download = `${baseName}-mastered.wav`;
      link.click();

      URL.revokeObjectURL(href);
      setExportProgress(100);
      setExportMessage("Download is starting...");
      setStatusNote("Export complete. The mastered WAV file has been downloaded.");
      await wait(650);
    } catch (error) {
      setExportProgress(100);
      setExportMessage("Export failed. Please try again.");
      setStatusNote(error instanceof Error ? `Export failed: ${error.message}` : "Export failed. Please try again.");
      await wait(900);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleExport = async () => {
    if (!canPlay || isExporting) return;

    if (validationFailCount > 0) {
      setIsExportConfirmOpen(true);
      return;
    }

    await proceedExport();
  };

  return {
    isExportConfirmOpen,
    isExporting,
    exportProgress,
    exportMessage,
    handleExport,
    handleExportReport,
    proceedExport,
    setIsExportConfirmOpen,
  };
}
