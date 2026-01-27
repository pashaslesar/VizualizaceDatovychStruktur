import type { Frame, NodeState, EdgeState, LayoutType } from "../core/types";

type BstNode = {
    id: number;
    value: number;
    left: BstNode | null;
    right: BstNode | null;
};

let NEXT_ID = 1;

const MAX_ROWS = 5;

export class BstOperations {
    private root: BstNode | null = null;

    snapshot(): Frame {
        const nodes = this.layout();
        const edges = this.edges();
        return this.frame(nodes, edges, "Snapshot");
    }

    reset(): Frame[] {
        const before = this.frame(this.layout(), this.edges(), "Před vymazáním");
        this.root = null;
        NEXT_ID = 1;
        const after = this.frame([], [], "Prázdný strom");
        return [before, after];
    }

    setRandom(count: number): Frame[] {
        const before = this.frame(this.layout(), this.edges(), "Před náhodným naplněním");

        this.root = null;
        NEXT_ID = 1;

        const n = Math.max(8, Math.min(15, count));
        const pool = new Set<number>();
        while (pool.size < n) pool.add(Math.floor(Math.random() * 90) + 10);

        for (const v of pool) {
            let clone = this.cloneTree(this.root);
            clone = this.insertRawInto(clone, v);

            if (this.height(clone) <= MAX_ROWS) {
                this.root = clone;
            }
        }

        const after = this.frame(this.layout(), this.edges(), `Náhodný strom (${this.countNodes(this.root)})`);
        return [before, after];
    }

    insert(value: number): Frame[] {
        const frames: Frame[] = [];

        frames.push(this.frame(this.layout(), this.edges(), "Výchozí stav"));

        if (this.contains(value)) {
            frames.push(this.frame(this.layout(), this.edges(), "Hodnota již existuje – vložení zrušeno"));
            return frames;
        }

        const path: BstNode[] = [];
        let cur = this.root;

        while (cur) {
            path.push(cur);
            cur = value < cur.value ? cur.left : cur.right;
        }

        for (const p of path) {
            frames.push(this.frame(this.layout({ highlightId: p.id }), this.edges(), `Porovnání s ${p.value}`));
        }

        let clone = this.cloneTree(this.root);
        clone = this.insertRawInto(clone, value);

        const hAfter = this.height(clone);
        if (hAfter > MAX_ROWS) {
            frames.push(this.frame(this.layout(), this.edges(), `Max hloubka je ${MAX_ROWS} řádky – nelze vložit`));
            return frames;
        }

        this.root = clone;
        frames.push(this.frame(this.layout(), this.edges(), "Vloženo"));
        return frames;
    }

    find(value: number): Frame[] {
        const frames: Frame[] = [];

        const blinkFast = (nodes: NodeState[], edges: EdgeState[], label: string) => {
            const f = this.frame(nodes, edges, label);
            (f as any).durationMs = 70;
            frames.push(f);
        };

        frames.push(this.frame(this.layout(), this.edges(), "Hledání hodnoty"));

        let cur = this.root;
        while (cur) {
            frames.push(this.frame(this.layout({ highlightId: cur.id }), this.edges(), `Porovnání s ${cur.value}`));

            if (cur.value === value) {
                frames.push(this.frame(this.layout({ highlightId: cur.id }), this.edges(), "Nalezeno"));

                for (let k = 0; k < 2; k++) {
                    blinkFast(this.layout(), this.edges(), " ");
                    blinkFast(this.layout({ highlightId: cur.id }), this.edges(), " ");
                }

                frames.push(this.frame(this.layout({ highlightId: cur.id }), this.edges(), "Nalezeno"));
                return frames;
            }

            cur = value < cur.value ? cur.left : cur.right;
        }

        frames.push(this.frame(this.layout(), this.edges(), "Nebylo nalezeno"));
        return frames;
    }

