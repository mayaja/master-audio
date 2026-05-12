export async function fakeCleanProcessor(
    onProgress: (
        value: number
    ) => void
) {
    return new Promise<void>((resolve) => {
        let progress = 0;

        const interval = setInterval(() => {
            progress += Math.random() * 18;

            if (progress >= 100) {
                progress = 100;

                onProgress(progress);

                clearInterval(interval);

                setTimeout(() => {
                    resolve();
                }, 400);

                return;
            }

            onProgress(progress);
        }, 250);
    });
}