"use client";

import { useEffect, useState } from "react";

const SCALE_MIN = 75;
const SCALE_MAX = 150;
const SCALE_DEFAULT = 100;

function getStoredScale(): number {
  if (typeof document === "undefined") return SCALE_DEFAULT;
  const match = document.cookie.match(/uiScale=(\d+)/);
  return match ? Number(match[1]) : SCALE_DEFAULT;
}

function applyScale(scale: number) {
  document.documentElement.style.fontSize = `${scale}%`;
  document.cookie = `uiScale=${scale}; path=/; max-age=31536000`;
}

export function UIScaleSlider() {
  const [scale, setScale] = useState(SCALE_DEFAULT);

  useEffect(() => {
    const stored = getStoredScale();
    setScale(stored);
    applyScale(stored);
  }, []);

  function handleChange(value: number) {
    setScale(value);
    applyScale(value);
  }

  function handleReset() {
    handleChange(SCALE_DEFAULT);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="range"
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={5}
            value={scale}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-sm text-muted-foreground w-12 text-right">{scale}%</span>
        </div>
        {scale !== SCALE_DEFAULT && (
          <button
            onClick={handleReset}
            className="ml-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
