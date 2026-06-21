/**
 * Web scraping service orchestration
 *
 * Provides parallel multi-source scraping functionality that combines
 * Google Trends, Reddit, YouTube, and Twitter data.
 */

import {
  getTrendingByCategory as getGoogleTrendsByCategory,
  scrapeGoogleTrends,
} from "./google-trends";
import { getTrendingFromSubreddits } from "./reddit";
import { scrapeTwitter, searchTwitter } from "./twitter";
import type { MultiSourceScrapingResult, ScrapingOptions } from "./types";
import { isValidUrl } from "./utils";
import { fetchTrendingVideos } from "./youtube";

export * from "./google-trends";
export * from "./reddit";
export * from "./twitter";
// Re-export types and utilities
export * from "./types";
export * from "./utils";
export * from "./youtube";

/**
 * Scrape data from all sources in parallel
 *
 * This is the main entry point for multi-source scraping. It fetches data
 * from Google Trends, Reddit, YouTube, and Twitter simultaneously.
 *
 * @param config - Configuration for each source
 * @param options - Global scraping options
 * @returns Combined data from all sources
 *
 * @example
 * ```typescript
 * const result = await scrapeAllSources({
 *   googleTrends: { keywords: ["AI", "content creation"], region: "US" },
 *   reddit: { subreddits: ["ContentCreation", "marketing"] },
 *   youtube: { region: "US", maxResults: 10 },
 *   twitter: { region: "worldwide", limit: 20 }
 * });
 *
 * console.log(result.googleTrends?.keywords);
 * console.log(result.reddit?.topPosts);
 * console.log(result.youtube?.trendingVideos);
 * console.log(result.twitter?.trendingHashtags);
 * ```
 */
export async function scrapeAllSources(
  config: {
    googleTrends?: {
      keywords?: string[];
      region?: string;
      category?: string;
    };
    reddit?: {
      subreddits: string[];
      sortBy?: "hot" | "new" | "top" | "rising";
      timeRange?: "day" | "week" | "month" | "year" | "all";
    };
    youtube?: {
      region?: string;
      category?: string;
      maxResults?: number;
    };
    twitter?: {
      region?: string;
      limit?: number;
      query?: string;
    };
  },
  options?: ScrapingOptions,
): Promise<MultiSourceScrapingResult> {
  const errors: Record<string, string> = {};

  // Execute all scraping operations in parallel
  const [googleTrendsResult, redditResult, youtubeResult, twitterResult] =
    await Promise.allSettled([
      // Google Trends
      config.googleTrends
        ? config.googleTrends.category
          ? getGoogleTrendsByCategory(
              config.googleTrends.category,
              config.googleTrends.region,
              options,
            )
          : scrapeGoogleTrends(
              config.googleTrends.keywords,
              config.googleTrends.region,
              options,
            )
        : Promise.resolve(null),

      // Reddit
      config.reddit && config.reddit.subreddits.length > 0
        ? getTrendingFromSubreddits(config.reddit.subreddits, options).then(
            (data) => ({
              topPosts: data.topPostsAcrossSubreddits,
              discussionSentiment: data.overallSentiment,
              totalPosts: data.topPostsAcrossSubreddits.length,
            }),
          )
        : Promise.resolve(null),

      // YouTube
      config.youtube
        ? fetchTrendingVideos(
            config.youtube.region,
            config.youtube.category,
            config.youtube.maxResults,
            options,
          )
        : Promise.resolve(null),

      // Twitter
      config.twitter
        ? config.twitter.query
          ? searchTwitter(config.twitter.query, config.twitter.limit, options)
          : scrapeTwitter(config.twitter.region, config.twitter.limit, options)
        : Promise.resolve(null),
    ]);

  // Extract results and collect errors
  const googleTrends =
    googleTrendsResult.status === "fulfilled" ? googleTrendsResult.value : null;
  if (googleTrendsResult.status === "rejected") {
    errors.googleTrends = googleTrendsResult.reason.message || "Unknown error";
  }

  const reddit =
    redditResult.status === "fulfilled" ? redditResult.value : null;
  if (redditResult.status === "rejected") {
    errors.reddit = redditResult.reason.message || "Unknown error";
  }

  const youtube =
    youtubeResult.status === "fulfilled" ? youtubeResult.value : null;
  if (youtubeResult.status === "rejected") {
    errors.youtube = youtubeResult.reason.message || "Unknown error";
  }

  const twitter =
    twitterResult.status === "fulfilled" ? twitterResult.value : null;
  if (twitterResult.status === "rejected") {
    errors.twitter = twitterResult.reason.message || "Unknown error";
  }

  return {
    googleTrends,
    reddit,
    youtube,
    twitter,
    errors,
    timestamp: new Date(),
  };
}

