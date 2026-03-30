import type { Frame, NodeState, EdgeState } from "../core/types";

let NEXT_ID = 1;

export class StackOperations {
    private values: number[] = [];
    private readonly maxSize = 8;

    snapshot(): Frame {
        const nodes = this.layout(this.values);
        const edges = this.edges(nodes);
        return this.frame(nodes, edges, "Snapshot");
    }

    reset(): Frame[] {
        const beforeNodes = this.layout(this.values);
        const beforeEdges = this.edges(beforeNodes);
        const f1 = this.frame(beforeNodes, beforeEdges, "Vyprázdnění zásobníku");

        this.values = [];

        const afterNodes = this.layout(this.values);
        const afterEdges = this.edges(afterNodes);
        const f2 = this.frame(afterNodes, afterEdges, "Zásobník je prázdný");

        return [f1, f2];
    }

    setRandom(count: number): Frame[] {
        const beforeNodes = this.layout(this.values);
        const beforeEdges = this.edges(beforeNodes);
        const before = this.frame(beforeNodes, beforeEdges, "Před náhodným naplněním");

        const n = Math.max(4, Math.min(this.maxSize, count));
        const pool = new Set<number>();
        while (pool.size < n) {
            pool.add(Math.floor(Math.random() * 90) + 10);
        }

        this.values = Array.from(pool);

        const afterNodes = this.layout(this.values);
        const afterEdges = this.edges(afterNodes);
        const after = this.frame(afterNodes, afterEdges, `Náhodný zásobník (${n})`);

        return [before, after];
    }

    push(value: number): Frame[] {
        const beforeNodes = this.layout(this.values);
        const beforeEdges = this.edges(beforeNodes);

        const frames: Frame[] = [];
        frames.push(this.frame(beforeNodes, beforeEdges, "Výchozí stav"));

        if (this.values.length >= this.maxSize) {
            frames.push({
                ...this.frame(beforeNodes, beforeEdges, `Nelze vložit – zásobník je plný (${this.maxSize})`),
                limitExceeded: true,
            });
            return frames;
        }

        const ghostNodes = this.layout(this.values, {
            ghostValue: value,
            ghostAboveTop: true,
        });
        const ghostEdges = this.edges(ghostNodes);
        frames.push(this.frame(ghostNodes, ghostEdges, `Připraven push(${value})`));

        this.values.push(value);

        const afterNodes = this.layout(this.values, {
            highlightIndex: this.values.length - 1,
        });
        const afterEdges = this.edges(afterNodes);
        frames.push(this.frame(afterNodes, afterEdges, `${value} byl vložen na vrchol`));

        const finalNodes = this.layout(this.values);
        const finalEdges = this.edges(finalNodes);
        frames.push(this.frame(finalNodes, finalEdges, "Hotovo"));

        return frames;
    }

    pop(): Frame[] {
        const nodes = this.layout(this.values);
        const edges = this.edges(nodes);

        const frames: Frame[] = [];
        frames.push(this.frame(nodes, edges, "Výchozí stav"));

        if (this.values.length === 0) {
            frames.push(this.frame(nodes, edges, "Zásobník je prázdný"));
            return frames;
        }

        const topIndex = this.values.length - 1;

        const highlighted = this.layout(this.values, {
            highlightIndex: topIndex,
        });
        frames.push(this.frame(highlighted, this.edges(highlighted), "Odebírám vrchol zásobníku"));

        const removedValue = this.values[topIndex];

        const ghostInPlace = this.layout(this.values, {
            ghostValue: removedValue,
            ghostAtTopPos: true,
            hideRealTop: true,
        });
        frames.push(this.frame(ghostInPlace, this.edges(ghostInPlace), `${removedValue} opouští zásobník`));

        this.values.pop();

        const afterNodes = this.layout(this.values);
        const afterEdges = this.edges(afterNodes);
        frames.push(this.frame(afterNodes, afterEdges, `${removedValue} byl odebrán`));

        return frames;
    }

