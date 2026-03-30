import type { Frame, NodeState } from "../core/types";
import { BaseSvgRenderer, setStyleVar, NODE_W, NODE_H } from "./base/BaseSvgRenderer";
import type { BadgeSpec } from "./base/BaseSvgRenderer";

const QUEUE_COLOR = "var(--primary)";

export class QueueRenderer extends BaseSvgRenderer {
    private indexLayer: SVGGElement | null = null;

    private getIndexLayer(): SVGGElement {
        if (!this.indexLayer) {
            this.indexLayer = document.createElementNS(this.svg.namespaceURI, "g") as SVGGElement;
            this.svg.appendChild(this.indexLayer);
        }
        return this.indexLayer;
    }

    private drawIndices(nodes: NodeState[]) {
        const layer = this.getIndexLayer();
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

                const text = document.createElementNS(this.svg.namespaceURI, "text") as SVGTextElement;
                text.setAttribute("x", String(tx + NODE_W / 2));
                text.setAttribute("y", String(ty - 10));
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("font-family", "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace");
                text.setAttribute("font-size", "13");
                text.setAttribute("fill", "#4b5563");
                text.textContent = `[${n.index}]`;
                layer.appendChild(text);
            });
    }

    override render(frame: Frame) {
        super.render(frame);
        this.drawIndices(frame.nodes);
    }

    override renderLerp(a: Frame, b: Frame, t: number) {
        super.renderLerp(a, b, t);
        this.drawIndices(b.nodes);
    }

    protected applyNodeStyle(
        n: NodeState,
        _gEl: SVGGElement,
        rectEl: SVGRectElement,
        _textEl: SVGTextElement,
    ): void {
        const isFront = !!(n as any).isFront;
        const isRear = !!(n as any).isRear;

        const stroke =
            n.highlight ? "var(--hl-stroke)" :
            (isFront || isRear) ? QUEUE_COLOR :
            "#2a2f3a";

        const fill =
            n.highlight ? "var(--hl-fill)" :
            (isFront || isRear) ? "var(--hl-fill)" :
            "#1d2129";

        setStyleVar(rectEl, "stroke", stroke);
        setStyleVar(rectEl, "fill", fill);
    }

    protected override getBadgesForNode(n: NodeState): BadgeSpec[] {
        const isFront = !!(n as any).isFront;
        const isRear = !!(n as any).isRear;

        return [
            {
                key: "front",
                text: "FRONT",
                x: NODE_W / 2,
                y: 14,
                visible: isFront,
                anchor: "middle",
                fill: "var(--hl-fill)",
                stroke: QUEUE_COLOR,
                textFill: QUEUE_COLOR,
            },
            {
                key: "rear",
                text: "REAR",
                x: NODE_W / 2,
                y: NODE_H - 6,
                visible: isRear,
                anchor: "middle",
                fill: "var(--hl-fill)",
                stroke: QUEUE_COLOR,
                textFill: QUEUE_COLOR,
            },
        ];
    }
}
