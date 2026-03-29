import type { NodeState } from "../core/types";
import { BaseSvgRenderer, setStyleVar, NODE_W } from "./base/BaseSvgRenderer";
import type { BadgeSpec } from "./base/BaseSvgRenderer"; 

export class LinkedListRenderer extends BaseSvgRenderer {
    protected applyNodeStyle(n: NodeState, _g: SVGGElement, rect: SVGRectElement) {
        const isGhost = !!(n as any).isGhost;

        const showHead = (n as any).badgeHead ?? !!n.isHead;
        const showTail = (n as any).badgeTail ?? !!n.isTail;

        if (showHead) rect.setAttribute("data-head", "1");
        else rect.removeAttribute("data-head");

        if (showTail) rect.setAttribute("data-tail", "1");
        else rect.removeAttribute("data-tail");

        const stroke =
            isGhost ? "#ff5c5c" :
            n.highlight ? "var(--hl-stroke)" :
            (showHead || showTail) ? "var(--hl-stroke)" :
            "#2a2f3a";

        const fill =
            isGhost ? "rgba(255, 92, 92, 0.12)" :
            n.highlight ? "var(--hl-fill)" :
            (showHead || showTail) ? "var(--hl-fill)" :
            "#1d2129";

        setStyleVar(rect, "stroke", stroke);
        setStyleVar(rect, "fill", fill);
    }


    protected override getBadgesForNode(n: NodeState): BadgeSpec[] {
        const showHead = (n as any).badgeHead ?? !!n.isHead;
        const showTail = (n as any).badgeTail ?? !!n.isTail;

        return [
            { key: "head" as const, text: "HEAD", x: 8,          y: 14, visible: showHead, anchor: "start" as const,
              fill: "var(--hl-fill)", stroke: "var(--hl-stroke)", textFill: "var(--hl-stroke)" },
            { key: "tail" as const, text: "TAIL", x: NODE_W - 8, y: 14, visible: showTail, anchor: "end" as const,
              fill: "var(--hl-fill)", stroke: "var(--hl-stroke)", textFill: "var(--hl-stroke)" },
        ];
    }
}
