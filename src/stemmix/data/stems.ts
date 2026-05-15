export const stems = [
    {
        id: 'vocals',
        name: 'Vocals',
        short: 'VOX',
        color: 'from-violet-500 to-fuchsia-500',
    },
    {
        id: 'instrumental',
        name: 'Instrumental',
        short: 'INST',
        color: 'from-cyan-400 to-teal-500',
    },
    {
        id: 'drums',
        name: 'Drums',
        short: 'DRM',
        color: 'from-emerald-400 to-green-500',
    },
    {
        id: 'bass',
        name: 'Bass',
        short: 'BASS',
        color: 'from-sky-400 to-blue-500',
    },
    {
        id: 'other',
        name: 'Other',
        short: 'MISC',
        color: 'from-orange-400 to-amber-500',
    },
]

export type StemMode = '2stem' | '4stem'

export const stemModeOptions: Array<{
    id: StemMode
    label: string
    description: string
}> = [
    {
        id: '2stem',
        label: '2 Channel',
        description: 'Vocals and merged instrumental',
    },
    {
        id: '4stem',
        label: '4 Channel',
        description: 'Vocals, drums, bass, other',
    },
]

export const stemIdsByMode: Record<StemMode, string[]> = {
    '2stem': [
        'vocals',
        'instrumental',
    ],
    '4stem': [
        'vocals',
        'drums',
        'bass',
        'other',
    ],
}

export function getStemsForMode(
    mode: StemMode,
) {
    const ids = stemIdsByMode[mode]

    return stems.filter((stem) =>
        ids.includes(stem.id),
    )
}
