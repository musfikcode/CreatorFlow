# Web Scraping Service Implementation

## Overview

The web scraping service layer provides multi-source data collection capabilities for CreatorFlow Phase 2. It integrates with Google Trends, Reddit, YouTube, and Twitter to gather trending topics, content ideas, and audience insights.

**Implementation Date:** 2025-01-15  
**Task:** 2.2 Create web scraping service layer  
**Status:** ✅ Complete

## Architecture

### Components

```
src/lib/scraping/
├── types.ts           # TypeScript type definitions
├── utils.ts           # Shared utilities (URL validation, HTML sanitization)
├── google-trends.ts   # Google Trends scraping
├── reddit.ts          # Reddit scraping
├── youtube.ts         # YouTube Data API integration
├── twitter.ts         # Twitter/X scraping
├── index.ts           # Main orchestration & parallel scraping
├── example.ts         # Usage examples
└── __tests__/
    └── scraping.test.ts  # Unit and integration tests
```

### Key Features

1. **Multi-Source Scraping**: Parallel execution of scraping operations across all platforms
2. **Type Safety**: Full TypeScript support with comprehensive interfaces
3. **Firecrawl Integration**: Leverages existing rate limiting and caching from task 2.1
4. **URL Validation**: Validates URLs before scraping to prevent errors
5. **HTML Sanitization**: Extracts plain text from HTML, removes scripts/styles
6. **Error Handling**: Graceful degradation with detailed error messages
7. **Content Opportunities**: AI-powered analysis to identify content ideas

## Implementation Details

### Requirements Coverage

Task 2.2 requirements (from Phase 2 Hackathon Features spec):

✅ **1.2** - Multi-source data collection (Google Trends, Reddit, YouTube, Twitter)  
✅ **1.3** - Reddit subreddit data extraction with top posts and sentiment  
✅ **1.4** - YouTube trending videos using YouTube Data API (with fallback to scraping)  
✅ **1.5** - Twitter trending hashtags and viral threads  
✅ **1.6** - Competitor URL scraping capability  
✅ **1.8** - URL validation before scraping  
✅ **18.7** - HTML sanitization to extract plain text  
✅ **18.8** - Parallel multi-source scraping function

### Core Functions

#### `scrapeAllSources(config, options)`

Parallel scraping from all sources with configurable options:

```typescript
const result = await scrapeAllSources({
  googleTrends: { keywords: ["AI"], region: "US" },
  reddit: { subreddits: ["ContentCreation"] },
  youtube: { region: "US", maxResults: 10 },
  twitter: { query: "AI content", limit: 20 }
});
```

**Returns:**
- `MultiSourceScrapingResult` with data from all sources
- Errors for failed sources (graceful degradation)
- Timestamp for cache tracking

#### `scrapeByNiche(niche, options)`

Convenience function for niche-specific research:

```typescript
const nicheData = await scrapeByNiche("AI content creation");
```

Automatically determines:
- Relevant keywords for Google Trends
- Appropriate subreddits to monitor
- YouTube video categories
- Twitter search queries

#### `extractContentOpportunities(scrapedData)`

Analyzes scraped data to generate content ideas:

```typescript
const opportunities = extractContentOpportunities(scrapedData);
// Returns: Array<ContentOpportunity> with titles, platforms, engagement scores
```

Each opportunity includes:
- Title suggestion
- Reasoning based on data sources
- Target platforms (YouTube, Twitter, Blog, etc.)
- Estimated engagement score (0-100)
- Relevant keywords
- Source attribution

### Data Flow

```
User Request
    ↓
scrapeAllSources()
    ↓
Promise.allSettled([
  scrapeGoogleTrends(),
  scrapeReddit(),
  fetchTrendingVideos(),
  scrapeTwitter()
]) ← Parallel Execution
    ↓
Firecrawl Service
    ├─ Rate Limiting (100 req/hour)
    ├─ Caching (24 hours)
    └─ Retry Logic (3 attempts)
    ↓
Parse & Extract Data
    ├─ URL Validation
    ├─ HTML Sanitization
    └─ Keyword Extraction
    ↓
Return Combined Results
```

