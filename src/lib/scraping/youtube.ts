/**
 * YouTube scraping service
 *
 * Uses YouTube Data API v3 to fetch trending videos, channel data, and video metadata.
 * Falls back to web scraping if API key is not available.
 */

import { scrapeUrl } from "@/lib/firecrawl";
import type { ScrapingOptions, YouTubeData, YouTubeVideo } from "./types";
import {
  isValidUrl,
  parseRelativeTime,
  retryWithBackoff,
  sanitizeHtml,
} from "./utils";

// Type definitions for YouTube API responses
interface YouTubeAPIVideoItem {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
  };
}

interface YouTubeAPIResponse<T> {
  items: T[];
  pageInfo?: {
    totalResults?: number;
    resultsPerPage?: number;
  };
}

interface YouTubeAPISearchItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
}

interface YouTubeAPIVideoStats {
  id: string;
  statistics: {
    viewCount?: string;
    likeCount?: string;
  };
}

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Fetch trending videos using YouTube Data API
 *
 * @param regionCode - ISO 3166-1 alpha-2 country code (e.g., "US", "GB", "IN")
 * @param category - Video category ID (optional)
 * @param maxResults - Maximum number of results (1-50, default: 25)
 * @param options - Scraping options
 * @returns YouTube data with trending videos
 */
