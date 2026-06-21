/**
 * Phase 2: Research Data Type Definitions
 * These types correspond to JSON fields in the ResearchData model
 */

export interface TrendingTopic {
  topic: string;
  score: number; // 0-100
  velocity: "rising" | "stable" | "declining";
  category: string;
  sources: string[];
  keywords: string[];
}

export interface ContentIdea {
  id: string;
  idea: string;
  reasoning: string;
  platforms: string[];
  estimatedEngagement: number; // 1-10 scale
  keywords: string[];
}

export interface CompetitorAnalysis {
  topPerformers: Array<{
    url: string;
    engagement: number;
    strategy: string;
    postingFrequency: string;
  }>;
}

export interface ScrapedSource {
  url: string;
  source: string;
  timestamp: string;
}

/**
 * Complete ResearchData structure
 */
export interface ResearchDataStructure {
  id: string;
  userId: string;
  niche: string;
  trendingTopics: TrendingTopic[];
  contentIdeas: ContentIdea[];
  competitorData: CompetitorAnalysis;
  keywords: string[];
  hashtags: string[];
  scrapedSources: ScrapedSource[];
  createdAt: Date;
  expiresAt: Date;
}
