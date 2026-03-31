import { Timeline } from "../core/Timeline";
import { QueueOperations } from "../DSoperations/QueueOperations";
import { QueueRenderer } from "../render/QueueRenderer";
import { setupZoom } from "../core/zoom";

const svg        = document.querySelector<SVGSVGElement>("#stage")!;
const stepInfo   = document.querySelector<HTMLSpanElement>("#stepInfo")!;
const stepLabel  = document.querySelector<HTMLSpanElement>("#stepLabel")!;

const prevBtn    = document.querySelector<HTMLButtonElement>("#prevBtn")!;
const playBtn    = document.querySelector<HTMLButtonElement>("#playBtn")!;
const pauseBtn   = document.querySelector<HTMLButtonElement>("#pauseBtn")!;
const nextBtn    = document.querySelector<HTMLButtonElement>("#nextBtn")!;
const speedRange = document.querySelector<HTMLInputElement>("#speedRange")!;

const valueInput  = document.querySelector<HTMLInputElement>("#valueInput")!;
const enqueueBtn  = document.querySelector<HTMLButtonElement>("#enqueueBtn")!;
const dequeueBtn  = document.querySelector<HTMLButtonElement>("#dequeueBtn")!;
const peekBtn     = document.querySelector<HTMLButtonElement>("#peekBtn")!;
const randomBtn   = document.querySelector<HTMLButtonElement>("#randomBtn")!;
const resetBtn    = document.querySelector<HTMLButtonElement>("#resetBtn")!;

const limitBox = document.getElementById("queueLimitBox");

function blinkLimitBox() {
    if (!limitBox) return;
    limitBox.classList.remove("blink-limit");
    void (limitBox as HTMLElement).offsetWidth;
    limitBox.classList.add("blink-limit");
}

const ops      = new QueueOperations();
const renderer = new QueueRenderer(svg);
setupZoom(svg);

const timeline = new Timeline(
    (f, idx, total) => {
        renderer.render(f);
        stepInfo.textContent = `Krok ${idx + 1}/${total}` + (f.label ? ` • ${f.label}` : "");
        stepLabel.textContent = f.label ?? "";
    },
    (a, b, t) => renderer.renderLerp(a, b, t)
);

timeline.setFrames([ops.snapshot()], "end");

let pendingLimitBlink = false;

timeline.setOnReachedEnd(() => {
    if (pendingLimitBlink) {
        pendingLimitBlink = false;
        blinkLimitBox();
    }
});

prevBtn.onclick  = () => timeline.prev();
nextBtn.onclick  = () => timeline.next();
playBtn.onclick  = () => timeline.play();
pauseBtn.onclick = () => timeline.pause();

speedRange.oninput = () => {
    const v = Number(speedRange.value);
    const ms = (120 + 1500) - v;
    timeline.setSpeedMs(ms);
};

const num = () => Number(valueInput.value) || 0;

enqueueBtn.onclick = () => {
    const frames = ops.enqueue(num());
    const lastLabel = frames.at(-1)?.label ?? "";
    pendingLimitBlink = lastLabel.includes("plná");
    timeline.append(frames);
};

dequeueBtn.onclick = () => timeline.append(ops.dequeue());
peekBtn.onclick    = () => timeline.append(ops.peek());
randomBtn.onclick  = () => timeline.append(ops.setRandom(3 + Math.floor(Math.random() * 4)));
resetBtn.onclick   = () => timeline.append(ops.reset());

window.addEventListener("keydown", (e) => {
    if (e.key === "/" && (document.activeElement as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault(); valueInput.focus(); valueInput.select();
    }
    if (e.key === "Enter" && document.activeElement === valueInput) {
        enqueueBtn.click();
    }
});
