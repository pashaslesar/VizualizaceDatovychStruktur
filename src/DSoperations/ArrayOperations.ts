import type { Frame, NodeState, EdgeState } from "../core/types";

type Cell = number | null;

export class ArrayOperations {
    private data: Cell[] = [];
    private capacity = 8;

    constructor() {
        this.create(this.capacity);
    }

    create(capacity: number): Frame[] {
        const cap = this.clampCapacity(capacity);

        const before = this.layout();
        const f1 = this.frame(before, [], "Vytvoření nového pole");

        this.capacity = cap;
        this.data = Array(this.capacity).fill(null);

        const after = this.layout();
        const f2 = this.frame(after, [], `Nové pole (kapacita ${this.capacity})`);

        return [f1, f2];
    }

    deleteArray(): Frame[] {
        const before = this.layout();
        const f1 = this.frame(before, [], "Mazání pole");

        this.capacity = 0;
        this.data = [];

        const after = this.layout();
        const f2 = this.frame(after, [], "Pole bylo odstraněno");

        return [f1, f2];
    }

    snapshot(): Frame {
        const nodes = this.layout();
        return this.frame(nodes, [], "Snapshot");
    }

    clearValues(): Frame[] {
        const before = this.layout();
        const f1 = this.frame(before, [], "Před vyčištěním");

        this.data = Array(this.capacity).fill(null);

        const after = this.layout();
        const f2 = this.frame(after, [], "Pole vyčištěno");

        return [f1, f2];
    }

    setCapacity(newCapacity: number): Frame[] {
        const cap = this.clampCapacity(newCapacity);

        const before = this.layout();
        const f1 = this.frame(before, [], `Změna kapacity: ${this.capacity} → ${cap}`);

        if (cap === this.capacity) {
            const f2 = this.frame(this.layout(), [], "Beze změny");
            return [f1, f2];
        }

        const old = this.data.slice();
        this.capacity = cap;

        if (this.capacity <= 0) {
            this.data = [];
            const after0 = this.layout();
            const f2 = this.frame(after0, [], "Pole bylo odstraněno");
            return [f1, f2];
        }

        this.data = Array(this.capacity).fill(null);
        for (let i = 0; i < Math.min(old.length, this.capacity); i++) {
            this.data[i] = old[i];
        }

        const after = this.layout();
        const f2 = this.frame(after, [], `Kapacita nastavena na ${this.capacity}`);
        return [f1, f2];
    }

    setAt(index: number, value: number): Frame[] {
        if (this.capacity === 0) return this.create(8).concat(this.setAt(index, value));

        const idx = this.clampIndex(index);

        const frames: Frame[] = [];
        frames.push(this.frame(this.layout(), [], "Výchozí stav"));
        frames.push(this.frame(this.layout({ highlightIndex: idx }), [], `Index ${idx} vybrán`));

        this.data[idx] = value;

        frames.push(this.frame(this.layout({ highlightIndex: idx }), [], `Nastavení ${value} na index ${idx}`));
        frames.push(this.frame(this.layout(), [], "Hotovo"));
        return frames;
    }

    insertAt(index: number, value: number): Frame[] {
        if (this.capacity === 0) return this.create(8).concat(this.insertAt(index, value));

        const size = this.getSize();

        if (size >= this.capacity && this.capacity * 2 > 12) {
            return [
                {
                ...this.frame(this.layout(), [], "Nelze vložit – maximální kapacita pole je 12"),
                limitExceeded: true,
                } as Frame,
            ];
        }

        const idx = this.clampIndex(index);
        const frames: Frame[] = [];

        frames.push(this.frame(this.layout(), [], "Výchozí stav"));
        frames.push(this.frame(this.layout({ highlightIndex: idx }), [], `Vkládáme na index ${idx}`));

        if (this.data[idx] === null) {
            this.data[idx] = value;
            frames.push(this.frame(this.layout({ highlightIndex: idx }), [], `Vloženo ${value} na index ${idx}`));
            frames.push(this.frame(this.layout(), [], "Hotovo"));
            return frames;
        }

        let hole = -1;
        for (let i = idx + 1; i < this.capacity; i++) {
            if (this.data[i] === null) {
                hole = i;
                break;
            }
        }

        if (hole === -1) {
            frames.push(this.frame(this.layout(), [], "Není volné místo → rozšíření kapacity"));
            frames.push(...this.setCapacity(Math.min(12, Math.max(4, this.capacity * 2))));
            return frames.concat(this.insertAt(idx, value));
        }

        for (let i = hole; i > idx; i--) {
            this.data[i] = this.data[i - 1];
            frames.push(this.frame(this.layout({ highlightIndex: i }), [], `Posun: ${i - 1} → ${i}`));
        }

        this.data[idx] = value;
        frames.push(this.frame(this.layout({ highlightIndex: idx }), [], `Vloženo ${value} na index ${idx}`));
        frames.push(this.frame(this.layout(), [], "Hotovo"));
        return frames;
    }

