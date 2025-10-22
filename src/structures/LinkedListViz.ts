import type { Frame, NodeState, EdgeState } from "../core/types";

let NEXT_ID = 1;

export class LinkedListViz {
  private values: number[] = [];
  
  insertHead(value: number): Frame[] {
    if (this.values.includes(value)) {
      const nodes = this.layout(this.values);
      return [this.frame(nodes, this.edges(nodes), "Hodnota již existuje – vložení zrušeno")];
    }
    const before = this.layout(this.values);
    const newNode: NodeState = { id: NEXT_ID++, value, x: 120, y: 120, highlight: true };

    const f1 = this.frame(before, this.edges(before), "Výchozí stav");
    const f2 = this.frame([...before, newNode], this.edges(before), "Vytvoření nového uzlu");

    let f3: Frame;
    if (before.length) {
      f3 = this.frame([...before, newNode], [...this.edges(before), { from: newNode.id, to: before[0].id }], "Nový uzel ukazuje na bývalou hlavu");
    } else {
      f3 = this.frame([...before, newNode], [], "Nový uzel je první prvek");
    }

    this.values = [value, ...this.values];
    const after = this.layout(this.values, [...before, newNode]);
    const f4 = this.frame(after, this.edges(after), "Nový uzel se stává hlavou");

    return [f1, f2, f3, f4];
  }

  insertTail(value: number): Frame[] {
    if (this.values.includes(value)) {
      const nodes = this.layout(this.values);
      return [this.frame(nodes, this.edges(nodes), "Hodnota již existuje – vložení zrušeno")];
    }
    const before = this.layout(this.values);
    const newNode: NodeState = { id: NEXT_ID++, value, x: 120, y: 120, highlight: true };

    const f1 = this.frame(before, this.edges(before), "Výchozí stav");
    const f2 = this.frame([...before, newNode], this.edges(before), "Vytvoření nového uzlu");

    if (before.length) {
      const last = before[before.length - 1];
      const f3 = this.frame([...before, newNode], [...this.edges(before), { from: last.id, to: newNode.id }], "Poslední ukazuje na nový uzel");
      const afterVals = [...this.values, value];
      const after = this.layout(afterVals, [...before, newNode]);
      const f4 = this.frame(after, this.edges(after), "Nový uzel se stává koncem");
      this.values = afterVals;
      return [f1, f2, f3, f4];
    } else {
      this.values = [value];
      const after = this.layout(this.values, [...before, newNode]);
      const f3 = this.frame(after, this.edges(after), "Nový uzel je první prvek");
      return [f1, f2, f3];
    }
  }

  deleteHead(): Frame[] {
    const before = this.layout(this.values);
    if (!before.length) return [this.frame(before, [], "Seznam je prázdný")];

    const f1 = this.frame(before, this.edges(before), "Před odstraněním hlavy");
    before[0].highlight = true;
    const f2 = this.frame(before, this.edges(before), "Označení hlavy");

    this.values = this.values.slice(1);
    const after = this.layout(this.values);
    const f3 = this.frame(after, this.edges(after), "Nová hlava");

    return [f1, f2, f3];
  }

  deleteTail(): Frame[] {
    const before = this.layout(this.values);
    if (!before.length) return [this.frame(before, [], "Seznam je prázdný")];

    const f1 = this.frame(before, this.edges(before), "Před odstraněním konce");
    before[before.length - 1].highlight = true;
    const f2 = this.frame(before, this.edges(before), "Označení konce");

    this.values = this.values.slice(0, -1);
    const after = this.layout(this.values);
    const f3 = this.frame(after, this.edges(after), "Nový konec");

    return [f1, f2, f3];
  }

  deleteValue(value: number): Frame[] {
    const idx = this.values.indexOf(value);
    const before = this.layout(this.values);
    if (idx === -1) return [this.frame(before, this.edges(before), "Hodnota nebyla nalezena")];

    const f1 = this.frame(before, this.edges(before), "Před odstraněním");
    before[idx].highlight = true;
    const f2 = this.frame(before, this.edges(before), "Označení uzlu");

    this.values = this.values.filter(v => v !== value);
    const after = this.layout(this.values);
    const f3 = this.frame(after, this.edges(after), "Uzel odstraněn");

    return [f1, f2, f3];
  }

  findValue(value: number): Frame[] {
    const nodes = this.layout(this.values);
    const edges = this.edges(nodes);
    const frames: Frame[] = [];

    frames.push(this.frame(nodes, edges, "Hledání hodnoty"));
    for (let i = 0; i < nodes.length; i++) {
      nodes.forEach(n => (n.highlight = false));
      nodes[i].highlight = true;
      frames.push(this.frame(nodes, edges, `Kontrola pozice ${i + 1}`));
      if (nodes[i].value === value) {
        frames.push(this.frame(nodes, edges, "Nalezeno"));
        return frames;
      }
    }
    frames.push(this.frame(nodes, edges, "Nebylo nalezeno"));
    return frames;
  }

  setRandom(count: number): Frame[] {
    const beforeNodes = this.layout(this.values);
    const before = this.frame(beforeNodes, this.edges(beforeNodes), "Před náhodným naplněním");

    const n = Math.max(4, Math.min(6, count));
    const pool = new Set<number>();
    while (pool.size < n) pool.add(Math.floor(Math.random() * 90) + 10);

    this.values = Array.from(pool);
    NEXT_ID = 1;

    const afterNodes = this.layout(this.values);
    const after = this.frame(afterNodes, this.edges(afterNodes), `Náhodný seznam (${n})`);

    return [before, after];
  }

  reset(): Frame[] {
    const before = this.layout(this.values);
    const f1 = this.frame(before, this.edges(before), "Před vymazáním");
    this.values = [];
    const f2 = this.frame([], [], "Prázdný seznam");
    return [f1, f2];
  }

  snapshot(): Frame {
    const nodes = this.layout(this.values);
    return this.frame(nodes, this.edges(nodes), "Snapshot");
  }

  private frame(nodes: NodeState[], edges: EdgeState[], label: string): Frame {
    return { nodes: nodes.map(n => ({ ...n })), edges: edges.map(e => ({ ...e })), label };
  }

  private layout(values: number[], reuseFrom?: NodeState[]): NodeState[] {
    const baseX = 140, stepX = 160, y = 220;
    return values.map((v, i) => {
      const existing = reuseFrom?.find(n => n.value === v);
      const id = existing?.id ?? (NEXT_ID++);
      const highlight = existing?.highlight && i === 0 ? true : false;
      return { id, value: v, x: baseX + i * stepX, y, highlight };
    });
  }

  private edges(nodes: NodeState[]): EdgeState[] {
    const arr: EdgeState[] = [];
    for (let i = 0; i < nodes.length - 1; i++) arr.push({ from: nodes[i].id, to: nodes[i + 1].id });
    return arr;
  }
}
