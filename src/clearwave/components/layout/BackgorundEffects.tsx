export default function BackgroundEffects() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-[#060816]">
            <div
                className="
                    absolute
                    top-[-200px]
                    left-[-200px]
                    w-[500px]
                    h-[500px]
                    rounded-full
                    bg-violet-500/10
                    blur-3xl
                "
            />

            <div
                className="
                    absolute
                    bottom-[-200px]
                    right-[-200px]
                    w-[500px]
                    h-[500px]
                    rounded-full
                    bg-cyan-500/10
                    blur-3xl
                "
            />

            <div
                className="
                    absolute inset-0
                    bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_70%)]
                "
            />
        </div>
    );
}