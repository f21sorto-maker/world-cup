import type { QualificationStatus } from "../types";

/** Visual + copy bucket for qualification UI (tables, badges, bentos). */
export type QualificationDisplayVariant =
  | "confirmed-qualified"
  | "projected-qualified"
  | "confirmed-eliminated"
  | "projected-eliminated"
  | "in-contention";

export type QualificationDisplay = {
  variant: QualificationDisplayVariant;
  /** Primary label, e.g. "Confirmed · Qualified" */
  label: string;
  /** Compact badge text */
  shortLabel: string;
  /** Row / chip CSS modifier */
  rowClass: string;
  /** Tooltip / helper copy */
  hint: string;
};

function isConfirmedEliminated(qual: QualificationStatus): boolean {
  return qual.status === "eliminated" || (!qual.canQualify && qual.lifeState === "eliminated");
}

function isConfirmedQualified(qual: QualificationStatus): boolean {
  return qual.status === "qualified" && qual.certainty === "confirmed";
}

function isProjectedQualified(qual: QualificationStatus): boolean {
  if (!qual.canQualify) return false;
  if (qual.status === "qualified" && qual.certainty !== "confirmed") return true;
  if (qual.status === "at_risk") return true;
  return false;
}

function isProjectedEliminated(qual: QualificationStatus): boolean {
  if (isConfirmedEliminated(qual)) return false;
  if (qual.status === "projected_out") return true;
  if (!qual.canQualify) return false;
  if (qual.status === "pending" && qual.lifeState === "alive") return true;
  return false;
}

/**
 * Universal qualification copy + styling.
 *
 * Confirmed = mathematically final (FIFA group stage locked in or no path remains).
 * Projected = live table / remaining matches can still change the outcome.
 */
export function resolveQualificationDisplay(qual: QualificationStatus): QualificationDisplay {
  if (isConfirmedQualified(qual)) {
    return {
      variant: "confirmed-qualified",
      label: "Confirmed · Qualified",
      shortLabel: "Conf. Qual ✓",
      rowClass: "qual-row--confirmed-qualified",
      hint: "Mathematically through — group stage complete and final position is top two.",
    };
  }

  if (isConfirmedEliminated(qual)) {
    return {
      variant: "confirmed-eliminated",
      label: "Confirmed · Eliminated",
      shortLabel: "Eliminated ✕",
      rowClass: "qual-row--confirmed-eliminated",
      hint:
        qual.eliminationReason ??
        "Mathematically eliminated — no remaining results can change knockout qualification.",
    };
  }

  if (isProjectedQualified(qual)) {
    return {
      variant: "projected-qualified",
      label: "Projected · To Qualify",
      shortLabel: "Proj. Qualify",
      rowClass: "qual-row--projected-qualified",
      hint:
        qual.reason ??
        "Currently on course to advance, but remaining group matches could still change the outcome.",
    };
  }

  if (isProjectedEliminated(qual)) {
    return {
      variant: "projected-eliminated",
      label: "Projected · To Be Eliminated",
      shortLabel: "Proj. Out",
      rowClass: "qual-row--projected-eliminated",
      hint:
        qual.reason ??
        "Likely out based on live standings, but not yet mathematically eliminated.",
    };
  }

  return {
    variant: "in-contention",
    label: "In Contention",
    shortLabel: "Live",
    rowClass: "qual-row--in-contention",
    hint: qual.reason ?? "Still fighting for position — outcome depends on remaining matches.",
  };
}
