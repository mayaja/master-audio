import Section from "@/mastering/components/sections/Section";
import LufsMeter from "@/mastering/components/meters/LufsMeter";
import CrestFactor from "@/mastering/components/analyzer/CrestFactor";
import MasterCheck from "@/mastering/components/analyzer/MasterCheck";
import TonalGuidance from "@/mastering/components/analyzer/TonalGuidance";

interface AppRightSidebarProps {
  integrated: number;
  truePeak: number;
  tonalTarget: [number, number, number, number, number, number, number, number, number, number];
}

export default function AppRightSidebar({ integrated, truePeak, tonalTarget }: AppRightSidebarProps) {
  return (
    <aside className="flex flex-col gap-6">
      <Section title="Loudness">
        <div className="grid grid-cols-1 gap-4">
          <LufsMeter />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-black/40 p-2 text-center">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">Integrated</p>
              <p className="mt-1 text-sm font-bold text-emerald-400">{integrated.toFixed(1)} LUFS</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/40 p-2 text-center">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">True Peak</p>
              <p className="mt-1 text-sm font-black text-rose-400">{truePeak.toFixed(1)} dBTP</p>
            </div>
          </div>

          <CrestFactor />
        </div>
      </Section>

      <Section title="Master Check">
        <MasterCheck />
      </Section>

      <Section title="Tonal Guidance">
        <TonalGuidance tonalTarget={tonalTarget} />
      </Section>
    </aside>
  );
}
