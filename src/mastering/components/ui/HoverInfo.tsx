import type { ReactNode } from "react";

interface HoverInfoProps {
  text: string;
  children: ReactNode;
  className?: string;
}

export default function HoverInfo({ text, children, className = "" }: HoverInfoProps) {
  return (
    <div className={`group relative inline-flex ${className}`.trim()}>
      {children}
      <div className="pointer-events-none absolute -top-11 left-1/2 z-30 w-52 -translate-x-1/2 rounded-md border border-zinc-700 bg-zinc-950/95 px-2 py-1 text-[11px] leading-snug text-zinc-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {text}
      </div>
    </div>
  );
}
