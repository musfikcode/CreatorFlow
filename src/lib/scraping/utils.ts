/**
 * Utility functions for web scraping
 */

import { decode } from "html-entities";

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML content to extract plain text
 * Removes HTML tags, script/style tags, and decodes HTML entities
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Remove script and style tags with their content
  let sanitized = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
  sanitized = sanitized.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    "",
  );

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  sanitized = decode(sanitized);

  // Remove extra whitespace and newlines
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Normalize URL by removing query parameters and fragments
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Extract keywords from text using simple frequency analysis
 */
export function extractKeywords(text: string, maxKeywords = 10): string[] {
  if (!text) return [];

  // Common stopwords to filter out
  const stopwords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "are",
    "been",
    "be",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "what",
    "which",
    "who",
    "when",
    "where",
    "why",
    "how",
  ]);

  // Tokenize and count words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopwords.has(word));

  const frequency = new Map<string, number>();
  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  // Sort by frequency and return top keywords
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Calculate sentiment score from text (simple heuristic)
 * Returns: "positive", "negative", or "neutral"
 */
export function calculateSentiment(text: string): string {
  if (!text) return "neutral";

  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "best",
    "love",
    "awesome",
    "perfect",
    "beautiful",
    "brilliant",
    "outstanding",
    "superb",
    "nice",
  ];

  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "worst",
    "hate",
    "poor",
    "disappointing",
    "useless",
    "waste",
    "annoying",
    "frustrating",
    "disappointing",
    "problem",
    "issue",
  ];

  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  for (const word of words) {
    if (positiveWords.some((pos) => word.includes(pos))) {
      score++;
    }
    if (negativeWords.some((neg) => word.includes(neg))) {
      score--;
    }
  }

  if (score > 2) return "positive";
  if (score < -2) return "negative";
  return "neutral";
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Unknown error");
}

/**
 * Parse relative time strings (e.g., "2 hours ago", "3 days ago") to Date
 */
export function parseRelativeTime(relativeTime: string): Date | null {
  const now = new Date();
  const match = relativeTime.match(
    /(\d+)\s*(minute|hour|day|week|month|year)s?\s*ago/i,
  );

  if (!match) return null;

  const value = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "minute":
      return new Date(now.getTime() - value * 60 * 1000);
    case "hour":
      return new Date(now.getTime() - value * 60 * 60 * 1000);
    case "day":
      return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
    case "year":
      return new Date(now.getTime() - value * 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}
