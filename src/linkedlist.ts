import { Timeline } from "./core/Timeline";
import { SvgRenderer } from "./render/SvgRenderer";
import { LinkedListOperations } from "./structures/LinkedListOperations";

const svg       = document.querySelector<SVGSVGElement>("#stage")!;
const stepInfo  = document.querySelector<HTMLSpanElement>("#stepInfo")!;

const btnNext   = document.querySelector<HTMLButtonElement>("#btnNext")!;
const btnPrev   = document.querySelector<HTMLButtonElement>("#btnPrev")!;
const btnPlay   = document.querySelector<HTMLButtonElement>("#btnPlay")!;
const btnPause  = document.querySelector<HTMLButtonElement>("#btnPause")!;
const speedRange= document.querySelector<HTMLInputElement>("#speedRange")!;

const valInput      = document.querySelector<HTMLInputElement>("#valInput")!;
const btnInsertHead = document.querySelector<HTMLButtonElement>("#btnInsertHead")!;
const btnInsertTail = document.querySelector<HTMLButtonElement>("#btnInsertTail")!;
const btnDeleteHead = document.querySelector<HTMLButtonElement>("#btnDeleteHead")!;
const btnDeleteTail = document.querySelector<HTMLButtonElement>("#btnDeleteTail")!;
const btnDeleteValue= document.querySelector<HTMLButtonElement>("#btnDeleteValue")!;
const btnFindValue  = document.querySelector<HTMLButtonElement>("#btnFindValue")!;
const btnRandom     = document.querySelector<HTMLButtonElement>("#btnRandom")!;
const btnClear      = document.querySelector<HTMLButtonElement>("#btnClear")!;

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

btnNext.onclick  = () => timeline.next();
btnPrev.onclick  = () => timeline.prev();
btnPlay.onclick  = () => timeline.play();
btnPause.onclick = () => timeline.pause();

speedRange.oninput = () => {
  const v = Number(speedRange.value);
  const ms = (120 + 1500) - v;
  timeline.setSpeedMs(ms);
};

const num = () => Number(valInput.value) || 0;
const pushFrames = (frames: any[]) => timeline.append(frames);

btnInsertHead.onclick = () => pushFrames(list.insertHead(num()));
btnInsertTail.onclick = () => pushFrames(list.insertTail(num()));
btnDeleteHead.onclick = () => pushFrames(list.deleteHead());
btnDeleteTail.onclick = () => pushFrames(list.deleteTail());
btnDeleteValue.onclick= () => pushFrames(list.deleteValue(num()));
btnFindValue.onclick  = () => pushFrames(list.findValue(num()));
btnRandom.onclick     = () => pushFrames(list.setRandom(4 + Math.floor(Math.random()*3)));
btnClear.onclick      = () => pushFrames(list.reset());

window.addEventListener("keydown", (e) => {
  if (e.key === "/" && (document.activeElement as HTMLElement)?.tagName !== "INPUT") {
    e.preventDefault(); valInput.focus(); valInput.select();
  }
  if (e.key === "Enter" && document.activeElement === valInput) {
    btnInsertHead.click();
  }
});
