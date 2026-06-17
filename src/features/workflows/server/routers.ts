import type { Edge, Node } from "@xyflow/react";
import { generateSlug } from "random-word-slugs";
import { z } from "zod";
import { PAGINATION } from "@/config/constants";
import { NodeType } from "@/generated/prisma/enums";
import { sendWorkflowExecution } from "@/inngest/utils";
import prisma from "@/lib/db";
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";

export const workflowsRouter = createTRPCRouter({
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });

      await sendWorkflowExecution({
        workflowId: input.id,
      });

      return workflow;
    }),

  create: premiumProcedure.mutation(({ ctx }) => {
    return prisma.workflow.create({
      data: {
        name: generateSlug(3),
        userId: ctx.auth.user.id,
        nodes: {
          create: {
            name: NodeType.INITIAL,
            type: NodeType.INITIAL,
            position: {
              x: 0,
              y: 0,
            },
          },
        },
        //connections: {
        //  create: {
        //    fromNodeId: "",
        //    toNodeId: "",
        //    fromOutput: "main",
        //    toInput: "main",
        //  },
        // },
      },
    });
  }),
  remove: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return prisma.workflow.delete({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string().nullish(),
            position: z.object({
              x: z.number(),
              y: z.number(),
            }),
            data: z.record(z.string(), z.any()).optional(),
          }),
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input;

      // Validate workflow exists and belongs to user
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id,
          userId: ctx.auth.user.id,
        },
      });

      // Validate that we have at least one node
      if (nodes.length === 0) {
        throw new Error("Workflow must have at least one node");
      }

      // Log workflow update for audit purposes
      console.log(`Updating workflow: ${workflow.name} (${workflow.id})`);

      // Validate all node types before transaction
      const validNodeTypes = Object.values(NodeType);
      for (const node of nodes) {
        if (node.type && !validNodeTypes.includes(node.type as NodeType)) {
          throw new Error(`Invalid node type: ${node.type}`);
        }
      }

      // Validate edge references

      const nodeIds = new Set(nodes.map((n) => n.id));
      for (const edge of edges) {
        if (!nodeIds.has(edge.source)) {
          throw new Error(
            `Edge references non-existent source node: ${edge.source}`,
          );
        }
        if (!nodeIds.has(edge.target)) {
          throw new Error(
            `Edge references non-existent target node: ${edge.target}`,
          );
        }
      }

      // Transaction to ensure consistency
      return await prisma.$transaction(async (tx) => {
        // Delete existing nodes and connections (cascade deletes connections)
        await tx.node.deleteMany({
          where: {
            workflowId: id,
          },
        });

        // Create new nodes
        await tx.node.createMany({
          data: nodes.map((node) => ({
            id: node.id,
            name: node.type || "unknown",
            type: node.type as NodeType,
            position: node.position,
            data: node.data || {},
            workflowId: id,
          })),
        });

        // Create new connections
        await tx.connection.createMany({
          data: edges.map((edge) => ({
            fromNodeId: edge.source,
            toNodeId: edge.target,
            fromOutput: edge.sourceHandle || "main",
            toInput: edge.targetHandle || "main",
            workflowId: id,
          })),
        });

        // Update workflow's updateAt timestamp and return the updated record
        return await tx.workflow.update({
          where: {
            id,
          },
          data: {
            updatedAt: new Date(),
          },
        });
      });
    }),
  updateName: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
        data: {
          name: input.name,
        },
      });
    }),
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
        include: { nodes: true, connections: true },
      });

      // Transforming server nodes to react flow compatibe nodes
      const nodes: Node[] = workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position as { x: number; y: number },
        data: (node.data as Record<string, unknown>) || {},
      }));

      // Transforming server conneections to react flow compatibe edges
      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }));

      return {
        id: workflow.id,
        name: workflow.name,
        nodes,
        edges,
      };
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      const [items, totalCount] = await Promise.all([
        prisma.workflow.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.workflow.count({
          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }),
      ]);
      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;
      return {
        items,
        totalCount,
        totalPages,
        page,
        hasNextPage,
        hasPreviousPage,
      };
    }),
});
