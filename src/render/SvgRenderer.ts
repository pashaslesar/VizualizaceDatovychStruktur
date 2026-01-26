import type { Frame, NodeState, EdgeState, LayoutType } from "../core/types";

const NODE_W = 100;
const NODE_H = 60;
const GAP = 5;

const HEAD_COLOR = "#91B9C1";
const TAIL_COLOR = "#D7EEF3";
const ROOT_COLOR = "#729969";
const GHOST_COLOR = "#ff5c5c";

export class SvgRenderer {
  private svg: SVGSVGElement;
  private nodeMap = new Map<number, SVGGElement>();

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
          value: nb.value,
          x: na.x + (nb.x - na.x) * t,
          y: na.y + (nb.y - na.y) * t,
          highlight: t < 0.5 ? na.highlight : nb.highlight,

          isHead: t < 0.5 ? na.isHead : nb.isHead,
          isTail: t < 0.5 ? na.isTail : nb.isTail,

          isRoot: t < 0.5 ? (na as any).isRoot : (nb as any).isRoot,
          isGhost: t < 0.5 ? (na as any).isGhost : (nb as any).isGhost,
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

  private syncNodes(nodes: NodeState[], opacityOf?: (id: number) => number) {
    const keep = new Set(nodes.map(n => n.id));

    const ensureBadge = (
      gEl: SVGGElement,
      cls: string,
      text: string,
      x: number,
      y: number,
      fill: string,
      visible: boolean,
      anchor: "start" | "middle" | "end" = "start",
    ) => {
      let t = gEl.querySelector(`text.${cls}`) as SVGTextElement | null;

      if (!t) {
        t = document.createElementNS(this.svg.namespaceURI, "text") as SVGTextElement;
        t.setAttribute("class", cls);
        t.setAttribute("font-size", "10");
        t.setAttribute("font-weight", "700");
        t.setAttribute("font-family", "system-ui, -apple-system, Segoe UI, Roboto, Arial");
        gEl.appendChild(t);
      }

      t.textContent = text;
      t.setAttribute("x", String(x));
      t.setAttribute("y", String(y));
      t.setAttribute("fill", fill);
      t.setAttribute("text-anchor", anchor);
      t.style.display = visible ? "block" : "none";
    };

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

      gEl.setAttribute(
        "transform",
        `translate(${n.x - NODE_W / 2}, ${n.y - NODE_H / 2})`
      );
      gEl.setAttribute("opacity", opacityOf ? String(opacityOf(n.id)) : "1");

      const rectEl = gEl.querySelector("rect") as SVGRectElement;
      const textEl = gEl.querySelector("text.node-value") as SVGTextElement;

      const isHead = !!n.isHead;
      const isTail = !!n.isTail;
      const isRoot = !!(n as any).isRoot;
      const isGhost = !!(n as any).isGhost;

      const stroke =
        isGhost ? GHOST_COLOR :
        n.highlight ? "var(--hl-stroke)" :
        isRoot ? ROOT_COLOR :
        isHead ? HEAD_COLOR :
        isTail ? TAIL_COLOR :
        "#2a2f3a";

      const fill =
        isGhost ? "rgba(255, 92, 92, 0.12)" :
        n.highlight ? "var(--hl-fill)" :
        isRoot ? "rgba(114, 153, 105, 0.18)" :
        isHead ? "rgba(145, 185, 193, 0.18)" :
        isTail ? "rgba(215, 238, 243, 0.18)" :
        "#1d2129";

      rectEl.setAttribute("stroke", stroke);
      rectEl.setAttribute("fill", fill);

      const v = (n as any).value;
      textEl.textContent = Number.isFinite(v) ? String(v) : "";

      textEl.setAttribute("y", String(NODE_H / 2 + 5));

      ensureBadge(gEl, "badge-head", "HEAD", 8, 14, HEAD_COLOR, isHead, "start");
      ensureBadge(gEl, "badge-tail", "TAIL", NODE_W - 8, 14, TAIL_COLOR, isTail, "end");

      ensureBadge(gEl, "badge-root", "ROOT", NODE_W / 2, 14, ROOT_COLOR, isRoot, "middle");
    });

    [...this.nodeMap.keys()].forEach(id => {
      if (!keep.has(id)) {
        this.nodeMap.get(id)!.remove();
        this.nodeMap.delete(id);
      }
    });
  }

  private syncEdges(edges: EdgeState[], nodes: NodeState[], layout: LayoutType) {
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

  private ensureMarker() {
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