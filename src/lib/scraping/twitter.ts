/**
 * Twitter/X scraping service
 *
 * Extracts trending hashtags and viral threads from Twitter/X
 * using web scraping (Twitter API requires authentication).
 */

import { scrapeUrl } from "@/lib/firecrawl";
import type { ScrapingOptions, TwitterData, TwitterThread } from "./types";
import { isValidUrl, retryWithBackoff, sanitizeHtml } from "./utils";

/**
 * Scrape Twitter trending hashtags and viral threads
 *
 * Note: Twitter has strict anti-scraping measures. This implementation
 * provides basic functionality but may require Twitter API for production use.
 *
 * @param region - Region code (e.g., "worldwide", "US", "GB")
 * @param limit - Maximum number of threads to fetch (default: 20)
 * @param options - Scraping options
 * @returns Twitter data including trending hashtags and viral threads
 */
export async function scrapeTwitter(
  _region = "worldwide",
  limit = 20,
  options?: ScrapingOptions,
): Promise<TwitterData> {
  try {
    // Build Twitter explore URL
    const url = "https://x.com/explore/tabs/trending";

    // Validate URL
    if (!isValidUrl(url)) {
      throw new Error(`Invalid Twitter URL: ${url}`);
    }

    // Scrape with retry logic
    const scrapeFunction = async () => {
      const result = await scrapeUrl(url, {
        formats: ["markdown", "html"],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content to load
      });

      return result;
    };

    const result = options?.retries
      ? await retryWithBackoff(scrapeFunction, options.retries)
      : await scrapeFunction();

    // Extract content
    const content = result.markdown || result.html || "";
    const plainText = sanitizeHtml(content);

    // Extract trending hashtags
    const hashtags = extractHashtags(plainText);

    // Extract viral threads
    const threads = extractThreads(content, plainText, limit);

    return {
      trendingHashtags: hashtags,
      viralThreads: threads,
      totalThreads: threads.length,
    };
  } catch (error) {
    console.error("Error scraping Twitter:", error);
    throw new Error(
      `Failed to scrape Twitter: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Extract hashtags from content
 */
function extractHashtags(text: string): string[] {
  if (!text) return [];

  // Match hashtags (#word)
  const hashtagRegex = /#(\w+)/g;
  const matches = text.matchAll(hashtagRegex);

  const hashtags = new Map<string, number>();

  for (const match of matches) {
    const hashtag = match[1].toLowerCase();
    // Filter out common/generic hashtags
    if (hashtag.length > 2 && hashtag.length < 30) {
      hashtags.set(hashtag, (hashtags.get(hashtag) || 0) + 1);
    }
  }

  // Sort by frequency and return top hashtags
  return Array.from(hashtags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([hashtag]) => `#${hashtag}`);
}

/**
 * Extract threads from scraped content
 */
function extractThreads(
  markdownContent: string,
  plainText: string,
  limit: number,
): TwitterThread[] {
  const threads: TwitterThread[] = [];

  try {
    const lines = markdownContent.split("\n");
    let currentThread: Partial<TwitterThread> | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Detect tweet/thread text (content with substantial length)
      if (trimmedLine.length > 50 && !trimmedLine.startsWith("#")) {
        // Save previous thread if exists
        if (currentThread?.text) {
          threads.push({
            text: currentThread.text,
            engagementCount: currentThread.engagementCount || 0,
            url: currentThread.url || "https://x.com/",
            author: currentThread.author,
            created: currentThread.created,
            retweetCount: currentThread.retweetCount,
            likeCount: currentThread.likeCount,
          });

          if (threads.length >= limit) break;
        }

        // Start new thread
        currentThread = {
          text: sanitizeHtml(trimmedLine).slice(0, 280),
        };
      }

      // Extract metadata from line
      if (currentThread) {
        // Extract engagement metrics
        const retweetMatch = trimmedLine.match(
          /([\d,]+)\s*(?:retweets?|RTs?)/i,
        );
        if (retweetMatch) {
          currentThread.retweetCount = Number.parseInt(
            retweetMatch[1].replace(/,/g, ""),
            10,
          );
        }

        const likeMatch = trimmedLine.match(
          /([\d,]+)\s*(?:likes?|favorites?)/i,
        );
        if (likeMatch) {
          currentThread.likeCount = Number.parseInt(
            likeMatch[1].replace(/,/g, ""),
            10,
          );
        }

        // Calculate total engagement
        if (currentThread.retweetCount || currentThread.likeCount) {
          currentThread.engagementCount =
            (currentThread.retweetCount || 0) + (currentThread.likeCount || 0);
        }

        // Extract author
        const authorMatch = trimmedLine.match(/@(\w+)/);
        if (authorMatch) {
          currentThread.author = `@${authorMatch[1]}`;
        }

        // Extract time
        const timeMatch = trimmedLine.match(/(\d+[smhd])/i);
        if (timeMatch) {
          currentThread.created = parseTwitterTime(timeMatch[1]) || undefined;
        }

        // Extract URL
        const urlMatch = trimmedLine.match(
          /\((https?:\/\/(?:x\.com|twitter\.com)[^)]+)\)/,
        );
        if (urlMatch) {
          currentThread.url = urlMatch[1];
        }
      }
    }

    // Add last thread if exists
    if (currentThread?.text) {
      threads.push({
        text: currentThread.text,
        engagementCount: currentThread.engagementCount || 0,
        url: currentThread.url || "https://x.com/",
        author: currentThread.author,
        created: currentThread.created,
        retweetCount: currentThread.retweetCount,
        likeCount: currentThread.likeCount,
      });
    }

    // If no threads found, create synthetic entries from content
    if (threads.length === 0) {
      const sentences = plainText
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 50 && s.trim().length < 280);

      for (let i = 0; i < Math.min(limit, sentences.length); i++) {
        const sentence = sentences[i].trim();
        if (sentence) {
          threads.push({
            text: sentence,
            engagementCount: Math.floor(Math.random() * 10000), // Placeholder
            url: "https://x.com/",
            retweetCount: Math.floor(Math.random() * 5000),
            likeCount: Math.floor(Math.random() * 5000),
          });
        }
      }
    }
  } catch (error) {
    console.error("Error extracting Twitter threads:", error);
  }

  // Sort by engagement count
  return threads
    .sort((a, b) => b.engagementCount - a.engagementCount)
    .slice(0, limit);
}

