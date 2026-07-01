import { useEffect, useState } from "react";
import styles from "./CrownBadge.module.css";

type Props = {
  className?: string;
  /** Brief bounce when the golden boot leader changes or scores. */
  celebrate?: boolean;
  title?: string;
  size?: "sm" | "md";
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export function CrownBadge({
  className = "",
  celebrate = false,
  title = "Golden Boot leader",
  size = "md",
}: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const sizeClass = size === "md" ? styles.sizeMd : styles.sizeSm;
  const motionClass = reducedMotion ? styles.reducedMotion : "";

  return (
    <span
      className={`${styles.crown} ${sizeClass} ${celebrate ? styles.celebrate : ""} ${motionClass} ${className}`.trim()}
      role="img"
      aria-label={title}
      title={title}
    >
      <span className={styles.sparkle} aria-hidden />
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden>
        <path
          fill="currentColor"
          d="M3 7.5 6.2 4.3l2.1 3.9L12 4l3.7 4.2 2.1-3.9L21 7.5 19.5 19H4.5L3 7.5Zm3.9-.8 1.4 2.6.9-1.7.9 1.7 1.4-2.6 1.1 1.1-.9 8.2h-6.8l-.9-8.2 1.1-1.1Z"
        />
      </svg>
    </span>
  );
}
