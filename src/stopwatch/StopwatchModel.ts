import moment from "moment";
import { StopwatchState } from "./StopwatchState";

export class StopwatchModel {
  private startedAt: Date;
  private pausedOffset: number;
  state: StopwatchState;

  constructor() {
    this.pausedOffset = 0;
    this.state = StopwatchState.INITIALIZED;
  }

  getCurrentTimeString(format: string): string {
    const cur = new Date();
    if (this.startedAt != null) {
      const elapsed =
        cur.getTime() - this.startedAt.getTime() + this.pausedOffset; // in milli seconds
      return this.getTimeString(elapsed, format);
    } else {
      return this.getTimeString(0, format);
    }
  }

  getTimeString(elapsed: number, format: string): string {
    return moment.duration(elapsed).format(format, {
      trim: false,
    });
  }

  start(): void {
    this.state = StopwatchState.STARTED;
    this.startedAt = new Date();
  }

  stop(): void {
    this.pausedOffset =
      new Date().getTime() - this.startedAt.getTime() + this.pausedOffset;
    this.state = StopwatchState.STOPPED;
  }

  reset(): void {
    this.state = StopwatchState.INITIALIZED;
    this.startedAt = null;
    this.pausedOffset = 0;
  }
}
