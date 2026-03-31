export function setupZoom(svg: SVGSVGElement): void {
    const wrap   = svg.closest<HTMLElement>(".stage-wrap");
    const player = wrap?.querySelector<HTMLElement>(".player");
    if (!wrap || !player) return;

    let zoom = 1.0;
    const MIN = 0.5, MAX = 1.5, STEP = 0.1;
    let baseW = 0, baseH = 0;

    const sep = document.createElement("div");
    sep.className = "divider";
    player.appendChild(sep);

    const group = document.createElement("div");
    group.className = "zoom-controls";
    group.innerHTML =
        `<button class="btn icon zoom-out" title="Zmenšit (−)">−</button>` +
        `<span class="zoom-label">100%</span>` +
        `<button class="btn icon zoom-in"  title="Zvětšit (+)">+</button>`;
    player.appendChild(group);

    const minusBtn = group.querySelector<HTMLButtonElement>(".zoom-out")!;
    const lbl      = group.querySelector<HTMLSpanElement>(".zoom-label")!;
    const plusBtn  = group.querySelector<HTMLButtonElement>(".zoom-in")!;

    function init() {
        svg.style.width  = "";
        svg.style.height = "";
        const r = svg.getBoundingClientRect();
        baseW = r.width;
        baseH = r.height;
        applyZoom();
    }

    function applyZoom() {
        svg.style.width  = Math.round(baseW * zoom) + "px";
        svg.style.height = Math.round(baseH * zoom) + "px";
        lbl.textContent  = Math.round(zoom * 100) + "%";
        plusBtn.disabled  = zoom >= MAX;
        minusBtn.disabled = zoom <= MIN;
    }

    minusBtn.onclick = () => {
        zoom = Math.round(Math.max(MIN, zoom - STEP) * 10) / 10;
        applyZoom();
    };
    plusBtn.onclick = () => {
        zoom = Math.round(Math.min(MAX, zoom + STEP) * 10) / 10;
        applyZoom();
    };

    window.addEventListener("keydown", e => {
        if (!(e.ctrlKey || e.metaKey)) return;
        if (e.key === "=" || e.key === "+") { e.preventDefault(); plusBtn.click(); }
        if (e.key === "-")                  { e.preventDefault(); minusBtn.click(); }
    });

    let lastDist = 0;
    wrap.addEventListener("touchstart", e => {
        if (e.touches.length === 2) lastDist = pinchDist(e);
    }, { passive: true });
    wrap.addEventListener("touchmove", e => {
        if (e.touches.length !== 2 || lastDist <= 0) return;
        const d = pinchDist(e);
        zoom = Math.max(MIN, Math.min(MAX, zoom * d / lastDist));
        lastDist = d;
        applyZoom();
    }, { passive: true });
    wrap.addEventListener("touchend",   () => { lastDist = 0; }, { passive: true });
    wrap.addEventListener("touchcancel",() => { lastDist = 0; }, { passive: true });

    window.addEventListener("resize", () => {
        zoom = 1;
        requestAnimationFrame(init);
    });

    requestAnimationFrame(init);
}

function pinchDist(e: TouchEvent): number {
    return Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
    );
}
