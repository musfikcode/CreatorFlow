"use client";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCheckIcon,
  ChevronDownIcon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSuspenseExecution } from "@/features/executions/hooks/use-executions";
import { ExecutionStatus } from "@/generated/prisma/enums";

const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case ExecutionStatus.SUCCESS:
      return <CheckCheckIcon className="size-5 text-green-600" />;
    case ExecutionStatus.RUNNING:
      return <Loader2Icon className="size-5 text-blue-600 animate-spin" />;
    case ExecutionStatus.FAILED:
      return <XCircleIcon className="size-5 text-red-600" />;
    default:
      return <ClockIcon className="size-5 text-gray-600" />;
  }
};

const formateStatus = (status: ExecutionStatus) => {
  return status.charAt(0) + status.slice(1).toLowerCase();
};

export const ExecutionView = ({ executionId }: { executionId: string }) => {
  const { data: execution } = useSuspenseExecution(executionId);
  const [showStackTrace, setShowStackTrace] = useState(false);
  const duration = execution.completedAt
    ? Math.round(
        new Date(execution.completedAt).getTime() -
          new Date(execution.startedAt).getTime(),
      ) / 1000
    : null;

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          {getStatusIcon(execution.status)}
          <div>
            <CardTitle>{formateStatus(execution.status)}</CardTitle>
            <CardDescription>
              Execution for {execution.workflow.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Workflow
            </p>
            <Link
              prefetch
              className="text-sm text-primary hover:underline"
              href={`/workflows/${execution.workflowId}`}
            >
              {execution.workflow.name}
            </Link>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-sm">{formateStatus(execution.status)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Started At
            </p>
            <p className="text-sm">
              {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
            </p>
          </div>
          {execution.completedAt ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed At
              </p>
              <p className="text-sm">
                {formatDistanceToNow(execution.completedAt, {
                  addSuffix: true,
                })}
              </p>
            </div>
          ) : null}
          {duration !== null ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Duration
              </p>
              <p className="text-sm">{duration}s</p>
            </div>
          ) : null}
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Event ID
            </p>
            <p className="text-sm">{execution.inngestEventId}</p>
          </div>
        </div>
        {execution.error && (
          <div className="mt-6 p-4 bg-red-50 rounded-md space-y-3">
            <p className="text-sm font-medium text-red-900 mb-2">Error</p>
            <p className="text-sm text-red-800 font-mono">{execution.error}</p>
          </div>
        )}
        {execution.errorStack && (
          <Collapsible open={showStackTrace} onOpenChange={setShowStackTrace}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
              >
                <ChevronDownIcon
                  className={`size-4 transition-transform duration-200 ${showStackTrace ? "rotate-180" : ""}`}
                />
                View Stack Trace
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <pre className="text-xs font-mono text-red-800 overflow-auto p-3 bg-red-100 rounded-md border border-red-200">
                {execution.errorStack}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
        {execution.output && (
          <div className="mt-6 p-4 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Output</p>
            <pre className="text-xs font-mono text-muted-foreground overflow-auto mt-2 p-2 bg-muted rounded">
              {JSON.stringify(execution.output, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
