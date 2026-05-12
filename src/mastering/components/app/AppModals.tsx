import HoverInfo from "@/mastering/components/ui/HoverInfo";

interface AppModalsProps {
  isExportConfirmOpen: boolean;
  validationFailCount: number;
  isExporting: boolean;
  exportProgress: number;
  exportMessage: string;
  onCancelExport: () => void;
  onConfirmExport: () => void;
  isPrivacyNoticeOpen: boolean;
  onAcknowledgePrivacy: () => void;
}

export default function AppModals({
  isExportConfirmOpen,
  validationFailCount,
  isExporting,
  exportProgress,
  exportMessage,
  onCancelExport,
  onConfirmExport,
  isPrivacyNoticeOpen,
  onAcknowledgePrivacy,
}: AppModalsProps) {
  const boundedExportProgress = Math.max(0, Math.min(100, exportProgress));

  return (
    <>
      {isExporting && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#03060ddd] px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cyan-300/25 bg-[#101926] p-6 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.95)]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/80">Export WAV</p>
            <h3 className="mt-2 text-xl font-bold text-white">Rendering your master</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Please keep this tab open while the processed audio is rendered locally in your browser.
              The download will start automatically when the file is ready.
            </p>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-cyan-100">{exportMessage}</span>
                <span className="font-mono text-zinc-300">{Math.round(boundedExportProgress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-cyan-300 transition-all duration-300 ease-out"
                  style={{ width: `${boundedExportProgress}%` }}
                />
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-zinc-700/70 bg-black/25 px-3 py-2 text-xs text-zinc-400">
              Audio stays on this device. No upload to a server is required for export.
            </div>
          </div>
        </div>
      )}

      {isExportConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-300/30 bg-[#10141f] p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200/80">Export Warning</p>
            <h3 className="mt-2 text-lg font-bold text-white">Validation still has FAIL items</h3>
            <p className="mt-2 text-sm text-zinc-300">
              There {validationFailCount === 1 ? "is" : "are"} {validationFailCount} FAIL item{validationFailCount === 1 ? "" : "s"} in the Validation Report. Export can continue, but the result may miss the platform target.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <HoverInfo text="Cancel export and return to the main page.">
                <button
                  onClick={onCancelExport}
                  className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </HoverInfo>

              <HoverInfo text="Continue exporting even though validation still has FAIL items.">
                <button
                  onClick={onConfirmExport}
                  className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-200"
                >
                  Export Anyway
                </button>
              </HoverInfo>
            </div>
          </div>
        </div>
      )}

      {isPrivacyNoticeOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#03060dcc] px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-cyan-300/25 bg-[#101926] p-6 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.95)]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/80">Privacy Notice</p>
            <h3 className="mt-2 text-xl font-bold text-white">User Data Protection</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              All audio processing in this application runs locally on your device through the browser.
              This app does not store, send, or share any audio file you upload, including project data,
              analysis results, or exported results, to any external server.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              By pressing the button below, you confirm that you understand this information and are ready to continue using the app.
            </p>

            <div className="mt-6 flex justify-end">
              <HoverInfo text="Close the privacy notice and continue using the app.">
                <button
                  onClick={onAcknowledgePrivacy}
                  className="rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-black transition hover:bg-cyan-200"
                >
                  I Understand
                </button>
              </HoverInfo>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
