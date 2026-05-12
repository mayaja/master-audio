import { useRef, useState } from "react";

interface Props {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (v: number) => void;
    bipolar?: boolean;
    tooltip?: string;
    disabled?: boolean;
}

const KNOB_TOOLTIPS: Record<string, string> = {
    Input: "Adjusts the incoming signal level before processing.",
    Output: "Adjusts the outgoing signal level after the full mastering chain.",
    Low: "Boosts or reduces the low-frequency character.",
    Mid: "Adjusts body and presence in the midrange.",
    High: "Adjusts brightness and high-frequency detail.",
    Threshold: "Sets the level where the compressor starts working.",
    Ratio: "Sets how strongly compression acts after the threshold.",
    Attack: "Sets how quickly the compressor reacts to signal peaks.",
    Release: "Sets how quickly the compressor or limiter returns to normal.",
    Drive: "Pushes level into the limiter to increase loudness.",
    Ceiling: "Limits the maximum output level to prevent clipping.",
    Lookahead: "Gives the limiter time to detect peaks before they happen.",
    Freq: "Selects the target frequency to sweep or inspect.",
    Q: "Adjusts the frequency band width; higher values are narrower.",
    Gain: "Boosts or cuts the level on the selected band.",
};

export default function Knob({
    label,
    value,
    min,
    max,
    step = 0.1,
    unit = "dB",
    onChange,
    bipolar = false,
    tooltip,
    disabled = false,
}: Props) {
    const startY = useRef(0);
    const startValue = useRef(value);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (disabled) {
            e.preventDefault();
            return;
        }

        setIsDragging(true);
        startY.current = e.clientY;
        startValue.current = value;

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (disabled) return;

        const delta = startY.current - e.clientY;

        let newValue = startValue.current + delta * step;

        newValue = Math.max(min, Math.min(max, newValue));

        onChange(Number(newValue.toFixed(3)));
    };

    const handleMouseUp = () => {
        setIsDragging(false);

        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    };

    let rotation = 0;

    if (bipolar) {
        const normalized = (value - min) / (max - min);
        const bipolarNorm = normalized * 2 - 1;

        rotation = bipolarNorm * 135 - 90;
    } else {
        const normalized = (value - min) / (max - min);

        rotation = normalized * 270 - 135 - 90;
    }

    const tooltipText = tooltip ?? KNOB_TOOLTIPS[label] ?? `Control for the ${label} parameter.`;

    return (
        <div className={`group relative flex flex-col items-center gap-2 select-none ${disabled ? "opacity-45" : ""}`}>
            <div
                onMouseDown={handleMouseDown}
                aria-label={`${label}: ${tooltipText}`}
                aria-disabled={disabled}
                className={`relative flex h-16 w-16 items-center justify-center rounded-full border ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${isDragging ? "border-emerald-400" : "border-zinc-700"
                    } bg-zinc-900`}
            >
                <div
                    className="absolute h-[2px] w-5 bg-emerald-400 rounded-full"
                    style={{
                        transform: `rotate(${rotation}deg) translateX(50%)`,
                        transformOrigin: "center left",
                        left: "50%",
                        top: "50%",
                    }}
                />

                <div className="h-11 w-11 rounded-full bg-zinc-800" />
            </div>

            <div className="pointer-events-none absolute -top-11 z-20 w-48 rounded-md border border-zinc-700 bg-zinc-950/95 px-2 py-1 text-[11px] leading-snug text-zinc-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                {tooltipText}
            </div>

            <div className="text-center">
                <p className="text-xs text-zinc-400">{label}</p>

                <p className="text-xs text-zinc-400 font-mono tabular-nums text-white">
                    {value.toFixed(2)} {unit}
                </p>
            </div>
        </div>
    );
}

// import { useRef, useState } from "react";

// interface Props {
//     label: string;
//     value: number;
//     min: number;
//     max: number;
//     step?: number;
//     unit?: string;
//     onChange: (v: number) => void;
// }

// export default function Knob({
//     label,
//     value,
//     min,
//     max,
//     step = 0.1,
//     unit = "dB",
//     onChange,
// }: Props) {
//     const startY = useRef(0);
//     const startValue = useRef(value);
//     const [isDragging, setIsDragging] =
//         useState(false);

//     const handleMouseDown = (e: React.MouseEvent) => {
//         setIsDragging(true);
//         startY.current = e.clientY;
//         startValue.current = value;

//         window.addEventListener("mousemove", handleMouseMove);
//         window.addEventListener("mouseup", handleMouseUp);
//     };

//     const handleMouseMove = (e: MouseEvent) => {
//         const delta = startY.current - e.clientY;

//         let newValue =
//             startValue.current + delta * step;

//         newValue = Math.max(min, Math.min(max, newValue));

//         onChange(Number(newValue.toFixed(2)));
//     };

//     const handleMouseUp = () => {
//         setIsDragging(false);

//         window.removeEventListener(
//             "mousemove",
//             handleMouseMove
//         );
//         window.removeEventListener(
//             "mouseup",
//             handleMouseUp
//         );
//     };

//     // const rotation =
//     //     ((value - min) / (max - min)) * 270 - 135;

//     const center = 0;

//     const range =
//         value >= center
//             ? max - center
//             : center - min;

//     const normalized =
//         (value - center) / range;

//     const rotation = normalized * 135 - 90;

//     return (
//         <div className="flex flex-col items-center gap-2 select-none">
//             <div
//                 onMouseDown={handleMouseDown}
//                 className={`relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border ${isDragging
//                     ? "border-emerald-400"
//                     : "border-zinc-700"
//                     } bg-zinc-900`}
//             >
//                 <div
//                     className="absolute h-1 w-8 bg-emerald-400 rounded-full"
//                     style={{
//                         transform: `rotate(${rotation}deg) translateX(50%)`,
//                         transformOrigin: "left center",
//                         left: "50%",
//                         top: "50%",
//                     }}
//                 />

//                 <div className="h-14 w-14 rounded-full bg-zinc-800" />
//             </div>

//             <div className="text-center">
//                 <p className="text-xs text-zinc-400">
//                     {label}
//                 </p>

//                 <p className="text-sm font-mono tabular-nums text-white">
//                     {value.toFixed(1)} {unit}
//                 </p>
//             </div>
//         </div>
//     );
// }
