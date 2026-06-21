/**
 * Twitter Thread Formatter
 *
 * Generates Twitter threads from analyzed content with:
 * - 280 character limit per tweet
 * - Logical thread flow with numbered tweets
 * - Strategic hashtag placement
 * - Hook-driven engagement
 *
 * Requirements: 7.1, 7.7, 7.8, 7.11
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type {
  ContentAnalysis,
  ExtractedContent,
  NicheContext,
  TwitterThreadOutput,
} from "../types";
import { FormattingError } from "../types";

const TWEET_MAX_CHARS = 280;
const RECOMMENDED_HASHTAG_COUNT = 2;

/**
 * Generate Twitter thread from content
 * Requirement 7.1: Generate Twitter thread format with maximum 280 characters per tweet
 */
export async function generateTwitterThread(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): Promise<TwitterThreadOutput> {
  try {
    const prompt = buildTwitterPrompt(content, analysis, nicheContext);

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.8,
    });

    // Parse AI response into structured thread
    const tweets = parseTwitterThread(text);

    // Validate and format tweets
    const formattedTweets = tweets.map((tweet, index) => ({
      content: validateTweetLength(tweet.content, index),
      characterCount: tweet.content.length,
      order: index + 1,
    }));

    // Generate hashtags from niche context and analysis
    const hashtags = generateHashtags(analysis, nicheContext);

    return {
      platform: "twitter",
      tweets: formattedTweets,
      totalTweets: formattedTweets.length,
      hashtags,
      estimatedEngagement: calculateEngagementScore(formattedTweets, hashtags),
    };
  } catch (error) {
    throw new FormattingError(
      `Failed to generate Twitter thread: ${error instanceof Error ? error.message : "Unknown error"}`,
      { content: content.title },
    );
  }
}

/**
 * Build prompt for Twitter thread generation
 */
function buildTwitterPrompt(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): string {
  let prompt = `Create an engaging Twitter thread from the following content. Each tweet must be under 280 characters.

CONTENT:
Title: ${content.title}
Main Message: ${analysis.mainMessage}
Key Points: ${analysis.contentStructure.mainPoints.join("; ")}
Hook: ${analysis.contentStructure.hook}
Conclusion: ${analysis.contentStructure.conclusion}

`;

  if (nicheContext) {
    prompt += `NICHE CONTEXT:
Trending Keywords: ${nicheContext.keywords.slice(0, 5).join(", ")}
Hot Topics: ${nicheContext.trendingTopics.slice(0, 3).join(", ")}

`;
  }

  prompt += `THREAD REQUIREMENTS:
1. Start with a STRONG HOOK tweet that grabs attention
2. Break down main points into 5-8 tweets
3. Each tweet must be UNDER 280 characters (strict limit)
4. Use numbered format (1/, 2/, etc.) for clarity
5. Include call-to-action in final tweet
6. Make each tweet valuable on its own while maintaining thread flow
7. Use conversational, engaging tone
8. Include line breaks for readability where appropriate

Format each tweet on a new line starting with the number (e.g., "1/ Your hook here").

THREAD:`;

  return prompt;
}

/**
 * Parse AI response into structured tweets
 */
function parseTwitterThread(responseText: string): Array<{ content: string }> {
  // Split by tweet numbers (1/, 2/, etc.)
  const tweetRegex = /(?:^|\n)(\d+)\/\s*([\s\S]*?)(?=(?:\n\d+\/|$))/g;
  const tweets: Array<{ content: string }> = [];

  let match = tweetRegex.exec(responseText);
  while (match !== null) {
    const _tweetNumber = parseInt(match[1], 10);
    const content = match[2].trim();

    if (content) {
      tweets.push({ content });
    }

    match = tweetRegex.exec(responseText);
  }

  // If parsing failed, split by newlines and try alternative format
  if (tweets.length === 0) {
    const lines = responseText
      .split("\n")
      .filter((line) => line.trim().length > 0);
    for (const line of lines) {
      const cleanLine = line.replace(/^\d+[./)]\s*/, "").trim();
      if (cleanLine.length > 0 && cleanLine.length <= TWEET_MAX_CHARS) {
        tweets.push({ content: cleanLine });
      }
    }
  }

  // Ensure we have at least 3 tweets
  if (tweets.length < 3) {
    throw new FormattingError(
      "Failed to generate sufficient tweets for thread",
    );
  }

  return tweets;
}

