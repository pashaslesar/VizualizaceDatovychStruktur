import type { Frame, NodeState } from "../core/types";
import { BaseSvgRenderer, setStyleVar, NODE_W } from "./base/BaseSvgRenderer";

export class ArrayRenderer extends BaseSvgRenderer {
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
        this.svg.appendChild(layer); // keep on top
        while (layer.firstChild) layer.removeChild(layer.firstChild);

        nodes
            .filter(n => n.index !== undefined)
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

    protected applyNodeStyle(n: NodeState, _g: SVGGElement, rect: SVGRectElement) {
        const stroke = n.highlight ? "var(--hl-stroke)" : "#2a2f3a";
        const fill = n.highlight ? "var(--hl-fill)" : "#1d2129";
        setStyleVar(rect, "stroke", stroke);
        setStyleVar(rect, "fill", fill);
    }
}
