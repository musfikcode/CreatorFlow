"use client";

import { createId } from "@paralleldrive/cuid2";
import { useReactFlow } from "@xyflow/react";
import { GlobeIcon, MousePointerIcon } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { toast } from "sonner";
import { NodeType } from "@/generated/prisma/enums";
import { Separator } from "./ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export type NodeTypeOption = {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }> | string;
};

const triggerNodes: NodeTypeOption[] = [
  {
    type: NodeType.MANUAL_TRIGGER,
    label: "Manual Trigger",
    description:
      "Runs the flow on clicking a button. Good for getting started quickly.",
    icon: MousePointerIcon,
  },
  {
    type: NodeType.GOOGLE_FORM_TRIGGER,
    label: "Google Form",
    description: "Runs the flow when a Google Form is submitted.",
    icon: "/images/logos/googleform.svg",
  },
  {
    type: NodeType.STRIPE_TRIGGER,
    label: "Stripe Event",
    description: "Runs the flow when a Stripe event is captured.",
    icon: "/images/logos/stripe.svg",
  },
];

const executionNodes: NodeTypeOption[] = [
  {
    type: NodeType.HTTP_REQUEST,
    label: "HTTP Request",
    description: "Make a HTTP request to an endpoint.",
    icon: GlobeIcon,
  },
  {
    type: NodeType.GEMINI,
    label: "Gemini",
    description: "Use Google's AI model for text generation.",
    icon: "/images/logos/gemini.svg",
  },
  {
    type: NodeType.OPENAI,
    label: "OpenAI",
    description: "Use OpenAI's AI model for text generation.",
    icon: "/images/logos/openai.svg",
  },
  {
    type: NodeType.ANTHROPIC,
    label: "Anthropic",
    description: "Use Anthropic's AI model for text generation.",
    icon: "/images/logos/anthropic.svg",
  },
  {
    type: NodeType.DEEPSEEK,
    label: "DeepSeek",
    description: "Use DeepSeek's AI model for text generation.",
    icon: "/images/logos/deepseek.svg",
  },
  {
    type: NodeType.DISCORD,
    label: "Discord",
    description: "Send a message to Discord.",
    icon: "/images/logos/discord.svg",
  },
  {
    type: NodeType.SLACK,
    label: "Slack",
    description: "Send a message to Slack.",
    icon: "/images/logos/slack.svg",
  },
];

interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function NodeSelector({
  open,
  onOpenChange,
  children,
}: NodeSelectorProps) {
  const { setNodes, screenToFlowPosition } = useReactFlow();

  const handleNodeSelect = useCallback(
    (selection: NodeTypeOption) => {
      setNodes((prev) => {
        // Atomic check for manual trigger duplicate
        if (
          selection.type === NodeType.MANUAL_TRIGGER &&
          prev.some((node) => node.type === NodeType.MANUAL_TRIGGER)
        ) {
          toast.error("Only one manual trigger is allowed.");
          return prev;
        }

        const filteredNodes = prev.filter(
          (node) => node.type !== NodeType.INITIAL,
        );

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const flowPosition = screenToFlowPosition({
          x: centerX + (Math.random() - 0.5) * 200,
          y: centerY + (Math.random() - 0.5) * 200,
        });

        const newNode = {
          id: createId(),
          data: {},
          position: flowPosition,
          type: selection.type,
        };

        return [...filteredNodes, newNode];
      });

      onOpenChange(false);
    },
    [setNodes, screenToFlowPosition, onOpenChange],
  );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Node Selector</SheetTitle>
          <SheetDescription>Select a node to add to the flow.</SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="grid grid-cols-1 gap-2 mt-4 mx-4">
          {triggerNodes.map((node) => {
            const Icon = node.icon;

            return (
              <button
                type="button"
                key={node.type}
                className="w-full text-left py-4 px-4 rounded-md cursor-pointer border border-transparent hover:border-primary hover:bg-muted/50 transition-colors"
                onClick={() => handleNodeSelect(node)}
              >
                <div className="flex items-center gap-4 w-full overflow-hidden">
                  {typeof Icon === "string" ? (
                    <Image
                      src={Icon}
                      alt={node.label}
                      width={20}
                      height={20}
                      className="size-5 object-contain rounded-sm"
                    />
                  ) : (
                    <Icon className="size-5 shrink-0" />
                  )}
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium text-sm">{node.label}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {node.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <Separator />
        <div className="grid grid-cols-1 gap-2 mt-4 mx-4">
          {executionNodes.map((node) => {
            const Icon = node.icon;

            return (
              <button
                type="button"
                key={node.type}
                className="w-full text-left p-4 rounded-md cursor-pointer border border-transparent hover:border-primary hover:bg-muted/50 transition-colors"
                onClick={() => handleNodeSelect(node)}
              >
                <div className="flex items-center gap-4 w-full overflow-hidden">
                  {typeof Icon === "string" ? (
                    <Image
                      src={Icon}
                      alt={node.label}
                      width={20}
                      height={20}
                      className="size-5 object-contain rounded-sm"
                    />
                  ) : (
                    <Icon className="size-5 shrink-0" />
                  )}
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium text-sm">{node.label}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {node.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
