"use client";

import { useThemeContext } from "@/components/providers/ThemeProvider";

export function useTheme() {
  const { theme, setTheme } = useThemeContext();
  const dark = theme === "dark";

  function toggle() {
    setTheme(dark ? "light" : "dark");
  }

  return { dark, toggle };
}
