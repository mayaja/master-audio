import { AudioWaveform, CircleHelp, Download, FileText, Home, Pause, Play, Square, Upload } from "lucide-react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import type { ChangeEvent } from "react";
import HoverInfo from "@/mastering/components/ui/HoverInfo";
import type { MasteringTargetProfile, PlatformId } from "@/mastering/types/mastering";

interface AppHeaderProps {
  isScrolled: boolean;
  statusNote: string;
  activePresetName: string;
  integrated: number;
  truePeak: number;
  loudnessState: string;
  profiles: MasteringTargetProfile[];
  activeProfileId: PlatformId;
  onProfileChange: (id: PlatformId) => void;
  onApplyTarget: () => void;
  adaptMode: "full" | "quick";
  onAdaptModeChange: (mode: "full" | "quick") => void;
  canPlay: boolean;
  isAdapting: boolean;
  adaptProgress: number;
  onAutoAdapt: () => void;
  masterMode: "safe" | "loud";
  onApplyMasterMode: (mode: "safe" | "loud") => void;
  onLoadAudio: (event: ChangeEvent<HTMLInputElement>) => void;
  transportState: "playing" | "paused" | "stopped";
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  abMode: "original" | "processed";
  onToggleAbMode: () => void;
  isExporting: boolean;
  onExport: () => void;
  onExportReport: () => void;
}

