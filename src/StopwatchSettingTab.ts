import { App, PluginSettingTab, Setting } from "obsidian";
import StopwatchPlugin from "../main";

const SETTING_INTERVAL_DESC = "Valid value range is 1~1000";

export class StopwatchSettingTab extends PluginSettingTab {
  plugin: StopwatchPlugin;

  constructor(app: App, plugin: StopwatchPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Settings for stopwatch plugin." });

    this.createIntervalSetting(containerEl);
    this.createFormatSetting(containerEl);
  }

  createIntervalSetting(containerEl: HTMLElement): void {
    const setting = new Setting(containerEl)
      .setName("Stopwatch refresh interval")
      .setDesc(SETTING_INTERVAL_DESC)
      .addText((text) =>
        text
          .setPlaceholder("Stopwatch refresh interval")
          .setValue(this.plugin.settings.interval.toString())
          .onChange(async (value) => {
            try {
              const i = StopwatchSettingTab.parseIntervalValue(value.trim());
              console.log(`interval set to ${i}`);
              this.plugin.settings.interval = i;
              await this.plugin.saveSettings();
              setting.descEl.textContent = SETTING_INTERVAL_DESC;
              const view = this.plugin.getView();
              if (view != null) {
                view.resetInterval();
              }
            } catch (e) {
              console.log(e);
              StopwatchSettingTab.showIntervalAlert(setting, e.toString());
            }
          })
      );
  }

  private static parseIntervalValue(src: string) {
    const value = src.trim();
    if (!value.match(/^[0-9]+$/)) {
      throw Error("Value should be an integer");
    }
    const i = parseInt(value, 10);
    if (1000 >= i && i > 0) {
      return i;
    } else {
      throw Error("Interval value out of range: " + i);
    }
  }

  private static showIntervalAlert(setting: Setting, message: string) {
    setting.descEl.empty();
    const container = setting.descEl.createDiv();
    const note = setting.descEl.createDiv();
    note.setText(SETTING_INTERVAL_DESC);
    const alert = setting.descEl.createDiv({
      cls: "settings-interval-alert",
    });
    alert.setText(message);
    console.log(message);
    container.appendChild(note);
    container.appendChild(alert);
  }

  private createFormatSetting(containerEl: HTMLElement) {
    const setting = new Setting(containerEl)
      .setName("Time Format")
      .addText((component) => {
        component
          .setValue(this.plugin.settings.format)
          .setPlaceholder("hh:mm:ss.SSS")
          .onChange(async (value) => {
            this.plugin.settings.format = value;
            this.plugin.getView().renderCurrentTime();
            await this.plugin.saveSettings();
          });
      });
    setting.descEl.innerHTML =
      "For more syntax, refer to " +
      "<a href='https://github.com/jsmreese/moment-duration-format#template-string'>format reference</a>";
  }
}
