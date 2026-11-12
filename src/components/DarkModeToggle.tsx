"use client";

import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const isDark = !dark;
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.cookie = "theme=dark; path=/; max-age=31536000";
    } else {
      document.documentElement.classList.remove("dark");
      document.cookie = "theme=light; path=/; max-age=31536000";
    }
  }

  return (
    <button
      onClick={toggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${dark ? "bg-primary" : "bg-muted"}`}
      role="switch"
      aria-checked={dark}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform ${dark ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}
