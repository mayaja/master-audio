import type { MasteringTargetProfile, ValidationRow, ValidationStatus } from "@/mastering/types/mastering";

function getStatus(value: number, passTest: (v: number) => boolean, warnTest: (v: number) => boolean): ValidationStatus {
  if (passTest(value)) {
    return "pass";
  }

  if (warnTest(value)) {
    return "warn";
  }

  return "fail";
}

export function evaluateMastering(
  profile: MasteringTargetProfile,
  integrated: number,
  shortTerm: number,
  truePeak: number,
  crest: number,
  correlation: number
): ValidationRow[] {
  const integratedDiff = Math.abs(integrated - profile.targetIntegratedLufs);

  // Sparse vocal-heavy arrangements (e.g., rap with minimal instruments)
  // can sit lower on integrated LUFS while short-term peaks remain compliant.
  const isSparseMaterial =
    crest >= profile.minCrestDb + 2 &&
    shortTerm <= profile.maxShortTermLufs;

  const integratedTolerance =
    profile.integratedTolerance + (isSparseMaterial ? 1.5 : 0);

  let integratedStatus = getStatus(
    integratedDiff,
    (v) => v <= integratedTolerance,
    (v) => v <= integratedTolerance + 1
  );

  // During sparse intros/build-up (e.g. vocal with minimal instruments),
  // integrated LUFS can lag behind short-term LUFS until kick/bass arrives.
  const isQuietIntro =
    shortTerm <= profile.targetIntegratedLufs - 4 &&
    integrated < profile.targetIntegratedLufs;

  const shortVsIntegratedGap = shortTerm - integrated;
  const isSparseVocalBuildUp =
    integrated < profile.targetIntegratedLufs - (profile.integratedTolerance + 1) &&
    shortTerm <= profile.targetIntegratedLufs + 1 &&
    shortVsIntegratedGap >= 3;

  // Sparse instrumental passages (e.g., electric guitar only) can also keep
  // integrated LUFS low before the full arrangement enters.
  const isSparseInstrumentalPassage =
    integrated < profile.targetIntegratedLufs - (profile.integratedTolerance + 1) &&
    shortTerm <= profile.targetIntegratedLufs - 1 &&
    truePeak <= profile.maxTruePeakDbtp - 1;

  if ((isQuietIntro || isSparseVocalBuildUp || isSparseInstrumentalPassage) && integratedStatus === "fail") {
    integratedStatus = "warn";
  }

  const shortTermStatus = getStatus(
    shortTerm,
    (v) => v <= profile.maxShortTermLufs,
    (v) => v <= profile.maxShortTermLufs + 1
  );

  const peakStatus = getStatus(
    truePeak,
    (v) => v <= profile.maxTruePeakDbtp,
    (v) => v <= profile.maxTruePeakDbtp + 0.5
  );

  let crestStatus = getStatus(
    crest,
    (v) => v >= profile.minCrestDb,
    (v) => v >= profile.minCrestDb - 1
  );

  // Crest can read unstable during sparse intro/build-up segments.
  // Avoid hard fail while short-term loudness is still far below the target zone.
  const isSparseIntroForCrest = shortTerm <= profile.maxShortTermLufs - 3;
  if (isSparseIntroForCrest && crestStatus === "fail") {
    crestStatus = "warn";
  }

  const corrStatus = getStatus(
    correlation,
    (v) => v >= profile.minCorrelation,
    (v) => v >= profile.minCorrelation - 0.1
  );

  return [
    {
      id: "integrated",
      title: "Integrated Loudness",
      value: `${integrated.toFixed(1)} LUFS`,
      target: `${profile.targetIntegratedLufs} +/- ${profile.integratedTolerance} LU`,
      status: integratedStatus,
      hint:
        integratedStatus === "pass"
          ? "Loudness is within the platform target zone."
          : integrated > profile.targetIntegratedLufs
            ? "The master is too loud; lower the output or limiter drive."
            : "The master is still quiet; increase gain gradually.",
    },
    {
      id: "short",
      title: "Short-term Loudness",
      value: `${shortTerm.toFixed(1)} LUFS`,
      target: `<= ${profile.maxShortTermLufs} LUFS`,
      status: shortTermStatus,
      hint:
        shortTermStatus === "pass"
          ? "Transient loudness is still safe."
          : "Short-term loudness peaks are too high.",
    },
    {
      id: "peak",
      title: "True Peak",
      value: `${truePeak.toFixed(1)} dBTP`,
      target: `<= ${profile.maxTruePeakDbtp} dBTP`,
      status: peakStatus,
      hint:
        peakStatus === "pass"
          ? "Headroom is safe from inter-sample clipping."
          : "Lower the limiter ceiling for safer lossy encoding.",
    },
    {
      id: "crest",
      title: "Crest Factor",
      value: `${crest.toFixed(1)} dB`,
      target: `>= ${profile.minCrestDb} dB`,
      status: crestStatus,
      hint:
        crestStatus === "pass"
          ? "The dynamic ratio is still healthy."
          : "Dynamics are too compressed (over-limited).",
    },
    {
      id: "corr",
      title: "Stereo Correlation",
      value: correlation.toFixed(2),
      target: `>= ${profile.minCorrelation.toFixed(2)}`,
      status: corrStatus,
      hint:
        corrStatus === "pass"
          ? "Mono compatibility is relatively safe."
          : "There is a risk of phase cancellation in mono.",
    },
  ];
}

export function summarizeValidation(rows: ValidationRow[]) {
  const pass = rows.filter((row) => row.status === "pass").length;
  const warn = rows.filter((row) => row.status === "warn").length;
  const fail = rows.filter((row) => row.status === "fail").length;

  const rawScore = rows.reduce((acc, row) => {
    if (row.status === "pass") return acc + 1;
    if (row.status === "warn") return acc + 0.5;
    return acc;
  }, 0);

  return {
    pass,
    warn,
    fail,
    score: Math.round((rawScore / Math.max(rows.length, 1)) * 100),
  };
}
