import {App, ItemView, Plugin, PluginSettingTab, Setting, WorkspaceLeaf} from 'obsidian';

interface StopwatchPluginSettings {
	interval: number,
	showMilliSeconds: boolean
}

const DEFAULT_SETTINGS: StopwatchPluginSettings = {
	interval: 100,
	showMilliSeconds: true
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
			}
		});
		this.addCommand({
			id: 'stop-stopwatch',
			name: 'Stop Stopwatch',
			callback: () => {
				this.view.stop();
			}
		});
		this.addCommand({
			id: 'reset-stopwatch',
			name: 'Reset Stopwatch',
			callback: () => {
				this.view.reset();
			}
		});

		this.registerView(VIEW_TYPE_STOPWATCH, (leaf: WorkspaceLeaf) => {
			this.view = new StopWatchView(leaf, this, new StopwatchModel());
			return this.view;
		});

		this.app.workspace.onLayoutReady(() => this.initLeaf.bind(this))
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

class StopwatchSettingTab extends PluginSettingTab {
	plugin: StopwatchPlugin;

	constructor(app: App, plugin: StopwatchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for stopwatch plugin.'});

		new Setting(containerEl)
			.setName('Stopwatch refresh interval')
			.addText(text => text
				.setPlaceholder('Stopwatch refresh interval')
				.setValue(this.plugin.settings.interval.toString())
				.onChange(async (value) => {
					this.plugin.settings.interval = parseInt(value, 10);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
				.setName('Show milliseconds')
				.addToggle(component => {
					component.setValue(this.plugin.settings.showMilliSeconds)
							.onChange(async (value) => {
								this.plugin.settings.showMilliSeconds = value;
								this.plugin.view.renderCurrentTime()
								await this.plugin.saveSettings();
							})
				});
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

	constructor(leaf: WorkspaceLeaf, plugin: StopwatchPlugin, model: StopwatchModel) {
		super(leaf);
		this.plugin = plugin;
		this.model = model;
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
		const dom = (this as any).contentEl as HTMLElement;

		this.timeDiv = dom.createEl('div', {
			text: ''
		});
		this.startStopButton = dom.createEl('button', {
			text: 'Start',
		});
		this.resetButton = dom.createEl('button', {
			text: 'Reset',
		});
		this.timeDiv.addClass("stopwatch-time");
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
		this.interval = window.setInterval(() => {
			this.renderCurrentTime()
		}, this.plugin.settings.interval);
		this.registerInterval(this.interval);
	}

	stop() {
		this.startStopButton.textContent = "Start";
		window.clearInterval(this.interval);
		this.model.stop();
	}

	reset() {
		this.startStopButton.textContent = "Start";
		this.model.reset();
		window.clearInterval(this.interval);
		this.interval = null;
		this.renderCurrentTime();
	}

	renderCurrentTime() {
		this.timeDiv.textContent = this.model.getCurrentTimeString(this.plugin.settings.showMilliSeconds);
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

	getCurrentTimeString(renderMilliSec: boolean) {
		const cur = new Date();
		if (this.startedAt != null) {
			const elapsed = (cur.getTime() - this.startedAt.getTime()) + this.pausedOffset; // in milli seconds
			return this.getTimeString(elapsed, renderMilliSec);
		} else {
			return this.getTimeString(0, renderMilliSec);
		}
	}

	getTimeString(elapsed: number, renderMilliSec: boolean) {
		const h = Math.floor(elapsed/60/60/1000)
		const m = Math.floor((elapsed - h*60*60*1000)/60/1000)
		const s = Math.floor((elapsed - h*60*60*1000 - m*60*1000)/1000)
		const ms = Math.floor(elapsed - h*60*60*1000 - m*60*1000 - s*1000)

		const hStr = ('0' + h).slice(-2);
		const mStr = ('0' + m).slice(-2);
		const sStr = ('0' + s).slice(-2);
		const msStr = ('000' + ms).slice(-3);
		return hStr + ":" + mStr + ":" + sStr + ( renderMilliSec ? "." + msStr : '');
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
