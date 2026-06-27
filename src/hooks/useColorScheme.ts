import { useEffect } from "react";
import { applyColorScheme } from "../lib/colorScheme";
import { useStore } from "../store";

/** Keeps `data-theme` on `<html>` in sync with store + OS preference. */
export function useColorScheme(): void {
  const colorScheme = useStore((s) => s.colorScheme);

  useEffect(() => {
    applyColorScheme(colorScheme);

    if (colorScheme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyColorScheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [colorScheme]);
}
