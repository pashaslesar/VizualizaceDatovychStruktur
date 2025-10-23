import type { Frame } from "./types";

export class Timeline {
  private frames: Frame[] = [];
  private idx = 0;
  private playing = false;
  private speed = 600;

  private onRender: (f: Frame, idx: number, total: number) => void;
  private onLerp?: (a: Frame, b: Frame, t: number) => void;

  constructor (
    onRender: (f: Frame, idx: number, total: number) => void,
    onLerp?: (a: Frame, b: Frame, t: number) => void
  ) {
    this.onRender = onRender;
    this.onLerp = onLerp;
  }

  get length() { return this.frames.length; }
  get index() { return this.idx; }

  render() {
    const f = this.frames[this.idx] ?? { nodes: [], edges: [], label: "" };
    this.onRender(f, this.idx, this.frames.length);
  }

  setFrames (frames: Frame[], goto: "start" | "end" = "end") {
    this.frames = frames;
    this.idx = goto === "start" ? 0 : Math.max(0, frames.length - 1);
    this.render();
  }

  private animateTo(targetIdx: number, done?: () => void, respectPause: boolean = false) {
    const from = this.frames[this.idx];
    const to = this.frames[targetIdx];
    if (!from || !to) { this.idx = targetIdx; this.render(); done?.(); return; }

    const t0 = performance.now();
    const dur = this.speed;

    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      if (this.onLerp) this.onLerp(from, to, t);
      const allow = respectPause ? this.playing : true;
      if (t < 1 && allow) {
        requestAnimationFrame(tick);
      } else {
        this.idx = targetIdx;
        this.render();
        done?.();
      }
    };
    requestAnimationFrame(tick);
  }

  append (frames: Frame[]) {
    const add = this.frames.length ? frames.slice(1) : frames;
    const startIdx = this.frames.length ? this.frames.length - 1 : 0;

    this.frames = this.frames.concat(add);

    if (add.length > 0) {
      const finalIdx = this.frames.length - 1;
      const step = (i: number) => {
        if (i > finalIdx) return;
        this.animateTo(i, () => step(i + 1), false);
      };
      step(startIdx + 1);
    } else {
      this.render();
    }
  }

  next() {
    if (this.idx < this.frames.length - 1) {
      this.animateTo(this.idx + 1, undefined, false);
    }
  }

  prev() {
    if (this.idx > 0) {
      this.animateTo(this.idx - 1, undefined, false);
    }
  }

  play() {
    if (this.frames.length < 2) return;
    this.playing = true;
    const stepForward = () => {
      if (!this.playing) return;
      if (this.idx < this.frames.length - 1) {
        this.animateTo(this.idx + 1, () => requestAnimationFrame(stepForward), true);
      } else {
        this.playing = false;
      }
    };
    stepForward();
  }

  pause() { this.playing = false; }

  setSpeedMs(ms: number) { this.speed = Math.max(60, ms); }
}
