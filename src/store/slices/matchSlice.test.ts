import { describe, expect, it } from "vitest";
import { createMatchSlice, getLockedSet, type MatchSliceState } from "./matchSlice";

function createTestSlice() {
  let state: MatchSliceState = createMatchSlice(
    (fn) => {
      state = { ...state, ...fn(state) };
    },
    () => state
  );
  return {
    getState: () => state,
    actions: state
  };
}

describe("matchSlice lockedMatchIds", () => {
  it("adds locked match ids without duplicates", () => {
    const { getState, actions } = createTestSlice();

    actions.addLockedMatchId("m1");
    actions.addLockedMatchId("m2");
    actions.addLockedMatchId("m1");

    expect(getState().lockedMatchIds).toEqual({ m1: true, m2: true });
    expect(getLockedSet(getState())).toEqual(new Set(["m1", "m2"]));
  });
});
