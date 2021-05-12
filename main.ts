import { Plugin, WorkspaceLeaf } from "obsidian";

import moment from "moment";

import momentDurationFormatSetup from "moment-duration-format";
import { VIEW_TYPE_STOPWATCH } from "./src/Constants";
import { StopwatchPluginSettings } from "./src/Settings";
import { StopWatchView } from "./src/stopwatch/StopwatchView";
import { StopwatchSettingTab } from "./src/StopwatchSettingTab";

momentDurationFormatSetup(moment);

const DEFAULT_SETTINGS: StopwatchPluginSettings = {
  interval: 100,
  format: "hh:mm:ss.SSS",
};

export default class StopwatchPlugin extends Plugin {
  settings: StopwatchPluginSettings;

  async onload(): Promise<void> {
    console.log("loading stopwatch plugin");

    await this.loadSettings();

    this.addSettingTab(new StopwatchSettingTab(this.app, this));

    this.addCommand({
      id: "start-stop-stopwatch",
      name: "Start or Stop the Stopwatch",
      checkCallback: this.onStartOrStop.bind(this),
    });
    this.addCommand({
      id: "reset-stopwatch",
      name: "Reset Stopwatch",
      checkCallback: this.onReset.bind(this),
    });

    this.registerView(VIEW_TYPE_STOPWATCH, (leaf: WorkspaceLeaf) => {
      return new StopWatchView(leaf, this);
    });

    this.app.workspace.onLayoutReady(this.initLeaf.bind(this));
  }

  onStartOrStop(checking: boolean): boolean {
    const view = this.getView();

    if (checking) {
      return view !== null;
    }

    if (view !== null) {
      view.startOrStop();
      return true;
    } else {
      return false;
    }
  }

  onReset(checking: boolean): boolean {
    const view = this.getView();
    if (checking) {
      return view !== null;
    }

    if (view !== null) {
      this.getView().reset();
      return true;
    } else {
      return false;
    }
  }

  getView(): StopWatchView {
    const leaf = this.app.workspace
      .getLeavesOfType(VIEW_TYPE_STOPWATCH)
      .first();
    if (leaf !== null && leaf.view instanceof StopWatchView) {
      return leaf.view;
    } else {
      return null;
    }
  }

  onunload(): void {
    console.log("unloading plugin");
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_STOPWATCH)
      .forEach((leaf) => leaf.detach());
  }

  initLeaf(): void {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_STOPWATCH).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_STOPWATCH,
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
