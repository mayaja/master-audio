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
                    <HeroSection />
                </div>
            )}
        </main>
    );
}