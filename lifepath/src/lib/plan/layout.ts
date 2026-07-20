// Pure layered layout for the step dependency DAG. No React, no DOM — just
// geometry, so it can be unit-tested and run identically on server and client.
//
// Layers run top -> bottom: layer 0 holds the roots (steps with no
// prerequisites), each subsequent layer holds steps whose deepest prerequisite
// sits one layer above. This is a longest-path layering (Sugiyama's first pass);
// within a layer, nodes are ordered by their plan `orderIndex` for stability.

export interface LayoutInputNode {
  id: string;
  orderIndex: number;
}

export interface LayoutInputEdge {
  /** prerequisite step id */
  fromStepId: string;
  /** dependent step id */
  toStepId: string;
}

export interface LaidOutNode {
  id: string;
  layer: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LaidOutEdge {
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GraphLayout {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
}

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  hGap?: number;
  vGap?: number;
  padding?: number;
}

const DEFAULTS = {
  nodeWidth: 180,
  nodeHeight: 72,
  hGap: 40,
  vGap: 64,
  padding: 24,
} as const;

/**
 * Assigns each node a layer via longest-path from the roots. Cycle-safe: if the
 * input somehow contains a cycle (validation should prevent it), the recursion
 * guard caps the offending node's layer rather than looping forever.
 */
export function assignLayers(
  nodes: LayoutInputNode[],
  edges: LayoutInputEdge[],
): Map<string, number> {
  const ids = new Set(nodes.map((n) => n.id));
  // prerequisites[to] = [from, ...]
  const prereqs = new Map<string, string[]>();
  for (const e of edges) {
    if (!ids.has(e.fromStepId) || !ids.has(e.toStepId)) continue;
    const arr = prereqs.get(e.toStepId) ?? [];
    arr.push(e.fromStepId);
    prereqs.set(e.toStepId, arr);
  }

  const layer = new Map<string, number>();
  const visiting = new Set<string>();

  const depth = (id: string): number => {
    const cached = layer.get(id);
    if (cached !== undefined) return cached;
    const parents = prereqs.get(id);
    if (!parents || parents.length === 0) {
      layer.set(id, 0);
      return 0;
    }
    if (visiting.has(id)) {
      // Cycle guard: break by treating this node as a root for layering.
      return 0;
    }
    visiting.add(id);
    let best = 0;
    for (const p of parents) {
      best = Math.max(best, depth(p) + 1);
    }
    visiting.delete(id);
    layer.set(id, best);
    return best;
  };

  for (const n of nodes) depth(n.id);
  return layer;
}

/** Produces node/edge geometry for the DAG. */
export function layoutGraph(
  nodes: LayoutInputNode[],
  edges: LayoutInputEdge[],
  opts: LayoutOptions = {},
): GraphLayout {
  const o = { ...DEFAULTS, ...opts };

  if (nodes.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const layerOf = assignLayers(nodes, edges);

  // Group node ids by layer, ordered within a layer by orderIndex then id.
  const byLayer = new Map<number, LayoutInputNode[]>();
  let maxLayer = 0;
  for (const n of nodes) {
    const l = layerOf.get(n.id) ?? 0;
    maxLayer = Math.max(maxLayer, l);
    const arr = byLayer.get(l) ?? [];
    arr.push(n);
    byLayer.set(l, arr);
  }
  for (const arr of byLayer.values()) {
    arr.sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id));
  }

  let maxRow = 1;
  for (const arr of byLayer.values()) maxRow = Math.max(maxRow, arr.length);

  const rowStride = o.nodeWidth + o.hGap;
  const contentWidth = maxRow * rowStride - o.hGap;
  const width = contentWidth + o.padding * 2;
  const height =
    (maxLayer + 1) * o.nodeHeight + maxLayer * o.vGap + o.padding * 2;

  const laidOut: LaidOutNode[] = [];
  const pos = new Map<string, LaidOutNode>();
  for (let l = 0; l <= maxLayer; l++) {
    const arr = byLayer.get(l) ?? [];
    const rowWidth = arr.length * rowStride - o.hGap;
    const startX = o.padding + (contentWidth - rowWidth) / 2;
    const y = o.padding + l * (o.nodeHeight + o.vGap);
    arr.forEach((n, i) => {
      const node: LaidOutNode = {
        id: n.id,
        layer: l,
        x: startX + i * rowStride,
        y,
        width: o.nodeWidth,
        height: o.nodeHeight,
      };
      laidOut.push(node);
      pos.set(n.id, node);
    });
  }

  const laidOutEdges: LaidOutEdge[] = [];
  for (const e of edges) {
    const from = pos.get(e.fromStepId);
    const to = pos.get(e.toStepId);
    if (!from || !to) continue;
    laidOutEdges.push({
      fromId: e.fromStepId,
      toId: e.toStepId,
      x1: from.x + from.width / 2,
      y1: from.y + from.height,
      x2: to.x + to.width / 2,
      y2: to.y,
    });
  }

  return { nodes: laidOut, edges: laidOutEdges, width, height };
}