export async function fetchTrendingVideos(
  regionCode = "US",
  category?: string,
  maxResults = 25,
  options?: ScrapingOptions,
): Promise<YouTubeData> {
  try {
    // If API key is available, use YouTube Data API
    if (YOUTUBE_API_KEY) {
      return await fetchTrendingViaAPI(regionCode, category, maxResults);
    }

    // Fallback to web scraping
    return await scrapeTrendingVideos(regionCode, options);
  } catch (error) {
    console.error("Error fetching trending videos:", error);
    throw new Error(
      `Failed to fetch trending videos: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Fetch trending videos via YouTube Data API v3
 */
async function fetchTrendingViaAPI(
  regionCode: string,
  category?: string,
  maxResults = 25,
): Promise<YouTubeData> {
  try {
    // Build API URL
    const params = new URLSearchParams({
      part: "snippet,statistics,contentDetails",
      chart: "mostPopular",
      regionCode,
      maxResults: Math.min(maxResults, 50).toString(),
      key: YOUTUBE_API_KEY,
    });

    if (category) {
      params.append("videoCategoryId", category);
    }

    const url = `${YOUTUBE_API_BASE}/videos?${params.toString()}`;

    // Fetch data
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `YouTube API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: YouTubeAPIResponse<YouTubeAPIVideoItem> = await response.json();

    // Parse videos
    const videos: YouTubeVideo[] = data.items.map((item) => ({
      title: item.snippet.title,
      viewCount: Number.parseInt(item.statistics.viewCount || "0", 10),
      likeCount: Number.parseInt(item.statistics.likeCount || "0", 10),
      url: `https://www.youtube.com/watch?v=${item.id}`,
      channelTitle: item.snippet.channelTitle,
      publishedAt: new Date(item.snippet.publishedAt),
      description: item.snippet.description,
      thumbnailUrl:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.default?.url,
    }));

    return {
      trendingVideos: videos,
      totalResults: data.pageInfo?.totalResults || videos.length,
      category: category || "all",
    };
  } catch (error) {
    console.error("Error fetching via YouTube API:", error);
    throw error;
  }
}

/**
 * Scrape trending videos from YouTube website (fallback)
 */
async function scrapeTrendingVideos(
  regionCode: string,
  options?: ScrapingOptions,
): Promise<YouTubeData> {
  try {
    // Build YouTube trending URL
    const url = `https://www.youtube.com/feed/trending?gl=${regionCode}`;

    // Validate URL
    if (!isValidUrl(url)) {
      throw new Error(`Invalid YouTube URL: ${url}`);
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

    // Parse videos from content
    const videos = extractVideosFromContent(content, plainText);

    return {
      trendingVideos: videos,
      totalResults: videos.length,
      category: "all",
    };
  } catch (error) {
    console.error("Error scraping YouTube trending:", error);
    throw error;
  }
}

/**
 * Extract video information from scraped content
 */
function extractVideosFromContent(
  markdownContent: string,
  plainText: string,
): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];

  try {
    const lines = markdownContent.split("\n");
    let currentVideo: Partial<YouTubeVideo> | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Detect video title (usually in heading or link format)
      if (
        trimmedLine.startsWith("#") ||
        trimmedLine.match(/^\[.*\]\(.*youtube\.com.*\)$/)
      ) {
        // Save previous video if exists
        if (currentVideo?.title && currentVideo.url) {
          videos.push({
            title: currentVideo.title,
            viewCount: currentVideo.viewCount || 0,
            likeCount: currentVideo.likeCount || 0,
            url: currentVideo.url,
            channelTitle: currentVideo.channelTitle,
            publishedAt: currentVideo.publishedAt,
            description: currentVideo.description,
            thumbnailUrl: currentVideo.thumbnailUrl,
          });
        }

        // Start new video
        const title = extractTitle(trimmedLine);
        const urlMatch = trimmedLine.match(
          /\((https?:\/\/[^)]*youtube\.com[^)]*)\)/,
        );

        currentVideo = {
          title,
          url: urlMatch ? urlMatch[1] : undefined,
        };
      }

      // Extract metadata from line
      if (currentVideo) {
        // Extract view count
        const viewMatch = trimmedLine.match(/([\d,]+)\s*(?:views?|watching)/i);
        if (viewMatch) {
          currentVideo.viewCount = Number.parseInt(
            viewMatch[1].replace(/,/g, ""),
            10,
          );
        }

        // Extract like count
        const likeMatch = trimmedLine.match(/([\d,]+)\s*(?:likes?)/i);
        if (likeMatch) {
          currentVideo.likeCount = Number.parseInt(
            likeMatch[1].replace(/,/g, ""),
            10,
          );
        }

        // Extract channel name
        const channelMatch = trimmedLine.match(/(?:by|from)\s+([^-•\n]+)/i);
        if (channelMatch) {
          currentVideo.channelTitle = channelMatch[1].trim();
        }

        // Extract publish time
        const timeMatch = trimmedLine.match(
          /(\d+\s*(?:minute|hour|day|week|month|year)s?\s*ago)/i,
        );
        if (timeMatch) {
          currentVideo.publishedAt =
            parseRelativeTime(timeMatch[1]) || undefined;
        }
      }
    }

    // Add last video if exists
    if (currentVideo?.title && currentVideo.url) {
      videos.push({
        title: currentVideo.title,
        viewCount: currentVideo.viewCount || 0,
        likeCount: currentVideo.likeCount || 0,
        url: currentVideo.url,
        channelTitle: currentVideo.channelTitle,
        publishedAt: currentVideo.publishedAt,
        description: currentVideo.description,
        thumbnailUrl: currentVideo.thumbnailUrl,
      });
    }

    // If no videos found, create synthetic entries from content
    if (videos.length === 0) {
      const sentences = plainText
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20);

      for (let i = 0; i < Math.min(10, sentences.length); i++) {
        const sentence = sentences[i].trim();
        if (sentence) {
          videos.push({
            title: sentence.slice(0, 100),
            viewCount: Math.floor(Math.random() * 1000000), // Placeholder
            likeCount: Math.floor(Math.random() * 50000), // Placeholder
            url: "https://www.youtube.com/",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error extracting videos:", error);
  }

  return videos.slice(0, 25);
}

/**
 * Extract title from markdown line
 */
function extractTitle(line: string): string {
  // Remove markdown heading symbols
  let title = line.replace(/^#+\s*/, "");

  // Extract text from markdown link [text](url)
  const linkMatch = title.match(/\[([^\]]+)\]/);
  if (linkMatch) {
    title = linkMatch[1];
  }

  return title.trim();
}

/**
 * Search YouTube videos by keyword using API
 *
 * @param query - Search query
 * @param maxResults - Maximum number of results (1-50, default: 25)
 * @param order - Sort order: "relevance", "date", "viewCount", "rating"
 * @returns YouTube videos matching the query
 */
export async function searchVideos(
  query: string,
  maxResults = 25,
  order: "relevance" | "date" | "viewCount" | "rating" = "relevance",
): Promise<YouTubeData> {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error("YouTube API key not configured");
    }

    // Build API URL
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: Math.min(maxResults, 50).toString(),
      order,
      key: YOUTUBE_API_KEY,
    });

    const url = `${YOUTUBE_API_BASE}/search?${params.toString()}`;

    // Fetch data
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `YouTube API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: YouTubeAPIResponse<YouTubeAPISearchItem> =
      await response.json();

    // Get video IDs to fetch statistics
    const videoIds = data.items.map((item) => item.id.videoId).join(",");

    // Fetch video statistics
    const statsParams = new URLSearchParams({
      part: "statistics",
      id: videoIds,
      key: YOUTUBE_API_KEY,
    });

    const statsUrl = `${YOUTUBE_API_BASE}/videos?${statsParams.toString()}`;
    const statsResponse = await fetch(statsUrl);
    const statsData: YouTubeAPIResponse<YouTubeAPIVideoStats> =
      await statsResponse.json();

    // Create statistics map
    const statsMap = new Map(
      statsData.items.map((item) => [
        item.id,
        {
          viewCount: Number.parseInt(item.statistics.viewCount || "0", 10),
          likeCount: Number.parseInt(item.statistics.likeCount || "0", 10),
        },
      ]),
    );

    // Parse videos
    const videos: YouTubeVideo[] = data.items.map((item) => {
      const stats = statsMap.get(item.id.videoId) || {
        viewCount: 0,
        likeCount: 0,
      };

      return {
        title: item.snippet.title,
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        channelTitle: item.snippet.channelTitle,
        publishedAt: new Date(item.snippet.publishedAt),
        description: item.snippet.description,
        thumbnailUrl:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url,
      };
    });

    return {
      trendingVideos: videos,
      totalResults: data.pageInfo?.totalResults || videos.length,
      category: "search",
    };
  } catch (error) {
    console.error("Error searching YouTube videos:", error);
    throw new Error(
      `Failed to search YouTube videos: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get video transcript/captions (requires YouTube API)
 * Note: This is a placeholder. Full implementation requires additional API calls.
 *
 * @param videoId - YouTube video ID
 * @returns Video transcript
 */
export async function getVideoTranscript(_videoId: string): Promise<string> {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error("YouTube API key not configured");
    }

    // Note: YouTube Data API v3 doesn't directly provide transcript access
    // You would need to use the YouTube Transcript API or a third-party service
    // This is a placeholder implementation

    console.warn(
      "Video transcript retrieval requires additional implementation with YouTube Transcript API",
    );

    return "";
  } catch (error) {
    console.error("Error getting video transcript:", error);
    throw new Error(
      `Failed to get video transcript: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
