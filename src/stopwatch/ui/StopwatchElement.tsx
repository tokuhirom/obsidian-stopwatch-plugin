import React from "react";
import { StopwatchModel } from "../StopwatchModel";
import StopwatchPlugin from "../../../main";
import { StopwatchState } from "../StopwatchState";

interface StopwatchElementProps {
  plugin: StopwatchPlugin;
}

interface StopwatchElementState {
  model: StopwatchModel;
  state: StopwatchState;
  time: string;
}

export class StopwatchElement extends React.Component<
  StopwatchElementProps,
  StopwatchElementState
> {
  private intervalId: number;
  constructor(props: StopwatchElementProps) {
    super(props);
    const model = new StopwatchModel();
    this.state = {
      model: model,
      state: model.state,
      time: model.getCurrentTimeString(this.props.plugin.settings.format),
    };
  }

  private updateTime() {
    this.setState({
      time: this.state.model.getCurrentTimeString(
        this.props.plugin.settings.format
      ),
    });
  }

  componentWillUnmount(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private onReset() {
    this.state.model.reset();
    this.setState({ state: this.state.model.state });
    this.clearInterval();
    this.updateTime();
  }

  private startOrStop(): void {
    if (this.state.model.state == StopwatchState.STARTED) {
      this.stop();
    } else {
      this.start();
    }
  }

  private onStartStop() {
    this.startOrStop();
  }

  render(): JSX.Element {
    return (
      <div>
        <div className={"stopwatch-time"}>{this.state.time}</div>
        <button
          onClick={this.onStartStop.bind(this)}
          className={"start-or-stop"}
        >
          {this.state.model.state == StopwatchState.STARTED ? "Pause" : "Start"}
        </button>
        <button onClick={this.onReset.bind(this)} className={"reset"}>
          Reset
        </button>
        <button
          onClick={this.createInterval.bind(this)}
          className={"reset-interval"}
          style={{ display: "none" }}
        >
          Reset Interval
        </button>
      </div>
    );
  }

  private stop() {
    this.state.model.stop();
    this.setState({ state: this.state.model.state });
    this.clearInterval();
  }

  private start() {
    this.state.model.start();
    this.setState({ state: this.state.model.state });
    this.createInterval();
  }

  private createInterval(): void {
    if (this.intervalId != null) {
      window.clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(() => {
      this.updateTime();
    }, this.props.plugin.settings.interval);
  }

  private clearInterval() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
