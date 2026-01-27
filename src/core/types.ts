export type NodeState = {
  id: number;
  value: number;
  x: number;
  y: number;
  highlight?: boolean;
  isHead?: boolean;
  isTail?: boolean;
  isRoot?: boolean;
  isGhost?: boolean;
};

export type EdgeState = {
  from: number;
  to: number;
};

export type ListType = "singly" | "doubly" | "doubly-cyclic";

export type LayoutType = "line" | "circle" | "tree";

export type Frame = {
  nodes: NodeState[];
  edges: EdgeState[];
  label?: string;
  layout?: LayoutType;
  durationMs?: number;
  
  limitExceeded?: boolean;
  capacity?: number;
  size?: number;
  lastIndex?: number;
};
