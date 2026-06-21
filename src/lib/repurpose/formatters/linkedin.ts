/**
 * LinkedIn Post Formatter
 *
 * Generates professional LinkedIn posts from analyzed content with:
 * - 3,000 character limit
 * - Professional tone and storytelling
 * - Strategic hashtag usage (3-5 recommended)
 * - Clear call-to-action
 *
 * Requirements: 7.3, 7.7, 7.10, 7.11
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type {
  ContentAnalysis,
  ExtractedContent,
  LinkedInPostOutput,
  NicheContext,
} from "../types";
import { FormattingError } from "../types";

const MAX_POST_LENGTH = 3000;
const RECOMMENDED_HASHTAG_COUNT = 5;

/**
 * Generate LinkedIn post from content
 * Requirement 7.3: Generate LinkedIn post format (3000 char limit)
 */
export async function generateLinkedInPost(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): Promise<LinkedInPostOutput> {
  try {
    const prompt = buildLinkedInPrompt(content, analysis, nicheContext);

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
    });

    // Parse AI response
    const { postContent, callToAction } = parseLinkedInPost(text);

    // Validate length
    const validatedContent = validatePostLength(postContent);

    // Generate professional hashtags
    const hashtags = generateLinkedInHashtags(analysis, nicheContext);

    return {
      platform: "linkedin",
      content: validatedContent,
      characterCount: validatedContent.length,
      hashtags,
      callToAction,
      estimatedEngagement: calculateEngagementScore(
        validatedContent,
        hashtags,
        callToAction,
      ),
    };
  } catch (error) {
    throw new FormattingError(
      `Failed to generate LinkedIn post: ${error instanceof Error ? error.message : "Unknown error"}`,
      { content: content.title },
    );
  }
}

/**
 * Build prompt for LinkedIn post generation
 */
function buildLinkedInPrompt(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): string {
  let prompt = `Create a professional LinkedIn post from the following content. Maximum 3,000 characters.

CONTENT:
Title: ${content.title}
Main Message: ${analysis.mainMessage}
Key Points: ${analysis.contentStructure.mainPoints.join("; ")}
Target Audience: ${analysis.targetAudience.demographics}
Emotional Tone: ${analysis.emotionalTone}

`;

  if (nicheContext) {
    prompt += `TRENDING IN NICHE:
Topics: ${nicheContext.trendingTopics.slice(0, 3).join(", ")}
Keywords: ${nicheContext.keywords.slice(0, 5).join(", ")}

`;
  }

  prompt += `POST REQUIREMENTS:
1. Professional, authoritative tone (suitable for LinkedIn)
2. Start with a strong hook that resonates with professionals
3. Use storytelling to make it engaging and relatable
4. Break content into short paragraphs (2-3 sentences each) for readability
5. Include specific insights and actionable takeaways
6. Add credibility with data points or examples
7. End with a thought-provoking question or clear call-to-action
8. Use line breaks strategically for visual appeal
9. Maximum 3,000 characters including spaces
10. NO hashtags in the main text (will be added separately)

FORMAT YOUR RESPONSE AS:

POST:
[Your LinkedIn post content here]

CALL_TO_ACTION:
[Specific call-to-action phrase]

LINKEDIN POST:`;

  return prompt;
}

/**
 * Parse AI response into structured post
 */
function parseLinkedInPost(responseText: string): {
  postContent: string;
  callToAction: string;
} {
  // Extract post content
  const postMatch = responseText.match(
    /POST:\s*([\s\S]*?)(?=CALL_TO_ACTION:|$)/i,
  );
  let postContent = postMatch?.[1]?.trim() || responseText.trim();

  // Extract call-to-action
  const ctaMatch = responseText.match(/CALL_TO_ACTION:\s*(.*?)$/is);
  const callToAction =
    ctaMatch?.[1]?.trim() || "Share your thoughts in the comments!";

  // Clean up post content
  postContent = postContent
    .replace(/^POST:\s*/i, "")
    .replace(/CALL_TO_ACTION:[\s\S]*$/i, "")
    .trim();

  if (!postContent) {
    throw new FormattingError("Failed to generate LinkedIn post content");
  }

  return { postContent, callToAction };
}

/**
 * Validate and enforce post length
 * Requirement 7.8: Enforce character limits and truncate gracefully
 */