export default function AppHeader({
  isScrolled,
  statusNote,
  activePresetName,
  integrated,
  truePeak,
  loudnessState,
  profiles,
  activeProfileId,
  onProfileChange,
  onApplyTarget,
  adaptMode,
  onAdaptModeChange,
  canPlay,
  isAdapting,
  adaptProgress,
  onAutoAdapt,
  masterMode,
  onApplyMasterMode,
  onLoadAudio,
  transportState,
  onPlay,
  onPause,
  onStop,
  abMode,
  onToggleAbMode,
  isExporting,
  onExport,
  onExportReport,
}: AppHeaderProps) {
  const controlsDisabled = !canPlay;

  return (
    <header
      className={`
        relative border border-white/10 transition-all duration-300
        ${isScrolled
          ? "sticky top-0 z-50 rounded-2xl bg-[#121722]/90 p-4 shadow-2xl backdrop-blur"
          : "rounded-3xl bg-[#121722]/70 p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.85)]"
        }
      `}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-5">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-cyan-300/25 bg-cyan-300/10 shadow-[0_22px_60px_-30px_rgba(34,211,238,0.95)]">
            <img src="/logo.svg" alt="" className="h-14 w-14" />
          </span>

          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">Master Audio</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Mastering Audio</h1>
            <p className="mt-2 text-xs text-cyan-200/80">{statusNote}</p>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-6">
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-cyan-100">
              <p className="opacity-70">Preset</p>
              <p className="mt-1 font-semibold">{activePresetName}</p>
            </div>
            <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-emerald-100">
              <p className="opacity-70">Integrated</p>
              <p className="mt-1 font-semibold">{integrated.toFixed(1)} LUFS</p>
            </div>
            <div className="rounded-xl border border-amber-200/30 bg-amber-200/10 px-3 py-2 text-amber-100">
              <p className="opacity-70">True Peak</p>
              <p className="mt-1 font-semibold">{truePeak.toFixed(1)} dBTP</p>
            </div>
            <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-2 text-fuchsia-100">
              <p className="opacity-70">Loudness</p>
              <p className="mt-1 font-semibold">{loudnessState}</p>
            </div>

            <HoverInfo text="Return to the Master Audio landing page.">
              <a
                href="/"
                onClick={() => {
                  audioEngine.stop();
                }}
                className="flex h-full min-h-[56px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-100 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] transition hover:border-cyan-200/40 hover:bg-white/[0.1]"
                aria-label="Back to home"
              >
                <Home size={22} />
              </a>
            </HoverInfo>

            <HoverInfo text="Open Help & Manual to view the complete usage guide.">
              <button
                disabled={controlsDisabled}
                onClick={() => {
                  window.open("/help-manual.html", "_blank", "noopener,noreferrer");
                }}
                className="flex h-full min-h-[56px] w-full items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-300/10 text-cyan-100 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] transition hover:border-cyan-200 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Help"
              >
                <CircleHelp size={22} />
              </button>
            </HoverInfo>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2">
          <span className="text-xs uppercase tracking-wide text-cyan-100">Target</span>
          <select
            disabled={controlsDisabled}
            value={activeProfileId}
            onChange={(event) => onProfileChange(event.target.value as PlatformId)}
            className="rounded-lg border border-zinc-600 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>

          <HoverInfo text="Apply the mastering target for the selected platform.">
            <button
              disabled={controlsDisabled}
              onClick={onApplyTarget}
              className="rounded-lg bg-cyan-300 px-2 py-1 text-xs font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply Target
            </button>
          </HoverInfo>

          <select
            disabled={controlsDisabled}
            value={adaptMode}
            onChange={(event) => onAdaptModeChange(event.target.value as "full" | "quick")}
            className="rounded-lg border border-zinc-600 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="full">Full Track</option>
            <option value="quick">Quick</option>
          </select>

          <HoverInfo
            text={
              adaptMode === "full"
                ? "Analyze the full track, then adjust settings automatically."
                : "Adjust settings automatically from the current spectrum snapshot."
            }
          >
            <button
              disabled={controlsDisabled || isAdapting}
              onClick={onAutoAdapt}
              className="rounded-lg border border-cyan-200/60 bg-zinc-900 px-2 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAdapting ? (adaptMode === "full" ? `Analyzing ${adaptProgress}%` : "Adapting...") : "Auto Adapt"}
            </button>
          </HoverInfo>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2">
          <span className="text-xs uppercase tracking-wide text-emerald-100">Master Mode</span>
          <HoverInfo text="Safe mode: prioritize headroom and more stable dynamics.">
            <button
              disabled={controlsDisabled}
              onClick={() => onApplyMasterMode("safe")}
              className={`rounded-lg px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                masterMode === "safe"
                  ? "bg-emerald-300 text-black"
                  : "border border-zinc-600 bg-zinc-900 text-zinc-100"
              }`}
            >
              Safe
            </button>
          </HoverInfo>
          <HoverInfo text="Loud mode: push loudness higher with tighter dynamics risk.">
            <button
              disabled={controlsDisabled}
              onClick={() => onApplyMasterMode("loud")}
              className={`rounded-lg px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                masterMode === "loud"
                  ? "bg-amber-300 text-black"
                  : "border border-zinc-600 bg-zinc-900 text-zinc-100"
              }`}
            >
              Loud
            </button>
          </HoverInfo>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-600/80 bg-zinc-900/70 px-3 py-2 lg:ml-auto">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:border-cyan-300 hover:bg-zinc-800">
            <span className="sr-only">Load audio file</span>
            <Upload size={14} />
            Load Audio
            <input type="file" accept="audio/*" hidden onChange={onLoadAudio} />
          </label>

          <HoverInfo text="Start audio playback to monitor the mastered result.">
            <button
              disabled={controlsDisabled}
              onClick={onPlay}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                transportState === "playing"
                  ? "bg-emerald-300 text-black"
                  : "border border-zinc-600 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
              } ${controlsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Play size={14} />
              Play
            </button>
          </HoverInfo>

          <HoverInfo text="Pause playback at the current position.">
            <button
              disabled={controlsDisabled}
              onClick={onPause}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                transportState === "paused"
                  ? "bg-emerald-300 text-black"
                  : "border border-zinc-600 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
              } ${controlsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Pause size={14} />
              Pause
            </button>
          </HoverInfo>

          <HoverInfo text="Stop playback and return to the beginning.">
            <button
              disabled={controlsDisabled}
              onClick={onStop}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                transportState === "stopped"
                  ? "bg-emerald-300 text-black"
                  : "border border-zinc-600 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
              } ${controlsDisabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Square size={14} />
              Stop
            </button>
          </HoverInfo>

          <HoverInfo text="Compare the original audio against the processed master.">
            <button
              disabled={controlsDisabled}
              onClick={onToggleAbMode}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                abMode === "processed"
                  ? "bg-emerald-300 text-black"
                  : "border border-zinc-600 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              <AudioWaveform size={14} />
              {abMode === "processed" ? "Processed" : "Original"}
            </button>
          </HoverInfo>

          <HoverInfo text="Export the mastered result to a WAV file.">
            <button
              disabled={controlsDisabled || isExporting}
              onClick={onExport}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:border-cyan-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={14} />
              {isExporting ? "Exporting..." : "Export WAV"}
            </button>
          </HoverInfo>

          <HoverInfo text="Export the mastering validation report as a text file.">
            <button
              disabled={controlsDisabled}
              onClick={onExportReport}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:border-emerald-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText size={14} />
              Export Report
            </button>
          </HoverInfo>

        </div>
      </div>
    </header>
  );
}