/**
 * Scrape data for a specific niche/topic across all sources
 *
 * This convenience function automatically configures all sources to scrape
 * data related to a specific niche or topic.
 *
 * @param niche - The niche or topic to research (e.g., "AI content creation")
 * @param options - Scraping options
 * @returns Combined data from all sources related to the niche
 *
 * @example
 * ```typescript
 * const nicheData = await scrapeByNiche("AI content creation");
 * ```
 */
export async function scrapeByNiche(
  niche: string,
  options?: ScrapingOptions,
): Promise<MultiSourceScrapingResult> {
  // Extract keywords from niche
  const keywords = niche
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3);

  // Determine relevant subreddits (you can expand this mapping)
  const subredditMap: Record<string, string[]> = {
    ai: ["artificial", "machinelearning", "ChatGPT", "OpenAI"],
    content: ["ContentCreation", "marketing", "socialmedia"],
    creator: ["YouTubers", "Twitch", "ContentCreators"],
    video: ["videography", "VideoEditing", "YouTube"],
    social: ["socialmedia", "marketing", "DigitalMarketing"],
    business: ["Entrepreneur", "startups", "smallbusiness"],
  };

  const subreddits = keywords
    .flatMap((keyword) => subredditMap[keyword] || [])
    .slice(0, 3);

  // If no specific subreddits found, use generic ones
  if (subreddits.length === 0) {
    subreddits.push("trending");
  }

  return await scrapeAllSources(
    {
      googleTrends: {
        keywords,
        region: "US",
      },
      reddit: {
        subreddits,
        sortBy: "hot",
        timeRange: "week",
      },
      youtube: {
        region: "US",
        maxResults: 15,
      },
      twitter: {
        query: niche,
        limit: 20,
      },
    },
    options,
  );
}

/**
 * Extract content opportunities from scraped data
 *
 * Analyzes multi-source data to identify content opportunities based on
 * trending topics, pain points, and engagement patterns.
 *
 * @param scrapedData - Multi-source scraping result
 * @returns Array of content opportunities with metadata
 */
export interface ContentOpportunity {
  title: string;
  reasoning: string;
  targetPlatforms: string[];
  estimatedEngagement: number;
  keywords: string[];
  sourceData: {
    googleTrends?: boolean;
    reddit?: boolean;
    youtube?: boolean;
    twitter?: boolean;
  };
}

