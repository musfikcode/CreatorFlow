/**
 * Example usage of the web scraping service layer
 *
 * This file demonstrates how to use the various scraping functions
 * and is useful for manual testing and verification.
 */

import {
  extractContentOpportunities,
  getScrapingStats,
  scrapeAllSources,
  scrapeByNiche,
  scrapeGoogleTrends,
  scrapeReddit,
  scrapeTwitter,
  validateUrlForScraping,
} from "./index";

/**
 * Example 1: Multi-source scraping
 */
async function exampleMultiSourceScraping() {
  console.log("\n=== Example 1: Multi-Source Scraping ===\n");

  const result = await scrapeAllSources({
    googleTrends: {
      keywords: ["AI", "content creation"],
      region: "US",
    },
    reddit: {
      subreddits: ["ContentCreation", "marketing"],
      sortBy: "hot",
      timeRange: "week",
    },
    youtube: {
      region: "US",
      maxResults: 10,
    },
    twitter: {
      query: "AI content",
      limit: 10,
    },
  });

  console.log("Scraping Results:");
  console.log("- Timestamp:", result.timestamp.toISOString());

  if (result.googleTrends) {
    console.log("\nGoogle Trends:");
    console.log("  Keywords:", result.googleTrends.keywords.slice(0, 5));
    console.log("  Trend Score:", result.googleTrends.trendScore);
  }

  if (result.reddit) {
    console.log("\nReddit:");
    console.log("  Top Posts:", result.reddit.topPosts.length);
    console.log("  Sentiment:", result.reddit.discussionSentiment);
    if (result.reddit.topPosts.length > 0) {
      console.log("  First Post:", result.reddit.topPosts[0].title);
    }
  }

  if (result.youtube) {
    console.log("\nYouTube:");
    console.log("  Trending Videos:", result.youtube.trendingVideos.length);
    if (result.youtube.trendingVideos.length > 0) {
      console.log("  First Video:", result.youtube.trendingVideos[0].title);
    }
  }

  if (result.twitter) {
    console.log("\nTwitter:");
    console.log(
      "  Trending Hashtags:",
      result.twitter.trendingHashtags.slice(0, 5),
    );
    console.log("  Viral Threads:", result.twitter.viralThreads.length);
  }

  if (Object.keys(result.errors).length > 0) {
    console.log("\nErrors:");
    for (const [source, error] of Object.entries(result.errors)) {
      console.log(`  ${source}: ${error}`);
    }
  }

  // Get statistics
  const stats = getScrapingStats(result);
  console.log("\nStatistics:");
  console.log(`  Successful: ${stats.successfulSources}/${stats.totalSources}`);
  console.log(`  Total Data Points: ${stats.totalDataPoints}`);

  return result;
}

/**
 * Example 2: Niche-specific scraping
 */
async function exampleNicheScraping() {
  console.log("\n=== Example 2: Niche-Specific Scraping ===\n");

  const niche = "AI content creation";
  console.log(`Scraping data for niche: "${niche}"`);

  const result = await scrapeByNiche(niche);

  const stats = getScrapingStats(result);
  console.log(
    `\nSuccessful sources: ${stats.successfulSources}/${stats.totalSources}`,
  );
  console.log(`Total data points: ${stats.totalDataPoints}`);

  return result;
}

/**
 * Example 3: Extract content opportunities
 */
async function exampleContentOpportunities() {
  console.log("\n=== Example 3: Content Opportunities ===\n");

  // First, scrape data
  const scrapedData = await scrapeByNiche("AI content creation");

  // Then extract opportunities
  const opportunities = extractContentOpportunities(scrapedData);

  console.log(`Found ${opportunities.length} content opportunities:\n`);

  for (const opp of opportunities.slice(0, 5)) {
    console.log(`Title: ${opp.title}`);
    console.log(`Platforms: ${opp.targetPlatforms.join(", ")}`);
    console.log(`Engagement Score: ${opp.estimatedEngagement}/100`);
    console.log(`Keywords: ${opp.keywords.slice(0, 3).join(", ")}`);
    console.log(`Reasoning: ${opp.reasoning}`);
    console.log();
  }

  return opportunities;
}

/**
 * Example 4: Individual source scraping
 */
async function exampleIndividualSources() {
  console.log("\n=== Example 4: Individual Source Scraping ===\n");

  // Google Trends
  console.log("Scraping Google Trends...");
  const trends = await scrapeGoogleTrends(["AI", "machine learning"], "US");
  console.log("Keywords:", trends.keywords.slice(0, 5));
  console.log("Trend Score:", trends.trendScore);

  // Reddit
  console.log("\nScraping Reddit...");
  const reddit = await scrapeReddit("artificial", "hot", "week", 10);
  console.log("Top Posts:", reddit.topPosts.length);
  console.log("Sentiment:", reddit.discussionSentiment);

  // Twitter
  console.log("\nScraping Twitter...");
  const twitter = await scrapeTwitter("worldwide", 10);
  console.log("Trending Hashtags:", twitter.trendingHashtags.slice(0, 5));
  console.log("Viral Threads:", twitter.viralThreads.length);
}

/**
 * Example 5: URL validation
 */
function exampleUrlValidation() {
  console.log("\n=== Example 5: URL Validation ===\n");

  const urls = [
    "https://example.com",
    "http://google.com",
    "not-a-url",
    "https://localhost/test",
    "ftp://example.com",
  ];

  for (const url of urls) {
    const isValid = validateUrlForScraping(url);
    console.log(`${url}: ${isValid ? "✓ Valid" : "✗ Invalid"}`);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║   Web Scraping Service Layer - Usage Examples       ║");
  console.log("╚═══════════════════════════════════════════════════════╝");

  try {
    // Example 5 doesn't require external calls
    exampleUrlValidation();

    // Note: The following examples require external API calls
    // and are commented out to avoid rate limits during testing.
    // Uncomment them for manual testing.

    // await exampleMultiSourceScraping();
    // await exampleNicheScraping();
    // await exampleContentOpportunities();
    // await exampleIndividualSources();

    console.log("\n✓ Examples completed successfully!");
    console.log(
      "\nNote: To test actual scraping, uncomment the examples in runAllExamples()",
    );
  } catch (error) {
    console.error("\n✗ Error running examples:", error);
    throw error;
  }
}

// Run examples if this file is executed directly
if (
  require.main === module ||
  import.meta.url === `file://${process.argv[1]}`
) {
  runAllExamples().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export {
  exampleContentOpportunities,
  exampleIndividualSources,
  exampleMultiSourceScraping,
  exampleNicheScraping,
  exampleUrlValidation,
  runAllExamples,
};
