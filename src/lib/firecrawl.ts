import FirecrawlApp from "firecrawl";
import prisma from "@/lib/db";

/**
 * Firecrawl SDK Integration with Rate Limiting, Caching, and Retry Logic
 *
 * Features:
 * - 24-hour caching layer using FirecrawlCache model
 * - Rate limiting (tracks requests per hour using FirecrawlRateLimit model)
 * - Retry logic with exponential backoff (3 retries, 1s/2s/4s delays)
 * - 30-second timeout per request
 * - Automatic cache expiration handling
 */

// Configuration constants
const MAX_REQUESTS_PER_HOUR = 100;
const CACHE_TTL_HOURS = 24;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const RETRY_DELAYS_MS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
const MAX_RETRIES = 3;

// Initialize Firecrawl client
const firecrawlClient = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});

/**
 * Error types for better error handling
 */
export class FirecrawlRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirecrawlRateLimitError";
  }
}

export class FirecrawlTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirecrawlTimeoutError";
  }
}

export class FirecrawlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirecrawlError";
  }
}

/**
 * Get the current hour bucket for rate limiting
 * Truncates timestamp to the hour (e.g., 2025-01-15 14:00:00)
 */
function getHourBucket(): Date {
  const now = new Date();
  now.setMinutes(0, 0, 0); // Reset minutes, seconds, milliseconds
  return now;
}

/**
 * Check and enforce rate limiting
 * @throws {FirecrawlRateLimitError} if rate limit exceeded
 */
async function checkRateLimit(): Promise<void> {
  const hourBucket = getHourBucket();

  // Get or create rate limit record for current hour
  const rateLimit = await prisma.firecrawlRateLimit.upsert({
    where: { hourBucket },
    update: {
      requestCount: {
        increment: 1,
      },
    },
    create: {
      hourBucket,
      requestCount: 1,
    },
  });

  if (rateLimit.requestCount > MAX_REQUESTS_PER_HOUR) {
    throw new FirecrawlRateLimitError(
      `Rate limit exceeded: ${rateLimit.requestCount}/${MAX_REQUESTS_PER_HOUR} requests in the current hour`,
    );
  }
}

// Type definition for scrape metadata
interface ScrapeMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  ogImage?: string;
  markdown?: string;
  html?: string;
  rawHtml?: string;
  links?: string[];
  screenshot?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * Get cached content for a URL
 * @param url The URL to check cache for
 * @returns Cached content or null if not found or expired
 */
async function getCachedContent(
  url: string,
): Promise<{ content: string; metadata: ScrapeMetadata } | null> {
  const now = new Date();

  // Find valid cache entry
  const cacheEntry = await prisma.firecrawlCache.findUnique({
    where: {
      url,
      expiresAt: {
        gt: now, // Only get entries that haven't expired
      },
    },
  });

  if (cacheEntry) {
    return {
      content: cacheEntry.content,
      metadata: cacheEntry.metadata as unknown as ScrapeMetadata,
    };
  }

  return null;
}

/**
 * Set cached content for a URL
 * @param url The URL to cache
 * @param content The content to cache
 * @param metadata Optional metadata to store
 */
async function setCachedContent(
  url: string,
  content: string,
  metadata?: ScrapeMetadata,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000);

  await prisma.firecrawlCache.upsert({
    where: { url },
    update: {
      content,
      metadata: metadata || {},
      expiresAt,
    },
    create: {
      url,
      content,
      metadata: metadata || {},
      expiresAt,
    },
  });
}

/**
 * Delete expired cache entries
 * This should be called periodically (e.g., via a cron job)
 */
export async function cleanupExpiredCache(): Promise<number> {
  const now = new Date();

  const result = await prisma.firecrawlCache.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  return result.count;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new FirecrawlTimeoutError(errorMessage)),
      timeoutMs,
    );
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Scrape a single URL with Firecrawl
 *
 * Features:
 * - Checks cache first (24-hour TTL)
 * - Enforces rate limiting
 * - Implements retry logic with exponential backoff
 * - 30-second timeout per request
 * - Stores result in cache
 *
 * @param url The URL to scrape
 * @param options Optional scraping options
 * @returns Scraped content and metadata
 * @throws {FirecrawlRateLimitError} if rate limit exceeded
 * @throws {FirecrawlTimeoutError} if request times out
 * @throws {FirecrawlError} if scraping fails after retries
 */
