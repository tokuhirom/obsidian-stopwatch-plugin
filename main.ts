import {App, ItemView, Plugin, PluginSettingTab, Setting, WorkspaceLeaf} from 'obsidian';

// @ts-ignore
import moment from "moment";

// @ts-ignore
import momentDurationFormatSetup from "moment-duration-format";

momentDurationFormatSetup(moment)

interface StopwatchPluginSettings {
	interval: number,
	format: string
}

const DEFAULT_SETTINGS: StopwatchPluginSettings = {
	interval: 100,
	format: 'hh:mm:ss.SSS'
}

const VIEW_TYPE_STOPWATCH = 'online.tokuhirom.obsidian-stopwatch-plugin';

export default class StopwatchPlugin extends Plugin {
	settings: StopwatchPluginSettings;
	view: StopWatchView;

	async onload() {
		console.log('loading stopwatch plugin');

		await this.loadSettings();

		this.addSettingTab(new StopwatchSettingTab(this.app, this));

		this.addCommand({
			id: 'start-stopwatch',
			name: 'Start Stopwatch',
			callback: () => {
				this.view.start();
			},
			checkCallback(checking) {
				return this.view != null
			}
		});
		this.addCommand({
			id: 'stop-stopwatch',
			name: 'Stop Stopwatch',
			callback() {
				this.view.stop();
			},
			checkCallback(checking) {
				return this.view != null
			}
		});
		this.addCommand({
			id: 'reset-stopwatch',
			name: 'Reset Stopwatch',
			callback() {
				this.view.reset();
			},
			checkCallback(checking) {
				return this.view != null
			}
		});

		this.registerView(VIEW_TYPE_STOPWATCH, (leaf: WorkspaceLeaf) => {
			this.view = new StopWatchView(leaf, this);
			return this.view;
		});

		this.app.workspace.onLayoutReady(this.initLeaf.bind(this))
	}

	onunload() {
		console.log('unloading plugin');
		this.app.workspace.getLeavesOfType(VIEW_TYPE_STOPWATCH).forEach((leaf) => leaf.detach());
	}

	initLeaf(): void {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE_STOPWATCH).length) {
			return;
		}
		this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_STOPWATCH,
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

const SETTING_INTERVAL_DESC = 'Valid value range is 1~1000'

class StopwatchSettingTab extends PluginSettingTab {
	plugin: StopwatchPlugin;

	constructor(app: App, plugin: StopwatchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;
		let p: HTMLElement = containerEl

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for stopwatch plugin.'});

		this.createIntervalSetting(containerEl)
		this.createFormatSetting(containerEl);
	}

	createIntervalSetting(containerEl: HTMLElement) {
		const setting = new Setting(containerEl)
				.setName('Stopwatch refresh interval')
				.setDesc(SETTING_INTERVAL_DESC)
				.addText(text => text
						.setPlaceholder('Stopwatch refresh interval')
						.setValue(this.plugin.settings.interval.toString())
						.onChange(async (value) => {
							try {
								const i = this.parseIntervalValue(value.trim());
								console.log(`interval set to ${i}`)
								this.plugin.settings.interval = i
								await this.plugin.saveSettings();
								setting.descEl.textContent = SETTING_INTERVAL_DESC
								if (this.plugin.view != null) {
									this.plugin.view.resetInterval()
								}
							} catch (e) {
								console.log(e)
								this.showIntervalAlert(setting, e.toString())
							}
						}));
	}

	private parseIntervalValue(src: string) {
		const value = src.trim()
		if (!value.match(/^[0-9]+$/)) {
			throw Error("Value should be an integer")
		}
		const i = parseInt(value, 10)
		if (1000 >= i && i > 0) {
			return i
		} else {
			throw Error("Interval value out of range: " + i)
		}
	}

	private showIntervalAlert(setting: Setting, message: string) {
		setting.descEl.empty()
		const container = setting.descEl.createDiv()
		const note = setting.descEl.createDiv()
		note.setText(SETTING_INTERVAL_DESC)
		const alert = setting.descEl.createDiv({
			cls: 'settings-interval-alert'
		})
		alert.setText(message)
		console.log(message)
		container.appendChild(note)
		container.appendChild(alert)
	}

	private createFormatSetting(containerEl: HTMLElement) {
		const setting = new Setting(containerEl)
				.setName('Time Format')
				.addText(component => {
					component.setValue(this.plugin.settings.format)
							.setPlaceholder('hh:mm:ss.SSS')
							.onChange(async (value) => {
								this.plugin.settings.format = value;
								this.plugin.view.renderCurrentTime()
								await this.plugin.saveSettings();
							})
				});
		setting.descEl.innerHTML = "For more syntax, refer to " +
				"<a href='https://github.com/jsmreese/moment-duration-format#template-string'>format reference</a>"
	}
}

enum StopwatchState {
	INITIALIZED, STARTED, STOPPED
}

class StopWatchView extends ItemView {
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
		return 'clock';
	}

	async onOpen(): Promise<void> {
		const dom = this.contentEl;

		this.timeDiv = dom.createEl('div', {
			text: '',
			cls: 'stopwatch-time'
		});
		this.startStopButton = dom.createEl('button', {
			text: 'Start',
		});
		this.resetButton = dom.createEl('button', {
			text: 'Reset',
		});
		this.renderCurrentTime()

		this.startStopButton.onClickEvent((e) => {
			if (this.model.state == StopwatchState.STARTED) {
				// stop the timer
				this.stop();
			} else {
				// start the timer
				this.start();
			}
			return true;
		});
		this.resetButton.onClickEvent((e) => {
			this.reset();
		});
	}

	start() {
		this.model.start()
		this.startStopButton.textContent = "Pause";
		this.interval = this.createInterval();
		this.registerInterval(this.interval);
	}

	stop() {
		this.startStopButton.textContent = "Start";
		window.clearInterval(this.interval);
		this.interval = null;
		this.model.stop();
	}

	reset() {
		this.startStopButton.textContent = "Start";
		this.model.reset();
		window.clearInterval(this.interval);
		this.interval = null;
		this.renderCurrentTime();
	}

	resetInterval() {
		if (this.interval != null) {
			window.clearInterval(this.interval);
			this.interval = this.createInterval()
		}
	}

	createInterval() {
		return window.setInterval(() => {
			this.renderCurrentTime()
		}, this.plugin.settings.interval)
	}

	renderCurrentTime() {
		this.timeDiv.textContent = this.model.getCurrentTimeString(this.plugin.settings.format);
	}
}

class StopwatchModel {
	private startedAt: Date;
	private pausedOffset: number;
	state: StopwatchState;

	constructor() {
		this.pausedOffset = 0;
		this.state = StopwatchState.INITIALIZED;
	}

	getCurrentTimeString(format: string) {
		const cur = new Date();
		if (this.startedAt != null) {
			const elapsed = (cur.getTime() - this.startedAt.getTime()) + this.pausedOffset; // in milli seconds
			return this.getTimeString(elapsed, format);
		} else {
			return this.getTimeString(0, format);
		}
	}

	getTimeString(elapsed: number, format: string) {
		return moment.duration(elapsed).format(format, {
			trim: false
		})
	}

	start() {
		this.state = StopwatchState.STARTED;
		this.startedAt = new Date();
	}

	stop() {
		this.pausedOffset = (new Date()).getTime() - this.startedAt.getTime() + this.pausedOffset;
		this.state = StopwatchState.STOPPED;
	}

	reset() {
		this.state = StopwatchState.INITIALIZED;
		this.startedAt = null;
		this.pausedOffset = 0;
	}
}