function validatePostLength(content: string): string {
  if (content.length <= MAX_POST_LENGTH) {
    return content;
  }

  // Truncate at paragraph or sentence boundary
  const truncated = content.substring(0, MAX_POST_LENGTH - 50);

  // Try to find last paragraph break
  const lastParagraph = truncated.lastIndexOf("\n\n");
  if (lastParagraph > MAX_POST_LENGTH * 0.8) {
    return (
      truncated.substring(0, lastParagraph) +
      "\n\n[Content truncated for length]"
    );
  }

  // Try to find last sentence
  const lastSentence = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? "),
  );

  if (lastSentence > MAX_POST_LENGTH * 0.8) {
    return truncated.substring(0, lastSentence + 1);
  }

  // Fallback: truncate at word boundary
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.substring(0, lastSpace)}...`;
}

/**
 * Generate professional LinkedIn hashtags
 * Requirement 7.7: Apply platform-specific best practices including hashtag count
 */
function generateLinkedInHashtags(
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): string[] {
  const keywords = [
    ...analysis.seoKeywords.slice(0, 4),
    ...(nicheContext?.keywords.slice(0, 3) || []),
    ...analysis.coreThemes.slice(0, 2),
  ];

  // Convert to professional hashtags (capitalize each word)
  const hashtags = keywords
    .map((keyword) => {
      const words = keyword.split(/\s+/).filter((w) => w.length > 0);
      const capitalized = words
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join("");

      return capitalized.length > 2 ? `#${capitalized}` : null;
    })
    .filter((tag): tag is string => tag !== null);

  // Remove duplicates and limit to recommended count
  const uniqueHashtags = [...new Set(hashtags)].slice(
    0,
    RECOMMENDED_HASHTAG_COUNT,
  );

  // Add generic professional hashtags if we have less than 3
  const defaultHashtags = [
    "#LinkedIn",
    "#Professional",
    "#CareerGrowth",
    "#Industry",
  ];
  while (uniqueHashtags.length < 3 && defaultHashtags.length > 0) {
    const tag = defaultHashtags.shift();
    if (tag && !uniqueHashtags.includes(tag)) {
      uniqueHashtags.push(tag);
    }
  }

  return uniqueHashtags;
}

/**
 * Calculate engagement score
 * Requirement 7.10: Generate call-to-action appropriate for each platform
 */
function calculateEngagementScore(
  content: string,
  hashtags: string[],
  callToAction: string,
): number {
  let score = 5; // Base score

  // Content length optimization (1500-2500 is ideal for LinkedIn)
  const contentLength = content.length;
  if (contentLength >= 1500 && contentLength <= 2500) {
    score += 2;
  } else if (contentLength >= 800) {
    score += 1;
  }

  // Professional tone indicators
  const professionalWords = [
    "insight",
    "strategy",
    "experience",
    "learn",
    "growth",
    "professional",
    "industry",
    "career",
    "business",
    "success",
  ];
  const contentLower = content.toLowerCase();
  const professionalScore = professionalWords.filter((word) =>
    contentLower.includes(word),
  ).length;
  score += Math.min(1.5, professionalScore * 0.3);

  // Paragraph structure (good readability)
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length >= 4 && paragraphs.length <= 8) {
    score += 1;
  }

  // Hashtag optimization (3-5 is ideal for LinkedIn)
  if (hashtags.length >= 3 && hashtags.length <= 5) {
    score += 1;
  }

  // Call-to-action quality
  const ctaLower = callToAction.toLowerCase();
  const hasCTAWords =
    /comment|share|connect|follow|discuss|think|experience|thoughts/.test(
      ctaLower,
    );
  if (hasCTAWords) {
    score += 1;
  }

  // Question at the end (drives engagement)
  if (content.endsWith("?") || callToAction.endsWith("?")) {
    score += 0.5;
  }

  return Math.min(10, Math.max(1, score));
}

/**
 * Validate post quality
 * Requirement 7.11: Include confidence score indicating expected quality
 */
export function validateLinkedInPost(post: LinkedInPostOutput): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check character limit
  if (post.characterCount > MAX_POST_LENGTH) {
    issues.push(`Post exceeds ${MAX_POST_LENGTH} character limit`);
  }

  // Check minimum length
  if (post.characterCount < 100) {
    issues.push("Post is too short (minimum 100 characters recommended)");
  }

  // Check for empty content
  if (post.content.trim().length === 0) {
    issues.push("Post content is empty");
  }

  // Validate hashtags
  if (post.hashtags.length === 0) {
    issues.push("No hashtags provided (recommended: 3-5)");
  }

  if (post.hashtags.length > 10) {
    issues.push("Too many hashtags (recommended: 3-5 for LinkedIn)");
  }

  // Check for call-to-action
  if (!post.callToAction || post.callToAction.trim().length === 0) {
    issues.push("Missing call-to-action");
  }

  // Check professional tone (basic heuristic)
  const contentLower = post.content.toLowerCase();
  const casualWords = ["lol", "omg", "gonna", "wanna", "u ", " ur "];
  const hasCasualLanguage = casualWords.some((word) =>
    contentLower.includes(word),
  );
  if (hasCasualLanguage) {
    issues.push("Content may be too casual for LinkedIn");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Format post with hashtags for final output
 * Requirement 7.11: Maintain brand voice consistency across all output formats
 */
export function formatLinkedInPostWithHashtags(
  post: LinkedInPostOutput,
): string {
  let formattedPost = post.content;

  // Add call-to-action if not already in content
  if (!formattedPost.includes(post.callToAction)) {
    formattedPost += `\n\n${post.callToAction}`;
  }

  // Add hashtags at the end
  if (post.hashtags.length > 0) {
    formattedPost += `\n\n${post.hashtags.join(" ")}`;
  }

  return formattedPost;
}
