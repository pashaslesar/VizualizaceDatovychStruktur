import { Timeline } from "./core/Timeline";
import { SvgRenderer } from "./render/SvgRenderer";
import { LinkedListOperations } from "./structures/LinkedListOperations";

const svg = document.querySelector<SVGSVGElement>("#stage")!;
const stepInfo = document.querySelector<HTMLSpanElement>("#stepInfo")!;
const btnNext = document.querySelector<HTMLButtonElement>("#btnNext")!;
const btnPrev = document.querySelector<HTMLButtonElement>("#btnPrev")!;
const btnPlay = document.querySelector<HTMLButtonElement>("#btnPlay")!;
const btnPause = document.querySelector<HTMLButtonElement>("#btnPause")!;
const btnInsertHead = document.querySelector<HTMLButtonElement>("#btnInsertHead")!;
const btnReset = document.querySelector<HTMLButtonElement>("#btnReset")!;
const valInput = document.querySelector<HTMLInputElement>("#valInput")!;
const speedRange = document.querySelector<HTMLInputElement>("#speedRange")!;

const renderer = new SvgRenderer(svg);
const timeline = new Timeline(
  (f, idx, total) => {
    renderer.render(f);
    stepInfo.textContent = `Krok ${idx + 1}/${total}` + (f.label ? ` • ${f.label}` : "");
  },
  (a, b, t) => renderer.renderLerp(a, b, t)
);

const list = new LinkedListOperations();

timeline.setFrames([list.snapshot()], "end");

btnNext.onclick = () => timeline.next();
btnPrev.onclick = () => timeline.prev();
btnPlay.onclick = () => timeline.play();
btnPause.onclick = () => timeline.pause();

speedRange.oninput = () => {
  const v = Number(speedRange.value);
  const ms = (120 + 1500) - v;
  timeline.setSpeedMs(ms);
};


btnInsertHead.onclick = () => {
  const v = Number(valInput.value) || 0;
  const opFrames = list.insertHead(v);
  timeline.append(opFrames);
};

btnReset.onclick = () => {
  const opFrames = list.reset();
  timeline.append(opFrames);
};
