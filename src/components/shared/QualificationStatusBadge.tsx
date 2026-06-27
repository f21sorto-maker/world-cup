import { resolveQualificationDisplay } from "../../lib/qualificationDisplay";
import type { QualificationStatus } from "../../types";
import styles from "./QualificationStatusBadge.module.css";

type Props = {
  qual: QualificationStatus;
  size?: "sm" | "xs";
};

export function QualificationStatusBadge({ qual, size = "xs" }: Props) {
  const display = resolveQualificationDisplay(qual);
  const sizeClass = size === "xs" ? styles.xs : styles.sm;
  const variantClass =
    display.variant === "confirmed-qualified"
      ? styles.confirmedQualified
      : display.variant === "projected-qualified"
        ? styles.projectedQualified
        : display.variant === "confirmed-eliminated"
          ? styles.confirmedEliminated
          : display.variant === "projected-eliminated"
            ? styles.projectedEliminated
            : styles.inContention;

  return (
    <span
      className={`${styles.badge} ${sizeClass} ${variantClass}`}
      title={display.hint}
      aria-label={display.label}
    >
      {display.shortLabel}
    </span>
  );
}
