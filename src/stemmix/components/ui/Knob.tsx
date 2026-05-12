import Tooltip from '@/stemmix/components/ui/Tooltip'

type Props = {
    label: string

    value?: number

    disabled?: boolean

    tooltip?: string

    onChange?: (value: number) => void
}

export default function Knob({
    label,
    value = 0,
    disabled = false,
    tooltip,
    onChange,
}: Props) {
    function handleChange(
        e: React.ChangeEvent<HTMLInputElement>,
    ) {
        if (disabled) return

        onChange?.(
            Number(e.target.value),
        )
    }

    // 270° ARC
    const rotation =
        value * 135

    const knob = (
        <div
            className={[
                'flex flex-col items-center gap-1.5 transition-opacity',

                disabled
                    ? 'pointer-events-none opacity-40'
                    : '',
            ].join(' ')}
        >

            <div className="relative flex h-[48px] w-[48px] items-center justify-center">

                {/* Invisible range */}
                <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={value}
                    disabled={disabled}
                    onChange={handleChange}
                    className="absolute inset-0 z-20 cursor-pointer opacity-0"
                />

                {/* Outer glow */}
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_70%)]" />

                {/* Arc ring */}
                <div className="absolute inset-0 rounded-full border border-white/[0.08]" />

                {/* Inner body */}
                <div className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border border-white/[0.06] bg-gradient-to-b from-[#1a2333] via-[#111827] to-[#070b14] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.45)]">

                    {/* Top gloss */}
                    <div className="absolute inset-x-2 top-[4px] h-[8px] rounded-full bg-white/[0.04] blur-[2px]" />

                    {/* Center dot */}
                    <div className="absolute h-[4px] w-[4px] rounded-full bg-white/[0.14]" />

                    {/* Indicator */}
                    <div
                        className="absolute bottom-1/2 left-1/2 h-[14px] w-[2.5px] origin-bottom rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)]"
                        style={{
                            transform: `
                                translateX(-50%)
                                rotate(${rotation}deg)
                            `,
                        }}
                    />
                </div>

                {/* Center detent */}
                <div className="pointer-events-none absolute top-[1px] h-[5px] w-[1px] rounded-full bg-white/30" />
            </div>

            <span className="text-[8px] uppercase tracking-[0.18em] text-zinc-600">
                {label}
            </span>
        </div>
    )

    if (!tooltip) return knob

    return (
        <Tooltip
            content={tooltip}
            className="inline-flex"
        >
            {knob}
        </Tooltip>
    )
}
