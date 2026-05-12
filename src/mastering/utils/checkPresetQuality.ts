import type { Preset } from "@/mastering/data/presets";

export type PresetQualityReport = {
  blockingIssues: string[];
  warnings: string[];
};

export function checkPresetQuality(preset: Preset): PresetQualityReport {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  if (preset.eq.length !== 7) {
    blockingIssues.push("EQ bands are incomplete (7 bands required).");
  }

  if (preset.tonalTarget.length !== 10) {
    blockingIssues.push("The tonal target is incomplete (10 points required).");
  }

  if (preset.comp.ratio < 1 || preset.comp.ratio > 6) {
    blockingIssues.push("Compressor ratio is outside the safe range (1-6).");
  }

  if (preset.comp.attack <= 0 || preset.comp.release <= 0) {
    blockingIssues.push("Compressor attack/release must be greater than 0.");
  }

  if (preset.limiter.ceiling > 0 || preset.limiter.ceiling < -3) {
    blockingIssues.push("Limiter ceiling is outside the safe range (-3 to 0 dBTP).");
  }

  if (preset.limiter.drive < 0 || preset.limiter.drive > 12) {
    blockingIssues.push("Limiter drive is outside the safe range (0-12 dB).");
  }

  if (preset.outputComp <= -2) {
    warnings.push("Output compensation is quite negative; the result may feel quieter.");
  }

  if (preset.limiter.drive < 2) {
    warnings.push("Limiter drive is low; final loudness may not increase enough.");
  }

  return {
    blockingIssues,
    warnings,
  };
}
