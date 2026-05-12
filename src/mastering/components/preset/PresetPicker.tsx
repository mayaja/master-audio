import { useEffect, useMemo, useRef, useState } from "react";
import type { Preset } from "@/mastering/data/presets";

interface PresetPickerProps {
  presets: Preset[];
  activePreset: string;
  presetDescriptions: Record<string, string>;
  onSelectPreset: (name: string) => void;
  disabled?: boolean;
}

export default function PresetPicker({
  presets,
  activePreset,
  presetDescriptions,
  onSelectPreset,
  disabled = false,
}: PresetPickerProps) {
  const [presetSearch, setPresetSearch] = useState("");
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [presetTooltipPos, setPresetTooltipPos] = useState({ x: 0, y: 0 });
  const presetListRef = useRef<HTMLDivElement | null>(null);

  const filteredPresets = useMemo(() => {
    const keyword = presetSearch.trim().toLowerCase();

    if (!keyword) {
      return presets;
    }

    return presets.filter((preset) => preset.name.toLowerCase().includes(keyword));
  }, [presetSearch, presets]);

  const visibleActivePreset = useMemo(() => {
    return filteredPresets.some((preset) => preset.name === activePreset)
      ? activePreset
      : "";
  }, [activePreset, filteredPresets]);

  const hoveredPresetDescription = useMemo(() => {
    if (!hoveredPreset) {
      return "";
    }

    return presetDescriptions[hoveredPreset] ?? hoveredPreset;
  }, [hoveredPreset, presetDescriptions]);

  const updateTooltipPos = (event: React.MouseEvent<HTMLButtonElement>) => {
    const list = presetListRef.current;
    if (!list) {
      return;
    }

    const rect = list.getBoundingClientRect();
    setPresetTooltipPos({
      x: event.clientX - rect.left + 14,
      y: event.clientY - rect.top + 14,
    });
  };

  useEffect(() => {
    const list = presetListRef.current;
    if (!list) {
      return;
    }

    const activeButton = list.querySelector<HTMLButtonElement>('button[data-active="true"]');
    if (activeButton) {
      activeButton.scrollIntoView({ block: "nearest" });
    }
  }, [activePreset, filteredPresets]);

  return (
    <>
      <div className="relative flex h-40 flex-col gap-1.5">
        <input
          disabled={disabled}
          value={presetSearch}
          onChange={(event) => setPresetSearch(event.target.value)}
          placeholder="Search..."
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div
          ref={presetListRef}
          role="listbox"
          aria-label="Preset list"
          className="min-h-0 flex-1 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-900 p-1"
        >
          {filteredPresets.map((preset) => {
            const isActive = visibleActivePreset === preset.name;

            return (
              <button
                key={preset.name}
                type="button"
                role="option"
                aria-selected={isActive}
                data-active={isActive ? "true" : "false"}
                title={`Select preset ${preset.name}.`}
                disabled={disabled}
                onClick={() => onSelectPreset(preset.name)}
                onMouseEnter={(event) => {
                  setHoveredPreset(preset.name);
                  updateTooltipPos(event);
                }}
                onMouseLeave={() => setHoveredPreset(null)}
                onMouseMove={(event) => {
                  updateTooltipPos(event);
                }}
                className={`mb-1 w-full rounded px-2 py-1 text-left text-[11px] transition last:mb-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive
                    ? "bg-cyan-300 text-black"
                    : "text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {hoveredPresetDescription && (
          <div
            className="pointer-events-none absolute z-[75] w-[100px] rounded-md border border-cyan-300/30 bg-[#0f1c2acc] px-2 py-1.5 text-[10px] leading-snug text-cyan-100 shadow-lg"
            style={{ left: presetTooltipPos.x, top: presetTooltipPos.y }}
          >
            {hoveredPresetDescription}
          </div>
        )}
      </div>
    </>
  );
}
