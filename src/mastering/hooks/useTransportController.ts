import { useCallback, useEffect, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

interface UseTransportControllerParams {
  setStatusNote: (text: string) => void;
}

export function useTransportController({ setStatusNote }: UseTransportControllerParams) {
  const [transportState, setTransportState] = useState<"playing" | "paused" | "stopped">("stopped");
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null);
  const [abMode, setAbMode] = useState<"original" | "processed">("processed");

  const canPlay = audioEngine.audioBuffer !== null;

  const resetLoadedAudio = useCallback((note?: string) => {
    audioEngine.clearAudio();
    setTransportState("stopped");
    setLoadedFileName(null);
    setAudioUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return null;
    });
    waveSurfer?.empty();
    waveSurfer?.seekTo(0);

    if (note) {
      setStatusNote(note);
    }
  }, [setStatusNote, waveSurfer]);

  const handleLoadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    audioEngine.stop();
    setTransportState("stopped");

    await audioEngine.loadAudio(file);
    setLoadedFileName(file.name);

    const newUrl = URL.createObjectURL(file);
    setAudioUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return newUrl;
    });

    setStatusNote(`Track ${file.name} loaded successfully.`);
    e.target.value = "";
  };

  const handlePlay = async () => {
    if (!canPlay) return;
    await audioEngine.play();
    setTransportState("playing");
  };

  const handlePause = () => {
    audioEngine.pause();
    setTransportState("paused");
  };

  const handleStop = () => {
    audioEngine.stop();
    setTransportState("stopped");
    waveSurfer?.seekTo(0);
  };

  const handleToggleAbMode = () => {
    const next = abMode === "processed" ? "original" : "processed";
    setAbMode(next);
    audioEngine.setABMode(next);
  };

  useEffect(() => {
    if (!waveSurfer) return;

    let animationFrame = 0;

    const update = () => {
      if (audioEngine.isPlaying && audioEngine.audioBuffer) {
        const currentTime = audioEngine.getCurrentTime();
        const duration = audioEngine.audioBuffer.duration;
        const progress = duration > 0 ? currentTime / duration : 0;

        waveSurfer.setTime(currentTime);
        waveSurfer.seekTo(progress);
      }

      animationFrame = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(animationFrame);
  }, [waveSurfer]);

  useEffect(() => {
    const stopForPageLifecycle = () => {
      audioEngine.stop();
      setTransportState("stopped");
      waveSurfer?.seekTo(0);
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        resetLoadedAudio("Audio was reset after Safari page restore. Please upload the track again.");
      }
    };

    window.addEventListener("pagehide", stopForPageLifecycle);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pagehide", stopForPageLifecycle);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [resetLoadedAudio, waveSurfer]);

  useEffect(() => {
    return () => {
      audioEngine.stop();
      setTransportState("stopped");

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return {
    abMode,
    audioUrl,
    canPlay,
    loadedFileName,
    transportState,
    handleLoadAudio,
    handlePause,
    handlePlay,
    handleStop,
    handleToggleAbMode,
    setWaveSurfer,
  };
}
