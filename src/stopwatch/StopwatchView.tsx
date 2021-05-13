import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_STOPWATCH } from "../Constants";
import StopwatchPlugin from "../../main";
import React from "react";
import ReactDOM from "react-dom";
import { StopwatchElement } from "./ui/StopwatchElement";

export class StopWatchView extends ItemView {
  private readonly plugin: StopwatchPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: StopwatchPlugin) {
    super(leaf);
    this.plugin = plugin;
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

    ReactDOM.render(<StopwatchElement plugin={this.plugin} />, dom);
  }

  startOrStop(): void {
    const el = this.contentEl.querySelector("button.start-or-stop");
    (el as HTMLButtonElement).click();
  }

  reset(): void {
    const el = this.contentEl.querySelector("button.reset");
    (el as HTMLButtonElement).click();
  }

  resetInterval(): void {
    const el = this.contentEl.querySelector("button.reset-interval");
    (el as HTMLButtonElement).click();
  }
}
