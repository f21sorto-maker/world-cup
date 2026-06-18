import type { Match, PolymarketMatchMarket, Team, TournamentSimulationResult } from "../types";
import { simulateTournamentOutcomes } from "../lib/tournament";

type SimulationRequest = {
  requestId: number;
  teams: Team[];
  matches: Match[];
  knockoutMarkets: PolymarketMatchMarket[];
  iterations: number;
  seed: number;
};

type SimulationResponse = {
  requestId: number;
  result?: TournamentSimulationResult;
  error?: string;
};

self.onmessage = (event: MessageEvent<SimulationRequest>) => {
  const { requestId, teams, matches, knockoutMarkets, iterations, seed } = event.data;

  try {
    const result = simulateTournamentOutcomes(teams, matches, knockoutMarkets, iterations, seed);
    self.postMessage({ requestId, result } satisfies SimulationResponse);
  } catch (error) {
    self.postMessage({
      requestId,
      error: error instanceof Error ? error.message : "Simulation failed"
    } satisfies SimulationResponse);
  }
};

export {};
