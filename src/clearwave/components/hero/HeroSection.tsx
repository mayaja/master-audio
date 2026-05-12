export default function HeroSection() {
    return (
        <section
            className="
                rounded-3xl
                border border-white/10
                bg-white/[0.03]
                px-8 py-10
                overflow-hidden
                relative
            "
        >
            {/* BACKGROUND GLOW */}
            <div
                className="
                    absolute
                    inset-0
                    bg-gradient-to-br
                    from-violet-500/10
                    via-transparent
                    to-cyan-500/10
                    pointer-events-none
                "
            />

            <div className="relative z-10">
                

                <h1
                    className="
                        mt-6
                        text-5xl
                        lg:text-6xl
                        font-black
                        tracking-tight
                        leading-[1]
                    "
                >
                    Clean Audio.
                    <br />

                    <span
                        className="
                            bg-gradient-to-r
                            from-violet-300
                            to-cyan-300
                            text-transparent
                            bg-clip-text
                        "
                    >
                        Fully Private.
                    </span>
                </h1>

                <p
                    className="
                        mt-6
                        max-w-3xl
                        text-lg
                        text-slate-300
                        leading-relaxed
                    "
                >
                    Remove fan noise,
                    background hiss,
                    wind, and unwanted
                    audio artifacts
                    directly in your
                    browser — without
                    uploading files to
                    any server.
                </p>

                <div
                    className="
                        mt-8
                        flex flex-wrap
                        gap-3
                    "
                >
                    <div
                        className="
                            rounded-xl
                            border border-white/10
                            bg-white/[0.03]
                            px-4 py-2
                            text-sm
                            text-slate-300
                        "
                    >
                        Local Processing
                    </div>

                    <div
                        className="
                            rounded-xl
                            border border-white/10
                            bg-white/[0.03]
                            px-4 py-2
                            text-sm
                            text-slate-300
                        "
                    >
                        No Cloud Uploads
                    </div>

                    <div
                        className="
                            rounded-xl
                            border border-white/10
                            bg-white/[0.03]
                            px-4 py-2
                            text-sm
                            text-slate-300
                        "
                    >
                        Multi-Track Workspace
                    </div>

                    <div
                        className="
                            rounded-xl
                            border border-white/10
                            bg-white/[0.03]
                            px-4 py-2
                            text-sm
                            text-slate-300
                        "
                    >
                        FFmpeg.wasm Powered
                    </div>
                </div>
            </div>
        </section>
    );
}