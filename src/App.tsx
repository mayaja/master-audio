import { lazy, Suspense } from "react";
import {
  AudioLines,
  ChevronRight,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
  Wand2,
  Waves,
} from "lucide-react";

const MasteringApp = lazy(() => import("@/mastering/App"));
const StemMixApp = lazy(() => import("@/stemmix/App"));
const ClearWaveApp = lazy(() => import("@/clearwave/App"));

type Product = {
  name: string;
  label: string;
  action: string;
  href: string;
  summary: string;
  details: string[];
  Icon: typeof Gauge;
  accent: string;
};

const products: Product[] = [
  {
    name: "Mastering Audio",
    label: "Mastering",
    action: "Master Audio",
    href: "/mastering",
    summary: "Finalize tracks with loudness, peak, stereo, EQ, compressor, limiter, and validation tools.",
    details: ["LUFS and true peak checks", "Mastering chain controls", "Export-ready WAV workflow"],
    Icon: Gauge,
    accent: "from-cyan-300 to-blue-400",
  },
  {
    name: "ClearWave",
    label: "Noise Cleaner",
    action: "Clean Noise",
    href: "/noise-cleaner",
    summary: "Clean recordings by reducing unwanted noise while keeping speech, vocals, and music usable.",
    details: ["Noise reduction workflow", "Cleaner preview experience", "Designed for fast browser use"],
    Icon: Wand2,
    accent: "from-emerald-300 to-teal-400",
  },
  {
    name: "StemMix",
    label: "Stem Separation",
    action: "Split Stems",
    href: "/stems",
    summary: "Separate a song into stems, then review, mix, process, and export the result from one workspace.",
    details: ["Vocals and instrument stems", "Mixer and FX controls", "Waveform-based editing flow"],
    Icon: Layers3,
    accent: "from-amber-300 to-rose-400",
  },
];

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05070d] px-5 text-center text-zinc-100">
      <div>
        <img src="/logo.svg" alt="" className="mx-auto h-14 w-14" />
        <p className="mt-4 text-sm font-semibold text-cyan-100">Loading workspace...</p>
      </div>
    </div>
  );
}

function App() {
  if (window.location.pathname.startsWith("/mastering")) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <MasteringApp />
      </Suspense>
    );
  }

  if (window.location.pathname.startsWith("/stems")) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <StemMixApp />
      </Suspense>
    );
  }

  if (window.location.pathname.startsWith("/noise-cleaner")) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <ClearWaveApp />
      </Suspense>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden text-zinc-100">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-7 sm:px-8 lg:px-10 lg:py-8">
        <a href="/" className="flex items-center gap-5" aria-label="Master Audio home">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/25 bg-cyan-300/10 shadow-[0_22px_60px_-30px_rgba(34,211,238,0.95)]">
            <img src="/logo.svg" alt="" className="h-14 w-14" />
          </span>
          <div>
            <p className="text-3xl font-black tracking-tight text-white sm:text-4xl">Master Audio</p>
            <p className="mt-1.5 text-sm uppercase tracking-[0.28em] text-cyan-200/75">Production Suite</p>
          </div>
        </a>

        <div className="hidden min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-zinc-200 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.9)] sm:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-200">
            <ShieldCheck size={17} />
          </span>
          Local-first browser tools
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:pb-20 lg:pt-14">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
            <Sparkles size={14} />
            Three audio workflows, one professional hub
          </div>

          <h1 className="max-w-xl text-2xl font-black leading-snug text-white sm:text-3xl lg:text-4xl">
            Master, clean, and split audio in one focused workspace.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            Master Audio is the new home for your three browser audio projects: ClearWave for noise cleanup,
            Mastering Audio for release preparation, and StemMix for stem separation and mixing.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {products.map((product) => (
              <a
                key={product.name}
                href={product.href}
                className={`group inline-flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-gradient-to-r ${product.accent} px-4 py-4 text-sm font-black text-black shadow-[0_24px_60px_-30px_rgba(0,0,0,0.95)] ring-1 ring-white/20 transition hover:-translate-y-1 hover:shadow-[0_28px_70px_-28px_rgba(34,211,238,0.45)] focus:outline-none focus:ring-2 focus:ring-cyan-100 lg:px-5 lg:text-base`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/15">
                    <product.Icon size={20} />
                  </span>
                  {product.action}
                </span>
                <ChevronRight size={22} className="transition group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </div>

        <div className="relative min-h-[340px] lg:min-h-[430px]">
          <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-[#0d1521]/80 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.95)] backdrop-blur" />
          <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Suite Signal</p>
                <p className="mt-2 text-2xl font-bold text-white">Unified Audio Flow</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                <AudioLines size={24} />
              </div>
            </div>

            <div className="my-5 space-y-3">
              <div className="h-14 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3">
                <div className="flex h-full items-center gap-1">
                  {Array.from({ length: 42 }).map((_, index) => (
                    <span
                      key={index}
                      className="w-full rounded-full bg-cyan-200/80"
                      style={{ height: `${18 + ((index * 17) % 44)}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {products.map((product) => (
                  <div key={product.name} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className={`mb-3 h-1.5 rounded-full bg-gradient-to-r ${product.accent}`} />
                    <p className="text-[11px] text-zinc-400">{product.label}</p>
                    <p className="mt-1 text-sm font-bold text-white">{product.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center gap-3">
                <Waves size={18} className="text-emerald-300" />
                <p className="text-sm font-semibold text-white">Built for one integrated release workflow.</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Start with cleanup, separate stems when needed, then master and validate the final output.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-14 sm:px-8 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = product.Icon;

            return (
              <article
                key={product.name}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_22px_60px_-42px_rgba(0,0,0,0.95)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{product.label}</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">{product.name}</h2>
                  </div>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${product.accent} text-black`}>
                    <Icon size={21} />
                  </div>
                </div>

                <p className="mt-4 min-h-[72px] text-sm leading-6 text-zinc-300">{product.summary}</p>

                <ul className="mt-4 space-y-2">
                  {product.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm text-zinc-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                      {detail}
                    </li>
                  ))}
                </ul>

                <a
                  href={product.href}
                  className={`mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${product.accent} px-4 py-3 text-sm font-black text-black shadow-[0_18px_45px_-30px_rgba(0,0,0,0.95)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-30px_rgba(34,211,238,0.45)] focus:outline-none focus:ring-2 focus:ring-cyan-100`}
                >
                  {product.action}
                  <ChevronRight size={18} />
                </a>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default App;
