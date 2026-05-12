import Header from '@/stemmix/components/layout/Header/Header'

import StemRow from '@/stemmix/components/mixer/StemRow/StemRow'
import MixerConsole from '@/stemmix/components/mixer/MixerConsole/MixerConsole'

import EQCard from '@/stemmix/components/effects/EQ/EQCard'
import CompressorCard from '@/stemmix/components/effects/Compressor/CompressorCard'
import LimiterCard from '@/stemmix/components/effects/Limiter/LimiterCard'
import ReverbCard from '@/stemmix/components/effects/Reverb/ReverbCard'

import { stems } from '@/stemmix/data/stems'

export default function StudioPage() {
    return (
        <div className="min-h-screen bg-[#050816] text-white">
            <Header />

            <main className="mx-auto max-w-[1850px] space-y-5 p-5">
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
                            {stems.map((stem) => (
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
