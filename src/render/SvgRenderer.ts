import type { Frame, NodeState, EdgeState } from "../core/types";

const NODE_W = 100;
const NODE_H = 60;
const GAP = 5;

export class SvgRenderer {
  private svg: SVGSVGElement;
  private nodeMap = new Map<number, SVGGElement>();

  constructor(svg: SVGSVGElement) {
    this.svg = svg;
  }

  render(frame: Frame) {
    this.syncNodes(frame.nodes);
    this.syncEdges(frame.edges, frame.nodes);
  }

  renderLerp(a: Frame, b: Frame, t: number) {
    const allIds = new Set<number>([...a.nodes.map(n => n.id), ...b.nodes.map(n => n.id)]);
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
        });
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
    this.syncEdges(b.edges, interNodes);
  }

  private syncNodes(nodes: NodeState[], opacityOf?: (id: number) => number) {
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
        rect.setAttribute("fill",   "#1d2129");

        const text = document.createElementNS(this.svg.namespaceURI, "text") as SVGTextElement;
        text.setAttribute("x", String(NODE_W / 2));
        text.setAttribute("y", String(NODE_H / 2 + 5));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute(
          "font-family",
          "system-ui, -apple-system, Segoe UI, Roboto, Arial"
        );
        text.setAttribute("font-size", "14");
        text.setAttribute("fill",   "#e8ecf1");

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
      rectEl.setAttribute("stroke", n.highlight ? "#6ea8fe" : "#2a2f3a");
      rectEl.setAttribute("fill",   n.highlight ? "#1a2a3e" : "#1d2129");

      const textEl = gEl.querySelector("text") as SVGTextElement;
      textEl.textContent = String(n.value);
    });

    [...this.nodeMap.keys()].forEach(id => {
      if (!keep.has(id)) {
        this.nodeMap.get(id)!.remove();
        this.nodeMap.delete(id);
      }
    });
  }

  private syncEdges(edges: EdgeState[], nodes: NodeState[]) {
    [...this.svg.querySelectorAll("path.edge")].forEach(p => p.remove());

    const pos = new Map<number, { x: number; y: number }>();
    nodes.forEach(n => pos.set(n.id, { x: n.x, y: n.y }));

    const moveToward = (ax:number, ay:number, bx:number, by:number, dist:number) => {
        const vx = bx - ax, vy = by - ay;
        const len = Math.hypot(vx, vy) || 1;
        const k = dist / len;
        return { x: ax + vx * k, y: ay + vy * k };
    };

    edges.forEach(e => {
        const a = pos.get(e.from), b = pos.get(e.to);
        if (!a || !b) return;

        const start = moveToward(a.x, a.y, b.x, b.y, NODE_W/2 - 2);
        const end   = moveToward(b.x, b.y, a.x, a.y, NODE_W/2 + GAP);

        const path = document.createElementNS(this.svg.namespaceURI, "path");
        path.setAttribute("class", "edge");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#666");
        path.setAttribute("stroke-width", "1.5");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("d", `M ${start.x} ${start.y} L ${end.x} ${end.y}`);
        path.setAttribute("marker-end", "url(#arrow)");

        this.ensureMarker();
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
