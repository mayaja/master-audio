import {
    useEffect,
    useRef,
} from "react";

import AudioWorker from "./../workers/audioWorkers?worker";

export function useAudioWorker(
    onProgress: (
        progress: number
    ) => void,

    onDone: () => void
) {
    const workerRef =
        useRef<Worker | null>(null);

    useEffect(() => {
        /*
         * CREATE WORKER
         */
        const worker =
            new AudioWorker();

        worker.onmessage = (
            event
        ) => {
            const {
                type,
                progress,
            } = event.data;

            if (type === "PROGRESS") {
                onProgress(progress);
            }

            if (type === "DONE") {
                onDone();
            }
        };

        worker.onerror = (
            error
        ) => {
            console.error(
                "Worker Error:",
                error
            );
        };

        workerRef.current =
            worker;

        return () => {
            worker.terminate();
        };
    }, []);

    const startProcessing =
        () => {
            workerRef.current?.postMessage(
                {
                    type:
                        "PROCESS_AUDIO",
                }
            );
        };

    return {
        startProcessing,
    };
}