    peek(): Frame[] {
        const nodes = this.layout(this.values);
        const edges = this.edges(nodes);

        const frames: Frame[] = [];
        frames.push(this.frame(nodes, edges, "Výchozí stav"));

        if (this.values.length === 0) {
            frames.push(this.frame(nodes, edges, "Zásobník je prázdný"));
            return frames;
        }

        const topIndex = this.values.length - 1;
        const value = this.values[topIndex];

        const highlighted = this.layout(this.values, { highlightIndex: topIndex });
        frames.push(this.frame(highlighted, this.edges(highlighted), `Vrchol = ${value}`));

        for (let i = 0; i < 2; i++) {
            const off = this.frame(this.layout(this.values), this.edges(this.layout(this.values)), " ");
            off.durationMs = 70;
            frames.push(off);

            const onNodes = this.layout(this.values, { highlightIndex: topIndex });
            const on = this.frame(onNodes, this.edges(onNodes), " ");
            on.durationMs = 70;
            frames.push(on);
        }

        frames.push(this.frame(highlighted, this.edges(highlighted), `Vrchol = ${value}`));
        return frames;
    }

    peekBottom(): Frame[] {
        const nodes = this.layout(this.values);
        const edges = this.edges(nodes);

        const frames: Frame[] = [];
        frames.push(this.frame(nodes, edges, "Výchozí stav"));

        if (this.values.length === 0) {
            frames.push(this.frame(nodes, edges, "Zásobník je prázdný"));
            return frames;
        }

        const bottomIndex = 0;
        const value = this.values[bottomIndex];

        const highlighted = this.layout(this.values, { highlightIndex: bottomIndex });
        frames.push(this.frame(highlighted, this.edges(highlighted), `Dno = ${value}`));

        for (let i = 0; i < 2; i++) {
            const off = this.frame(this.layout(this.values), this.edges(this.layout(this.values)), " ");
            off.durationMs = 70;
            frames.push(off);

            const onNodes = this.layout(this.values, { highlightIndex: bottomIndex });
            const on = this.frame(onNodes, this.edges(onNodes), " ");
            on.durationMs = 70;
            frames.push(on);
        }

        frames.push(this.frame(highlighted, this.edges(highlighted), `Dno = ${value}`));
        return frames;
    }

    private frame(nodes: NodeState[], edges: EdgeState[], label: string): Frame {
        return {
            nodes: nodes.map(n => ({ ...n })),
            edges: edges.map(e => ({ ...e })),
            label,
            layout: "stack",
            size: this.values.length,
            lastIndex: this.values.length > 0 ? this.values.length - 1 : undefined,
        };
    }

    private edges(nodes: NodeState[]): EdgeState[] {
        const realNodes = nodes
            .filter(n => !n.isGhost)
            .sort((a, b) => a.y - b.y);

        const edges: EdgeState[] = [];

        for (let i = 0; i < realNodes.length - 1; i++) {
            edges.push({
                from: realNodes[i].id,
                to: realNodes[i + 1].id,
            });
        }

        return edges;
    }

    private layout(
        values: number[],
        opts?: {
            highlightIndex?: number;
            ghostValue?: number;
            ghostAboveTop?: boolean;
            ghostAtTopPos?: boolean;
            hideRealTop?: boolean;
        }
    ): NodeState[] {
        const highlightIndex = opts?.highlightIndex;
        const nodes: NodeState[] = [];

        const x = 800;
        const topY = 100;
        const step = 90;

        for (let i = 0; i < values.length; i++) {
            const isTop = i === values.length - 1;
            const isBottom = i === 0;

            if (opts?.hideRealTop && isTop) continue;

            nodes.push({
                id: i + 1,
                value: values[i],
                x,
                y: topY + (values.length - 1 - i) * step,
                highlight: highlightIndex === i,
                isTop,
                isBottom,
                index: i,
            });
        }

        if (opts?.ghostValue !== undefined) {
            let ghostY: number;

            if (opts.ghostAtTopPos) {
                ghostY = topY;
            } else if (opts.ghostAboveTop) {
                ghostY = topY - step;
            } else {
                ghostY = topY + values.length * step;
            }

            nodes.push({
                id: 100000 + NEXT_ID++,
                value: opts.ghostValue,
                x,
                y: ghostY,
                isGhost: true,
                highlight: true,
                isTop: false,
                isBottom: false,
            });
        }

        return nodes;
    }
}
