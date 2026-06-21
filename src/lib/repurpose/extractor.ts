/**
 * Phase 2: Content Extraction Service
 *
 * Extracts content from various sources: YouTube videos, blog posts, podcasts, and plain text.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.9, 6.10, 6.11
 */

import { scrapeUrl } from "@/lib/firecrawl";
import { getVideoTranscript } from "@/lib/scraping/youtube";
import type { SourceContent } from "@/types/repurpose";

// Maximum content length before summarization
const MAX_CONTENT_LENGTH = 50000;

export interface ExtractedContent {
  text: string;
  title?: string;
  author?: string;
  publishedDate?: string;
  duration?: string;
  sourceUrl?: string;
  requiresSummarization: boolean;
}

/**
 * Extract content based on source type
 *
 * @param source - Source content with type and content URL/text
 * @returns Extracted content with metadata
 */
export async function extractContent(
  source: SourceContent,
): Promise<ExtractedContent> {
  switch (source.type) {
    case "youtube_url":
      return extractYouTubeContent(source.content, source.metadata);
    case "blog_url":
      return extractBlogContent(source.content, source.metadata);
    case "podcast_url":
      return extractPodcastContent(source.content, source.metadata);
    case "text":
      return extractPlainText(source.content, source.metadata);
    default:
      throw new Error(`Unsupported source type: ${source.type}`);
  }
}

/**
 * Extract content from YouTube video URL
 * Uses YouTube Data API to get video transcript
 *
 * Requirement 6.4: Extract video transcript using YouTube API
 */
async function extractYouTubeContent(
  url: string,
  metadata?: SourceContent["metadata"],
): Promise<ExtractedContent> {
  try {
    // Validate URL
    if (!isValidYouTubeUrl(url)) {
      throw new Error(`Invalid YouTube URL: ${url}`);
    }

    // Extract video ID from URL
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error(`Could not extract video ID from URL: ${url}`);
    }

    // Get video transcript
    let transcript: string;
    try {
      transcript = await getVideoTranscript(videoId);
    } catch (error) {
      // Fallback: scrape video page for description and title
      console.warn(
        `Failed to get transcript for ${videoId}, falling back to page scraping:`,
        error,
      );
      const scraped = await scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: true,
      });

      transcript = scraped.content || scraped.markdown || "";

      if (!transcript) {
        throw new Error(`No transcript or content available for video: ${url}`);
      }
    }

    // Check if summarization is needed
    const requiresSummarization = transcript.length > MAX_CONTENT_LENGTH;

    return {
      text: transcript,
      title: metadata?.title,
      author: metadata?.author,
      publishedDate: metadata?.publishedDate,
      duration: metadata?.duration,
      sourceUrl: url,
      requiresSummarization,
    };
  } catch (error) {
    throw new Error(
      `Failed to extract YouTube content: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Extract content from blog post URL
 * Uses Firecrawl service for web scraping
 *
 * Requirement 6.5: Extract article content using Firecrawl_Service
 */
async function extractBlogContent(
  url: string,
  metadata?: SourceContent["metadata"],
): Promise<ExtractedContent> {
  try {
    // Validate URL (Requirement 6.10)
    if (!isValidUrl(url)) {
      throw new Error(`Invalid blog URL: ${url}`);
    }

    // Scrape blog post using Firecrawl
    const result = await scrapeUrl(url, {
      formats: ["markdown"],
      onlyMainContent: true,
    });

    const text = result.content || result.markdown || "";

    if (!text) {
      throw new Error(`No content extracted from blog URL: ${url}`);
    }

    // Use scraped metadata if not provided
    const title = metadata?.title || result.metadata?.title;
    const author = metadata?.author || result.metadata?.author;
    const publishedDate = metadata?.publishedDate;

    // Check if summarization is needed
    const requiresSummarization = text.length > MAX_CONTENT_LENGTH;

    // Preserve attribution (Requirement 6.11)
    return {
      text,
      title,
      author,
      publishedDate,
      sourceUrl: url,
      requiresSummarization,
    };
  } catch (error) {
    throw new Error(
      `Failed to extract blog content: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Extract content from podcast episode URL or audio transcript
 *
 * Requirement 6.3: Accept podcast episode URLs or audio transcripts
 */
async function extractPodcastContent(
  url: string,
  metadata?: SourceContent["metadata"],
): Promise<ExtractedContent> {
  try {
    // If URL contains transcript text in metadata, use it directly
    if (metadata?.title && url.startsWith("http")) {
      // Try to scrape podcast page for show notes/transcript
      const result = await scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: true,
      });

      const text = result.content || result.markdown || "";

      if (!text) {
        throw new Error(`No transcript found at podcast URL: ${url}`);
      }

      const requiresSummarization = text.length > MAX_CONTENT_LENGTH;

      return {
        text,
        title: metadata.title,
        author: metadata.author,
        publishedDate: metadata.publishedDate,
        duration: metadata.duration,
        sourceUrl: url,
        requiresSummarization,
      };
    }

    // Otherwise treat as transcript text
    return extractPlainText(url, metadata);
  } catch (error) {
    throw new Error(
      `Failed to extract podcast content: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Extract content from plain text
 *
 * Requirement 6.2: Accept plain text as input
 */
async function extractPlainText(
  text: string,
  metadata?: SourceContent["metadata"],
): Promise<ExtractedContent> {
  if (!text || text.trim().length === 0) {
    throw new Error("Plain text content cannot be empty");
  }

  const requiresSummarization = text.length > MAX_CONTENT_LENGTH;

  return {
    text: text.trim(),
    title: metadata?.title,
    author: metadata?.author,
    publishedDate: metadata?.publishedDate,
    duration: metadata?.duration,
    requiresSummarization,
  };
}

/**
 * Validate if URL is valid (Requirement 6.10)
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate if URL is a valid YouTube URL
 */
function isValidYouTubeUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "youtu.be" ||
      parsed.hostname === "m.youtube.com"
    );
  } catch {
    return false;
  }
}

/**
 * Extract video ID from YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);

    // youtube.com/watch?v=VIDEO_ID
    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.pathname === "/watch"
    ) {
      return parsed.searchParams.get("v");
    }

    // youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1); // Remove leading slash
    }

    // youtube.com/embed/VIDEO_ID
    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.pathname.startsWith("/embed/")
    ) {
      return parsed.pathname.split("/")[2];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Summarize content if it exceeds maximum length (Requirement 6.9)
 * This will be called by the orchestrator using AI models
 */
export function shouldSummarize(content: ExtractedContent): boolean {
  return content.requiresSummarization;
}
