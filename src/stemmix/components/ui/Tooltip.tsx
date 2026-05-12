import type {
    ReactNode,
} from 'react'

type TooltipSide =
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'

type Props = {
    content: ReactNode
    children: ReactNode
    side?: TooltipSide
    className?: string
}

const sideClassName: Record<TooltipSide, string> = {
    top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
    bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
    left: 'right-full top-1/2 mr-2 -translate-y-1/2',
    right: 'left-full top-1/2 ml-2 -translate-y-1/2',
}

export default function Tooltip({
    content,
    children,
    side = 'top',
    className = 'inline-flex',
}: Props) {
    return (
        <div
            className={[
                'group/tooltip relative',
                className,
            ].join(' ')}
        >
            {children}

            <span
                className={[
                    'pointer-events-none absolute z-[10050] w-max max-w-[240px] rounded-lg border border-white/[0.08] bg-[#090d18]/95 px-3 py-2 text-center text-[10px] font-medium leading-snug text-zinc-200 opacity-0 shadow-[0_12px_36px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-150 group-hover/tooltip:opacity-100',
                    sideClassName[side],
                ].join(' ')}
                role="tooltip"
            >
                {content}
            </span>
        </div>
    )
}
