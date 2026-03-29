import type { Frame, NodeState, EdgeState, LayoutType } from "../../core/types";

export const NODE_W = 100;
export const NODE_H = 60;
export const GAP = 5;

export const setStyleVar = (el: SVGElement, prop: string, value: string) => {
    (el as any).style.setProperty(prop, value);
    };

    export type BadgeKey = "head" | "tail" | "root";

    export type BadgeSpec = {
    key: BadgeKey;
    text: string;
    x: number;
    y: number;
    visible: boolean;
    anchor?: "start" | "middle" | "end";
    fill?: string;
    stroke?: string;
    textFill?: string;
    };

    export abstract class BaseSvgRenderer {
    protected svg: SVGSVGElement;
    protected nodeMap = new Map<number, SVGGElement>();

    constructor(svg: SVGSVGElement) {
        this.svg = svg;
    }

    render(frame: Frame) {
        this.syncNodes(frame.nodes);
        this.syncEdges(frame.edges, frame.nodes, frame.layout ?? "line");
    }

    renderLerp(a: Frame, b: Frame, t: number) {
        const allIds = new Set<number>([
        ...a.nodes.map(n => n.id),
        ...b.nodes.map(n => n.id),
        ]);

        const interNodes: NodeState[] = [];

        allIds.forEach(id => {
            const na = a.nodes.find(n => n.id === id);
            const nb = b.nodes.find(n => n.id === id);

            if (na && nb) {
                interNodes.push({
                    id,
                    value: (nb as any).value,
                    x: na.x + (nb.x - na.x) * t,
                    y: na.y + (nb.y - na.y) * t,
                    highlight: t < 0.5 ? na.highlight : nb.highlight,

                    isHead: t < 0.5 ? na.isHead : nb.isHead,
                    isTail: t < 0.5 ? na.isTail : nb.isTail,

                    isRoot: t < 0.5 ? (na as any).isRoot : (nb as any).isRoot,
                    isGhost: t < 0.5 ? (na as any).isGhost : (nb as any).isGhost,

                    badgeHead: t < 0.5 ? (na as any).badgeHead : (nb as any).badgeHead,
                    badgeTail: t < 0.5 ? (na as any).badgeTail : (nb as any).badgeTail,
                } as any);
            } else if (!na && nb) {
                interNodes.push({ ...nb });
            } else if (na && !nb) {
                interNodes.push({ ...na });
            }
        });

        this.syncNodes(interNodes, id => {
        const inA = !!a.nodes.find(n => n.id === id);
        const inB = !!b.nodes.find(n => n.id === id);
        if (!inA && inB) return t;
        if (inA && !inB) return 1 - t;
        return 1;
        });

        const layout: LayoutType = ((t < 0.5 ? a.layout : b.layout) ?? "line");
        this.syncEdges(b.edges, interNodes, layout);
    }

    protected syncNodes(nodes: NodeState[], opacityOf?: (id: number) => number) {
        const keep = new Set(nodes.map(n => n.id));

        nodes.forEach(n => {
        let g = this.nodeMap.get(n.id);

        if (!g) {
            const newG = document.createElementNS(this.svg.namespaceURI, "g") as SVGGElement;
            newG.setAttribute("data-id", String(n.id));

            const rect = document.createElementNS(this.svg.namespaceURI, "rect") as SVGRectElement;
            rect.setAttribute("rx", "10");
            rect.setAttribute("ry", "10");
            rect.setAttribute("width", String(NODE_W));
            rect.setAttribute("height", String(NODE_H));
            rect.setAttribute("stroke", "#2a2f3a");
            rect.setAttribute("fill", "#1d2129");

            const text = document.createElementNS(this.svg.namespaceURI, "text") as SVGTextElement;
            text.setAttribute("class", "node-value");
            text.setAttribute("x", String(NODE_W / 2));
            text.setAttribute("y", String(NODE_H / 2 + 5));
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-family", "system-ui, -apple-system, Segoe UI, Roboto, Arial");
            text.setAttribute("font-size", "14");
            text.setAttribute("fill", "#e8ecf1");

            newG.appendChild(rect);
            newG.appendChild(text);
            this.svg.appendChild(newG);

            this.nodeMap.set(n.id, newG);
            g = newG;
        }

        const gEl = g as SVGGElement;

        gEl.setAttribute("transform", `translate(${n.x - NODE_W / 2}, ${n.y - NODE_H / 2})`);
        gEl.setAttribute("opacity", opacityOf ? String(opacityOf(n.id)) : "1");

        const rectEl = gEl.querySelector("rect") as SVGRectElement;
        const textEl = gEl.querySelector("text.node-value") as SVGTextElement;

        const v = (n as any).value;
        textEl.textContent = Number.isFinite(v) ? String(v) : "";
        textEl.setAttribute("y", String(NODE_H / 2 + 5));

        this.applyNodeStyle(n, gEl, rectEl, textEl);

        const badges = this.getBadgesForNode(n);
        this.syncBadges(gEl, badges);
        });

        [...this.nodeMap.keys()].forEach(id => {
        if (!keep.has(id)) {
            this.nodeMap.get(id)!.remove();
            this.nodeMap.delete(id);
        }
        });
    }

    protected abstract applyNodeStyle(
        n: NodeState,
        gEl: SVGGElement,
        rectEl: SVGRectElement,
        textEl: SVGTextElement,
    ): void;

    protected getBadgesForNode(_n: NodeState): BadgeSpec[] {
        return [];
    }

    protected syncBadges(host: SVGGElement, specs: BadgeSpec[]) {
        (["head", "tail", "root"] as BadgeKey[]).forEach(k => {
        const bg = host.querySelector(`g[data-badge="${k}"]`) as SVGGElement | null;
        if (bg) bg.style.display = "none";
        });

        specs.forEach(s => {
        this.ensureBadge(host, s.key, s.text, s.x, s.y, s.visible, s.anchor ?? "start", s.fill, s.stroke, s.textFill);
        });
    }

    protected ensureBadge(
        host: SVGGElement,
        badgeKey: BadgeKey,
        text: string,
        x: number,
        y: number,
        visible: boolean,
        anchor: "start" | "middle" | "end" = "start",
        fill?: string,
        stroke?: string,
        textFill?: string,
    ) {
        const sel = `g[data-badge="${badgeKey}"]`;
        let bg = host.querySelector(sel) as SVGGElement | null;

        if (!bg) {
        bg = document.createElementNS(this.svg.namespaceURI, "g") as SVGGElement;
        bg.setAttribute("data-badge", badgeKey);

        const r = document.createElementNS(this.svg.namespaceURI, "rect") as SVGRectElement;
        r.setAttribute("rx", "6");
        r.setAttribute("ry", "6");
        r.setAttribute("class", "array-badge");
        bg.appendChild(r);

        const t = document.createElementNS(this.svg.namespaceURI, "text") as SVGTextElement;
        t.setAttribute("class", "array-badge-text");
        t.setAttribute("font-size", "10");
        t.setAttribute("font-weight", "800");
        t.setAttribute("font-family", "system-ui, -apple-system, Segoe UI, Roboto, Arial");
        t.setAttribute("dominant-baseline", "middle");
        t.setAttribute("text-anchor", anchor);
        bg.appendChild(t);

        host.appendChild(bg);
        }

        const rect = bg.querySelector("rect") as SVGRectElement;
        const txt = bg.querySelector("text") as SVGTextElement;

        txt.textContent = text;
        txt.setAttribute("x", String(x));
        txt.setAttribute("y", String(y));
        txt.setAttribute("text-anchor", anchor);

        const padX = 6;
        const approxCharW = 6.2;
        const w = Math.max(28, Math.round(text.length * approxCharW) + padX * 2);
        const h = 16;

        let rx = x;
        if (anchor === "start") rx = x - 2;
        if (anchor === "middle") rx = x - w / 2;
        if (anchor === "end") rx = x - w + 2;

        rect.setAttribute("x", String(rx));
        rect.setAttribute("y", String(y - h / 2));
        rect.setAttribute("width", String(w));
        rect.setAttribute("height", String(h));

        setStyleVar(rect, "fill",   fill     ?? "var(--tag-fill,   rgba(140,200,255,.12))");
        setStyleVar(rect, "stroke", stroke   ?? "var(--tag-stroke, rgba(140,200,255,.75))");
        setStyleVar(txt,  "fill",   textFill ?? "var(--tag-text,   rgba(140,200,255,.95))");

        bg.style.display = visible ? "block" : "none";
    }

    protected syncEdges(edges: EdgeState[], nodes: NodeState[], layout: LayoutType) {
        [...this.svg.querySelectorAll("path.edge")].forEach(p => p.remove());

        const pos = new Map<number, { x: number; y: number }>();
        nodes.forEach(n => pos.set(n.id, { x: n.x, y: n.y }));

        const key = (a: number, b: number) => `${a}->${b}`;
        const edgeSet = new Set(edges.map(e => key(e.from, e.to)));

        this.ensureMarker();

        if (layout === "tree") {
        edges.forEach(e => {
            const a = pos.get(e.from), b = pos.get(e.to);
            if (!a || !b) return;

            const startX = a.x;
            const startY = a.y + NODE_H / 2 - 4;
            const endX   = b.x;
            const endY   = b.y - NODE_H / 2 + 4;

            const path = document.createElementNS(this.svg.namespaceURI, "path");
            path.setAttribute("class", "edge");
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "#666");
            path.setAttribute("stroke-width", "1.5");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("marker-end", "url(#arrow)");
            path.setAttribute("d", `M ${startX} ${startY} L ${endX} ${endY}`);

            this.svg.insertBefore(path, this.svg.firstChild);
        });
        return;
        }

        if (layout === "line") {
        const moveToward = (ax: number, ay: number, bx: number, by: number, dist: number) => {
            const vx = bx - ax, vy = by - ay;
            const len = Math.hypot(vx, vy) || 1;
            const k = dist / len;
            return { x: ax + vx * k, y: ay + vy * k };
        };

        const offsetPerp = (ax: number, ay: number, bx: number, by: number, amount: number) => {
            const vx = bx - ax, vy = by - ay;
            const len = Math.hypot(vx, vy) || 1;
            const nx = -vy / len;
            const ny = vx / len;
            return { x: nx * amount, y: ny * amount };
        };

        edges.forEach(e => {
            const a = pos.get(e.from), b = pos.get(e.to);
            if (!a || !b) return;

            const start = moveToward(a.x, a.y, b.x, b.y, NODE_W / 2 - 2);
            const end = moveToward(b.x, b.y, a.x, a.y, NODE_W / 2 + GAP);

            const hasReverse = edgeSet.has(key(e.to, e.from));

            const path = document.createElementNS(this.svg.namespaceURI, "path");
            path.setAttribute("class", "edge");
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "#666");
            path.setAttribute("stroke-width", "1.5");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("marker-end", "url(#arrow)");

            if (!hasReverse) {
            path.setAttribute("d", `M ${start.x} ${start.y} L ${end.x} ${end.y}`);
            } else {
            const sign = e.from < e.to ? 1 : -1;
            const dist = Math.hypot(b.x - a.x, b.y - a.y);
            const amount = Math.min(80, Math.max(18, dist * 0.12)) * sign;

            const off = offsetPerp(start.x, start.y, end.x, end.y, amount);
            const cx = (start.x + end.x) / 2 + off.x;
            const cy = (start.y + end.y) / 2 + off.y;

            path.setAttribute("d", `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`);
            }

            this.svg.insertBefore(path, this.svg.firstChild);
        });

        return;
        }

        const cx = nodes.reduce((s, n) => s + n.x, 0) / Math.max(1, nodes.length);
        const cy = nodes.reduce((s, n) => s + n.y, 0) / Math.max(1, nodes.length);

        const ang = (p: { x: number; y: number }) => Math.atan2(p.y - cy, p.x - cx);

        const normAngle = (a: number) => {
        while (a <= -Math.PI) a += 2 * Math.PI;
        while (a > Math.PI) a -= 2 * Math.PI;
        return a;
        };

        const shrinkRadial = (p: { x: number; y: number }, dist: number) => {
        const vx = p.x - cx, vy = p.y - cy;
        const len = Math.hypot(vx, vy) || 1;
        return { x: p.x - (vx / len) * dist, y: p.y - (vy / len) * dist };
        };

        edges.forEach(e => {
        const a = pos.get(e.from), b = pos.get(e.to);
        if (!a || !b) return;

        const a1 = ang(a);
        const a2 = ang(b);
        const d = normAngle(a2 - a1);

        const start = shrinkRadial(a, NODE_W / 2 - 6);
        const end = shrinkRadial(b, NODE_W / 2 + 8);

        const hasReverse = edgeSet.has(key(e.to, e.from));
        const mid = a1 + d / 2;

        const baseR = Math.hypot(a.x - cx, a.y - cy);
        const sweep: 0 | 1 = d < 0 ? 1 : 0;

        const bend = hasReverse ? (sweep === 1 ? 80 : -80) : 0;

        const ctrlR = Math.max(60, (baseR - 35) + bend);
        const ctrlX = cx + ctrlR * Math.cos(mid);
        const ctrlY = cy + ctrlR * Math.sin(mid);

        const path = document.createElementNS(this.svg.namespaceURI, "path");
        path.setAttribute("class", "edge");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#666");
        path.setAttribute("stroke-width", "1.5");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("marker-end", "url(#arrow)");
        path.setAttribute("d", `M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}`);

        this.svg.insertBefore(path, this.svg.firstChild);
        });
    }

    protected ensureMarker() {
        if (this.svg.querySelector("#arrow")) return;

        const defs = document.createElementNS(this.svg.namespaceURI, "defs");
        const marker = document.createElementNS(this.svg.namespaceURI, "marker");
        marker.setAttribute("id", "arrow");
        marker.setAttribute("markerWidth", "8");
        marker.setAttribute("markerHeight", "6");
        marker.setAttribute("refX", "8");
        marker.setAttribute("refY", "3");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("markerUnits", "strokeWidth");

        const poly = document.createElementNS(this.svg.namespaceURI, "polygon");
        poly.setAttribute("points", "0 0, 8 3, 0 6");
        poly.setAttribute("fill", "#666");

        marker.appendChild(poly);
        defs.appendChild(marker);
        this.svg.appendChild(defs);
    }
}