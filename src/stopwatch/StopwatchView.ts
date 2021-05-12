import { ItemView, WorkspaceLeaf } from "obsidian";
import { StopwatchModel } from "./StopwatchModel";
import { VIEW_TYPE_STOPWATCH } from "../Constants";
import StopwatchPlugin from "../../main";
import { StopwatchState } from "./StopwatchState";

export class StopWatchView extends ItemView {
  private startStopButton: HTMLButtonElement;
  private plugin: StopwatchPlugin;
  private timeDiv: HTMLDivElement;
  private resetButton: HTMLButtonElement;
  private model: StopwatchModel;
  private interval: number;

  constructor(leaf: WorkspaceLeaf, plugin: StopwatchPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.model = new StopwatchModel();
  }

  getDisplayText(): string {
    return "Stopwatch";
  }

  getViewType(): string {
    return VIEW_TYPE_STOPWATCH;
  }

  getIcon(): string {
    return "clock";
  }

  async onOpen(): Promise<void> {
    const dom = this.contentEl;

    this.timeDiv = dom.createEl("div", {
      text: "",
      cls: "stopwatch-time",
    });
    this.startStopButton = dom.createEl("button", {
      text: "Start",
    });
    this.resetButton = dom.createEl("button", {
      text: "Reset",
    });
    this.renderCurrentTime();

    this.startStopButton.onClickEvent(() => {
      this.startOrStop();
      return true;
    });
    this.resetButton.onClickEvent(() => {
      this.reset();
    });
  }

  startOrStop(): void {
    if (this.model.state == StopwatchState.STARTED) {
      this.stop();
    } else {
      this.start();
    }
  }

  start(): void {
    this.model.start();
    this.startStopButton.textContent = "Pause";
    this.interval = this.createInterval();
    this.registerInterval(this.interval);
  }

  stop(): void {
    this.startStopButton.textContent = "Start";
    window.clearInterval(this.interval);
    this.interval = null;
    this.model.stop();
  }

  reset(): void {
    this.startStopButton.textContent = "Start";
    this.model.reset();
    window.clearInterval(this.interval);
    this.interval = null;
    this.renderCurrentTime();
  }

  resetInterval(): void {
    if (this.interval != null) {
      window.clearInterval(this.interval);
      this.interval = this.createInterval();
    }
  }

  createInterval(): number {
    return window.setInterval(() => {
      this.renderCurrentTime();
    }, this.plugin.settings.interval);
  }

  renderCurrentTime(): void {
    this.timeDiv.textContent = this.model.getCurrentTimeString(
      this.plugin.settings.format
    );
  }
}
