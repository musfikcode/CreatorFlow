/**
 * Example usage of the Firecrawl SDK integration
 *
 * This file demonstrates how to use the Firecrawl service
 * with rate limiting, caching, and retry logic.
 */

import {
  cleanupExpiredCache,
  clearCache,
  FirecrawlError,
  FirecrawlRateLimitError,
  FirecrawlTimeoutError,
  getCacheStats,
  getRateLimitStatus,
  mapUrl,
  scrapeMultipleUrls,
  scrapeUrl,
} from "@/lib/firecrawl";

/**
 * Example 1: Scrape a single URL
 */
async function exampleScrapeUrl() {
  try {
    const result = await scrapeUrl("https://example.com", {
      formats: ["markdown"],
      onlyMainContent: true,
    });

    console.log("Content:", result.content);
    console.log("Metadata:", result.metadata);
  } catch (error) {
    if (error instanceof FirecrawlRateLimitError) {
      console.error("Rate limit exceeded:", error.message);
    } else if (error instanceof FirecrawlTimeoutError) {
      console.error("Request timed out:", error.message);
    } else if (error instanceof FirecrawlError) {
      console.error("Scraping failed:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
  }
}

/**
 * Example 2: Scrape multiple URLs in parallel
 */
async function exampleScrapeMultipleUrls() {
  const urls = [
    "https://example.com/page1",
    "https://example.com/page2",
    "https://example.com/page3",
  ];

  const results = await scrapeMultipleUrls(urls, {
    formats: ["markdown"],
    onlyMainContent: true,
  });

  results.forEach((result, index) => {
    if (result) {
      console.log(`URL ${urls[index]}:`, result.content.substring(0, 100));
    } else {
      console.log(`URL ${urls[index]}: Failed to scrape`);
    }
  });
}

/**
 * Example 3: Map a URL (get all links from a page)
 */
async function exampleMapUrl() {
  try {
    const result = await mapUrl("https://example.com", {
      limit: 100,
    });

    console.log("Links found:", result.links?.length);
    console.log("Links:", result.links);
  } catch (error) {
    console.error("Mapping failed:", error);
  }
}

/**
 * Example 4: Check rate limit status
 */
async function exampleCheckRateLimit() {
  const status = await getRateLimitStatus();

  console.log("Current requests:", status.requestCount);
  console.log("Limit:", status.limit);
  console.log("Remaining:", status.remaining);
  console.log("Resets at:", status.resetsAt);
}

/**
 * Example 5: Check cache statistics
 */
async function exampleCacheStats() {
  const stats = await getCacheStats();

  console.log("Total cache entries:", stats.totalEntries);
  console.log("Valid entries:", stats.validEntries);
  console.log("Expired entries:", stats.expiredEntries);
}

/**
 * Example 6: Clean up expired cache entries
 */
async function exampleCleanupCache() {
  const deletedCount = await cleanupExpiredCache();
  console.log(`Cleaned up ${deletedCount} expired cache entries`);
}

/**
 * Example 7: Clear all cache entries
 */
async function exampleClearCache() {
  const deletedCount = await clearCache();
  console.log(`Cleared ${deletedCount} cache entries`);
}

/**
 * Example 8: Scrape with custom options
 */
async function exampleScrapeWithOptions() {
  try {
    const result = await scrapeUrl("https://example.com", {
      formats: ["markdown", "html", "links"],
      onlyMainContent: true,
      includeTags: ["article", "main"],
      excludeTags: ["nav", "footer", "aside"],
      waitFor: 2000, // Wait 2 seconds for dynamic content
    });

    console.log("Markdown:", result.markdown);
    console.log("HTML:", result.html);
    console.log("Links:", result.links);
    console.log("Title:", result.metadata?.title);
  } catch (error) {
    console.error("Scraping failed:", error);
  }
}

// Export examples for use in other files
export {
  exampleScrapeUrl,
  exampleScrapeMultipleUrls,
  exampleMapUrl,
  exampleCheckRateLimit,
  exampleCacheStats,
  exampleCleanupCache,
  exampleClearCache,
  exampleScrapeWithOptions,
};
