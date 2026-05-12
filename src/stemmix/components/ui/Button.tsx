import type {
    ButtonHTMLAttributes,
    ReactNode,
} from 'react'

type Props =
    ButtonHTMLAttributes<HTMLButtonElement> & {
        children: ReactNode
    }

export default function Button({
    children,
    className = '',
    ...props
}: Props) {
    return (
        <button
            {...props}
            className={[
                'rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-300 transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-white',
                className,
            ].join(' ')}
        >
            {children}
        </button>
    )
}