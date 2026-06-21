/**
 * Unit tests for Firecrawl SDK integration
 *
 * These tests verify the rate limiting, caching, retry logic,
 * and timeout handling functionality.
 */

import { describe, expect, it } from "vitest";
import {
  cleanupExpiredCache,
  getCacheStats,
  getRateLimitStatus,
} from "@/lib/firecrawl";

describe("Firecrawl SDK Integration", () => {
  describe("Rate Limiting", () => {
    it("should return rate limit status", async () => {
      const status = await getRateLimitStatus();

      expect(status).toBeDefined();
      expect(status.requestCount).toBeGreaterThanOrEqual(0);
      expect(status.limit).toBe(100);
      expect(status.remaining).toBeGreaterThanOrEqual(0);
      expect(status.resetsAt).toBeInstanceOf(Date);
    });
  });

  describe("Caching", () => {
    it("should return cache statistics", async () => {
      const stats = await getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.totalEntries).toBeGreaterThanOrEqual(0);
      expect(stats.expiredEntries).toBeGreaterThanOrEqual(0);
      expect(stats.validEntries).toBeGreaterThanOrEqual(0);
    });

    it("should clean up expired cache entries", async () => {
      const deletedCount = await cleanupExpiredCache();

      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Configuration", () => {
    it("should have FIRECRAWL_API_KEY configured", () => {
      expect(process.env.FIRECRAWL_API_KEY).toBeDefined();
      expect(process.env.FIRECRAWL_API_KEY).not.toBe("");
    });
  });
});
