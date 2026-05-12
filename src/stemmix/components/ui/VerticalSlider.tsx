import {
    useRef,
} from 'react'

import Tooltip from '@/stemmix/components/ui/Tooltip'

type Props = {
    value: number

    disabled?: boolean

    color?: string

    tooltip?: string

    onChange?: (value: number) => void
}

export default function VerticalSlider({
    value,
    disabled = false,
    color = 'from-cyan-400 to-sky-500',
    tooltip,
    onChange,
}: Props) {
    const sliderRef =
        useRef<HTMLDivElement | null>(null)

    const percent =
        (value / 2) * 100

    function updateValue(clientY: number) {
        if (
            disabled ||
            !sliderRef.current
        ) return

        const rect =
            sliderRef.current.getBoundingClientRect()

        const ratio =
            Math.min(
                1,
                Math.max(
                    0,
                    (rect.bottom - clientY) /
                    rect.height,
                ),
            )

        onChange?.(
            Number((ratio * 2).toFixed(2)),
        )
    }

    function handlePointerDown(
        e: React.PointerEvent<HTMLDivElement>,
    ) {
        if (disabled) return

        e.preventDefault()

        e.currentTarget.setPointerCapture(
            e.pointerId,
        )

        updateValue(e.clientY)
    }

    function handlePointerMove(
        e: React.PointerEvent<HTMLDivElement>,
    ) {
        if (
            disabled ||
            !e.currentTarget.hasPointerCapture(
                e.pointerId,
            )
        ) return

        updateValue(e.clientY)
    }

    function handleKeyDown(
        e: React.KeyboardEvent<HTMLDivElement>,
    ) {
        if (disabled) return

        const step =
            e.shiftKey ? 0.1 : 0.01

        if (
            e.key !== 'ArrowUp' &&
            e.key !== 'ArrowDown' &&
            e.key !== 'Home' &&
            e.key !== 'End'
        ) return

        e.preventDefault()

        if (e.key === 'Home') {
            onChange?.(0)
            return
        }

        if (e.key === 'End') {
            onChange?.(2)
            return
        }

        const direction =
            e.key === 'ArrowUp' ? 1 : -1

        onChange?.(
            Number(
                Math.min(
                    2,
                    Math.max(
                        0,
                        value + direction * step,
                    ),
                ).toFixed(2),
            ),
        )
    }

    const slider = (
        <div
            ref={sliderRef}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-valuemin={0}
            aria-valuemax={2}
            aria-valuenow={value}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onKeyDown={handleKeyDown}
            className={[
                'relative flex h-[240px] w-[54px] touch-none select-none items-center justify-center',
                disabled
                    ? 'cursor-not-allowed opacity-70'
                    : 'cursor-ns-resize',
            ].join(' ')}
        >

            {/* Rail */}
            <div className="absolute top-3 bottom-3 w-[6px] rounded-full bg-white/[0.05]" />

            {/* Active Fill */}
            <div
                className={`absolute bottom-2 w-[8px] rounded-full bg-gradient-to-t ${color} shadow-[0_0_12px_rgba(255,255,255,0.12)]`}
                style={{
                    height: `${percent * 0.82}%`,
                }}
            />

            {/* dB Marks */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col items-center justify-between py-2 text-[8px] font-bold text-zinc-600">
                <span>+6</span>
                <span>0</span>
                <span>-6</span>
                <span>-12</span>
            </div>

            {/* Thumb */}
            <div
                className="pointer-events-none absolute left-1/2 z-20 h-[42px] w-[20px] -translate-x-1/2 rounded-[10px] border border-white/[0.16] bg-gradient-to-b from-[#f8fafc] via-[#d4d4d8] to-[#9ca3af] shadow-[0_4px_10px_rgba(0,0,0,0.32),inset_0_1px_2px_rgba(255,255,255,0.8)] transition-all duration-75"
                style={{
                    bottom: `calc(${percent * 0.84}% + 2px)`,
                }}
            >
                {/* Grip */}
                <div className="absolute inset-x-[4px] top-1/2 flex -translate-y-1/2 flex-col gap-[1.5px]">
                    <div className="h-[1px] rounded-full bg-black/20" />
                    <div className="h-[1px] rounded-full bg-black/20" />
                    <div className="h-[1px] rounded-full bg-black/20" />
                </div>
            </div>

        </div>
    )

    if (!tooltip) return slider

    return (
        <Tooltip
            content={tooltip}
            className="inline-flex"
        >
            {slider}
        </Tooltip>
    )
}
