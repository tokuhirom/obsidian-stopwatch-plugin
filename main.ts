import {App, ItemView, Plugin, PluginSettingTab, Setting, WorkspaceLeaf} from 'obsidian';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

const VIEW_TYPE_STOPWATCH = 'online.tokuhirom.obsidian-stopwatch-plugin';

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	private view: StopWatchView;

	async onload() {
		console.log('loading stopwatch plugin');

		await this.loadSettings();

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		this.registerView(VIEW_TYPE_STOPWATCH, (leaf: WorkspaceLeaf) => {
			this.view = new StopWatchView(leaf, this);
			return this.view;
		});

		if (this.app.workspace.layoutReady) {
			this.initLeaf();
			// await this.prepareIndex();
		} else {
			this.registerEvent(this.app.workspace.on('layout-ready', this.initLeaf.bind(this)));
			// this.registerEvent(this.app.workspace.on('layout-ready', async () => await this.prepareIndex()));
		}
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

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue('')
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

enum StopwatchState {
	INITIALIZED, STARTED, STOPPED
}

class StopWatchView extends ItemView {
	private startStopButton: HTMLButtonElement;
	private state: StopwatchState;
	private startedAt: Date;
	private plugin: MyPlugin;
	private interval: number;
	private timeDiv: HTMLDivElement;
	private resetButton: HTMLButtonElement;
	private pausedOffset: number;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.state = StopwatchState.INITIALIZED;
		this.pausedOffset = 0;
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

	onClose(): Promise<void> {
		return Promise.resolve();
	}

	async onOpen(): Promise<void> {
		const dom = (this as any).contentEl as HTMLElement;

		this.timeDiv = dom.createEl('div', {
			text: '00:00:00.00'
		});
		this.startStopButton = dom.createEl('button', {
			text: 'Start',
		});
		this.resetButton = dom.createEl('button', {
			text: 'Reset',
		});
		this.timeDiv.addClass("stopwatch-time");

		this.startStopButton.onClickEvent((e) => {
			console.log("CLICK!");
			console.log(e);
			if (this.state == StopwatchState.STARTED) {
				// stop the timer
				this.startStopButton.textContent = "Start";
				window.clearInterval(this.interval);
				this.pausedOffset = (new Date()).getTime() - this.startedAt.getTime() + this.pausedOffset;
				this.state = StopwatchState.STOPPED;
			} else {
				// start the timer
				this.state = StopwatchState.STARTED;
				this.startStopButton.textContent = "Pause";
				this.startedAt = new Date();
				this.interval = window.setInterval(() => {
					this.renderCurrentTime();
				}, 10);
				this.plugin.registerInterval(this.interval) // make interval configurable
			}
			return true;
		});
		this.resetButton.onClickEvent((e) => {
			this.state = StopwatchState.INITIALIZED;
			this.startedAt = null;
			window.clearInterval(this.interval);
			this.interval = null;
			this.pausedOffset = 0;
			this.renderCurrentTime();
		});
	}

	private renderCurrentTime() {
		const cur = new Date();
		if (this.startedAt != null) {
			const elapsed = (cur.getTime() - this.startedAt.getTime()) + this.pausedOffset; // in milli seconds

			const h = Math.floor(elapsed/60/60/1000)
			const m = Math.floor((elapsed - h*60*60*1000)/60/1000)
			const s = Math.floor((elapsed - h*60*60*1000 - m*60*1000)/1000)
			const ms = Math.floor(elapsed - h*60*60*1000 - m*60*1000 - s*1000)
			console.log(elapsed);

			const hStr = ('0' + h).slice(-2);
			const mStr = ('0' + m).slice(-2);
			const sStr = ('0' + s).slice(-2);
			const msStr = ('000' + ms).slice(-3);
			this.timeDiv.textContent = hStr + ":" + mStr + ":" + sStr + "." + msStr;
		} else {
			this.timeDiv.textContent = "00:00:00.000";
		}
	}
}

class StopwatchModel {

}