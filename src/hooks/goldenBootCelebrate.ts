export type GoldenBootCelebrateState = {
  mounted: boolean;
  prevLeaderId: string;
  prevLeaderGoals: number;
};

export function nextGoldenBootCelebrateState(
  state: GoldenBootCelebrateState,
  leaderId: string,
  leaderGoals: number
): { state: GoldenBootCelebrateState; celebrate: boolean } {
  if (!leaderId) {
    return { state, celebrate: false };
  }

  if (!state.mounted) {
    return {
      state: {
        mounted: true,
        prevLeaderId: leaderId,
        prevLeaderGoals: leaderGoals,
      },
      celebrate: true,
    };
  }

  const leaderChanged = leaderId !== state.prevLeaderId;
  const goalsIncreased =
    leaderId === state.prevLeaderId && leaderGoals > state.prevLeaderGoals;

  return {
    state: {
      mounted: true,
      prevLeaderId: leaderId,
      prevLeaderGoals: leaderGoals,
    },
    celebrate: leaderChanged || goalsIncreased,
  };
}
