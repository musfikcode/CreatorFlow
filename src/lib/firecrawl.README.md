# Firecrawl SDK Integration

Comprehensive Firecrawl SDK integration with rate limiting, caching, retry logic, and timeout handling for the CreatorFlow Phase 2 AI Niche Research Engine.

## Features

- ✅ **24-hour caching layer** using `FirecrawlCache` Prisma model
- ✅ **Rate limiting** (100 requests/hour) using `FirecrawlRateLimit` Prisma model
- ✅ **Retry logic** with exponential backoff (3 retries: 1s, 2s, 4s delays)
- ✅ **30-second timeout** per request
- ✅ **Automatic cache expiration** handling
- ✅ **Type-safe API** with TypeScript
- ✅ **Error handling** with custom error types

## Installation

The Firecrawl SDK is already installed in the project:

```bash
bun add firecrawl
```

## Environment Variables

Add to `.env.local`:

```env
FIRECRAWL_API_KEY="fc-your-api-key-here"
```

## Usage

### Import

```typescript
import { scrapeUrl, scrapeMultipleUrls, mapUrl } from "@/lib/firecrawl";
```

### Scrape a Single URL

```typescript
try {
  const result = await scrapeUrl("https://example.com", {
    formats: ["markdown"],
    onlyMainContent: true,
  });

  console.log("Content:", result.content);
  console.log("Title:", result.metadata?.title);
  console.log("Description:", result.metadata?.description);
} catch (error) {
  if (error instanceof FirecrawlRateLimitError) {
    console.error("Rate limit exceeded");
  } else if (error instanceof FirecrawlTimeoutError) {
    console.error("Request timed out");
  } else {
    console.error("Scraping failed");
  }
}
```

### Scrape Multiple URLs in Parallel

```typescript
const urls = [
  "https://example.com/page1",
  "https://example.com/page2",
  "https://example.com/page3",
];

const results = await scrapeMultipleUrls(urls, {
  formats: ["markdown"],
  onlyMainContent: true,
}, 5); // 5 concurrent requests

results.forEach((result, index) => {
  if (result) {
    console.log(`URL ${urls[index]}: Success`);
  } else {
    console.log(`URL ${urls[index]}: Failed`);
  }
});
```

### Map a URL (Get All Links)

```typescript
const result = await mapUrl("https://example.com", {
  limit: 100,
});

console.log("Links found:", result.links?.length);
```

### Advanced Scraping Options

```typescript
const result = await scrapeUrl("https://example.com", {
  formats: ["markdown", "html", "links", "screenshot"],
  onlyMainContent: true,
  includeTags: ["article", "main"],
  excludeTags: ["nav", "footer", "aside"],
  waitFor: 2000, // Wait 2 seconds for dynamic content
});

console.log("Markdown:", result.markdown);
console.log("HTML:", result.html);
console.log("Links:", result.links);
console.log("Screenshot:", result.screenshot);
```

## API Reference

### `scrapeUrl(url, options)`

Scrape a single URL with caching and rate limiting.

**Parameters:**
- `url` (string): The URL to scrape
- `options` (object, optional):
  - `formats`: Array of formats to return (`"markdown" | "html" | "rawHtml" | "links" | "screenshot"`)
  - `onlyMainContent`: Extract only main content (default: `true`)
  - `includeTags`: Array of HTML tags to include
  - `excludeTags`: Array of HTML tags to exclude
  - `waitFor`: Milliseconds to wait for dynamic content

**Returns:**
```typescript
{
  content: string;
  markdown?: string;
  html?: string;
  rawHtml?: string;
  links?: string[];
  screenshot?: string;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string;
    author?: string;
    ogImage?: string;
  };
}
```

**Throws:**
- `FirecrawlRateLimitError`: Rate limit exceeded
- `FirecrawlTimeoutError`: Request timed out
- `FirecrawlError`: Scraping failed after retries

---

### `scrapeMultipleUrls(urls, options, concurrency)`

Scrape multiple URLs in parallel with rate limiting.

**Parameters:**
- `urls` (string[]): Array of URLs to scrape
- `options`: Same as `scrapeUrl` options
- `concurrency` (number, default: 5): Maximum concurrent requests

**Returns:**
Array of scrape results (null for failed scrapes)

---

### `mapUrl(url, options)`

Get structured data from a single page (all links).

**Parameters:**
- `url` (string): The URL to map
- `options` (object, optional):
  - `search`: Search term to filter links
  - `ignoreSitemap`: Ignore sitemap (default: false)
  - `includeSubdomains`: Include subdomains (default: false)
  - `limit`: Maximum number of links

**Returns:**
```typescript
{
  success: boolean;
  links?: string[];
  error?: string;
}
```

---

### `getRateLimitStatus()`

Get current rate limit status.

**Returns:**
```typescript
{
  requestCount: number;
  limit: number;
  remaining: number;
  resetsAt: Date;
}
```

---

### `getCacheStats()`

Get cache statistics.

**Returns:**
```typescript
{
  totalEntries: number;
  expiredEntries: number;
  validEntries: number;
}
```

---

### `cleanupExpiredCache()`

Delete expired cache entries.

**Returns:** Number of entries deleted

---

### `clearCache()`

Clear all cache entries.

**Returns:** Number of entries deleted

---

## Error Handling

The integration provides three custom error types:

