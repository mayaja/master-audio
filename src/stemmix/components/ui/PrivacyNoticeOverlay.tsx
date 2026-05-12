import {
    useEffect,
    useState,
} from 'react'

import {
    AnimatePresence,
    motion,
} from 'framer-motion'

import {
    LockKeyhole,
    ShieldCheck,
    X,
} from 'lucide-react'

const STORAGE_KEY =
    'stemmix_privacy_notice_closed_at'

const NOTICE_INTERVAL_MS =
    30 * 60 * 1000

function getLastClosedAt() {
    const value =
        window.localStorage.getItem(
            STORAGE_KEY,
        )

    if (!value) return null

    const timestamp = Number(value)

    return Number.isFinite(timestamp)
        ? timestamp
        : null
}

export default function PrivacyNoticeOverlay() {
    const [
        isVisible,
        setIsVisible,
    ] = useState(false)

    useEffect(() => {
        let timeoutId = 0

        function scheduleNextNotice() {
            const lastClosedAt =
                getLastClosedAt()

            if (!lastClosedAt) {
                setIsVisible(true)
                return
            }

            const elapsed =
                Date.now() - lastClosedAt
            const remaining =
                NOTICE_INTERVAL_MS - elapsed

            if (remaining <= 0) {
                setIsVisible(true)
                return
            }

            timeoutId = window.setTimeout(() => {
                setIsVisible(true)
            }, remaining)
        }

        scheduleNextNotice()

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [])

    function handleClose() {
        window.localStorage.setItem(
            STORAGE_KEY,
            String(Date.now()),
        )

        setIsVisible(false)

        window.setTimeout(() => {
            setIsVisible(true)
        }, NOTICE_INTERVAL_MS)
    }

    return (
        <AnimatePresence>
            {isVisible && (
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
                    className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl"
                >
                    <motion.div
                        initial={{
                            scale: 0.96,
                            opacity: 0,
                            y: 14,
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
                            duration: 0.22,
                        }}
                        className="relative w-full max-w-[520px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-[#111827] via-[#0d1320] to-[#090d18] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.62)]"
                    >
                        <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.18),transparent_72%)]" />

                        <button
                            onClick={handleClose}
                            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-all hover:border-white/[0.16] hover:text-white"
                            aria-label="Close privacy notice"
                        >
                            <X size={16} />
                        </button>

                        <div className="relative flex items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 shadow-[0_0_30px_rgba(52,211,153,0.14)]">
                                <ShieldCheck size={30} />
                            </div>

                            <div className="min-w-0 pr-8">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                                    Privacy First
                                </div>

                                <h2 className="mt-2 text-[24px] font-black tracking-tight text-white">
                                    Your audio stays in your browser
                                </h2>

                                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                                    StemMix does not store, upload, or keep any audio file you add. Audio processing runs locally in your own browser, not on our server.
                                </p>
                            </div>
                        </div>

                        <div className="relative mt-6 grid gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                            <div className="flex items-start gap-3">
                                <LockKeyhole
                                    size={16}
                                    className="mt-0.5 shrink-0 text-cyan-200"
                                />

                                <p className="text-xs leading-relaxed text-zinc-400">
                                    You can use this app with confidence: your uploaded audio is handled only for the active session in this browser.
                                </p>
                            </div>
                        </div>

                        <div className="relative mt-6 flex items-center justify-between gap-3">
                            <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                                This notice returns every 30 minutes
                            </span>

                            <button
                                onClick={handleClose}
                                className="rounded-xl border border-emerald-300/15 bg-emerald-300/10 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100 transition-all hover:border-emerald-300/25 hover:bg-emerald-300/15"
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