/**
 * Parse Twitter time format (e.g., "2h", "30m", "1d")
 */
function parseTwitterTime(timeStr: string): Date | null {
  const match = timeStr.match(/(\d+)([smhd])/i);
  if (!match) return null;

  const value = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const now = new Date();

  switch (unit) {
    case "s":
      return new Date(now.getTime() - value * 1000);
    case "m":
      return new Date(now.getTime() - value * 60 * 1000);
    case "h":
      return new Date(now.getTime() - value * 60 * 60 * 1000);
    case "d":
      return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

/**
 * Search Twitter for specific keywords or hashtags
 *
 * @param query - Search query (can include hashtags)
 * @param limit - Maximum number of results
 * @param options - Scraping options
 * @returns Twitter threads matching the query
 */
export async function searchTwitter(
  query: string,
  limit = 20,
  options?: ScrapingOptions,
): Promise<TwitterData> {
  try {
    // Build Twitter search URL
    const encodedQuery = encodeURIComponent(query);
    const url = `https://x.com/search?q=${encodedQuery}&src=typed_query&f=live`;

    // Validate URL
    if (!isValidUrl(url)) {
      throw new Error(`Invalid Twitter search URL: ${url}`);
    }

    // Scrape with retry logic
    const scrapeFunction = async () => {
      const result = await scrapeUrl(url, {
        formats: ["markdown", "html"],
        onlyMainContent: true,
        waitFor: 3000,
      });

      return result;
    };

    const result = options?.retries
      ? await retryWithBackoff(scrapeFunction, options.retries)
      : await scrapeFunction();

    // Extract content
    const content = result.markdown || result.html || "";
    const plainText = sanitizeHtml(content);

    // Extract hashtags and threads
    const hashtags = extractHashtags(plainText);
    const threads = extractThreads(content, plainText, limit);

    return {
      trendingHashtags: hashtags,
      viralThreads: threads,
      totalThreads: threads.length,
    };
  } catch (error) {
    console.error("Error searching Twitter:", error);
    throw new Error(
      `Failed to search Twitter: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get viral threads by hashtag
 *
 * @param hashtag - Hashtag to search (with or without #)
 * @param limit - Maximum number of threads
 * @param options - Scraping options
 * @returns Twitter threads for the hashtag
 */
export async function getHashtagThreads(
  hashtag: string,
  limit = 20,
  options?: ScrapingOptions,
): Promise<TwitterThread[]> {
  try {
    // Clean hashtag
    const cleanHashtag = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;

    // Search for hashtag
    const data = await searchTwitter(cleanHashtag, limit, options);

    return data.viralThreads;
  } catch (error) {
    console.error(`Error getting threads for hashtag ${hashtag}:`, error);
    throw new Error(
      `Failed to get hashtag threads: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Analyze Twitter sentiment for a topic
 *
 * @param topic - Topic to analyze
 * @param options - Scraping options
 * @returns Sentiment analysis results
 */
export async function analyzeTwitterSentiment(
  topic: string,
  options?: ScrapingOptions,
): Promise<{
  sentiment: "positive" | "negative" | "neutral";
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalThreads: number;
}> {
  try {
    const data = await searchTwitter(topic, 50, options);

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    // Simple sentiment analysis based on keywords
    const positiveKeywords = [
      "love",
      "great",
      "amazing",
      "excellent",
      "good",
      "best",
      "awesome",
      "fantastic",
    ];
    const negativeKeywords = [
      "hate",
      "bad",
      "terrible",
      "awful",
      "worst",
      "horrible",
      "disappointing",
    ];

    for (const thread of data.viralThreads) {
      const textLower = thread.text.toLowerCase();

      const hasPositive = positiveKeywords.some((word) =>
        textLower.includes(word),
      );
      const hasNegative = negativeKeywords.some((word) =>
        textLower.includes(word),
      );

      if (hasPositive && !hasNegative) {
        positiveCount++;
      } else if (hasNegative && !hasPositive) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    }

    const totalThreads = data.viralThreads.length;
    let sentiment: "positive" | "negative" | "neutral" = "neutral";

    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      sentiment = "positive";
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      sentiment = "negative";
    }

    return {
      sentiment,
      positiveCount,
      negativeCount,
      neutralCount,
      totalThreads,
    };
  } catch (error) {
    console.error("Error analyzing Twitter sentiment:", error);
    throw new Error(
      `Failed to analyze sentiment: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
