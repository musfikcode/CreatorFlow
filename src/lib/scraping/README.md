# Web Scraping Service Layer

Multi-source web scraping service for CreatorFlow Phase 2 hackathon features. Provides integrated scraping capabilities for Google Trends, Reddit, YouTube, and Twitter.

## Features

- **Multi-source scraping**: Parallel data collection from Google Trends, Reddit, YouTube, and Twitter
- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Firecrawl integration**: Leverages existing Firecrawl service with rate limiting and caching
- **URL validation**: Validates URLs before scraping to prevent errors
- **HTML sanitization**: Extracts plain text from HTML content
- **Error handling**: Graceful error handling with detailed error messages
- **Content opportunities**: Automatically identifies trending content opportunities

## Modules

### Core Modules

- **`types.ts`**: TypeScript type definitions for all scraping data structures
- **`utils.ts`**: Shared utility functions (URL validation, HTML sanitization, etc.)
- **`google-trends.ts`**: Google Trends scraping with trend scores and related queries
- **`reddit.ts`**: Reddit scraping for top posts, pain points, and discussion sentiment
- **`youtube.ts`**: YouTube Data API integration for trending videos
- **`twitter.ts`**: Twitter/X scraping for trending hashtags and viral threads
- **`index.ts`**: Main orchestration module with parallel scraping functions

## Usage

### Basic Multi-Source Scraping

```typescript
import { scrapeAllSources } from "@/lib/scraping";

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
    region: "worldwide",
    limit: 20,
  },
});

console.log("Google Trends:", result.googleTrends?.keywords);
console.log("Reddit Posts:", result.reddit?.topPosts);
console.log("YouTube Videos:", result.youtube?.trendingVideos);
console.log("Twitter Hashtags:", result.twitter?.trendingHashtags);
console.log("Errors:", result.errors);
```

### Niche-Specific Scraping

Automatically configures all sources for a specific niche:

```typescript
import { scrapeByNiche } from "@/lib/scraping";

const nicheData = await scrapeByNiche("AI content creation");

// Returns data from all sources related to the niche
console.log(nicheData.googleTrends?.keywords);
console.log(nicheData.reddit?.topPosts);
```

### Extract Content Opportunities

Analyze scraped data to identify content opportunities:

```typescript
import { scrapeAllSources, extractContentOpportunities } from "@/lib/scraping";

const scrapedData = await scrapeAllSources({
  googleTrends: { keywords: ["AI"], region: "US" },
  reddit: { subreddits: ["artificial"] },
  youtube: { region: "US" },
  twitter: { query: "AI" },
});

const opportunities = extractContentOpportunities(scrapedData);

for (const opp of opportunities) {
  console.log(`Title: ${opp.title}`);
  console.log(`Platforms: ${opp.targetPlatforms.join(", ")}`);
  console.log(`Engagement Score: ${opp.estimatedEngagement}/100`);
  console.log(`Keywords: ${opp.keywords.join(", ")}`);
}
```

### Individual Source Usage

#### Google Trends

```typescript
import { scrapeGoogleTrends, getTrendingByCategory } from "@/lib/scraping";

// General trending topics
const trends = await scrapeGoogleTrends(["AI", "machine learning"], "US");
console.log(trends.keywords);
console.log(trends.trendScore); // 0-100
console.log(trends.relatedQueries);

// Category-specific trends
const techTrends = await getTrendingByCategory("technology", "US");
```

#### Reddit

```typescript
import { scrapeReddit, extractPainPoints } from "@/lib/scraping";

// Scrape subreddit
const redditData = await scrapeReddit("ContentCreation", "hot", "week", 25);
console.log(redditData.topPosts);
console.log(redditData.discussionSentiment); // "positive", "negative", or "neutral"

// Extract pain points and questions
const painPoints = await extractPainPoints("ContentCreation");
console.log(painPoints.painPoints);
console.log(painPoints.questions);
```

#### YouTube

```typescript
import { fetchTrendingVideos, searchVideos } from "@/lib/scraping";

// Trending videos
const trending = await fetchTrendingVideos("US", undefined, 25);
console.log(trending.trendingVideos);

// Search videos
const searchResults = await searchVideos("AI content creation", 10, "viewCount");
console.log(searchResults.trendingVideos);
```

#### Twitter

```typescript
import {
  scrapeTwitter,
  searchTwitter,
  analyzeTwitterSentiment,
} from "@/lib/scraping";

// Trending hashtags and threads
const twitterData = await scrapeTwitter("worldwide", 20);
console.log(twitterData.trendingHashtags);
console.log(twitterData.viralThreads);

// Search Twitter
const searchResults = await searchTwitter("#AIContent", 20);

// Sentiment analysis
const sentiment = await analyzeTwitterSentiment("AI content creation");
console.log(sentiment.sentiment); // "positive", "negative", or "neutral"
console.log(sentiment.positiveCount, sentiment.negativeCount);
```

