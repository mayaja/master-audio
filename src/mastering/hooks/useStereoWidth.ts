import { useEffect, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

export function useStereoWidth() {
  const [mid, setMid] = useState(0);
  const [side, setSide] = useState(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const v = audioEngine.getMidSideWidth();

      const safeWidth = Number.isFinite(v.width) ? Math.max(0, v.width) : 0;

      setMid(v.mid);
      setSide(v.side);
      setWidth(safeWidth);
      raf = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(raf);
  }, []);

  return { mid, side, width };
}