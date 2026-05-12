import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import {
    Upload,
    Trash2,
    Files,
} from "lucide-react";

import { useAudioStore } from "@/clearwave/store/audioStore";

const maxFiles = 10;
export default function UploadZone() {
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

    const onDrop = (
        accepted: File[]
    ) => {
        if (
            accepted.length === 0
        )
            return;

        const liveTracks =
            useAudioStore.getState()
                .tracks;

        if (
            liveTracks.length +
            accepted.length > maxFiles
        ) {
            toast.error(
                `Maximum ${maxFiles} audio files`
            );

            return;
        }

        const newTracks =
            accepted.map(
                (file) => ({
                    id: crypto.randomUUID(),

                    file,

                    originalUrl:
                        URL.createObjectURL(
                            file
                        ),

                    cleanedUrl:
                        undefined,

                    status:
                        "idle" as const,

                    progress: 0,

                    preset:
                        "voice" as const,

                    intensity: 50,
                })
            );

        setTracks([
            ...tracks,
            ...newTracks,
        ]);
    };

    const {
        getRootProps,
        getInputProps,
        isDragActive,
    } = useDropzone({
        accept: {
            "audio/*": [],
        },

        multiple: true,

        maxFiles: maxFiles,

        onDrop,

        onDropRejected: () => {
            toast.error(
                `Maximum ${maxFiles} audio files`
            );
        },
    });

    const clearCompleted =
        () => {
            const liveTracks =
                useAudioStore.getState()
                    .tracks;

            /*
             * CLEAN OBJECT URLS
             */
            liveTracks.forEach(
                (track) => {
                    if (
                        track.status ===
                        "done"
                    ) {
                        URL.revokeObjectURL(
                            track.originalUrl
                        );

                        if (
                            track.cleanedUrl
                        ) {
                            URL.revokeObjectURL(
                                track.cleanedUrl
                            );
                        }
                    }
                }
            );

            const remaining =
                liveTracks.filter(
                    (track) =>
                        track.status !==
                        "done"
                );

            setTracks(
                remaining
            );
        };

    return (
        <div
            className={`
                glass
                rounded-2xl
                border
                transition-all
                px-4 py-3
                flex items-center
                justify-between
                gap-4

                ${isDragActive
                    ? "border-violet-400/50 bg-violet-500/10"
                    : "border-white/10"
                }
            `}
        >
            <div className="flex items-center gap-3">
                <div
                    {...getRootProps()}
                    className="cursor-pointer"
                >
                    <input
                        {...getInputProps()}
                    />

                    <button
                        className="
                            h-11
                            px-5
                            rounded-xl
                            bg-violet-500
                            hover:bg-violet-400
                            transition-all
                            text-white
                            font-semibold
                            flex items-center
                            gap-2
                        "
                    >
                        <Upload
                            size={18}
                        />

                        Upload Audio
                    </button>
                </div>
                <button
                    onClick={
                        clearCompleted
                    }
                    className="
                        h-11
                        px-4
                        rounded-xl
                        border border-white/10
                        hover:bg-white/5
                        transition-all
                        flex items-center
                        gap-2
                    "
                >
                    <Trash2
                        size={16}
                    />

                    Clear Completed
                </button>
            </div>

            <div
                className="
                    flex items-center
                    gap-2
                    text-slate-400
                    text-sm
                    shrink-0
                "
            >
                <Files size={16} />

                {tracks.length} files
            </div>
        </div>
    );
}