export async function scrapeUrl(
  url: string,
  options?: {
    formats?: ("markdown" | "html" | "rawHtml" | "links" | "screenshot")[];
    onlyMainContent?: boolean;
    includeTags?: string[];
    excludeTags?: string[];
    waitFor?: number;
  },
): Promise<{
  content: string;
  markdown?: string;
  html?: string;
  rawHtml?: string;
  links?: string[];
  screenshot?: string;
  metadata?: ScrapeMetadata;
}> {
  // Check cache first
  const cached = await getCachedContent(url);
  if (cached) {
    return {
      content: cached.content,
      metadata: cached.metadata,
      ...cached.metadata,
    };
  }

  // Check rate limit
  await checkRateLimit();

  // Retry logic with exponential backoff
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Execute scrape with timeout
      const result = await withTimeout(
        firecrawlClient.scrapeUrl(url, {
          formats: options?.formats || ["markdown"],
          onlyMainContent: options?.onlyMainContent ?? true,
          includeTags: options?.includeTags,
          excludeTags: options?.excludeTags,
          waitFor: options?.waitFor,
        }),
        REQUEST_TIMEOUT_MS,
        `Scraping URL ${url} timed out after ${REQUEST_TIMEOUT_MS}ms`,
      );

      // Extract content
      const content = result.markdown || result.html || result.rawHtml || "";
      const keywordsStr = Array.isArray(result.metadata?.keywords)
        ? result.metadata.keywords.join(", ")
        : result.metadata?.keywords;

      const metadata = {
        title: result.metadata?.title,
        description: result.metadata?.description,
        keywords: keywordsStr,
        author: result.metadata?.author as string | undefined,
        ogImage: result.metadata?.ogImage,
        markdown: result.markdown,
        html: result.html,
        rawHtml: result.rawHtml,
        links: result.links,
        screenshot: result.screenshot,
      };

      // Cache the result
      await setCachedContent(url, content, metadata);

      return {
        content,
        metadata,
        markdown: result.markdown,
        html: result.html,
        rawHtml: result.rawHtml,
        links: result.links,
        screenshot: result.screenshot,
      };
    } catch (error) {
      lastError = error as Error;

      // Don't retry on rate limit or timeout errors
      if (
        error instanceof FirecrawlRateLimitError ||
        error instanceof FirecrawlTimeoutError
      ) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === MAX_RETRIES) {
        break;
      }

      // Wait before retrying (exponential backoff)
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  // All retries failed
  throw new FirecrawlError(
    `Failed to scrape URL after ${MAX_RETRIES} retries: ${lastError?.message || "Unknown error"}`,
  );
}

/**
 * Scrape multiple URLs in parallel with rate limiting
 *
 * @param urls Array of URLs to scrape
 * @param options Optional scraping options
 * @param concurrency Maximum number of concurrent requests (default: 5)
 * @returns Array of scrape results (null for failed scrapes)
 */
export async function scrapeMultipleUrls(
  urls: string[],
  options?: Parameters<typeof scrapeUrl>[1],
  concurrency = 5,
): Promise<Array<Awaited<ReturnType<typeof scrapeUrl>> | null>> {
  const results: Array<Awaited<ReturnType<typeof scrapeUrl>> | null> = [];

  // Process URLs in batches to respect concurrency
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          return await scrapeUrl(url, options);
        } catch (error) {
          console.error(`Failed to scrape ${url}:`, error);
          return null;
        }
      }),
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Map a URL (get structured data from a single page)
 *
 * @param url The URL to map
 * @param options Optional mapping options
 * @returns Mapped data
 */
export async function mapUrl(
  url: string,
  options?: {
    search?: string;
    ignoreSitemap?: boolean;
    includeSubdomains?: boolean;
    limit?: number;
  },
): Promise<{
  success: boolean;
  links?: string[];
  error?: string;
}> {
  // Check cache
  const cacheKey = `map:${url}`;
  const cached = await getCachedContent(cacheKey);
  if (cached) {
    return JSON.parse(cached.content);
  }

  // Check rate limit
  await checkRateLimit();

  // Retry logic
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await withTimeout(
        firecrawlClient.mapUrl(url, {
          search: options?.search,
          sitemap: options?.ignoreSitemap ? "skip" : "include",
          includeSubdomains: options?.includeSubdomains,
          ignoreQueryParameters: true,
        }),
        REQUEST_TIMEOUT_MS,
        `Mapping URL ${url} timed out after ${REQUEST_TIMEOUT_MS}ms`,
      );

      // Transform MapData to expected format
      const mappedResult = {
        success: true,
        links:
          result.links
            ?.map((link) => link.url)
            .filter((url): url is string => !!url) || [],
      };

      // Cache the result
      await setCachedContent(cacheKey, JSON.stringify(mappedResult), {
        type: "map",
      });

      return mappedResult;
    } catch (error) {
      lastError = error as Error;

      if (
        error instanceof FirecrawlRateLimitError ||
        error instanceof FirecrawlTimeoutError
      ) {
        throw error;
      }

      if (attempt === MAX_RETRIES) {
        break;
      }

      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw new FirecrawlError(
    `Failed to map URL after ${MAX_RETRIES} retries: ${lastError?.message || "Unknown error"}`,
  );
}

/**
 * Get current rate limit status
 * @returns Current request count and limit for the current hour
 */
export async function getRateLimitStatus(): Promise<{
  requestCount: number;
  limit: number;
  remaining: number;
  resetsAt: Date;
}> {
  const hourBucket = getHourBucket();

  const rateLimit = await prisma.firecrawlRateLimit.findUnique({
    where: { hourBucket },
  });

  const requestCount = rateLimit?.requestCount || 0;
  const resetsAt = new Date(hourBucket.getTime() + 60 * 60 * 1000); // +1 hour

  return {
    requestCount,
    limit: MAX_REQUESTS_PER_HOUR,
    remaining: Math.max(0, MAX_REQUESTS_PER_HOUR - requestCount),
    resetsAt,
  };
}

/**
 * Get cache statistics
 * @returns Cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  expiredEntries: number;
  validEntries: number;
}> {
  const now = new Date();

  const [totalEntries, expiredEntries] = await Promise.all([
    prisma.firecrawlCache.count(),
    prisma.firecrawlCache.count({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    }),
  ]);

  return {
    totalEntries,
    expiredEntries,
    validEntries: totalEntries - expiredEntries,
  };
}

/**
 * Clear all cache entries
 * @returns Number of entries deleted
 */
export async function clearCache(): Promise<number> {
  const result = await prisma.firecrawlCache.deleteMany();
  return result.count;
}

/**
 * Export the Firecrawl client for direct access if needed
 */
export { firecrawlClient };
