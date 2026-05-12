import Tooltip from '@/stemmix/components/ui/Tooltip'

type Props = {
    value?: number

    disabled?: boolean

    tooltip?: string

    onChange?: (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => void
}

export default function HorizontalSlider({
    value = 1,
    disabled = false,
    tooltip,
    onChange,
}: Props) {
    const slider = (
        <div className="relative flex h-5 items-center">

            {/* Track */}
            <div className="absolute h-[4px] w-full rounded-full bg-white/[0.06]" />

            {/* Fill */}
            <div
                className={[
                    'absolute left-0 h-[4px] rounded-full transition-all shadow-[0_0_10px_rgba(124,140,255,0.18)]',

                    disabled
                        ? 'bg-zinc-700'
                        : 'bg-gradient-to-r from-[#7c8cff] to-[#a855f7]',
                ].join(' ')}
                style={{
                    width: `${(value / 2) * 100}%`,
                }}
            />

            {/* Input */}
            <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={value}
                disabled={disabled}
                onChange={onChange}
                className={[
                    'absolute inset-0 w-full appearance-none bg-transparent',
                    disabled
                        ? 'cursor-not-allowed opacity-40'
                        : 'cursor-pointer',
                ].join(' ')}
            />
        </div>
    )

    if (!tooltip) return slider

    return (
        <Tooltip
            content={tooltip}
            className="block"
        >
            {slider}
        </Tooltip>
    )
}