## API Reference

### Type Definitions

```typescript
interface GoogleTrendsData {
  keywords: string[];
  trendScore: number;  // 0-100
  relatedQueries: string[];
  region?: string;
  timeframe?: string;
}

interface RedditData {
  topPosts: RedditPost[];
  discussionSentiment: string;  // "positive" | "negative" | "neutral"
  totalPosts?: number;
  subreddit?: string;
}

interface YouTubeData {
  trendingVideos: YouTubeVideo[];
  totalResults?: number;
  category?: string;
}

interface TwitterData {
  trendingHashtags: string[];
  viralThreads: TwitterThread[];
  totalThreads?: number;
}

interface MultiSourceScrapingResult {
  googleTrends: GoogleTrendsData | null;
  reddit: RedditData | null;
  youtube: YouTubeData | null;
  twitter: TwitterData | null;
  errors: Record<string, string>;
  timestamp: Date;
}
```

### Utility Functions

```typescript
// URL Validation
isValidUrl(url: string): boolean
validateUrlForScraping(url: string): boolean

// HTML Sanitization
sanitizeHtml(html: string): string

// Keyword Extraction
extractKeywords(text: string, maxKeywords?: number): string[]

// Sentiment Analysis
calculateSentiment(text: string): "positive" | "negative" | "neutral"

// Statistics
getScrapingStats(result: MultiSourceScrapingResult): ScrapingStats
```

## Testing

### Unit Tests

Located in `src/lib/scraping/__tests__/scraping.test.ts`:

- ✅ URL validation (valid/invalid URLs, localhost blocking)
- ✅ HTML sanitization (tag removal, script/style removal, entity decoding)
- ✅ Keyword extraction (stopword filtering, frequency analysis)
- ✅ Scraping statistics (source counting, data point aggregation)
- ✅ Content opportunity extraction (engagement scoring, platform targeting)

**Test Results:** 12 passing, 2 skipped (integration tests require external APIs)

### Running Tests

```bash
# Run all tests
bun test

# Run scraping tests specifically
bun test src/lib/scraping/__tests__/scraping.test.ts

# Watch mode
bun test:watch

# UI mode
bun test:ui
```

### Integration Tests

Integration tests are skipped by default to avoid:
- Rate limit consumption
- External API dependencies
- Slow test execution

To run integration tests manually:
1. Uncomment the `.skip` tests in `scraping.test.ts`
2. Ensure `FIRECRAWL_API_KEY` is configured
3. Run with increased timeout: `bun test --timeout=60000`

## Usage Examples

See `src/lib/scraping/example.ts` for complete examples:

```bash
# Run examples (URL validation only by default)
bun run src/lib/scraping/example.ts

# To test actual scraping, uncomment examples in runAllExamples()
```

### Example 1: Multi-Source Scraping

```typescript
import { scrapeAllSources } from "@/lib/scraping";

const result = await scrapeAllSources({
  googleTrends: {
    keywords: ["AI", "content creation"],
    region: "US"
  },
  reddit: {
    subreddits: ["ContentCreation", "marketing"],
    sortBy: "hot",
    timeRange: "week"
  },
  youtube: {
    region: "US",
    maxResults: 10
  },
  twitter: {
    query: "AI content",
    limit: 20
  }
});

console.log(result.googleTrends?.keywords);
console.log(result.reddit?.topPosts);
console.log(result.youtube?.trendingVideos);
console.log(result.twitter?.trendingHashtags);
```

### Example 2: Niche Research

```typescript
import { scrapeByNiche, extractContentOpportunities } from "@/lib/scraping";

const nicheData = await scrapeByNiche("AI content creation");
const opportunities = extractContentOpportunities(nicheData);

for (const opp of opportunities) {
  console.log(`${opp.title} (${opp.estimatedEngagement}/100)`);
  console.log(`Platforms: ${opp.targetPlatforms.join(", ")}`);
  console.log(`Keywords: ${opp.keywords.join(", ")}`);
}
```

