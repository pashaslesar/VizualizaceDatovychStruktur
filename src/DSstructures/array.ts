import { Timeline } from "../core/Timeline";
import { ArrayRenderer } from "../render/ArrayRenderer";
import { ArrayOperations } from "../DSoperations/ArrayOperations";
import type { Frame } from "../core/types";
import { setupZoom } from "../core/zoom";

const arrayCapText = document.querySelector<HTMLSpanElement>("#arrayCapText")!;
const arraySizeText = document.querySelector<HTMLSpanElement>("#arraySizeText")!;
const arrayLastIndexText = document.querySelector<HTMLSpanElement>("#arrayLastIndexText")!;

const limitBox = document.querySelector<HTMLElement>("#arrayLimitBox");

function blinkArrayLimitBox() {
    if (!limitBox) return;
    limitBox.classList.remove("blink-array-limit");
    void limitBox.offsetWidth;
    limitBox.classList.add("blink-array-limit");
}

const svg = document.querySelector<SVGSVGElement>("#stage")!;
const stepInfo = document.querySelector<HTMLSpanElement>("#stepInfo")!;
const stepLabel = document.querySelector<HTMLSpanElement>("#stepLabel")!;

const btnNext = document.querySelector<HTMLButtonElement>("#btnNext")!;
const btnPrev = document.querySelector<HTMLButtonElement>("#btnPrev")!;
const btnPlay = document.querySelector<HTMLButtonElement>("#btnPlay")!;
const btnPause = document.querySelector<HTMLButtonElement>("#btnPause")!;
const speedRange = document.querySelector<HTMLInputElement>("#speedRange")!;

const valInput = document.querySelector<HTMLInputElement>("#valInput")!;
const idxInput = document.querySelector<HTMLInputElement>("#idxInput")!;
const capInput = document.querySelector<HTMLInputElement>("#capInput")!;

const btnSet = document.querySelector<HTMLButtonElement>("#btnSet")!;
const btnInsert = document.querySelector<HTMLButtonElement>("#btnInsert")!;
const btnRemove = document.querySelector<HTMLButtonElement>("#btnRemove")!;
const btnFind = document.querySelector<HTMLButtonElement>("#btnFind")!;
const btnResize = document.querySelector<HTMLButtonElement>("#btnResize")!;
const btnRandom = document.querySelector<HTMLButtonElement>("#btnRandom")!;
const btnClear = document.querySelector<HTMLButtonElement>("#btnClear")!;
const btnDeleteArray = document.querySelector<HTMLButtonElement>("#btnDeleteArray")!;
const btnCreateArray = document.querySelector<HTMLButtonElement>("#btnCreateArray")!;

const renderer = new ArrayRenderer(svg);
setupZoom(svg);

const timeline = new Timeline(
    (f: any, idx, total) => {
        renderer.render(f);

        stepInfo.textContent = `Krok ${idx + 1}/${total}` + (f.label ? ` • ${f.label}` : "");
        stepLabel.textContent = f.label ?? "";

        arrayCapText.textContent = String(f.capacity ?? "—");
        arraySizeText.textContent = String(f.size ?? "—");
        arrayLastIndexText.textContent = String(f.lastIndex ?? "—");
    },
    (a, b, t) => renderer.renderLerp(a, b, t)
);

const arr = new ArrayOperations();
timeline.setFrames([arr.snapshot()], "end");

btnNext.onclick = () => timeline.next();
btnPrev.onclick = () => timeline.prev();
btnPlay.onclick = () => timeline.play();
btnPause.onclick = () => timeline.pause();

speedRange.oninput = () => {
    const v = Number(speedRange.value);
    const ms = (120 + 1500) - v;
    timeline.setSpeedMs(ms);
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const numVal = () => Number(valInput.value) || 0;

const numIdx = () => clamp(Math.floor(Number(idxInput.value) || 0), 0, 11);

const numCap = () => clamp(Math.floor(Number(capInput.value) || 8), 0, 12);

function pushFrames(frames: Frame[]) {
    if (frames.some(f => (f as any).limitExceeded)) {
        blinkArrayLimitBox();
    }
    timeline.append(frames as any);
}

btnSet.onclick = () => pushFrames(arr.setAt(numIdx(), numVal()));
btnInsert.onclick = () => pushFrames(arr.insertAt(numIdx(), numVal()));
btnRemove.onclick = () => pushFrames(arr.removeAt(numIdx()));
btnFind.onclick = () => pushFrames(arr.findValue(numVal()));
btnResize.onclick = () => pushFrames(arr.setCapacity(numCap()));
btnRandom.onclick = () => pushFrames(arr.setRandom());
btnClear.onclick = () => pushFrames(arr.clearValues());

btnDeleteArray.onclick = () => pushFrames(arr.deleteArray());
btnCreateArray.onclick = () => pushFrames(arr.create(numCap()));

idxInput.min = "0";
idxInput.max = "11";
idxInput.step = "1";

capInput.min = "0";
capInput.max = "12";
capInput.step = "1";

window.addEventListener("keydown", (e) => {
    if (e.key === "/" && (document.activeElement as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        valInput.focus();
        valInput.select();
    }
    if (e.key === "Enter") {
        btnSet.click();
    }
});