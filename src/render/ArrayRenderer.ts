import type { NodeState } from "../core/types";
import { BaseSvgRenderer, setStyleVar } from "./base/BaseSvgRenderer";

export class ArrayRenderer extends BaseSvgRenderer {
    protected applyNodeStyle(n: NodeState, _g: SVGGElement, rect: SVGRectElement) {
        const stroke = n.highlight ? "var(--hl-stroke)" : "#2a2f3a";
        const fill = n.highlight ? "var(--hl-fill)" : "#1d2129";
        setStyleVar(rect, "stroke", stroke);
        setStyleVar(rect, "fill", fill);
    }
}
