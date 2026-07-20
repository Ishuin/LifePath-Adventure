import { describe, it, expect } from "vitest";
import {
  assignLayers,
  layoutGraph,
  type LayoutInputEdge,
  type LayoutInputNode,
} from "../layout";

const node = (id: string, orderIndex = 0): LayoutInputNode => ({
  id,
  orderIndex,
});
const edge = (from: string, to: string): LayoutInputEdge => ({
  fromStepId: from,
  toStepId: to,
});

describe("assignLayers", () => {
  it("puts every node on layer 0 when there are no edges", () => {
    const layers = assignLayers([node("a"), node("b")], []);
    expect(layers.get("a")).toBe(0);
    expect(layers.get("b")).toBe(0);
  });

  it("layers a linear chain by depth", () => {
    const layers = assignLayers(
      [node("a"), node("b"), node("c")],
      [edge("a", "b"), edge("b", "c")],
    );
    expect(layers.get("a")).toBe(0);
    expect(layers.get("b")).toBe(1);
    expect(layers.get("c")).toBe(2);
  });

  it("uses the longest path for diamonds", () => {
    // a -> b -> d, a -> c -> d, plus a -> d direct. d must sit below b and c.
    const layers = assignLayers(
      [node("a"), node("b"), node("c"), node("d")],
      [edge("a", "b"), edge("a", "c"), edge("b", "d"), edge("c", "d")],
    );
    expect(layers.get("a")).toBe(0);
    expect(layers.get("b")).toBe(1);
    expect(layers.get("c")).toBe(1);
    expect(layers.get("d")).toBe(2);
  });

  it("does not loop forever on a cycle", () => {
    const layers = assignLayers(
      [node("a"), node("b")],
      [edge("a", "b"), edge("b", "a")],
    );
    // Both nodes get a finite layer; exact values don't matter, only that it
    // terminates and returns something.
    expect(layers.size).toBe(2);
    expect(Number.isFinite(layers.get("a"))).toBe(true);
    expect(Number.isFinite(layers.get("b"))).toBe(true);
  });

  it("ignores edges referencing unknown nodes", () => {
    const layers = assignLayers([node("a")], [edge("a", "ghost")]);
    expect(layers.get("a")).toBe(0);
    expect(layers.has("ghost")).toBe(false);
  });
});

describe("layoutGraph", () => {
  it("returns an empty layout for no nodes", () => {
    const out = layoutGraph([], []);
    expect(out.nodes).toHaveLength(0);
    expect(out.width).toBe(0);
    expect(out.height).toBe(0);
  });

  it("positions a chain top-to-bottom with increasing y per layer", () => {
    const out = layoutGraph(
      [node("a"), node("b"), node("c")],
      [edge("a", "b"), edge("b", "c")],
    );
    const y = (id: string) => out.nodes.find((n) => n.id === id)!.y;
    expect(y("a")).toBeLessThan(y("b"));
    expect(y("b")).toBeLessThan(y("c"));
    expect(out.nodes).toHaveLength(3);
  });

  it("draws edges from the bottom of the prereq to the top of the dependent", () => {
    const out = layoutGraph([node("a"), node("b")], [edge("a", "b")]);
    const a = out.nodes.find((n) => n.id === "a")!;
    const b = out.nodes.find((n) => n.id === "b")!;
    const e = out.edges[0];
    expect(e.y1).toBe(a.y + a.height); // leaves the bottom of a
    expect(e.y2).toBe(b.y); // enters the top of b
    expect(e.y1).toBeLessThan(e.y2);
  });

  it("orders nodes within a layer by orderIndex", () => {
    // Two roots on layer 0; b has a lower orderIndex so it should sit left of a.
    const out = layoutGraph([node("a", 5), node("b", 1)], []);
    const a = out.nodes.find((n) => n.id === "a")!;
    const b = out.nodes.find((n) => n.id === "b")!;
    expect(b.x).toBeLessThan(a.x);
  });

  it("drops edges whose endpoints are missing", () => {
    const out = layoutGraph([node("a")], [edge("a", "ghost")]);
    expect(out.edges).toHaveLength(0);
  });
});
