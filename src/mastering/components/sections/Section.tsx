export default function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-3xl border border-white/10 bg-[#0f1623]/78 p-5 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.95)] backdrop-blur-md">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-100/85">
                    {title}
                </h2>
            </div>

            {children}
        </section>
    );
}