import { getStemsForMode } from '@/stemmix/data/stems'
import StemChannel from '@/stemmix/components/mixer/StemChannel/StemChannel'
import MasterMeter from '@/stemmix/components/mixer/MasterMeter/MasterMeter'
import { useAudioStore } from '@/stemmix/stores/useAudioStore'

export default function MixerConsole() {
    const stemMode =
        useAudioStore(
            (state) => state.stemMode,
        )
    const visibleStems =
        getStemsForMode(stemMode)

    return (
        <div className="col-span-4 rounded-[18px] border border-white/[0.06] bg-gradient-to-b from-[#0d1422]/95 to-[#090d18]/95 p-4">
            <div className="mb-6">
                <h2 className="text-xl font-semibold">Studio Console</h2>

                <p className="mt-1 text-[11px] text-zinc-500">
                    Fine tune each separated track.
                </p>
            </div>

            <div
                className={[
                    'grid gap-2 overflow-hidden',
                    stemMode === '2stem'
                        ? 'grid-cols-3'
                        : 'grid-cols-5',
                ].join(' ')}
            >
                {visibleStems.map((stem) => (
                    <StemChannel key={stem.id} stem={stem} />
                ))}

                <MasterMeter />
            </div>
        </div>
    )
}