export function extractContentOpportunities(
  scrapedData: MultiSourceScrapingResult,
): ContentOpportunity[] {
  const opportunities: ContentOpportunity[] = [];

  // Combine all keywords from different sources
  const allKeywords = new Set<string>();

  if (scrapedData.googleTrends) {
    for (const keyword of scrapedData.googleTrends.keywords) {
      allKeywords.add(keyword.toLowerCase());
    }
  }

  if (scrapedData.reddit) {
    for (const post of scrapedData.reddit.topPosts.slice(0, 10)) {
      const words = post.title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);
      for (const word of words) {
        allKeywords.add(word);
      }
    }
  }

  if (scrapedData.twitter) {
    for (const hashtag of scrapedData.twitter.trendingHashtags.slice(0, 10)) {
      allKeywords.add(hashtag.toLowerCase().replace("#", ""));
    }
  }

  // Generate opportunities from trending topics
  const keywordArray = Array.from(allKeywords);

  for (let i = 0; i < Math.min(10, keywordArray.length); i++) {
    const keyword = keywordArray[i];

    // Calculate estimated engagement based on data sources
    let engagementScore = 50;
    const sourceData = {
      googleTrends: false,
      reddit: false,
      youtube: false,
      twitter: false,
    };

    if (
      scrapedData.googleTrends?.keywords.some((k) =>
        k.toLowerCase().includes(keyword),
      )
    ) {
      engagementScore += 20;
      sourceData.googleTrends = true;
    }

    if (
      scrapedData.reddit?.topPosts.some((p) =>
        p.title.toLowerCase().includes(keyword),
      )
    ) {
      engagementScore += 15;
      sourceData.reddit = true;
    }

    if (
      scrapedData.youtube?.trendingVideos.some((v) =>
        v.title.toLowerCase().includes(keyword),
      )
    ) {
      engagementScore += 10;
      sourceData.youtube = true;
    }

    if (
      scrapedData.twitter?.trendingHashtags.some((h) =>
        h.toLowerCase().includes(keyword),
      )
    ) {
      engagementScore += 5;
      sourceData.twitter = true;
    }

    // Determine target platforms based on data sources
    const platforms: string[] = [];
    if (sourceData.youtube) platforms.push("YouTube");
    if (sourceData.twitter) platforms.push("Twitter");
    if (sourceData.reddit) platforms.push("Reddit", "Blog");

    if (platforms.length === 0) {
      platforms.push("Blog", "LinkedIn");
    }

    opportunities.push({
      title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Guide`,
      reasoning: `Trending across ${Object.values(sourceData).filter(Boolean).length} platforms. High engagement potential.`,
      targetPlatforms: platforms,
      estimatedEngagement: Math.min(100, engagementScore),
      keywords: [
        keyword,
        ...keywordArray.filter((k) => k !== keyword).slice(0, 4),
      ],
      sourceData,
    });
  }

  return opportunities.sort(
    (a, b) => b.estimatedEngagement - a.estimatedEngagement,
  );
}

/**
 * Validate URL before scraping
 *
 * @param url - URL to validate
 * @returns True if URL is valid and safe to scrape
 */
export function validateUrlForScraping(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // Ensure HTTPS
    if (urlObj.protocol !== "https:" && urlObj.protocol !== "http:") {
      return false;
    }

    // Blocked domains (optional - add domains you want to avoid)
    const blockedDomains = ["localhost", "127.0.0.1", "0.0.0.0"];
    if (blockedDomains.some((domain) => urlObj.hostname.includes(domain))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get scraping statistics
 *
 * @param result - Multi-source scraping result
 * @returns Statistics about the scraped data
 */
export function getScrapingStats(result: MultiSourceScrapingResult): {
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  totalDataPoints: number;
  hasErrors: boolean;
} {
  const sources = [
    result.googleTrends,
    result.reddit,
    result.youtube,
    result.twitter,
  ];

  const successfulSources = sources.filter((s) => s !== null).length;
  const failedSources = Object.keys(result.errors).length;

  let totalDataPoints = 0;
  if (result.googleTrends) {
    totalDataPoints += result.googleTrends.keywords.length;
    totalDataPoints += result.googleTrends.relatedQueries.length;
  }
  if (result.reddit) {
    totalDataPoints += result.reddit.topPosts.length;
  }
  if (result.youtube) {
    totalDataPoints += result.youtube.trendingVideos.length;
  }
  if (result.twitter) {
    totalDataPoints += result.twitter.trendingHashtags.length;
    totalDataPoints += result.twitter.viralThreads.length;
  }

  return {
    totalSources: 4,
    successfulSources,
    failedSources,
    totalDataPoints,
    hasErrors: failedSources > 0,
  };
}