    delete(value: number): Frame[] {
        const frames: Frame[] = [];
        frames.push(this.frame(this.layout(), this.edges(), "Před odstraněním"));

        let cur = this.root;
        while (cur) {
            frames.push(
                this.frame(
                    this.layout({ highlightId: cur.id }),
                    this.edges(),
                    `Hledání uzlu ${value}`
                )
            );
            if (cur.value === value) break;
            cur = value < cur.value ? cur.left : cur.right;
        }

        const target = cur;
        if (!target) {
            frames.push(this.frame(this.layout(), this.edges(), "Hodnota nebyla nalezena"));
            return frames;
        }

        if (target.left && target.right) {
            frames.push(
                this.frame(
                    this.layout({ highlightId: target.id }),
                    this.edges(),
                    "Uzel má 2 potomky – hledám nástupce"
                )
            );

            const path: BstNode[] = [];
            let s: BstNode | null = target.right;

            if (s) {
            path.push(s);
            while (s.left) {
                s = s.left;
                path.push(s);
            }
            }

            for (let i = 0; i < path.length; i++) {
            const n = path[i];
            const label =
                i === 0
                ? `Pravý podstrom (${n.value})`
                : `Nástupce hledám vlevo (${n.value})`;
            frames.push(this.frame(this.layout({ highlightId: n.id }), this.edges(), label));
            }

            const succ = path[path.length - 1];
            frames.push(
                this.frame(
                    this.layout({ highlightId: succ.id }),
                    this.edges(),
                    `Nalezen nástupce (${succ.value})`
                )
            );

            const baseNodes = this.layout();
            const baseEdges = this.edges();

            const tNode = baseNodes.find(n => n.id === target.id);
            const sNode = baseNodes.find(n => n.id === succ.id);

            if (tNode && sNode) {
                const ghostId = -999999;
                const moverId = -888888;

                const startNodes = baseNodes
                    .filter(n => n.id !== succ.id)
                    .concat([
                    { id: ghostId, value: NaN, x: sNode.x, y: sNode.y, isGhost: true } as any,
                    { id: moverId, value: sNode.value, x: sNode.x, y: sNode.y, highlight: true } as any,
                    ]);

                frames.push(this.frame(startNodes as any, baseEdges, "Přesun hodnoty"));

                const steps = 6;
                for (let i = 1; i <= steps; i++) {
                    const k = i / steps;
                    const mx = sNode.x + (tNode.x - sNode.x) * k;
                    const my = sNode.y + (tNode.y - sNode.y) * k;

                    const midNodes = baseNodes
                    .filter(n => n.id !== succ.id)
                    .concat([
                        { id: ghostId, value: NaN, x: sNode.x, y: sNode.y, isGhost: true } as any,
                        { id: moverId, value: sNode.value, x: mx, y: my, highlight: true } as any,
                    ]);

                    frames.push(this.frame(midNodes as any, baseEdges, " "));
                }
            }

            const clone = this.cloneTree(this.root);
            this.root = this.deleteRec(clone, value);

            frames.push(this.frame(this.layout(), this.edges(), "Odstraněno"));
            return frames;
        }

        frames.push(this.frame(this.layout({ highlightId: target.id }), this.edges(), "Odstraňuji uzel"));
        const clone = this.cloneTree(this.root);
        this.root = this.deleteRec(clone, value);
        frames.push(this.frame(this.layout(), this.edges(), "Odstraněno"));
        return frames;
    }

    deleteRoot(): Frame[] {
        if (!this.root) {
            return [this.frame(this.layout(), this.edges(), "Strom je prázdný")];
        }
        return this.delete(this.root.value);
    }

    getRootValue(): number | null {
        return this.root ? this.root.value : null;
    }

    private frame(nodes: NodeState[], edges: EdgeState[], label: string): Frame {
        return {
            nodes: nodes.map(n => ({ ...n })),
            edges: edges.map(e => ({ ...e })),
            label,
            layout: "tree" as LayoutType,
        };
    }

    private contains(value: number): boolean {
        let cur = this.root;
        while (cur) {
            if (cur.value === value) return true;
            cur = value < cur.value ? cur.left : cur.right;
        }
        return false;
    }

