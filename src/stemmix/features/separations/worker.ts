// Inisialisasi worker langsung dan ekspor agar bisa digunakan di Header.tsx
export const separatorWorker: Worker = new Worker(
    new URL(
        '@/stemmix/workers/separator.worker.ts',
        import.meta.url,
    ),
    {
        type: 'module',
    },
)

export function getSeparatorWorker() {
    return separatorWorker
}

export function releaseSeparatorWorker() {
    separatorWorker?.terminate()

}
