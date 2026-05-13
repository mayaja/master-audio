import Header from '@/stemmix/components/layout/Header/Header'

import StemRow from '@/stemmix/components/mixer/StemRow/StemRow'
import MixerConsole from '@/stemmix/components/mixer/MixerConsole/MixerConsole'

import EQCard from '@/stemmix/components/effects/EQ/EQCard'
import CompressorCard from '@/stemmix/components/effects/Compressor/CompressorCard'
import LimiterCard from '@/stemmix/components/effects/Limiter/LimiterCard'
import ReverbCard from '@/stemmix/components/effects/Reverb/ReverbCard'

import { getStemsForMode } from '@/stemmix/data/stems'
import { useAudioStore } from '@/stemmix/stores/useAudioStore'

export default function StudioPage() {
    const stemMode =
        useAudioStore(
            (state) => state.stemMode,
        )
    const visibleStems =
        getStemsForMode(stemMode)

    return (
        <div className="min-h-screen bg-[#050816] text-white">
            <Header />

            <main className="mx-auto max-w-[1850px] space-y-5 p-5">
                <section className="rounded-[18px] border border-cyan-300/10 bg-gradient-to-r from-cyan-300/[0.08] via-white/[0.03] to-fuchsia-300/[0.06] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.28)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/75">
                                Quick Guide
                            </p>

                            <h2 className="mt-1 text-lg font-bold text-white">
                                Split stems, adjust the mix, then export your final result.
                            </h2>
                        </div>

                        <div className="grid gap-2 text-[12px] text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                'Upload an audio file',
                                'Click Split Stems',
                                'Tune volume, pan, EQ, FX',
                                'Export when all stems are ready',
                            ].map((step, index) => (
                                <div
                                    key={step}
                                    className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2"
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-300 text-[11px] font-black text-black">
                                        {index + 1}
                                    </span>
                                    <span>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-12 items-stretch gap-5">
                    <div className="col-span-4 rounded-[18px] border border-white/[0.06] bg-gradient-to-b from-[#0d1422]/95 to-[#090d18]/95 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold">
                                Mixer Overview
                            </h2>

                            <p className="mt-1 text-[11px] text-zinc-500">
                                Track waveforms & playhead position.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {visibleStems.map((stem) => (
                                <StemRow
                                    key={stem.id}
                                    stem={stem}
                                    compact
                                />
                            ))}
                        </div>
                    </div>

                    <div className="col-span-4 h-full">
                        <EQCard />
                    </div>

                    <MixerConsole />
                </section>

                <section className="grid grid-cols-3 gap-4">
                    <CompressorCard />
                    <ReverbCard />
                    <LimiterCard />
                </section>
            </main>
        </div>
    )
}
