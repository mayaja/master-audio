import { FFmpeg } from "@ffmpeg/ffmpeg";

import { fetchFile } from "@ffmpeg/util";

let ffmpegInstance:
    | FFmpeg
    | null = null;

let isLoaded = false;

export async function getFFmpeg() {
    /*
     * CREATE SINGLETON
     */
    if (!ffmpegInstance) {
        ffmpegInstance =
            new FFmpeg();
    }

    /*
     * LOAD ONLY ONCE
     */
    if (!isLoaded) {
        await ffmpegInstance.load();

        isLoaded = true;
    }

    return ffmpegInstance;
}

export { fetchFile };