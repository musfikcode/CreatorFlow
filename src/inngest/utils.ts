import { createId } from "@paralleldrive/cuid2";
import toposort from "toposort";
import type { Connection, Node } from "@/generated/prisma/client";
import { inngest } from "./client";

export const topologicalSort = (
  nodes: Node[],
  connections: Connection[],
): Node[] => {
  // If no connections, return as-is (they are all independent)
  if (connections.length === 0) return nodes;

  // Create edges array for toposort
  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ]);

  // Add nodes with no connections as self-edges to ensure they are included
  const connectedNodeIds = new Set<string>();
  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  }

  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      edges.push([node.id, node.id]);
    }
  }

  // Perform topological sort
  let sortedNodeIds: string[];
  try {
    sortedNodeIds = toposort(edges);
    // Remove duplicates from self edges
    sortedNodeIds = [...new Set(sortedNodeIds)];
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error(`Cyclic dependency detected: ${error.message}`);
    } else {
      throw error;
    }
  }

  // Map sorted node IDs to Node objects
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const sortedNodes: Node[] = [];
  for (const id of sortedNodeIds) {
    const node = nodeMap.get(id);
    if (!node) {
      throw new Error(`Topological sort returned unknown node ID: ${id}`);
    }
    sortedNodes.push(node);
  }
  return sortedNodes;
};

export const sendWorkflowExecution = async (data: {
  workflowId: string;
  // biome-ignore lint/suspicious/noExplicitAny: <it is what it is>
  [key: string]: any;
}) => {
  return inngest.send({
    name: "workflows/execute.workflow",
    data,
    id: createId(),
  });
};
