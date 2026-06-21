/**
 * Google Trends scraping service
 *
 * Scrapes trending search queries and related topics from Google Trends
 * using Firecrawl for web scraping.
 */

import { scrapeUrl } from "@/lib/firecrawl";
import type { GoogleTrendsData, ScrapingOptions } from "./types";
import {
  extractKeywords,
  isValidUrl,
  retryWithBackoff,
  sanitizeHtml,
} from "./utils";

/**
 * Scrape Google Trends for trending topics
 *
 * @param keywords - Optional keywords to search for (if not provided, fetches general trends)
 * @param region - ISO 3166-1 alpha-2 country code (e.g., "US", "GB", "IN")
 * @param options - Scraping options
 * @returns Google Trends data including keywords, trend scores, and related queries
 */
export async function scrapeGoogleTrends(
  keywords?: string[],
  region = "US",
  options?: ScrapingOptions,
): Promise<GoogleTrendsData> {
  try {
    // Build Google Trends URL
    const baseUrl = "https://trends.google.com/trends/trendingsearches/daily";
    const url = `${baseUrl}?geo=${region}`;

    // Validate URL
    if (!isValidUrl(url)) {
      throw new Error(`Invalid Google Trends URL: ${url}`);
    }

    // Scrape with retry logic
    const scrapeFunction = async () => {
      const result = await scrapeUrl(url, {
        formats: ["markdown", "html"],
        onlyMainContent: true,
        waitFor: 2000, // Wait for dynamic content to load
      });

      return result;
    };

    const result = options?.retries
      ? await retryWithBackoff(scrapeFunction, options.retries)
      : await scrapeFunction();

    // Extract content
    const content = result.markdown || result.html || "";
    const plainText = sanitizeHtml(content);

    // Extract trending keywords
    const trendingKeywords = extractTrendingKeywords(plainText, keywords);

    // Calculate trend score based on keyword frequency and position
    const trendScore = calculateTrendScore(trendingKeywords, plainText);

    // Extract related queries
    const relatedQueries = extractRelatedQueries(plainText, trendingKeywords);

    return {
      keywords: trendingKeywords,
      trendScore,
      relatedQueries,
      region,
      timeframe: "daily",
    };
  } catch (error) {
    console.error("Error scraping Google Trends:", error);
    throw new Error(
      `Failed to scrape Google Trends: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Extract trending keywords from Google Trends content
 */
function extractTrendingKeywords(
  content: string,
  filterKeywords?: string[],
): string[] {
  if (!content) return [];

  // Extract all potential keywords (words/phrases that appear frequently)
  const keywords = extractKeywords(content, 20);

  // If filter keywords provided, prioritize them
  if (filterKeywords && filterKeywords.length > 0) {
    const filtered = keywords.filter((keyword) =>
      filterKeywords.some((filter) =>
        keyword.toLowerCase().includes(filter.toLowerCase()),
      ),
    );
    return filtered.slice(0, 10);
  }

  return keywords.slice(0, 10);
}

/**
 * Calculate trend score (0-100) based on keyword prominence
 */
function calculateTrendScore(keywords: string[], content: string): number {
  if (!keywords.length || !content) return 0;

  const contentLower = content.toLowerCase();
  let totalOccurrences = 0;

  // Count occurrences of top keywords
  for (const keyword of keywords) {
    const regex = new RegExp(keyword.toLowerCase(), "g");
    const matches = contentLower.match(regex);
    totalOccurrences += matches ? matches.length : 0;
  }

  // Normalize to 0-100 scale (adjust multiplier based on content length)
  const score = Math.min(
    100,
    Math.round((totalOccurrences / (content.length / 1000)) * 10),
  );

  return score;
}

/**
 * Extract related queries from content
 */
function extractRelatedQueries(
  content: string,
  mainKeywords: string[],
): string[] {
  if (!content) return [];

  // Extract phrases that appear near main keywords
  const relatedQueries: string[] = [];
  const sentences = content.split(/[.!?]+/);

  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();

    // Check if sentence contains any main keyword
    const containsKeyword = mainKeywords.some((keyword) =>
      sentenceLower.includes(keyword.toLowerCase()),
    );

    if (containsKeyword) {
      // Extract potential queries (2-4 word phrases)
      const words = sentence.trim().split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = words.slice(i, i + 3).join(" ");
        if (
          phrase.length > 10 &&
          phrase.length < 50 &&
          !relatedQueries.includes(phrase)
        ) {
          relatedQueries.push(phrase);
        }
      }
    }
  }

  return relatedQueries.slice(0, 10);
}

/**
 * Get trending topics for specific category
 *
 * @param category - Category slug (e.g., "technology", "entertainment", "sports")
 * @param region - ISO 3166-1 alpha-2 country code
 * @param options - Scraping options
 */
export async function getTrendingByCategory(
  category: string,
  region = "US",
  options?: ScrapingOptions,
): Promise<GoogleTrendsData> {
  try {
    // Google Trends doesn't have direct category URLs in the daily trends page
    // So we'll scrape the main page and filter by category keywords
    const categoryKeywords: Record<string, string[]> = {
      technology: ["tech", "ai", "software", "hardware", "app", "digital"],
      entertainment: ["movie", "music", "celebrity", "show", "film", "series"],
      sports: ["game", "player", "team", "match", "tournament", "champion"],
      business: ["market", "stock", "company", "business", "economy", "trade"],
      health: [
        "health",
        "medical",
        "fitness",
        "wellness",
        "disease",
        "treatment",
      ],
    };

    const keywords = categoryKeywords[category.toLowerCase()] || [];
    return await scrapeGoogleTrends(keywords, region, options);
  } catch (error) {
    console.error(`Error getting trends for category ${category}:`, error);
    throw new Error(
      `Failed to get trending topics for category: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Compare trend scores across different time periods
 * Note: This is a simplified version. Full implementation would require
 * historical data tracking.
 *
 * @param keywords - Keywords to track
 * @param region - ISO 3166-1 alpha-2 country code
 */
export async function getTrendVelocity(
  keywords: string[],
  region = "US",
): Promise<{ keyword: string; velocity: "rising" | "declining" | "stable" }[]> {
  try {
    // Get current trends
    const currentData = await scrapeGoogleTrends(keywords, region);

    // In a real implementation, you would compare with historical data
    // For now, we'll use trend score as a proxy
    return currentData.keywords.map((keyword) => ({
      keyword,
      velocity:
        currentData.trendScore > 70
          ? "rising"
          : currentData.trendScore < 30
            ? "declining"
            : "stable",
    }));
  } catch (error) {
    console.error("Error calculating trend velocity:", error);
    throw new Error(
      `Failed to calculate trend velocity: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