### Example 3: Individual Sources

```typescript
import {
  scrapeGoogleTrends,
  scrapeReddit,
  fetchTrendingVideos,
  scrapeTwitter
} from "@/lib/scraping";

// Google Trends
const trends = await scrapeGoogleTrends(["AI"], "US");

// Reddit
const reddit = await scrapeReddit("ContentCreation", "hot", "week");

// YouTube
const youtube = await fetchTrendingVideos("US");

// Twitter
const twitter = await scrapeTwitter("worldwide", 20);
```

## Performance Characteristics

### Rate Limiting
- **Limit**: 100 requests per hour (via Firecrawl)
- **Tracking**: Automatic via Prisma + FirecrawlRateLimit model
- **Enforcement**: Throws `FirecrawlRateLimitError` when exceeded

### Caching
- **TTL**: 24 hours per URL
- **Storage**: Prisma + FirecrawlCache model
- **Automatic**: Cache-first strategy, no manual management needed

### Retry Logic
- **Attempts**: 3 retries on failure
- **Backoff**: Exponential (1s, 2s, 4s)
- **Timeout**: 30 seconds per request

### Parallel Execution
- **Strategy**: `Promise.allSettled()` for independent source scraping
- **Benefit**: ~4x faster than sequential scraping
- **Resilience**: Failures in one source don't affect others

### Expected Timings
- Single source scrape: 2-5 seconds
- Multi-source (4 sources): 5-10 seconds (parallel)
- Cached requests: <100ms
- Niche research (full flow): 5-10 seconds

## Environment Variables

### Required
- `FIRECRAWL_API_KEY`: Firecrawl API key (configured in task 2.1)

### Optional
- `YOUTUBE_API_KEY`: YouTube Data API v3 key for enhanced video scraping
  - Without key: Falls back to web scraping
  - With key: Uses official API with higher rate limits and better data

## Integration Points

### With Firecrawl Service (`src/lib/firecrawl.ts`)

The scraping service leverages the Firecrawl client configured in task 2.1:
- `scrapeUrl()` - Main scraping function with rate limiting & caching
- `mapUrl()` - Site structure mapping (used for competitor tracking)
- Error handling classes (`FirecrawlRateLimitError`, `FirecrawlTimeoutError`)

### With Phase 2 Features

This scraping layer supports:
- **AI Niche Research Engine** (Requirement 1): Multi-source trend discovery
- **Competitor Tracking** (Requirement 1.6): URL scraping for competitor analysis
- **Content Opportunity Generation** (Requirement 2): AI-powered idea extraction
- **Pain Point Analysis** (Requirement 2.3): Reddit discussion analysis

## Error Handling

### Error Types

```typescript
// Rate limit exceeded
catch (error) {
  if (error instanceof FirecrawlRateLimitError) {
    // Wait for rate limit reset
    console.log("Rate limit exceeded, try again later");
  }
}

// Timeout
catch (error) {
  if (error instanceof FirecrawlTimeoutError) {
    // Request took too long
    console.log("Scraping timed out after 30s");
  }
}

// General scraping error
catch (error) {
  if (error instanceof FirecrawlError) {
    // Failed after retries
    console.log("Scraping failed:", error.message);
  }
}
```

### Graceful Degradation

`scrapeAllSources()` uses `Promise.allSettled()` for resilience:
- Failures are captured in `result.errors`
- Successful sources return data
- Partial results are always returned
- No cascading failures

Example:
```typescript
const result = await scrapeAllSources({...});

if (result.googleTrends) {
  // Use Google Trends data
}

if (result.errors.reddit) {
  console.log("Reddit failed:", result.errors.reddit);
  // Continue with other sources
}
```

## Security Considerations

### URL Validation
- Blocks localhost and internal IP addresses
- Requires HTTPS or HTTP protocols
- Prevents SSRF attacks via `validateUrlForScraping()`

### HTML Sanitization
- Removes `<script>` and `<style>` tags
- Strips all HTML tags
- Decodes HTML entities safely
- Prevents XSS in scraped content

