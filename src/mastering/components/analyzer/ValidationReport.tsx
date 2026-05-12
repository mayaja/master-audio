import type { MasteringTargetProfile, ValidationStatus } from "@/mastering/types/mastering";
import { evaluateMastering, summarizeValidation } from "@/mastering/utils/evaluateMastering";

type Props = {
  profile: MasteringTargetProfile;
  integrated: number;
  shortTerm: number;
  truePeak: number;
  crest: number;
  correlation: number;
};

function rowTone(status: ValidationStatus) {
  if (status === "pass") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "warn") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
  }

  return "border-red-500/30 bg-red-500/10 text-red-200";
}

function rowIcon(status: ValidationStatus) {
  if (status === "pass") return "PASS";
  if (status === "warn") return "WARN";
  return "FAIL";
}

export default function ValidationReport({
  profile,
  integrated,
  shortTerm,
  truePeak,
  crest,
  correlation,
}: Props) {
  const rows = evaluateMastering(profile, integrated, shortTerm, truePeak, crest, correlation);
  const summary = summarizeValidation(rows);

  return (
    <div className="flex h-[540px] flex-col rounded-2xl border border-zinc-800 bg-black/40 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="mt-1 text-sm text-zinc-300">Target profile: {profile.name}</p>
        </div>

        <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
          Score {summary.score}
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className={`h-[86px] rounded-xl border px-3 py-2 ${rowTone(row.status)}`}>
            <div className="flex h-full items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{row.title}</p>
                <p className="mt-1 truncate text-xs opacity-90">{row.hint}</p>
              </div>

              <div className="w-[112px] shrink-0 text-right">
                <p className="text-xs font-bold tracking-wide">{rowIcon(row.status)}</p>
                <p className="mt-1 truncate text-xs">{row.value}</p>
                <p className="truncate text-[11px] opacity-80">{row.target}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
