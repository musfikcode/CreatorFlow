/**
 * Integration tests for web scraping service layer
 *
 * These tests verify that the scraping service layer is properly set up
 * and all functions are accessible.
 */

import {
  extractContentOpportunities,
  getScrapingStats,
  scrapeAllSources,
  scrapeByNiche,
  validateUrlForScraping,
} from "../index";
import { extractKeywords, isValidUrl, sanitizeHtml } from "../utils";

describe("Web Scraping Service - Unit Tests", () => {
  describe("URL Validation", () => {
    test("should validate valid URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://example.com")).toBe(true);
    });

    test("should reject invalid URLs", () => {
      expect(isValidUrl("not-a-url")).toBe(false);
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl("ftp://example.com")).toBe(false);
    });

    test("should validate URLs for scraping", () => {
      expect(validateUrlForScraping("https://example.com")).toBe(true);
      expect(validateUrlForScraping("http://localhost")).toBe(false);
      expect(validateUrlForScraping("https://127.0.0.1")).toBe(false);
    });
  });

  describe("HTML Sanitization", () => {
    test("should remove HTML tags", () => {
      const html = "<p>Hello <b>world</b>!</p>";
      const result = sanitizeHtml(html);
      expect(result).toBe("Hello world !");
    });

    test("should remove script tags", () => {
      const html = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain("script");
      expect(result).not.toContain("alert");
    });

    test("should decode HTML entities", () => {
      const html = "Hello &amp; goodbye";
      const result = sanitizeHtml(html);
      expect(result).toBe("Hello & goodbye");
    });

    test("should handle empty input", () => {
      expect(sanitizeHtml("")).toBe("");
      expect(sanitizeHtml(null as unknown as string)).toBe("");
    });
  });

  describe("Keyword Extraction", () => {
    test("should extract keywords from text", () => {
      const text =
        "AI and machine learning are transforming content creation with artificial intelligence";
      const keywords = extractKeywords(text, 5);

      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.length).toBeLessThanOrEqual(5);

      // Should filter out stopwords
      expect(keywords).not.toContain("and");
      expect(keywords).not.toContain("are");
      expect(keywords).not.toContain("with");
    });

    test("should return empty array for empty text", () => {
      expect(extractKeywords("")).toEqual([]);
    });
  });

  describe("Scraping Stats", () => {
    test("should calculate stats for empty result", () => {
      const result = {
        googleTrends: null,
        reddit: null,
        youtube: null,
        twitter: null,
        errors: {},
        timestamp: new Date(),
      };

      const stats = getScrapingStats(result);

      expect(stats.totalSources).toBe(4);
      expect(stats.successfulSources).toBe(0);
      expect(stats.failedSources).toBe(0);
      expect(stats.totalDataPoints).toBe(0);
      expect(stats.hasErrors).toBe(false);
    });

    test("should calculate stats with successful data", () => {
      const result = {
        googleTrends: {
          keywords: ["AI", "machine learning"],
          trendScore: 75,
          relatedQueries: ["deep learning", "neural networks"],
        },
        reddit: {
          topPosts: [
            {
              title: "Test Post",
              upvotes: 100,
              url: "https://reddit.com/test",
              commentCount: 50,
            },
          ],
          discussionSentiment: "positive",
        },
        youtube: null,
        twitter: null,
        errors: { youtube: "API error", twitter: "Rate limited" },
        timestamp: new Date(),
      };

      const stats = getScrapingStats(result);

      expect(stats.totalSources).toBe(4);
      expect(stats.successfulSources).toBe(2);
      expect(stats.failedSources).toBe(2);
      expect(stats.totalDataPoints).toBeGreaterThan(0);
      expect(stats.hasErrors).toBe(true);
    });
  });

  describe("Content Opportunities", () => {
    test("should extract content opportunities from scraped data", () => {
      const scrapedData = {
        googleTrends: {
          keywords: ["AI", "machine learning", "content creation"],
          trendScore: 85,
          relatedQueries: ["AI tools", "automation"],
        },
        reddit: {
          topPosts: [
            {
              title: "AI content creation tools are amazing",
              upvotes: 500,
              url: "https://reddit.com/test",
              commentCount: 100,
            },
          ],
          discussionSentiment: "positive",
        },
        youtube: {
          trendingVideos: [
            {
              title: "Machine learning tutorial",
              viewCount: 100000,
              likeCount: 5000,
              url: "https://youtube.com/test",
            },
          ],
        },
        twitter: {
          trendingHashtags: ["#AI", "#MachineLearning"],
          viralThreads: [],
        },
        errors: {},
        timestamp: new Date(),
      };

      const opportunities = extractContentOpportunities(scrapedData);

      expect(Array.isArray(opportunities)).toBe(true);
      expect(opportunities.length).toBeGreaterThan(0);

      const firstOpp = opportunities[0];
      expect(firstOpp).toHaveProperty("title");
      expect(firstOpp).toHaveProperty("reasoning");
      expect(firstOpp).toHaveProperty("targetPlatforms");
      expect(firstOpp).toHaveProperty("estimatedEngagement");
      expect(firstOpp).toHaveProperty("keywords");
      expect(firstOpp).toHaveProperty("sourceData");

      expect(firstOpp.estimatedEngagement).toBeGreaterThanOrEqual(0);
      expect(firstOpp.estimatedEngagement).toBeLessThanOrEqual(100);
    });
  });
});

// Note: Integration tests with actual scraping are intentionally skipped
// to avoid rate limits and external API dependencies during testing.
// These would be run manually or in a staging environment.

describe("Web Scraping Service - Integration Tests", () => {
  describe.skip("scrapeAllSources", () => {
    test("should scrape data from all sources", async () => {
      const result = await scrapeAllSources({
        googleTrends: {
          keywords: ["AI"],
          region: "US",
        },
        reddit: {
          subreddits: ["artificial"],
        },
        youtube: {
          region: "US",
          maxResults: 5,
        },
        twitter: {
          query: "AI",
          limit: 5,
        },
      });

      expect(result).toHaveProperty("googleTrends");
      expect(result).toHaveProperty("reddit");
      expect(result).toHaveProperty("youtube");
      expect(result).toHaveProperty("twitter");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("timestamp");
    }, 60000); // 60 second timeout for scraping
  });

  describe.skip("scrapeByNiche", () => {
    test("should scrape data for a specific niche", async () => {
      const result = await scrapeByNiche("AI content creation");

      const stats = getScrapingStats(result);
      expect(stats.successfulSources).toBeGreaterThan(0);
    }, 60000);
  });
});
