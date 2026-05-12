import {
    ShieldCheck,
    Lock,
    HardDrive,
    Cpu,
    Home,
} from "lucide-react";

export default function Sidebar() {
    return (
        <aside
            className="
                w-[300px]
                shrink-0
                border-r border-white/10
                bg-black/20
                backdrop-blur-xl
                p-6
                hidden lg:flex
                flex-col
            "
        >
            {/* LOGO */}
            <div>
                <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 shadow-[0_18px_45px_-28px_rgba(34,211,238,0.8)]">
                        <img src="/logo.svg" alt="" className="h-8 w-8" />
                    </span>

                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/75">
                            Master Audio
                        </p>

                        <h1
                            className="
                                text-2xl
                                font-bold
                                tracking-tight
                            "
                        >
                            Clean Noise
                        </h1>
                    </div>
                </div>

                <a
                    href="/"
                    className="
                        mt-5
                        inline-flex
                        h-11
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border border-cyan-300/20
                        bg-cyan-300/10
                        px-4
                        text-xs
                        font-bold
                        uppercase
                        tracking-[0.16em]
                        text-cyan-100
                        transition
                        hover:border-cyan-200/40
                        hover:bg-cyan-300/15
                    "
                >
                    <Home size={15} />
                    Home
                </a>
            </div>

            {/* PRIVACY PANEL */}
            <div className="mt-10">
                <div
                    className="
                        flex items-center
                        gap-2
                        mb-5
                    "
                >
                    <ShieldCheck
                        size={18}
                        className="text-emerald-400"
                    />

                    <h2
                        className="
                            font-semibold
                            text-lg
                        "
                    >
                        Privacy & Security
                    </h2>
                </div>

                <div className="space-y-4">
                    <div
                        className="
                            flex gap-3
                            items-start
                        "
                    >
                        <Lock
                            size={18}
                            className="
                                text-cyan-400
                                mt-0.5
                                shrink-0
                            "
                        />

                        <p
                            className="
                                text-sm
                                text-slate-300
                                leading-relaxed
                            "
                        >
                            Audio files are
                            processed fully
                            inside your
                            browser.
                        </p>
                    </div>

                    <div
                        className="
                            flex gap-3
                            items-start
                        "
                    >
                        <HardDrive
                            size={18}
                            className="
                                text-violet-400
                                mt-0.5
                                shrink-0
                            "
                        />

                        <p
                            className="
                                text-sm
                                text-slate-300
                                leading-relaxed
                            "
                        >
                            No uploads, no
                            cloud storage,
                            and no audio is
                            saved to any
                            server.
                        </p>
                    </div>

                    <div
                        className="
                            flex gap-3
                            items-start
                        "
                    >
                        <Cpu
                            size={18}
                            className="
                                text-amber-400
                                mt-0.5
                                shrink-0
                            "
                        />

                        <p
                            className="
                                text-sm
                                text-slate-300
                                leading-relaxed
                            "
                        >
                            Processing uses
                            FFmpeg.wasm and
                            runs locally on
                            your device.
                        </p>
                    </div>
                </div>
            </div>

            {/* EXTRA NOTES */}
            <div
                className="
                    mt-10
                    rounded-2xl
                    border border-white/10
                    bg-white/[0.03]
                    p-4
                "
            >
                <h3
                    className="
                        text-sm
                        font-semibold
                        mb-3
                    "
                >
                    Important Notes
                </h3>

                <ul
                    className="
                        space-y-2
                        text-sm
                        text-slate-400
                    "
                >
                    <li>
                        • Files never leave
                        your device
                    </li>

                    <li>
                        • Closing the tab
                        removes all
                        temporary data
                    </li>

                    <li>
                        • Recommended for
                        desktop/laptop use
                    </li>

                    <li>
                        • Maximum 10 audio
                        files per session
                    </li>
                </ul>
            </div>

            {/* FOOTER */}
            <div className="mt-auto pt-8">
                <div
                    className="
                        border-t border-white/10
                        pt-4
                    "
                >
                    <p
                        className="
                            text-xs
                            text-slate-500
                            leading-relaxed
                        "
                    >
                        Powered by
                        FFmpeg.wasm •
                        Browser-only audio
                        processing
                    </p>
                </div>
            </div>
        </aside>
    );
}
