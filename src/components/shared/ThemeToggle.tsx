import type { ColorSchemePreference } from "../../lib/colorScheme";
import { useStore } from "../../store";

const OPTIONS: { id: ColorSchemePreference; label: string; shortLabel: string; title: string }[] = [
  { id: "light", label: "Light", shortLabel: "L", title: "Light theme" },
  { id: "dark", label: "Dark", shortLabel: "D", title: "Dark theme" },
  { id: "system", label: "System", shortLabel: "Auto", title: "Match system appearance" },
];

type Props = {
  compact?: boolean;
  className?: string;
};

export function ThemeToggle({ compact, className = "" }: Props) {
  const colorScheme = useStore((s) => s.colorScheme);
  const setColorScheme = useStore((s) => s.setColorScheme);

  return (
    <div
      className={`theme-toggle ${compact ? "theme-toggle--compact" : ""} ${className}`.trim()}
      role="group"
      aria-label="Color theme"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`theme-toggle-btn ${colorScheme === opt.id ? "theme-toggle-btn--active" : ""}`}
          aria-pressed={colorScheme === opt.id}
          title={opt.title}
          onClick={() => setColorScheme(opt.id)}
        >
          {compact ? opt.shortLabel : opt.label}
        </button>
      ))}
    </div>
  );
}
