import PhaseControl from "@/mastering/components/analyzer/PhaseControl";
import StereoMeter from "@/mastering/components/meters/StereoMeter";
import VectorScope from "@/mastering/components/analyzer/VectorScope";
import StereoWidth from "@/mastering/components/analyzer/StereoWidth";

interface StereoMonitoringProps {
    disabled?: boolean;
}

export default function StereoMonitoring({ disabled = false }: StereoMonitoringProps) {
    return (
        <div className="flex flex-col gap-4">
            {/* MONO TOGGLE 
            <div className="flex flex-col gap-4">

            
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 p-3">
                <p className="text-xs text-zinc-400">Mono Bas</p>

                <button
                    onClick={() => {
                        const newMonoBass = !monoBass;
                        setMonoBass(newMonoBass);
                        audioEngine.setMonoBassEnabled(newMonoBass);
                    }}
                    className={`px-3 py-1 text-xs rounded-md font-bold transition bg-emerald-500 text-black"}`}
                >
                    Mono Bass
                </button>
            </div>

        </div>
        */}

            <PhaseControl disabled={disabled} />
            <StereoMeter />
            <StereoWidth />
            <VectorScope />
        </div>
    );
}
