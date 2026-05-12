import { useEffect, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

export function useLimiterMeter() {
  const [gr, setGr] = useState(0);

  useEffect(() => {
    let raf: number;

    const update = () => {
      const reduction = audioEngine.limiter.reduction || 0;
      setGr(Math.max(0, -reduction));

      raf = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(raf);
  }, []);

  return gr;
}