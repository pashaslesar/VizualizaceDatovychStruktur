import type { Frame, NodeState, EdgeState } from "../core/types";

type QueueItem = {
    id: number;
    value: number;
};

let NEXT_ID = 1;

export class QueueOperations {
    private items: QueueItem[] = [];
    private readonly maxSize = 7;

    snapshot(): Frame {
        const nodes = this.layout(this.items);
        const edges = this.edges(nodes);
        return this.frame(nodes, edges, "Snapshot");
    }

    reset(): Frame[] {
        const beforeNodes = this.layout(this.items);
        const beforeEdges = this.edges(beforeNodes);
        const f1 = this.frame(beforeNodes, beforeEdges, "Vyprázdnění fronty");

        this.items = [];

        const afterNodes = this.layout(this.items);
        const afterEdges = this.edges(afterNodes);
        const f2 = this.frame(afterNodes, afterEdges, "Fronta je prázdná");

        return [f1, f2];
    }

    setRandom(count: number): Frame[] {
        const beforeNodes = this.layout(this.items);
        const beforeEdges = this.edges(beforeNodes);
        const before = this.frame(beforeNodes, beforeEdges, "Před náhodným naplněním");

        const n = Math.max(3, Math.min(this.maxSize, count));
        const pool = new Set<number>();

        while (pool.size < n) {
            pool.add(Math.floor(Math.random() * 90) + 10);
        }

        this.items = Array.from(pool).map(value => ({
            id: NEXT_ID++,
            value,
        }));

        const afterNodes = this.layout(this.items);
        const afterEdges = this.edges(afterNodes);
        const after = this.frame(afterNodes, afterEdges, `Náhodná fronta (${n})`);

        return [before, after];
    }

    enqueue(value: number): Frame[] {
        const frames: Frame[] = [];

        const beforeNodes = this.layout(this.items);
        const beforeEdges = this.edges(beforeNodes);
        frames.push(this.frame(beforeNodes, beforeEdges, "Výchozí stav"));

        if (this.items.length >= this.maxSize) {
            frames.push({
                ...this.frame(beforeNodes, beforeEdges, `Nelze vložit – fronta je plná (${this.maxSize})`),
                limitExceeded: true,
            });
            return frames;
        }

        this.items.push({
            id: NEXT_ID++,
            value,
        });

        const afterNodes = this.layout(this.items, {
            highlightIndex: this.items.length - 1,
        });
        const afterEdges = this.edges(afterNodes);
        frames.push(this.frame(afterNodes, afterEdges, `${value} byl vložen na konec fronty`));

        const finalNodes = this.layout(this.items);
        const finalEdges = this.edges(finalNodes);
        frames.push(this.frame(finalNodes, finalEdges, "Hotovo"));

        return frames;
    }

    dequeue(): Frame[] {
        const frames: Frame[] = [];

        const beforeNodes = this.layout(this.items);
        const beforeEdges = this.edges(beforeNodes);
        frames.push(this.frame(beforeNodes, beforeEdges, "Výchozí stav"));

        if (this.items.length === 0) {
            frames.push(this.frame(beforeNodes, beforeEdges, "Fronta je prázdná"));
            return frames;
        }

        const removed = this.items[0];

        const highlighted = this.layout(this.items, {
            highlightIndex: 0,
        });
        frames.push(this.frame(highlighted, this.edges(highlighted), "Odebírám prvek z čela fronty"));

        this.items.shift();

        const afterNodes = this.layout(this.items);
        const afterEdges = this.edges(afterNodes);
        frames.push(this.frame(afterNodes, afterEdges, `${removed.value} byl odebrán`));

        return frames;
    }

    peek(): Frame[] {
        const frames: Frame[] = [];

        const nodes = this.layout(this.items);
        const edges = this.edges(nodes);
        frames.push(this.frame(nodes, edges, "Výchozí stav"));

        if (this.items.length === 0) {
            frames.push(this.frame(nodes, edges, "Fronta je prázdná"));
            return frames;
        }

        const value = this.items[0].value;

        const highlighted = this.layout(this.items, {
            highlightIndex: 0,
        });
        frames.push(this.frame(highlighted, this.edges(highlighted), `Čelo = ${value}`));

        for (let i = 0; i < 2; i++) {
            const offNodes = this.layout(this.items);
            const off = this.frame(offNodes, this.edges(offNodes), " ");
            off.durationMs = 70;
            frames.push(off);

            const onNodes = this.layout(this.items, { highlightIndex: 0 });
            const on = this.frame(onNodes, this.edges(onNodes), " ");
            on.durationMs = 70;
            frames.push(on);
        }

        frames.push(this.frame(highlighted, this.edges(highlighted), `Čelo = ${value}`));
        return frames;
    }

    private frame(nodes: NodeState[], edges: EdgeState[], label: string): Frame {
        return {
            nodes: nodes.map(n => ({ ...n })),
            edges: edges.map(e => ({ ...e })),
            label,
            layout: "line",
            size: this.items.length,
            lastIndex: this.items.length > 0 ? this.items.length - 1 : undefined,
        };
    }

    private edges(nodes: NodeState[]): EdgeState[] {
        const realNodes = nodes
            .filter(n => !n.isGhost)
            .sort((a, b) => a.x - b.x);

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
        items: QueueItem[],
        opts?: { highlightIndex?: number }
    ): NodeState[] {
        const nodes: NodeState[] = [];
        const step = 150;
        const startX = 420;
        const y = 300;

        for (let i = 0; i < items.length; i++) {
            nodes.push({
                id: items[i].id,
                value: items[i].value,
                x: startX + i * step,
                y,
                highlight: opts?.highlightIndex === i,
                isFront: i === 0,
                isRear: i === items.length - 1,
                index: i,
            } as NodeState);
        }

        return nodes;
    }
}