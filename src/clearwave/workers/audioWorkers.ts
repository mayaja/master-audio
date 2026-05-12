self.onmessage = async (
    event
) => {
    const {
        type,
    } = event.data;

    if (type !== "PROCESS_AUDIO")
        return;

    /*
     * SIMULATE HEAVY PROCESSING
     */
    for (
        let progress = 0;
        progress <= 100;
        progress += 5
    ) {
        await wait(120);

        self.postMessage({
            type: "PROGRESS",

            progress,
        });
    }

    self.postMessage({
        type: "DONE",
    });
};

function wait(
    ms: number
) {
    return new Promise((resolve) =>
        setTimeout(resolve, ms)
    );
}

export { };