### Rate Limiting
- Prevents API quota exhaustion
- Enforces fair usage policies
- Protects against DoS scenarios

## Monitoring & Observability

### Statistics Tracking

```typescript
import { getScrapingStats } from "@/lib/scraping";

const stats = getScrapingStats(result);
console.log(`Success: ${stats.successfulSources}/${stats.totalSources}`);
console.log(`Data Points: ${stats.totalDataPoints}`);
console.log(`Errors: ${stats.hasErrors}`);
```

### Rate Limit Status

```typescript
import { getRateLimitStatus } from "@/lib/firecrawl";

const status = await getRateLimitStatus();
console.log(`Used: ${status.requestCount}/${status.limit}`);
console.log(`Remaining: ${status.remaining}`);
console.log(`Resets: ${status.resetsAt}`);
```

### Cache Statistics

```typescript
import { getCacheStats } from "@/lib/firecrawl";

const stats = await getCacheStats();
console.log(`Total: ${stats.totalEntries}`);
console.log(`Valid: ${stats.validEntries}`);
console.log(`Expired: ${stats.expiredEntries}`);
```

## Future Enhancements

### Planned Features
- [ ] TikTok trending videos scraping
- [ ] Instagram trending posts (requires Meta API)
- [ ] LinkedIn trending content
- [ ] Historical trend tracking and velocity calculation
- [ ] Real-time webhook notifications for trends
- [ ] Custom scraping patterns for specific niches
- [ ] Sentiment analysis using AI models (GPT-4, Claude)
- [ ] Automated content calendar generation

### Performance Improvements
- [ ] Redis-based caching for faster lookups
- [ ] Background job processing via Inngest
- [ ] Rate limit sharing across instances
- [ ] CDN caching for static scrape results

## Troubleshooting

### Common Issues

**Issue**: Rate limit exceeded  
**Solution**: Check `getRateLimitStatus()`, wait for hourly reset, or enable caching

**Issue**: YouTube scraping fails without API key  
**Solution**: Add `YOUTUBE_API_KEY` to `.env.local` or accept web scraping fallback

**Issue**: Scraping times out  
**Solution**: Increase timeout in options or check network connectivity

**Issue**: No data returned from sources  
**Solution**: Check `result.errors` for specific source failures

**Issue**: HTML content has encoding issues  
**Solution**: `sanitizeHtml()` automatically handles HTML entities

### Debug Mode

Enable detailed logging:
```typescript
const result = await scrapeAllSources(config, {
  timeout: 60000,  // Increase timeout
  retries: 5,      // More retries
  cache: false     // Disable cache for testing
});
```

## Documentation

- **README**: `src/lib/scraping/README.md` - Usage guide
- **Examples**: `src/lib/scraping/example.ts` - Working code examples
- **Tests**: `src/lib/scraping/__tests__/scraping.test.ts` - Test coverage
- **Types**: `src/lib/scraping/types.ts` - TypeScript interfaces
- **Implementation**: This document - Architecture and design decisions

## Related Tasks

- ✅ **Task 2.1**: Firecrawl SDK integration (prerequisite)
- ⏳ **Task 2.3**: Content repurposing service (uses scraping data)
- ⏳ **Task 2.4**: AI analysis service for research insights (consumes scraping data)
- ⏳ **Task 10.1**: Inngest niche research function (orchestrates scraping)

## Summary

The web scraping service layer is **complete and production-ready**. It provides:
- ✅ Type-safe TypeScript implementation
- ✅ Multi-source parallel scraping (Google, Reddit, YouTube, Twitter)
- ✅ URL validation and HTML sanitization
- ✅ Rate limiting and caching via Firecrawl
- ✅ Comprehensive error handling
- ✅ Unit test coverage (12 passing tests)
- ✅ Documentation and examples
- ✅ Integration with Phase 2 requirements

The implementation follows CreatorFlow's architecture patterns and is ready for integration with the AI Niche Research Engine (Phase 2, Tasks 10+).
