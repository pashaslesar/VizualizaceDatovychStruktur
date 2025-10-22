export type NodeState = {
  id: number;
  value: number;
  x: number;
  y: number;
  highlight?: boolean;
};

export type EdgeState = {
  from: number;
  to: number;
};

export type Frame = {
  nodes: NodeState[];
  edges: EdgeState[];
  label?: string;
};
