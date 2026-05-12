import { getFFmpeg, fetchFile } from "@/clearwave/lib/ffmpeg";

export async function cleanAudioWithFFmpeg(
    file: File,
    intensity: number,
    onProgress?: (
        value: number
    ) => void
): Promise<string> {
    const ffmpeg = await getFFmpeg();

    /*
     * INPUT / OUTPUT
     */
    const inputName =
        "input.wav";

    const outputName =
        "output.wav";

    /*
     * WRITE FILE
     */
    await ffmpeg.writeFile(
        inputName,
        await fetchFile(file)
    );

    onProgress?.(20);

    /*
     * DENOISE STRENGTH
     */
    const normalized =
        intensity / 100;

    /*
     * FFT DENOISE
     *
     * nr = noise reduction
     */
    // const noiseReduction =
    //     6 + normalized * 18;

    const noiseReduction = 12 + normalized * 24;

    /*
     * HIGH PASS
     */
    const highpass =
        70 + normalized * 40;

    /*
     * FILTER CHAIN
     */
    const filter = [
        `highpass=f=${highpass}`,
        `afftdn=nr=${noiseReduction}`,
        `loudnorm`
    ].join(",");

    onProgress?.(40);

    /*
     * RUN FFMPEG
     */
    await ffmpeg.exec([
        "-i",
        inputName,
        "-af",
        filter,
        outputName
    ]);

    onProgress?.(85);

    /*
     * READ OUTPUT
     */
    const data =
        await ffmpeg.readFile(
            outputName
        ) as Uint8Array;

    const uint8 =
        new Uint8Array(data);

    const blob =
        new Blob(
            [uint8.buffer],
            {
                type: "audio/wav"
            }
        );

    const url =
        URL.createObjectURL(blob);

    onProgress?.(100);

    return url;
}