## Data Structures

### GoogleTrendsData

```typescript
{
  keywords: string[];
  trendScore: number; // 0-100
  relatedQueries: string[];
  region?: string;
  timeframe?: string;
}
```

### RedditData

```typescript
{
  topPosts: RedditPost[];
  discussionSentiment: string; // "positive", "negative", "neutral"
  totalPosts?: number;
  subreddit?: string;
}
```

### YouTubeData

```typescript
{
  trendingVideos: YouTubeVideo[];
  totalResults?: number;
  category?: string;
}
```

### TwitterData

```typescript
{
  trendingHashtags: string[];
  viralThreads: TwitterThread[];
  totalThreads?: number;
}
```

## Error Handling

All functions handle errors gracefully and provide detailed error messages:

```typescript
try {
  const result = await scrapeAllSources({
    googleTrends: { keywords: ["AI"] },
  });

  // Check for errors
  if (Object.keys(result.errors).length > 0) {
    console.error("Scraping errors:", result.errors);
  }
} catch (error) {
  console.error("Fatal error:", error);
}
```

## Utility Functions

### URL Validation

```typescript
import { isValidUrl, validateUrlForScraping } from "@/lib/scraping";

if (isValidUrl("https://example.com")) {
  // Valid URL
}

if (validateUrlForScraping("https://example.com")) {
  // Safe to scrape
}
```

### HTML Sanitization

```typescript
import { sanitizeHtml } from "@/lib/scraping";

const plainText = sanitizeHtml("<p>Hello <b>world</b>!</p>");
// Returns: "Hello world!"
```

### Keyword Extraction

```typescript
import { extractKeywords } from "@/lib/scraping";

const keywords = extractKeywords(
  "AI and machine learning are transforming content creation",
  10
);
// Returns: ["machine", "learning", "transforming", "content", "creation", ...]
```

## Environment Variables

### Required

None required for basic functionality.

### Optional

- `YOUTUBE_API_KEY`: YouTube Data API v3 key for accessing YouTube trending videos (falls back to web scraping)
- `FIRECRAWL_API_KEY`: Already configured from task 2.1

## Rate Limiting

The scraping service respects rate limits through Firecrawl integration:

- **Rate limit**: 100 requests per hour
- **Cache TTL**: 24 hours
- **Retry logic**: 3 retries with exponential backoff (1s, 2s, 4s)
- **Timeout**: 30 seconds per request

## Best Practices

1. **Use parallel scraping**: `scrapeAllSources()` executes all scrapes in parallel for optimal performance
2. **Enable caching**: Reuse cached results within 24 hours to avoid rate limits
3. **Handle errors gracefully**: Check the `errors` object in multi-source results
4. **Validate URLs**: Always validate URLs before scraping custom sources
5. **Respect rate limits**: Monitor rate limit status if scraping frequently

## Integration with Phase 2 Features

This scraping service layer supports the following Phase 2 requirements:

- **1.2**: Multi-source data collection (Google Trends, Reddit, YouTube, Twitter)
- **1.3**: Firecrawl integration for web scraping
- **1.4**: Reddit subreddit data extraction
- **1.5**: YouTube trending video data
- **1.6**: Twitter trending hashtag analysis
- **1.8**: URL validation and HTML sanitization
- **18.7**: Pain point extraction from Reddit discussions
- **18.8**: Content opportunity generation from scraped data

## Testing

Example test usage:

```typescript
import { scrapeByNiche, getScrapingStats } from "@/lib/scraping";

async function testScraping() {
  const result = await scrapeByNiche("AI content creation", {
    timeout: 30000,
    retries: 3,
    cache: true,
  });

  const stats = getScrapingStats(result);
  console.log(`Successful sources: ${stats.successfulSources}/${stats.totalSources}`);
  console.log(`Total data points: ${stats.totalDataPoints}`);
  console.log(`Has errors: ${stats.hasErrors}`);
}
```

## Troubleshooting

### YouTube API Issues

If YouTube scraping fails, ensure:
1. `YOUTUBE_API_KEY` is set in environment variables
2. YouTube Data API v3 is enabled in Google Cloud Console
3. API quota is not exceeded (fallback to web scraping will be used)

### Rate Limit Errors

If you encounter rate limit errors:
1. Check current rate limit: Use Firecrawl's `getRateLimitStatus()`
2. Wait for the current hour to expire
3. Enable caching to reduce API calls
4. Reduce scraping frequency

### Scraping Failures

If scraping fails:
1. Verify the URL is valid and accessible
2. Check if the website has anti-scraping measures
3. Review error messages in `result.errors`
4. Try increasing retry count in options

## Future Enhancements

- Add more data sources (TikTok, Instagram, LinkedIn)
- Implement historical trend tracking
- Add sentiment analysis using AI models
- Support custom scraping patterns
- Add webhook notifications for real-time alerts
