import UploadZone from "@/clearwave/components/audio/UploadZone";

import TrackCard from "@/clearwave/components/audio/TrackCard";

import { useAudioStore } from "@/clearwave/store/audioStore";

import HeroSection from "@/clearwave/components/hero/HeroSection";

export default function Home() {
    const tracks =
        useAudioStore(
            (state) =>
                state.tracks
        );

    const setTracks =
        useAudioStore(
            (state) =>
                state.setTracks
        );

    /*
     * UPDATE TRACK
     */
    const updateTrack = (
        trackId: string,
        updates: any
    ) => {
        const liveTracks =
            useAudioStore.getState()
                .tracks;

        const updatedTracks =
            liveTracks.map(
                (track) =>
                    track.id ===
                        trackId
                        ? {
                            ...track,
                            ...updates,
                        }
                        : track
            );

        setTracks(
            updatedTracks
        );
    };

    return (
        <main className="flex-1 overflow-auto">
            <div className="max-w-[1800px] mx-auto p-4 lg:p-6">
                <UploadZone />
                
                <div className="mt-4 space-y-3">
                    {tracks.map(
                        (track) => (
                            <TrackCard
                                key={
                                    track.id
                                }
                                track={
                                    track
                                }
                                onUpdate={
                                    updateTrack
                                }
                            />
                        )
                    )}
                </div>
            </div>
            {tracks.length === 0 && (
                <div className="mt-10 max-w-[1800px] mx-auto p-4 lg:p-6">
                    <section className="mb-4 rounded-3xl border border-cyan-300/10 bg-cyan-300/[0.06] p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                            How to use Clean Noise
                        </p>

                        <div className="mt-4 grid gap-3 text-sm text-slate-300 lg:grid-cols-4">
                            {[
                                'Upload or drag audio files',
                                'Choose a cleaning preset',
                                'Adjust intensity and process',
                                'Preview and download cleaned audio',
                            ].map((step, index) => (
                                <div
                                    key={step}
                                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-cyan-300 text-xs font-black text-black">
                                        {index + 1}
                                    </span>
                                    <span>{step}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <HeroSection />
                </div>
            )}
        </main>
    );
}
