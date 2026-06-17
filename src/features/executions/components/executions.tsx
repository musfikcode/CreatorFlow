"use client";

import { formatDistanceToNow } from "date-fns";
import {
  CheckCheckIcon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  ErrorView,
  LoadingView,
} from "@/components/entity-components";
import { useSuspenseExecutions } from "@/features/executions/hooks/use-executions";
import type { Execution } from "@/generated/prisma/client";
import { ExecutionStatus } from "@/generated/prisma/enums";
import { useExecutionsParams } from "../hooks/use-executions-params";

export const ExecutionsList = () => {
  const executions = useSuspenseExecutions();

  return (
    <EntityList
      items={executions.data.items}
      renderItem={(execution) => <ExecutionsItem data={execution} />}
      getKey={(execution) => execution.id}
      emptyView={<ExecutionsEmpty />}
    />
  );
};

export const ExecutionsHeader = () => {
  return (
    <EntityHeader
      title="Executions"
      description="Create and manage your executions"
    />
  );
};

export const ExecutionsPagination = () => {
  const executions = useSuspenseExecutions();
  const [params, setParams] = useExecutionsParams();
  return (
    <EntityPagination
      page={executions.data.page}
      totalPages={executions.data.totalPages}
      disabled={executions.isFetching}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const ExecutionsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<ExecutionsHeader />}
      pagination={<ExecutionsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const ExecutionsLoading = () => {
  return <LoadingView message="Loading executions..." />;
};

export const ExecutionsError = () => {
  return <ErrorView message="Error loading executions" />;
};

export const ExecutionsEmpty = () => {
  return <EmptyView message="No executions found" />;
};

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

export const ExecutionsItem = ({
  data,
}: {
  data: Execution & { workflow: { id: string; name: string } };
}) => {
  const duration = data.completedAt
    ? Math.round(
        new Date(data.completedAt).getTime() -
          new Date(data.startedAt).getTime(),
      ) / 1000
    : null;

  const subtitle = (
    <>
      {data.workflow.name} &bull; Started{" "}
      {formatDistanceToNow(data.startedAt, { addSuffix: true })}
      {duration !== null && <> &bull; Took {duration} seconds</>}
    </>
  );
  return (
    <EntityItem
      href={`/executions/${data.id}`}
      title={formateStatus(data.status)}
      subtitle={subtitle}
      image={
        <div className="size-8 flex items-center justify-center">
          {getStatusIcon(data.status)}
        </div>
      }
    />
  );
};