```typescript
import {
  FirecrawlRateLimitError,
  FirecrawlTimeoutError,
  FirecrawlError,
} from "@/lib/firecrawl";

try {
  await scrapeUrl("https://example.com");
} catch (error) {
  if (error instanceof FirecrawlRateLimitError) {
    // Handle rate limit error
    console.error("Rate limit exceeded:", error.message);
  } else if (error instanceof FirecrawlTimeoutError) {
    // Handle timeout error
    console.error("Request timed out:", error.message);
  } else if (error instanceof FirecrawlError) {
    // Handle general Firecrawl error
    console.error("Scraping failed:", error.message);
  } else {
    // Handle unknown error
    console.error("Unknown error:", error);
  }
}
```

## Caching Strategy

- **TTL:** 24 hours
- **Storage:** PostgreSQL via `FirecrawlCache` Prisma model
- **Automatic expiration:** Cache entries expire automatically
- **Cache key:** URL for scraping, `map:{url}` for mapping
- **Cleanup:** Use `cleanupExpiredCache()` periodically (e.g., via cron job)

## Rate Limiting

- **Limit:** 100 requests per hour
- **Tracking:** Per-hour buckets using `FirecrawlRateLimit` Prisma model
- **Reset:** Every hour on the hour (e.g., 14:00, 15:00)
- **Enforcement:** Automatic with `FirecrawlRateLimitError` thrown when exceeded

## Retry Logic

- **Max retries:** 3
- **Delays:** Exponential backoff (1s, 2s, 4s)
- **Non-retryable errors:** Rate limit and timeout errors
- **Automatic:** Happens transparently for transient failures

## Timeout

- **Default timeout:** 30 seconds per request
- **Non-configurable:** Fixed timeout to prevent long-running requests
- **Error:** Throws `FirecrawlTimeoutError` on timeout

## Database Models

### FirecrawlCache

```prisma
model FirecrawlCache {
  id        String   @id @default(cuid())
  url       String
  content   String   @db.Text
  metadata  Json?    @default("{}")
  createdAt DateTime @default(now())
  expiresAt DateTime
  
  @@unique([url])
  @@index([url, expiresAt])
  @@map("firecrawl_cache")
}
```

### FirecrawlRateLimit

```prisma
model FirecrawlRateLimit {
  id        String   @id @default(cuid())
  hourBucket DateTime
  requestCount Int    @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([hourBucket])
  @@index([hourBucket])
  @@map("firecrawl_rate_limit")
}
```

## Best Practices

1. **Use caching:** The 24-hour cache automatically reduces API calls
2. **Batch requests:** Use `scrapeMultipleUrls` for multiple URLs
3. **Handle errors:** Always catch and handle custom error types
4. **Monitor rate limits:** Use `getRateLimitStatus()` to track usage
5. **Clean up cache:** Run `cleanupExpiredCache()` periodically via cron
6. **Respect limits:** Don't exceed 100 requests/hour

## Integration with AI Niche Research Engine

This Firecrawl integration is designed for Phase 2's AI Niche Research Engine:

- **Google Trends scraping:** Keyword trend scores
- **Reddit scraping:** Top posts and discussion sentiment
- **YouTube scraping:** Trending video data
- **Twitter scraping:** Trending hashtags and viral threads
- **Competitor scraping:** Content data and engagement metrics

Example use case:

```typescript
// Scrape Google Trends data
const trendsData = await scrapeUrl("https://trends.google.com/...", {
  formats: ["markdown"],
  onlyMainContent: true,
});

// Scrape Reddit subreddit
const redditData = await scrapeUrl("https://reddit.com/r/yourNiche", {
  formats: ["markdown", "links"],
  onlyMainContent: true,
});

// Scrape competitor content
const competitorUrls = ["https://competitor1.com", "https://competitor2.com"];
const competitorData = await scrapeMultipleUrls(competitorUrls);
```

## Maintenance

### Periodic Cache Cleanup (Recommended)

Create a cron job or scheduled task to clean up expired cache entries:

```typescript
// Run daily at midnight
import { cleanupExpiredCache } from "@/lib/firecrawl";

async function dailyCacheCleanup() {
  const deletedCount = await cleanupExpiredCache();
  console.log(`Cleaned up ${deletedCount} expired cache entries`);
}
```

### Monitor Rate Limits

Check rate limit status before bulk operations:

```typescript
const status = await getRateLimitStatus();

if (status.remaining < 10) {
  console.warn(`Only ${status.remaining} requests remaining`);
  console.warn(`Rate limit resets at ${status.resetsAt}`);
}
```

## Requirements Covered

This implementation satisfies the following Phase 2 requirements:

- ✅ **Requirement 18.1:** Firecrawl SDK installed and configured
- ✅ **Requirement 18.2:** Rate limiting (100 requests/hour)
- ✅ **Requirement 18.3:** 24-hour caching layer
- ✅ **Requirement 18.4:** Automatic cache expiration
- ✅ **Requirement 18.6:** Retry logic with exponential backoff
- ✅ **Requirement 18.10:** 30-second timeout per request

## Testing

See `src/lib/__tests__/firecrawl.example.ts` for example usage and test cases.

## Support

For issues or questions, refer to:
- [Firecrawl Documentation](https://docs.firecrawl.dev/)
- Phase 2 Requirements Document
- Task 2.1 in tasks.md
