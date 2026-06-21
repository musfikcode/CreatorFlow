/**
 * Phase 2: Content Repurposing Type Definitions
 */

export type SourceContentType =
  | "youtube_url"
  | "blog_url"
  | "text"
  | "podcast_url";

export interface SourceContent {
  type: SourceContentType;
  content: string;
  metadata?: {
    title?: string;
    author?: string;
    publishedDate?: string;
    duration?: string;
  };
}

export interface ContentAnalysis {
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
}

export type PlatformType =
  | "twitter"
  | "instagram"
  | "linkedin"
  | "blog"
  | "tiktok"
  | "email";

export interface PlatformOutput {
  platform: PlatformType;
  content: string;
  qualityScore: number; // 0-1
  metadata: {
    characterCount?: number;
    slideCount?: number;
    hashtagCount?: number;
    estimatedReadTime?: string;
  };
}

export interface RepurposeRequest {
  source: SourceContent;
  platforms: PlatformType[];
  includeNicheContext?: boolean;
}

export interface RepurposeResponse {
  outputs: PlatformOutput[];
  sourceAnalysis: ContentAnalysis;
  nicheContextUsed: boolean;
}

/**
 * Platform-specific formatting rules
 */
export interface PlatformRules {
  twitter: {
    maxCharsPerTweet: 280;
    maxThreadLength: 25;
    maxHashtags: 3;
  };
  instagram: {
    maxCaptionLength: 2200;
    maxSlides: 10;
    minSlides: 8;
    maxHashtags: 30;
  };
  linkedin: {
    maxLength: 3000;
    professionalTone: true;
  };
  blog: {
    seoOptimized: true;
    includeHeaders: true;
    includeConclusion: true;
  };
  tiktok: {
    maxScriptDuration: 60; // seconds
    includeHook: true;
    includeCTA: true;
  };
  email: {
    includeSubject: true;
    includePreview: true;
    maxLength: 5000;
  };
}
