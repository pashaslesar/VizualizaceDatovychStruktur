import type { NodeState } from "../core/types";
import { BaseSvgRenderer, setStyleVar, NODE_W } from "./base/BaseSvgRenderer";
import type { BadgeSpec } from "./base/BaseSvgRenderer";

const ROOT_COLOR = "#729969";

export class BstRenderer extends BaseSvgRenderer {
    protected applyNodeStyle(n: NodeState, _g: SVGGElement, rect: SVGRectElement) {
        const isRoot = !!(n as any).isRoot;
        const isGhost = !!(n as any).isGhost;

        const stroke =
        isGhost ? "#ff5c5c" :
        n.highlight ? "var(--hl-stroke)" :
        isRoot ? ROOT_COLOR :
        "#2a2f3a";

        const fill =
        isGhost ? "rgba(255, 92, 92, 0.12)" :
        n.highlight ? "var(--hl-fill)" :
        isRoot ? "rgba(114, 153, 105, 0.18)" :
        "#1d2129";

        setStyleVar(rect, "stroke", stroke);
        setStyleVar(rect, "fill", fill);
    }

    protected override getBadgesForNode(n: NodeState): BadgeSpec[] {
        const isRoot = !!(n as any).isRoot;

        return [
            {
                key: "root" as const,
                text: "ROOT",
                x: NODE_W / 2,
                y: 14,
                visible: isRoot,
                anchor: "middle" as const,
                fill: "rgba(114, 153, 105, 0.18)",
                stroke: ROOT_COLOR,
                textFill: ROOT_COLOR,
            },
        ];
    }
}
