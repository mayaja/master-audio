import Tooltip from '@/stemmix/components/ui/Tooltip'

type Props = {
    enabled?: boolean

    disabled?: boolean

    tooltip?: string

    onChange?: (
        enabled: boolean,
    ) => void
}

export default function Toggle({
    enabled = false,
    disabled = false,
    tooltip,
    onChange,
}: Props) {
    const toggle = (
        <button
            disabled={disabled}
            onClick={() => {
                if (disabled) return

                onChange?.(!enabled)
            }}
            className={[
                'relative h-5 w-9 rounded-full border transition-all duration-200',

                disabled
                    ? 'cursor-not-allowed border-white/[0.04] bg-zinc-800 opacity-40'
                    : enabled
                        ? 'border-cyan-400/40 bg-cyan-500/20 shadow-[0_0_14px_rgba(34,211,238,0.25)]'
                        : 'border-white/[0.06] bg-white/[0.04]',
            ].join(' ')}
        >
            <div
                className={[
                    'absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all duration-200',

                    disabled
                        ? 'left-[2px] bg-zinc-600'
                        : enabled
                            ? 'left-[18px] bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.55)]'
                            : 'left-[2px] bg-zinc-400',
                ].join(' ')}
            />
        </button>
    )

    if (!tooltip) return toggle

    return (
        <Tooltip content={tooltip}>
            {toggle}
        </Tooltip>
    )
}
