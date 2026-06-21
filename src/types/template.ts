/**
 * Phase 2: Template Type Definitions
 * These types correspond to JSON fields in the WorkflowTemplate model
 */

export interface NodeConfiguration {
  id: string;
  name: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, unknown>;
  credentialId?: string;
}

export interface ConnectionConfiguration {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromOutput: string;
  toInput: string;
}

export interface TemplateMetadata {
  requiredCredentials: string[];
  nodeCount: number;
  estimatedTime?: string;
  timeSavings?: string;
  tags: string[];
  category:
    | "research_strategy"
    | "content_distribution"
    | "audience_engagement"
    | "business_management";
}

/**
 * Complete WorkflowTemplate structure
 */
export interface WorkflowTemplateStructure {
  id: string;
  name: string;
  description: string;
  category: string;
  nodeData: NodeConfiguration[];
  connectionData: ConnectionConfiguration[];
  authorId?: string;
  cloneCount: number;
  successRate: number;
  averageRating: number;
  estimatedTime?: string;
  timeSavings?: string;
  tags: string[];
  requiredCredentials: string[];
  nodeCount: number;
  published: boolean;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
