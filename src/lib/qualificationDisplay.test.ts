import { describe, expect, it } from "vitest";
import { resolveQualificationDisplay } from "./qualificationDisplay";
import type { QualificationStatus } from "../types";

function qual(partial: Partial<QualificationStatus> & Pick<QualificationStatus, "status">): QualificationStatus {
  return {
    certainty: "projected_weak",
    lifeState: "alive",
    canQualify: true,
    projectionScore: 50,
    reason: "test",
    ...partial,
  };
}

describe("resolveQualificationDisplay", () => {
  it("labels confirmed top-two as Confirmed · Qualified", () => {
    const d = resolveQualificationDisplay(
      qual({ status: "qualified", certainty: "confirmed", lifeState: "projected", projectionScore: 100 })
    );
    expect(d.variant).toBe("confirmed-qualified");
    expect(d.label).toContain("Confirmed");
    expect(d.label).toContain("Qualified");
  });

  it("labels projected top-two as Projected · To Qualify", () => {
    const d = resolveQualificationDisplay(
      qual({ status: "qualified", certainty: "projected_weak", lifeState: "alive" })
    );
    expect(d.variant).toBe("projected-qualified");
    expect(d.shortLabel).toBe("Proj. Qualify");
  });

  it("labels mathematical elimination as Confirmed · Eliminated", () => {
    const d = resolveQualificationDisplay(
      qual({
        status: "eliminated",
        certainty: "confirmed",
        canQualify: false,
        lifeState: "eliminated",
        projectionScore: 0,
      })
    );
    expect(d.variant).toBe("confirmed-eliminated");
    expect(d.label).toContain("Eliminated");
  });

  it("labels fourth-place alive as Projected · To Be Eliminated", () => {
    const d = resolveQualificationDisplay(
      qual({ status: "pending", lifeState: "alive", canQualify: true, projectionScore: 22 })
    );
    expect(d.variant).toBe("projected-eliminated");
  });

  it("labels third-place race as Projected · To Qualify", () => {
    const d = resolveQualificationDisplay(
      qual({ status: "at_risk", certainty: "projected_weak", lifeState: "alive" })
    );
    expect(d.variant).toBe("projected-qualified");
  });
});
