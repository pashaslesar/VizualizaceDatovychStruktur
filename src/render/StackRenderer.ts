import type { Frame, NodeState } from "../core/types";
import { BaseSvgRenderer, setStyleVar, NODE_W, NODE_H } from "./base/BaseSvgRenderer";
import type { BadgeSpec } from "./base/BaseSvgRenderer";

export class StackRenderer extends BaseSvgRenderer {
    private indexLayer: SVGGElement | null = null;

    private getIndexLayer(): SVGGElement {
        if (!this.indexLayer) {
            this.indexLayer = document.createElementNS(this.svg.namespaceURI, "g") as SVGGElement;
            this.svg.appendChild(this.indexLayer);
        }
        return this.indexLayer;
    }

    // Draw index labels at current nodeMap positions (works during lerp too)
    private drawIndices(nodes: NodeState[]) {
        const layer = this.getIndexLayer();
        // Re-append to end so it renders on top of all node groups
        this.svg.appendChild(layer);
        while (layer.firstChild) layer.removeChild(layer.firstChild);

        nodes
            .filter(n => !(n as any).isGhost && n.index !== undefined)
            .forEach(n => {
                const g = this.nodeMap.get(n.id);
                if (!g) return;

                const transform = g.getAttribute("transform") ?? "";
                const match = /translate\(([^,]+),\s*([^)]+)\)/.exec(transform);
                if (!match) return;

                const tx = parseFloat(match[1]);
                const ty = parseFloat(match[2]);

                const idx = n.index ?? (n.id - 1); // 0 = bottom, n-1 = top

                const text = document.createElementNS(this.svg.namespaceURI, "text") as SVGTextElement;
                text.setAttribute("x", String(tx + NODE_W + 12));
                text.setAttribute("y", String(ty + NODE_H / 2 + 5));
                text.setAttribute("text-anchor", "start");
                text.setAttribute("font-family", "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace");
                text.setAttribute("font-size", "13");
                text.setAttribute("fill", "#4b5563");
                text.textContent = `[${idx}]`;
                layer.appendChild(text);
            });
    }

    override render(frame: Frame) {
        super.render(frame);
        this.drawIndices(frame.nodes);
    }

    override renderLerp(a: Frame, b: Frame, t: number) {
        super.renderLerp(a, b, t);
        // Use b.nodes for id/isGhost info; positions are read from live nodeMap transforms
        this.drawIndices(b.nodes);
    }

    protected applyNodeStyle(
        n: NodeState,
        _gEl: SVGGElement,
        rectEl: SVGRectElement,
        _textEl: SVGTextElement,
    ): void {
        const isTop = !!(n as any).isTop;
        const isGhost = !!(n as any).isGhost;

        const stroke =
            isGhost ? "var(--hl-stroke)" :
            n.highlight ? "var(--hl-stroke)" :
            isTop ? "var(--primary)" :
            "#2a2f3a";

        const fill =
            isGhost ? "var(--hl-fill)" :
            n.highlight ? "var(--hl-fill)" :
            isTop ? "rgba(57, 217, 138, 0.12)" :
            "#1d2129";

        setStyleVar(rectEl, "stroke", stroke);
        setStyleVar(rectEl, "fill", fill);
    }

    protected override getBadgesForNode(n: NodeState): BadgeSpec[] {
        const isTop = !!(n as any).isTop;
        const isBottom = !!(n as any).isBottom;

        return [
            {
                key: "top",
                text: "TOP",
                x: NODE_W / 2,
                y: 14,
                visible: isTop,
                anchor: "middle",
                fill: "rgba(57, 217, 138, 0.12)",
                stroke: "var(--primary)",
                textFill: "var(--primary)",
            },
            {
                key: "bottom",
                text: "BOTTOM",
                x: NODE_W / 2,
                y: NODE_H - 6,
                visible: isBottom,
                anchor: "middle",
                fill: "rgba(57, 217, 138, 0.12)",
                stroke: "var(--primary)",
                textFill: "var(--primary)",
            },
        ];
    }
}
