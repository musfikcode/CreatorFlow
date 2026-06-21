/**
 * Phase 2: Analytics Type Definitions
 * These types correspond to JSON fields in the AnalyticsSnapshot model
 */

export interface PlatformMetrics {
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  engagementRate: number;
  topContent: Array<{
    id: string;
    title: string;
    views: number;
    engagement: number;
  }>;
}

export interface AggregatedMetrics {
  totalViews: number;
  totalEngagements: number;
  totalFollowers: number;
  averageEngagementRate: number;
  followerGrowth: {
    day7: number;
    day30: number;
    day90: number;
  };
  revenue: {
    total: number;
    byPlatform: Record<string, number>;
  };
}

export interface AIInsight {
  id: string;
  type: "performance" | "timing" | "content" | "growth" | "anomaly";
  title: string;
  description: string;
  confidence: number; // 0-1
  supportingData: Record<string, unknown>;
  actionable: boolean;
  recommendations?: string[];
}

/**
 * Complete AnalyticsSnapshot structure
 */
export interface AnalyticsSnapshotStructure {
  id: string;
  userId: string;
  platformData: PlatformMetrics[];
  aggregatedMetrics: AggregatedMetrics;
  insights: AIInsight[];
  totalViews: number;
  totalEngagements: number;
  totalFollowers: number;
  engagementRate: number;
  revenue: number;
  createdAt: Date;
}
