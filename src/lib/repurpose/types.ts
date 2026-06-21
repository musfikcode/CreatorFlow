/**
 * Type definitions for AI Content Repurposing Engine
 *
 * Core types for content extraction, analysis, formatting, and validation.
 * Supports multiple input sources and platform-specific output formats.
 */

/**
 * Supported content source types
 */
export type ContentSourceType = "youtube" | "blog" | "podcast" | "text";

/**
 * Supported output platform types
 */
export type OutputPlatform =
  | "twitter"
  | "instagram"
  | "linkedin"
  | "blog"
  | "tiktok"
  | "email";

/**
 * Raw content input from various sources
 */
export interface ContentInput {
  type: ContentSourceType;
  url?: string;
  text?: string;
  transcript?: string;
  metadata?: {
    title?: string;
    author?: string;
    duration?: number;
    publishedAt?: string;
    [key: string]: unknown;
  };
}

/**
 * Extracted content with key information
 */
export interface ExtractedContent {
  title: string;
  rawContent: string;
  summary: string;
  keyPoints: string[];
  themes: string[];
  tone:
    | "professional"
    | "casual"
    | "educational"
    | "entertaining"
    | "inspirational";
  targetAudience: string;
  quotableSegments: string[];
  metadata: {
    sourceType: ContentSourceType;
    sourceUrl?: string;
    wordCount: number;
    estimatedReadTime: number;
    extractedAt: string;
  };
}

/**
 * AI analysis result with content insights
 */
export interface ContentAnalysis {
  mainMessage: string;
  coreThemes: string[];
  painPoints: string[];
  actionableInsights: string[];
  emotionalTone: string;
  targetAudience: {
    demographics: string;
    interests: string[];
    painPoints: string[];
  };
  suggestedPlatforms: OutputPlatform[];
  seoKeywords: string[];
  contentStructure: {
    hook: string;
    mainPoints: string[];
    conclusion: string;
  };
}

/**
 * Platform-specific formatting constraints
 */
export interface PlatformConstraints {
  maxCharacters?: number;
  maxParagraphs?: number;
  maxHashtags?: number;
  recommendedHashtagCount?: number;
  allowsEmojis: boolean;
  allowsLinks: boolean;
  recommendedTone: string;
  characterCountPerSlide?: number;
  maxSlides?: number;
  readingTimeSeconds?: number;
}

/**
 * Twitter thread output
 */
export interface TwitterThreadOutput {
  platform: "twitter";
  tweets: {
    content: string;
    characterCount: number;
    order: number;
  }[];
  totalTweets: number;
  hashtags: string[];
  estimatedEngagement: number;
}

/**
 * Instagram carousel output
 */
export interface InstagramCarouselOutput {
  platform: "instagram";
  slides: {
    content: string;
    order: number;
    visualSuggestion: string;
  }[];
  caption: string;
  hashtags: string[];
  totalSlides: number;
  estimatedEngagement: number;
}

/**
 * LinkedIn post output
 */
export interface LinkedInPostOutput {
  platform: "linkedin";
  content: string;
  characterCount: number;
  hashtags: string[];
  callToAction: string;
  estimatedEngagement: number;
}

/**
 * Blog article output
 */
export interface BlogArticleOutput {
  platform: "blog";
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  sections: {
    heading: string;
    content: string;
  }[];
  seoKeywords: string[];
  readingTime: number;
  estimatedEngagement: number;
}

/**
 * TikTok script output
 */
export interface TikTokScriptOutput {
  platform: "tiktok";
  hook: string;
  mainContent: string;
  callToAction: string;
  fullScript: string;
  estimatedDuration: number;
  hashtags: string[];
  estimatedEngagement: number;
}

/**
 * Email newsletter output
 */
export interface EmailNewsletterOutput {
  platform: "email";
  subject: string;
  previewText: string;
  body: string;
  sections: {
    heading: string;
    content: string;
  }[];
  callToAction: string;
  estimatedEngagement: number;
}

/**
 * Union type for all platform outputs
 */
export type PlatformOutput =
  | TwitterThreadOutput
  | InstagramCarouselOutput
  | LinkedInPostOutput
  | BlogArticleOutput
  | TikTokScriptOutput
  | EmailNewsletterOutput;

/**
 * Quality validation result
 */
export interface ValidationResult {
  isValid: boolean;
  confidenceScore: number;
  issues: {
    type: "error" | "warning" | "info";
    message: string;
    field?: string;
  }[];
  suggestions: string[];
  qualityMetrics: {
    grammarScore: number;
    coherenceScore: number;
    toneConsistency: number;
    keyPointsCoverage: number;
  };
}

/**
 * Complete repurposing result
 */
export interface RepurposingResult {
  success: boolean;
  sourceContent: ExtractedContent;
  analysis: ContentAnalysis;
  outputs: PlatformOutput[];
  validation: {
    [key in OutputPlatform]?: ValidationResult;
  };
  nicheContext?: {
    trendingKeywords: string[];
    painPoints: string[];
    appliedContext: boolean;
  };
  metadata: {
    processingTime: number;
    aiModel: string;
    timestamp: string;
    totalOutputs: number;
  };
}

/**
 * Repurposing options
 */
export interface RepurposingOptions {
  platforms: OutputPlatform[];
  includeNicheContext?: boolean;
  userId?: string;
  customPrompt?: string;
  tone?:
    | "professional"
    | "casual"
    | "educational"
    | "entertaining"
    | "inspirational";
  preserveBrandVoice?: boolean;
  aiModel?: "openai" | "anthropic" | "gemini" | "deepseek";
}

/**
 * Niche context for content enhancement
 */
export interface NicheContext {
  trendingTopics: string[];
  keywords: string[];
  painPoints: string[];
  competitorGaps: string[];
  trendVelocity?: "rising" | "stable" | "declining";
}

/**
 * Error types for repurposing process
 */
export class RepurposingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "RepurposingError";
  }
}

export class ExtractionError extends RepurposingError {
  constructor(message: string, details?: unknown) {
    super(message, "EXTRACTION_ERROR", details);
    this.name = "ExtractionError";
  }
}

export class AnalysisError extends RepurposingError {
  constructor(message: string, details?: unknown) {
    super(message, "ANALYSIS_ERROR", details);
    this.name = "AnalysisError";
  }
}

export class FormattingError extends RepurposingError {
  constructor(message: string, details?: unknown) {
    super(message, "FORMATTING_ERROR", details);
    this.name = "FormattingError";
  }
}

export class ValidationError extends RepurposingError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}
