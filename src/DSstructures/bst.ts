import { Timeline } from "../core/Timeline";
import { BstRenderer } from "../render/BstRenderer";
import { BstOperations } from "../DSoperations/BstOperations";

const svg        = document.querySelector<SVGSVGElement>("#stage")!;
const stepInfo   = document.querySelector<HTMLSpanElement>("#stepInfo")!;
const stepLabel  = document.querySelector<HTMLSpanElement>("#stepLabel")!;

const btnNext    = document.querySelector<HTMLButtonElement>("#btnNext")!;
const btnPrev    = document.querySelector<HTMLButtonElement>("#btnPrev")!;
const btnPlay    = document.querySelector<HTMLButtonElement>("#btnPlay")!;
const btnPause   = document.querySelector<HTMLButtonElement>("#btnPause")!;
const speedRange = document.querySelector<HTMLInputElement>("#speedRange")!;

const valInput       = document.querySelector<HTMLInputElement>("#valInput")!;
const btnInsert      = document.querySelector<HTMLButtonElement>("#btnInsertHead")!;
const btnDelete      = document.querySelector<HTMLButtonElement>("#btnDeleteValue")!;
const btnFind        = document.querySelector<HTMLButtonElement>("#btnFindValue")!;
const btnRandom      = document.querySelector<HTMLButtonElement>("#btnRandom")!;
const btnClear       = document.querySelector<HTMLButtonElement>("#btnClear")!;
const btnDeleteRoot = document.querySelector<HTMLButtonElement>("#btnDeleteRoot")!;

const btnTraverseLifo = document.querySelector<HTMLButtonElement>("#btnTraverseLifo")!;
const btnTraverseFifo = document.querySelector<HTMLButtonElement>("#btnTraverseFifo")!;
const traversalText = document.querySelector<HTMLSpanElement>("#bstTraversalText")!;

const limitBox = document.getElementById("bstLimitBox");

function blinkLimitBox() {
    if (!limitBox) return;
    limitBox.classList.remove("blink-limit");
    void (limitBox as HTMLElement).offsetWidth;
    limitBox.classList.add("blink-limit");
}

function setTraversalOrder(values: number[]) {
    traversalText.textContent = values.length ? values.join(", ") : "—";
}

const renderer = new BstRenderer(svg);
const timeline = new Timeline(
    (f, idx, total) => {
        renderer.render(f);
        stepInfo.textContent = `Krok ${idx + 1}/${total}` + (f.label ? ` • ${f.label}` : "");
        stepLabel.textContent = f.label ?? "";
    },
    (a, b, t) => renderer.renderLerp(a, b, t)
);

const bst = new BstOperations();
timeline.setFrames([bst.snapshot()], "end");

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

function appendWithLimitBlink(frames: any[]) {
    const lastLabel = frames.at(-1)?.label ?? "";
    if (lastLabel.includes("nelze vložit")) {
        blinkLimitBox();
    }
    pushFrames(frames);
}

let pendingLimitBlink = false;

timeline.setOnReachedEnd(() => {
    if (pendingLimitBlink) {
        pendingLimitBlink = false;
        blinkLimitBox();
    }
});

btnInsert.onclick = () => {
    const frames = bst.insert(num());
    const lastLabel = frames.at(-1)?.label ?? "";
    pendingLimitBlink = lastLabel.includes("nelze vložit");
    timeline.append(frames);
};

btnDeleteRoot.onclick = () => {
    const frames = bst.deleteRoot();
    pushFrames(frames);
};

btnDelete.onclick = () => {
    const value = num();
    const rootVal = bst.getRootValue();

    if (rootVal !== null && value === rootVal) {
        pushFrames(bst.deleteRoot());
    } else {
        pushFrames(bst.delete(value));
    }
};

btnFind.onclick   = () => pushFrames(bst.find(num()));
btnRandom.onclick = () => appendWithLimitBlink(bst.setRandom(10 + Math.floor(Math.random() * 6)));
btnClear.onclick  = () => pushFrames(bst.reset());

btnTraverseLifo.onclick = () => {
    const res = bst.traverse("lifo");
    setTraversalOrder(res.order);
    pushFrames(res.frames);
};

btnTraverseFifo.onclick = () => {
    const res = bst.traverse("fifo");
    setTraversalOrder(res.order);
    pushFrames(res.frames);
};

window.addEventListener("keydown", (e) => {
    if (e.key === "/" && (document.activeElement as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault(); valInput.focus(); valInput.select();
    }
    if (e.key === "Enter" && document.activeElement === valInput) {
        btnInsert.click();
    }
});
