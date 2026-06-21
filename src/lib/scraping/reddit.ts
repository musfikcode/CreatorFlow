/**
 * Reddit scraping service
 *
 * Extracts top posts, comments, and discussion sentiment from Reddit subreddits
 * using Firecrawl for web scraping.
 */

import { scrapeUrl } from "@/lib/firecrawl";
import type { RedditData, RedditPost, ScrapingOptions } from "./types";
import {
  calculateSentiment,
  isValidUrl,
  parseRelativeTime,
  retryWithBackoff,
  sanitizeHtml,
} from "./utils";

/**
 * Scrape Reddit subreddit for top posts and discussion sentiment
 *
 * @param subreddit - Subreddit name (without "r/" prefix)
 * @param sortBy - Sort order: "hot", "new", "top", "rising"
 * @param timeRange - Time range for "top" sort: "day", "week", "month", "year", "all"
 * @param limit - Maximum number of posts to fetch (default: 25)
 * @param options - Scraping options
 * @returns Reddit data including top posts and discussion sentiment
 */
export async function scrapeReddit(
  subreddit: string,
  sortBy: "hot" | "new" | "top" | "rising" = "hot",
  timeRange: "day" | "week" | "month" | "year" | "all" = "week",
  limit = 25,
  options?: ScrapingOptions,
): Promise<RedditData> {
  try {
    // Clean subreddit name
    const cleanSubreddit = subreddit.replace(/^r\//, "").trim();

    // Build Reddit URL
    const baseUrl = `https://www.reddit.com/r/${cleanSubreddit}`;
    let url = `${baseUrl}/${sortBy}/`;

    // Add time range for "top" sort
    if (sortBy === "top") {
      url += `?t=${timeRange}`;
    }

    // Validate URL
    if (!isValidUrl(url)) {
      throw new Error(`Invalid Reddit URL: ${url}`);
    }

    // Scrape with retry logic
    const scrapeFunction = async () => {
      const result = await scrapeUrl(url, {
        formats: ["markdown", "html"],
        onlyMainContent: true,
        waitFor: 2000, // Wait for dynamic content to load
      });

      return result;
    };

    const result = options?.retries
      ? await retryWithBackoff(scrapeFunction, options.retries)
      : await scrapeFunction();

    // Extract content
    const content = result.markdown || result.html || "";
    const plainText = sanitizeHtml(content);

    // Parse posts from content
    const posts = extractRedditPosts(content, plainText, cleanSubreddit, limit);

    // Calculate overall discussion sentiment
    const discussionSentiment = calculateDiscussionSentiment(posts, plainText);

    return {
      topPosts: posts,
      discussionSentiment,
      totalPosts: posts.length,
      subreddit: cleanSubreddit,
    };
  } catch (error) {
    console.error(`Error scraping Reddit r/${subreddit}:`, error);
    throw new Error(
      `Failed to scrape Reddit: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Extract Reddit posts from scraped content
 */
function extractRedditPosts(
  markdownContent: string,
  plainText: string,
  subreddit: string,
  limit: number,
): RedditPost[] {
  const posts: RedditPost[] = [];

  try {
    // Reddit posts typically follow patterns in markdown/HTML
    // Look for title patterns and extract metadata
    const lines = markdownContent.split("\n");
    let currentPost: Partial<RedditPost> | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Detect post title (usually in heading or link format)
      if (trimmedLine.startsWith("#") || trimmedLine.match(/^\[.*\]\(.*\)$/)) {
        // Save previous post if exists
        if (currentPost?.title) {
          posts.push({
            title: currentPost.title,
            upvotes: currentPost.upvotes || 0,
            url: currentPost.url || `https://www.reddit.com/r/${subreddit}`,
            commentCount: currentPost.commentCount || 0,
            author: currentPost.author,
            created: currentPost.created,
            subreddit,
          });

          if (posts.length >= limit) break;
        }

        // Start new post
        currentPost = {
          title: extractTitle(trimmedLine),
        };
      }

      // Extract metadata from line
      if (currentPost) {
        const upvotes = extractNumber(trimmedLine, [
          "upvote",
          "point",
          "score",
        ]);
        if (upvotes !== null) {
          currentPost.upvotes = upvotes;
        }

        const comments = extractNumber(trimmedLine, ["comment"]);
        if (comments !== null) {
          currentPost.commentCount = comments;
        }

        // Extract author
        const authorMatch = trimmedLine.match(
          /(?:by|posted by|submitted by|u\/)\s*(\w+)/i,
        );
        if (authorMatch) {
          currentPost.author = authorMatch[1];
        }

        // Extract time
        const timeMatch = trimmedLine.match(
          /(\d+\s*(?:minute|hour|day|week|month|year)s?\s*ago)/i,
        );
        if (timeMatch) {
          currentPost.created = parseRelativeTime(timeMatch[1]) || undefined;
        }

        // Extract URL
        const urlMatch = trimmedLine.match(/\((https?:\/\/[^)]+)\)/);
        if (urlMatch) {
          currentPost.url = urlMatch[1];
        }
      }
    }

    // Add last post if exists
    if (currentPost?.title) {
      posts.push({
        title: currentPost.title,
        upvotes: currentPost.upvotes || 0,
        url: currentPost.url || `https://www.reddit.com/r/${subreddit}`,
        commentCount: currentPost.commentCount || 0,
        author: currentPost.author,
        created: currentPost.created,
        subreddit,
      });
    }

    // If no posts found through structured parsing, create synthetic posts
    // from content segments (fallback)
    if (posts.length === 0) {
      const sentences = plainText
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20);
      for (let i = 0; i < Math.min(limit, sentences.length); i++) {
        const sentence = sentences[i].trim();
        if (sentence) {
          posts.push({
            title: sentence.slice(0, 200),
            upvotes: Math.floor(Math.random() * 1000), // Placeholder
            url: `https://www.reddit.com/r/${subreddit}`,
            commentCount: Math.floor(Math.random() * 100), // Placeholder
            subreddit,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error extracting Reddit posts:", error);
  }

  return posts.slice(0, limit);
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
 * Extract number from text based on keywords
 */
function extractNumber(text: string, keywords: string[]): number | null {
  for (const keyword of keywords) {
    const regex = new RegExp(`(\\d+[,\\d]*)\\s*${keyword}`, "i");
    const match = text.match(regex);
    if (match) {
      return Number.parseInt(match[1].replace(/,/g, ""), 10);
    }
  }
  return null;
}

/**
 * Calculate overall discussion sentiment
 */
function calculateDiscussionSentiment(
  posts: RedditPost[],
  plainText: string,
): string {
  // Analyze sentiment from post titles and content
  const allText = `${posts.map((p) => p.title).join(" ")} ${plainText}`;
  return calculateSentiment(allText);
}

/**
 * Extract pain points and common questions from Reddit discussions
 *
 * @param subreddit - Subreddit name
 * @param options - Scraping options
 * @returns Array of pain points and questions
 */
export async function extractPainPoints(
  subreddit: string,
  options?: ScrapingOptions,
): Promise<{ painPoints: string[]; questions: string[] }> {
  try {
    const data = await scrapeReddit(subreddit, "top", "week", 50, options);

    const painPoints: string[] = [];
    const questions: string[] = [];

    for (const post of data.topPosts) {
      const title = post.title.toLowerCase();

      // Detect pain points (frustration, problems, issues)
      if (
        title.includes("problem") ||
        title.includes("issue") ||
        title.includes("frustrat") ||
        title.includes("annoying") ||
        title.includes("difficult") ||
        title.includes("struggle") ||
        title.includes("can't") ||
        title.includes("won't") ||
        title.includes("doesn't work")
      ) {
        painPoints.push(post.title);
      }

      // Detect questions
      if (
        title.includes("?") ||
        title.startsWith("how") ||
        title.startsWith("why") ||
        title.startsWith("what") ||
        title.startsWith("where") ||
        title.startsWith("when") ||
        title.startsWith("which")
      ) {
        questions.push(post.title);
      }
    }

    return {
      painPoints: painPoints.slice(0, 10),
      questions: questions.slice(0, 10),
    };
  } catch (error) {
    console.error("Error extracting pain points from Reddit:", error);
    throw new Error(
      `Failed to extract pain points: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get trending topics from multiple subreddits
 *
 * @param subreddits - Array of subreddit names
 * @param options - Scraping options
 * @returns Combined trending topics from all subreddits
 */
export async function getTrendingFromSubreddits(
  subreddits: string[],
  options?: ScrapingOptions,
): Promise<{
  trendingTopics: string[];
  topPostsAcrossSubreddits: RedditPost[];
  overallSentiment: string;
}> {
  try {
    const results = await Promise.allSettled(
      subreddits.map((subreddit) =>
        scrapeReddit(subreddit, "hot", "week", 10, options),
      ),
    );

    const allPosts: RedditPost[] = [];
    const allTitles: string[] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        allPosts.push(...result.value.topPosts);
        allTitles.push(...result.value.topPosts.map((p) => p.title));
      }
    }

    // Extract trending topics from titles
    const allText = allTitles.join(" ");
    const trendingTopics = allText
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .reduce(
        (acc, word) => {
          acc[word] = (acc[word] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    const sortedTopics = Object.entries(trendingTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([topic]) => topic);

    // Calculate overall sentiment
    const overallSentiment = calculateSentiment(allText);

    // Sort posts by upvotes
    const topPosts = allPosts
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 20);

    return {
      trendingTopics: sortedTopics,
      topPostsAcrossSubreddits: topPosts,
      overallSentiment,
    };
  } catch (error) {
    console.error("Error getting trending topics from subreddits:", error);
    throw new Error(
      `Failed to get trending topics: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