/**
 * Validate and enforce tweet length
 * Requirement 7.8: Enforce character limits and truncate gracefully
 */
function validateTweetLength(tweet: string, index: number): string {
  // Add thread number prefix if not present
  const hasPrefix = /^\d+\//.test(tweet);
  const prefix = hasPrefix ? "" : `${index + 1}/ `;
  const content = hasPrefix ? tweet : prefix + tweet;

  if (content.length <= TWEET_MAX_CHARS) {
    return content;
  }

  // Truncate with ellipsis
  const availableLength = TWEET_MAX_CHARS - prefix.length - 3; // -3 for "..."
  const truncated = tweet.substring(0, availableLength);

  // Try to truncate at word boundary
  const lastSpace = truncated.lastIndexOf(" ");
  const finalContent =
    lastSpace > availableLength * 0.8
      ? truncated.substring(0, lastSpace)
      : truncated;

  return `${prefix + finalContent}...`;
}

/**
 * Generate relevant hashtags
 * Requirement 7.7: Apply platform-specific best practices including hashtag count
 */
function generateHashtags(
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): string[] {
  const allKeywords = [
    ...analysis.seoKeywords.slice(0, 3),
    ...(nicheContext?.keywords.slice(0, 2) || []),
  ];

  // Convert to hashtags (remove spaces, capitalize)
  const hashtags = allKeywords
    .map((keyword) => {
      const cleanKeyword = keyword
        .replace(/\s+/g, "")
        .replace(/[^a-zA-Z0-9]/g, "");
      return cleanKeyword.length > 0 ? `#${cleanKeyword}` : null;
    })
    .filter((tag): tag is string => tag !== null)
    .slice(0, RECOMMENDED_HASHTAG_COUNT);

  return [...new Set(hashtags)];
}

/**
 * Calculate engagement score for thread
 */
function calculateEngagementScore(
  tweets: Array<{ content: string; characterCount: number }>,
  hashtags: string[],
): number {
  let score = 5; // Base score

  // Strong hook bonus (first tweet)
  if (tweets[0] && tweets[0].content.length > 100) {
    score += 2;
  }

  // Thread length optimization (5-10 tweets is ideal)
  if (tweets.length >= 5 && tweets.length <= 10) {
    score += 2;
  } else if (tweets.length > 10) {
    score -= 1;
  }

  // Hashtag optimization
  if (hashtags.length >= 1 && hashtags.length <= 3) {
    score += 1;
  }

  // Call-to-action detection in last tweet
  const lastTweet = tweets[tweets.length - 1]?.content.toLowerCase() || "";
  const hasCTA =
    /reply|comment|share|follow|check|learn|read|watch|download/.test(
      lastTweet,
    );
  if (hasCTA) {
    score += 1;
  }

  return Math.min(10, Math.max(1, score));
}

/**
 * Validate thread quality
 * Requirement 7.11: Include confidence score indicating expected quality
 */
export function validateTwitterThread(thread: TwitterThreadOutput): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check tweet count
  if (thread.totalTweets < 3) {
    issues.push("Thread should have at least 3 tweets");
  }

  if (thread.totalTweets > 15) {
    issues.push("Thread is too long (>15 tweets), may lose engagement");
  }

  // Validate character limits
  const invalidTweets = thread.tweets.filter(
    (tweet) => tweet.characterCount > TWEET_MAX_CHARS,
  );
  if (invalidTweets.length > 0) {
    issues.push(`${invalidTweets.length} tweet(s) exceed 280 character limit`);
  }

  // Check for empty tweets
  const emptyTweets = thread.tweets.filter(
    (tweet) => tweet.content.trim().length === 0,
  );
  if (emptyTweets.length > 0) {
    issues.push(`${emptyTweets.length} tweet(s) are empty`);
  }

  // Validate hashtags
  if (thread.hashtags.length > 3) {
    issues.push("Too many hashtags (recommended: 1-2)");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