    private insertRawInto(root: BstNode | null, value: number): BstNode {
        const n: BstNode = { id: NEXT_ID++, value, left: null, right: null };
        if (!root) return n;

        let cur = root;
        while (true) {
            if (value < cur.value) {
                if (!cur.left) { cur.left = n; break; }
                cur = cur.left;
            } else {
                if (!cur.right) { cur.right = n; break; }
                cur = cur.right;
            }
        }
        return root;
    }

    private deleteRec(node: BstNode | null, value: number): BstNode | null {
        if (!node) return null;

        if (value < node.value) {
            node.left = this.deleteRec(node.left, value);
            return node;
        }
        if (value > node.value) {
            node.right = this.deleteRec(node.right, value);
            return node;
        }

        if (!node.left && !node.right) return null;
        if (!node.left) return node.right;
        if (!node.right) return node.left;

        const succ = this.minNode(node.right);
        node.value = succ.value;
        node.right = this.deleteRec(node.right, succ.value);
        return node;
    }

    private minNode(node: BstNode): BstNode {
        let cur = node;
        while (cur.left) cur = cur.left;
        return cur;
    }

    private edges(): EdgeState[] {
        const edges: EdgeState[] = [];

        const walk = (n: BstNode | null) => {
        if (!n) return;

        if (n.left) edges.push({ from: n.id, to: n.left.id });
        if (n.right) edges.push({ from: n.id, to: n.right.id });

        walk(n.left);
        walk(n.right);
        };

        walk(this.root);
        return edges;
    }

    private layout(opts?: { highlightId?: number }): NodeState[] {
        const nodes: NodeState[] = [];

        const W = 1600;
        const PAD = 140;
        const baseY = 140;
        const levelY = 110;

        const place = (n: BstNode | null, depth: number, x0: number, x1: number) => {
        if (!n) return;
        if (depth >= MAX_ROWS) return;

        const x = (x0 + x1) / 2;
        const y = baseY + depth * levelY;

        nodes.push({
            id: n.id,
            value: n.value,
            x,
            y,
            highlight: opts?.highlightId === n.id,
            isRoot: depth === 0,
        });


        const mid = (x0 + x1) / 2;
        place(n.left, depth + 1, x0, mid);
        place(n.right, depth + 1, mid, x1);
        };

        place(this.root, 0, PAD, W - PAD);
        return nodes;
    }

    private height(n: BstNode | null): number {
        if (!n) return 0;
        return 1 + Math.max(this.height(n.left), this.height(n.right));
    }

    private countNodes(n: BstNode | null): number {
        if (!n) return 0;
        return 1 + this.countNodes(n.left) + this.countNodes(n.right);
    }

    private cloneTree(n: BstNode | null): BstNode | null {
        if (!n) return null;
        return {
        id: n.id,
        value: n.value,
        left: this.cloneTree(n.left),
        right: this.cloneTree(n.right),
        };
    }

    traverse(mode: "lifo" | "fifo"): { frames: Frame[]; order: number[] } {
        const frames: Frame[] = [];
        const order: number[] = [];

        frames.push(this.frame(this.layout(), this.edges(), mode === "lifo"
            ? "Průchod do hloubky (LIFO)"
            : "Průchod do šířky (FIFO)"
        ));

        if (!this.root) {
            frames.push(this.frame([], [], "Strom je prázdný"));
            return { frames, order };
        }

        const stackOrQueue: BstNode[] = [this.root];

        while (stackOrQueue.length > 0) {
            const cur =
            mode === "lifo" ? stackOrQueue.pop()! : stackOrQueue.shift()!;

            order.push(cur.value);
            frames.push(this.frame(
            this.layout({ highlightId: cur.id }),
            this.edges(),
            `Navštíveno: ${cur.value}`
            ));

            if (mode === "lifo") {
                if (cur.right) stackOrQueue.push(cur.right);
                if (cur.left) stackOrQueue.push(cur.left);
            } else {
                if (cur.left) stackOrQueue.push(cur.left);
                if (cur.right) stackOrQueue.push(cur.right);
            }
        }

        frames.push(this.frame(this.layout(), this.edges(), "Hotovo"));
        return { frames, order };
    }
}
