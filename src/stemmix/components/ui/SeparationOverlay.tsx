import {
    motion,
    AnimatePresence,
} from 'framer-motion'

import {
    useAudioStore,
} from '@/stemmix/stores/useAudioStore'

export default function SeparationOverlay() {
    const isSeparating =
        useAudioStore(
            (state) => state.isSeparating,
        )

    const separationProgress =
        useAudioStore(
            (state) => state.separationProgress,
        )

    const separationStatus =
        useAudioStore(
            (state) => state.separationStatus,
        )

    return (
        <AnimatePresence>
            {isSeparating && (
                <motion.div
                    initial={{
                        opacity: 0,
                    }}
                    animate={{
                        opacity: 1,
                    }}
                    exit={{
                        opacity: 0,
                    }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/72 backdrop-blur-xl"
                >

                    <motion.div
                        initial={{
                            scale: 0.96,
                            opacity: 0,
                            y: 12,
                        }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            scale: 0.96,
                            opacity: 0,
                            y: 8,
                        }}
                        transition={{
                            duration: 0.24,
                        }}
                        className="relative w-[460px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-[#111827] via-[#0d1320] to-[#090d18] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
                    >
                        {/* Glow */}
                        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_72%)]" />

                        {/* Spinner */}
                        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10">
                            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-300" />

                            <div className="text-sm font-black tracking-[0.18em] text-cyan-200">
                                AI
                            </div>
                        </div>

                        {/* Title */}
                        <div className="relative mt-6 text-center">
                            <h2 className="text-[24px] font-black tracking-tight text-white">
                                Separating Audio Stems
                            </h2>

                            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                                AI is analyzing frequencies, transients,
                                vocals, drums, bass, and harmonic layers.
                            </p>

                            <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.06] px-4 py-3 text-left">
                                <p className="text-[12px] font-semibold leading-relaxed text-cyan-100">
                                    This process can take several minutes,
                                    especially on the first run or for longer
                                    songs. Processing happens locally in your
                                    browser, so speed depends on your device.
                                </p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="relative mt-8">

                            {/* Labels */}
                            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-400">
                                <span>
                                    {separationStatus}
                                </span>

                                <span>
                                    {Math.round(
                                        separationProgress,
                                    )}
                                    %
                                </span>
                            </div>

                            {/* Bar */}
                            <div className="h-3 overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.04]">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 shadow-[0_0_24px_rgba(56,189,248,0.45)]"
                                    animate={{
                                        width: `${separationProgress}%`,
                                    }}
                                    transition={{
                                        ease: 'easeOut',
                                        duration: 0.25,
                                    }}
                                />
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] tracking-[0.14em] text-zinc-500">
                            <div className="h-[5px] w-[5px] animate-pulse rounded-full bg-cyan-400" />

                            PLEASE KEEP THIS TAB OPEN UNTIL IT FINISHES
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