    removeAt(index: number): Frame[] {
        if (this.capacity === 0) return [this.frame([], [], "Pole neexistuje")];

        const idx = this.clampIndex(index);

        const before = this.layout();
        const frames: Frame[] = [];
        frames.push(this.frame(before, [], "Výchozí stav"));
        frames.push(this.frame(this.layout({ highlightIndex: idx }), [], `Odstraňujeme index ${idx}`));

        if (this.data[idx] === null) {
            frames.push(this.frame(this.layout({ highlightIndex: idx }), [], "Buňka je prázdná — bez změny"));
            frames.push(this.frame(this.layout(), [], "Hotovo"));
            return frames;
        }

        const removed = this.data[idx];
        this.data[idx] = null;

        frames.push(this.frame(this.layout({ highlightIndex: idx }), [], `Odstraněno (${removed})`));
        frames.push(this.frame(this.layout(), [], "Hotovo"));
        return frames;
    }

    setRandom(): Frame[] {
        if (this.capacity === 0) this.create(8);

        const before = this.layout();
        const f1 = this.frame(before, [], "Před náhodným naplněním");

        const n = this.capacity;
        const pool = new Set<number>();
        while (pool.size < n) pool.add(Math.floor(Math.random() * 90) + 10);

        this.data = Array(this.capacity).fill(null);
        let i = 0;
        for (const v of pool) this.data[i++] = v;

        const after = this.layout();
        const f2 = this.frame(after, [], `Náhodné pole (${this.capacity})`);

        return [f1, f2];
    }

    findValue(value: number): Frame[] {
        if (this.capacity === 0) return [this.frame([], [], "Pole neexistuje")];

        const frames: Frame[] = [];
        frames.push(this.frame(this.layout(), [], "Hledání hodnoty"));

        for (let i = 0; i < this.capacity; i++) {
            frames.push(this.frame(this.layout({ highlightIndex: i }), [], `Kontrola indexu ${i}`));

            if (this.data[i] === value) {
                frames.push(this.frame(this.layout({ highlightIndex: i }), [], "Nalezeno"));

                for (let k = 0; k < 2; k++) {
                const a = this.frame(this.layout(), [], " ");
                (a as any).durationMs = 60;
                frames.push(a);

                const b = this.frame(this.layout({ highlightIndex: i }), [], " ");
                (b as any).durationMs = 60;
                frames.push(b);
                }

                frames.push(this.frame(this.layout({ highlightIndex: i }), [], "Nalezeno"));
                frames.push(this.frame(this.layout(), [], "Hotovo"));
                return frames;
            }
        }

        frames.push(this.frame(this.layout(), [], "Nebylo nalezeno"));
        return frames;
    }

    private getSize(): number {
        let cnt = 0;
        for (const v of this.data) if (v !== null) cnt++;
        return cnt;
    }

    private frame(nodes: NodeState[], edges: EdgeState[], label: string): Frame {
        return {
        nodes: nodes.map(n => ({ ...n })),
        edges: edges.map(e => ({ ...e })),
        label,
        layout: "line",
        capacity: this.capacity,
        size: this.getSize(),
        lastIndex: this.capacity > 0 ? this.capacity - 1 : undefined,
        };
    }

    private layout(opts?: { highlightIndex?: number }): NodeState[] {
        const highlightIndex = opts?.highlightIndex;

        if (this.capacity <= 0) return [];
            const left = 140;
            const right = 1460;
            const y = 260;

            const cap = this.capacity;
            const span = right - left;
            const step = cap <= 1 ? 0 : span / (cap - 1);

            const nodes: NodeState[] = [];

            for (let i = 0; i < cap; i++) {
            const v = this.data[i];
            const shownValue = v === null ? NaN : v;

            nodes.push({
                id: 1000 + i,
                value: shownValue as any,
                x: left + i * step,
                y,
                highlight: highlightIndex === i,
                isHead: i === 0,
                isTail: i === cap - 1,
                index: i,
            });
        }

        return nodes;
    }

    private clampIndex(i: number) {
        if (!Number.isFinite(i)) return 0;
        if (this.capacity <= 0) return 0;
        return Math.max(0, Math.min(this.capacity - 1, Math.floor(i)));
    }

    private clampCapacity(c: number) {
        if (!Number.isFinite(c)) return 8;
        return Math.max(0, Math.min(12, Math.floor(c)));
    }
}