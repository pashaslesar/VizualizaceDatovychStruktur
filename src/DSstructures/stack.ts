import { Timeline } from "../core/Timeline";
import { StackOperations } from "../DSoperations/StackOperations";
import { StackRenderer } from "../render/StackRenderer";

const svg        = document.querySelector<SVGSVGElement>("#stage")!;
const stepInfo   = document.querySelector<HTMLSpanElement>("#stepInfo")!;
const stepLabel  = document.querySelector<HTMLSpanElement>("#stepLabel")!;

const prevBtn    = document.querySelector<HTMLButtonElement>("#prevBtn")!;
const playBtn    = document.querySelector<HTMLButtonElement>("#playBtn")!;
const pauseBtn   = document.querySelector<HTMLButtonElement>("#pauseBtn")!;
const nextBtn    = document.querySelector<HTMLButtonElement>("#nextBtn")!;
const speedRange = document.querySelector<HTMLInputElement>("#speedRange")!;

const valueInput = document.querySelector<HTMLInputElement>("#valueInput")!;
const pushBtn    = document.querySelector<HTMLButtonElement>("#pushBtn")!;
const popBtn     = document.querySelector<HTMLButtonElement>("#popBtn")!;
const peekBtn         = document.querySelector<HTMLButtonElement>("#peekBtn")!;
const peekBottomBtn   = document.querySelector<HTMLButtonElement>("#peekBottomBtn")!;
const randomBtn  = document.querySelector<HTMLButtonElement>("#randomBtn")!;
const resetBtn   = document.querySelector<HTMLButtonElement>("#resetBtn")!;

const limitBox   = document.getElementById("stackLimitBox");

function blinkLimitBox() {
    if (!limitBox) return;
    limitBox.classList.remove("blink-limit");
    void (limitBox as HTMLElement).offsetWidth;
    limitBox.classList.add("blink-limit");
}

const ops      = new StackOperations();
const renderer = new StackRenderer(svg);

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

pushBtn.onclick = () => {
    const frames = ops.push(num());
    const lastLabel = frames.at(-1)?.label ?? "";
    pendingLimitBlink = lastLabel.includes("plný");
    timeline.append(frames);
};

popBtn.onclick    = () => timeline.append(ops.pop());
peekBtn.onclick         = () => timeline.append(ops.peek());
peekBottomBtn.onclick   = () => timeline.append(ops.peekBottom());
randomBtn.onclick = () => timeline.append(ops.setRandom(4 + Math.floor(Math.random() * 3)));
resetBtn.onclick  = () => timeline.append(ops.reset());

window.addEventListener("keydown", (e) => {
    if (e.key === "/" && (document.activeElement as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault(); valueInput.focus(); valueInput.select();
    }
    if (e.key === "Enter" && document.activeElement === valueInput) {
        pushBtn.click();
    }
});
