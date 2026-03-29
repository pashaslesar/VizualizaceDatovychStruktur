import type { Frame, NodeState, EdgeState, ListType } from "../core/types";

let NEXT_ID = 1;

export class LinkedListOperations {
  private values: number[] = [];
  private type: ListType = "singly";

  setType(t: ListType) {
    this.type = t;
  }

  getType(): ListType {
    return this.type;
  }

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
      f3 = this.frame(
        [...before, newNode],
        [...this.edges(before), { from: newNode.id, to: before[0].id }],
        "Nový uzel ukazuje na bývalou hlavu"
      );
    } else {
      f3 = this.frame([...before, newNode], [], "Nový uzel je první prvek");
    }

    this.values = [value, ...this.values];
    
    const after = this.layout(this.values, [...before, newNode]);
    after.forEach(n => (n.highlight = false));
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
      const f3 = this.frame(
        [...before, newNode],
        [...this.edges(before), { from: last.id, to: newNode.id }],
        "Poslední ukazuje na nový uzel"
      );

      this.values = [...this.values, value];

      const after = this.layout(this.values, [...before, newNode]);
      after.forEach(n => (n.highlight = false));
      const f4 = this.frame(after, this.edges(after), "Nový uzel se stává koncem");

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

    before.forEach(n => (n.highlight = false));
    before[idx].highlight = true;
    const f2 = this.frame(before, this.edges(before), "Odstraňovaný uzel");

    const afterVals = this.values.filter(v => v !== value);

    const frozenNodes = this.freezeLayoutFrom(before, afterVals);
    const f3 = this.frame(frozenNodes, this.edges(before), "Uzel zmizí");

    const bridgedEdges = this.edgesAfterRemove(before, value);
    const f4 = this.frame(frozenNodes, bridgedEdges, "Přesměrování ukazatelů");

    this.values = afterVals;
    const aligned = this.layout(this.values, frozenNodes);
    const f5 = this.frame(aligned, this.edges(aligned), "Seznam vyrovnán");

    return [f1, f2, f3, f4, f5];
  }

  findValue(value: number): Frame[] {
    const nodes = this.layout(this.values);
    const edges = this.edges(nodes);
    const frames: Frame[] = [];

    const clear = () => nodes.forEach(n => (n.highlight = false));

    const push = (label: string) => frames.push(this.frame(nodes, edges, label));

    const pushFast = (label: string) => {
      const f = this.frame(nodes, edges, label);
      (f as any).durationMs = 50;
      frames.push(f);
    };

    push("Hledání hodnoty");

    for (let i = 0; i < nodes.length; i++) {
      clear();
      nodes[i].highlight = true;
      push(`Kontrola pozice ${i + 1}`);

      if (nodes[i].value === value) {
        push("Nalezeno");

        const blinkTimes = 2;
        for (let k = 0; k < blinkTimes; k++) {
          clear();
          pushFast(" ");
          nodes[i].highlight = true;
          pushFast(" ");
        }

        clear();
        push("Nalezeno");
        return frames;
      }
    }

    clear();
    push("Nebylo nalezeno");
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
    const nn = nodes.map(n => ({ ...n }));
    const ee = edges.map(e => ({ ...e }));

    nn.forEach(n => {
      n.isHead = false;
      n.isTail = false;
    });

    const listNodes = nn.filter(n => this.values.includes(n.value));
    if (listNodes.length > 0) {
      listNodes[0].isHead = true;
      listNodes[listNodes.length - 1].isTail = true;
    }

    return {
      nodes: nn,
      edges: ee,
      label,
      layout: this.type === "singly" ? "line" : "circle",
    };
  }

  private layout(values: number[], reuseFrom?: NodeState[]): NodeState[] {
    const nodes =
      this.type === "singly"
        ? this.layoutLine(values, reuseFrom)
        : this.layoutCircle(values, reuseFrom);

    if (nodes.length > 0) {
      nodes.forEach(n => { n.isHead = false; n.isTail = false; });

      nodes[0].isHead = true;

      if (this.type !== "doubly-cyclic") {
        nodes[nodes.length - 1].isTail = true;
      }
    }

    return nodes;
  }

  private layoutLine(values: number[], reuseFrom?: NodeState[]): NodeState[] {
    const baseX = 140, stepX = 160, y = 220;

    return values.map((v, i) => {
      const existing = reuseFrom?.find(n => n.value === v);
      const id = existing?.id ?? (NEXT_ID++);
      return {
        id,
        value: v,
        x: baseX + i * stepX,
        y,
        highlight: !!existing?.highlight,
        isHead: i === 0,
        isTail: i === values.length - 1,
      };
    });
  }

  private layoutCircle(values: number[], reuseFrom?: NodeState[]): NodeState[] {
    const cx = 800;
    const cy = 280;
    const r = 220;

    const n = values.length;
    if (n === 0) return [];

    const start = -Math.PI / 2;

    return values.map((v, i) => {
      const existing = reuseFrom?.find(n => n.value === v);
      const id = existing?.id ?? (NEXT_ID++);

      const a = start + (2 * Math.PI * i) / n;
      return {
        id,
        value: v,
        x: cx + r * Math.cos(a),
        y: cy + r * Math.sin(a),
        highlight: !!existing?.highlight,
        isHead: i === 0,
        isTail: i === n - 1,
      };
    });
  }

  private edges(nodes: NodeState[]): EdgeState[] {
    const arr: EdgeState[] = [];
    const n = nodes.length;

    if (this.type === "singly") {
      for (let i = 0; i < n - 1; i++) arr.push({ from: nodes[i].id, to: nodes[i + 1].id });
      return arr;
    }

    for (let i = 0; i < n - 1; i++) {
      arr.push({ from: nodes[i].id, to: nodes[i + 1].id });
      arr.push({ from: nodes[i + 1].id, to: nodes[i].id });
    }

    if (this.type === "doubly-cyclic" && n > 1) {
      arr.push({ from: nodes[n - 1].id, to: nodes[0].id });
      arr.push({ from: nodes[0].id, to: nodes[n - 1].id });
    }

    return arr;
  }

  private freezeLayoutFrom(before: NodeState[], newValues: number[]): NodeState[] {
    return newValues.map(v => {
      const old = before.find(n => n.value === v);
      return {
        id: old!.id,
        value: v,
        x: old!.x,
        y: old!.y,
        highlight: false,
        ...(old as any),
      } as any;
    });
  }

  private edgesAfterRemove(beforeNodes: NodeState[], removedValue: number): EdgeState[] {
    const n = beforeNodes.length;
    const idx = beforeNodes.findIndex(x => x.value === removedValue);
    if (idx === -1) return this.edges(beforeNodes);

    const prev = idx > 0 ? beforeNodes[idx - 1] : null;
    const cur  = beforeNodes[idx];
    const next = idx < n - 1 ? beforeNodes[idx + 1] : null;

    const isCyclic = this.type === "doubly-cyclic";

    const oldEdges = this.edges(beforeNodes);

    const filtered = oldEdges.filter(e => e.from !== cur.id && e.to !== cur.id);

    if (this.type === "singly") {
      if (prev && next) filtered.push({ from: prev.id, to: next.id });
      return filtered;
    }

    if (prev && next) {
      filtered.push({ from: prev.id, to: next.id });
      filtered.push({ from: next.id, to: prev.id });
    } else if (isCyclic && n > 2) {
      const newFirst = idx === 0 ? beforeNodes[1] : beforeNodes[0];
      const newLast  = idx === n - 1 ? beforeNodes[n - 2] : beforeNodes[n - 1];

      filtered.push({ from: newLast.id, to: newFirst.id });
      filtered.push({ from: newFirst.id, to: newLast.id });
    }

    return filtered;
  }
}
