"use client";

import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  ErrorView,
  LoadingView,
} from "@/components/entity-components";
import {
  useRemoveCredentials,
  useSuspenseCredentials,
} from "@/features/credentials/hooks/use-credentials";
import type { Credential } from "@/generated/prisma/client";
import { CredentialType } from "@/generated/prisma/enums";
import { useCredentialsParams } from "../hooks/use-credentials-params";
import { useEntitySearch } from "../hooks/use-entity-search";

export const CredentialsSearch = () => {
  const [params, setParams] = useCredentialsParams();
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams,
  });
  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder="Search credentials"
    />
  );
};

export const CredentialsList = () => {
  const credentials = useSuspenseCredentials();

  return (
    <EntityList
      items={credentials.data.items}
      renderItem={(credential) => <CredentialsItem data={credential} />}
      getKey={(credential) => credential.id}
      emptyView={<CredentialsEmpty />}
    />
  );
};

export const CredentialsHeader = ({ disabled }: { disabled?: boolean }) => {
  return (
    <EntityHeader
      title="Credentials"
      description="Create and manage your credentials"
      newButtonHref="/credentials/new"
      newButtonLabel="New Credential"
      disabled={disabled}
    />
  );
};

export const CredentialsPagination = () => {
  const credentials = useSuspenseCredentials();
  const [params, setParams] = useCredentialsParams();
  return (
    <EntityPagination
      page={credentials.data.page}
      totalPages={credentials.data.totalPages}
      disabled={credentials.isFetching}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const CredentialsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<CredentialsHeader />}
      search={<CredentialsSearch />}
      pagination={<CredentialsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const CredentialsLoading = () => {
  return <LoadingView message="Loading credentials..." />;
};

export const CredentialsError = () => {
  return <ErrorView message="Error loading credentials" />;
};

export const CredentialsEmpty = () => {
  const router = useRouter();
  const handleCreate = () => {
    router.push(`/credentials/new`);
  };
  return <EmptyView message="No credentials found" onNew={handleCreate} />;
};

const credentialLogos: Record<CredentialType, string> = {
  [CredentialType.OPENAI]: "/images/logos/openai.svg",
  [CredentialType.ANTHROPIC]: "/images/logos/anthropic.svg",
  [CredentialType.GEMINI]: "/images/logos/gemini.svg",
  [CredentialType.DEEPSEEK]: "/images/logos/deepseek.svg",
};

const getCredentialLogo = (type: CredentialType): string => {
  return credentialLogos[type] ?? "/images/appLogo/logo.webp";
};

export const CredentialsItem = ({ data }: { data: Credential }) => {
  const removeCredential = useRemoveCredentials();
  const handleRemove = () => {
    removeCredential.mutate({ id: data.id });
  };

  return (
    <EntityItem
      href={`/credentials/${data.id}`}
      title={data.name}
      subtitle={
        <>
          Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })}{" "}
          &bull; Created{" "}
          {formatDistanceToNow(data.createdAt, { addSuffix: true })}
        </>
      }
      image={
        <div className="size-8 flex items-center justify-center">
          <Image
            src={getCredentialLogo(data.type)}
            alt={data.type}
            width={24}
            height={24}
          />
        </div>
      }
      onRemove={handleRemove}
      isRemoving={removeCredential.isPending}
    />
  );
};
