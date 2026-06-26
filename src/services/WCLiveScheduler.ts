import { isApiEnabled } from "../config/apiFlags";
import { logger } from "./Logger";
import { fetchLive, isWc2026LiveDisabled, type WcLiveMatch } from "./WorldCup2026LiveClient";

const POLL_INTERVAL_MS = 60_000;

type Subscriber = (matches: WcLiveMatch[]) => void;

class WCLiveScheduler {
  private static instance: WCLiveScheduler | null = null;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private subscribers = new Set<Subscriber>();
  private lastMatches: WcLiveMatch[] = [];

  static getInstance(): WCLiveScheduler {
    if (!WCLiveScheduler.instance) {
      WCLiveScheduler.instance = new WCLiveScheduler();
    }
    return WCLiveScheduler.instance;
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    if (!this.running) this.start();
    return () => {
      this.subscribers.delete(fn);
      if (this.subscribers.size === 0) this.stop();
    };
  }

  getLastMatches(): WcLiveMatch[] {
    return this.lastMatches;
  }

  private start(): void {
    if (this.running) return;
    this.running = true;
    logger.info("WCLiveScheduler started", "WCLiveScheduler");
    void this.poll();
  }

  private stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    logger.info("WCLiveScheduler stopped (no subscribers)", "WCLiveScheduler");
  }

  private scheduleNext(): void {
    if (!this.running) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.poll(), POLL_INTERVAL_MS);
  }

  private async poll(): Promise<void> {
    if (!this.running) return;

    if (!isApiEnabled("wc2026Live") || isWc2026LiveDisabled()) {
      this.scheduleNext();
      return;
    }

    try {
      const matches = await fetchLive();
      this.lastMatches = matches;
      if (matches.length > 0) {
        logger.debug("WCLiveScheduler fetched live matches", "WCLiveScheduler", {
          count: matches.length,
        });
      }
      for (const fn of this.subscribers) {
        fn(matches);
      }
    } catch (error) {
      logger.warn("WCLiveScheduler poll failed", "WCLiveScheduler", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    this.scheduleNext();
  }
}

export { WCLiveScheduler };
