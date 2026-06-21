/**
 * TikTok Script Formatter
 *
 * Generates TikTok video scripts from analyzed content with:
 * - 60-second reading time limit
 * - Strong hook in first 3 seconds
 * - Main content with key points
 * - Clear call-to-action
 * - Optimized for retention
 *
 * Requirements: 7.5, 7.7, 7.8, 7.10, 7.11
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type {
  ContentAnalysis,
  ExtractedContent,
  NicheContext,
  TikTokScriptOutput,
} from "../types";
import { FormattingError } from "../types";

// TikTok-specific constants
const MAX_SCRIPT_DURATION_SECONDS = 60;
const AVERAGE_WORDS_PER_SECOND = 2.5; // Speaking pace
const _MAX_WORDS = Math.floor(
  MAX_SCRIPT_DURATION_SECONDS * AVERAGE_WORDS_PER_SECOND,
); // ~150 words
const RECOMMENDED_HASHTAG_COUNT = 5;

/**
 * Generate TikTok video script from content
 * Requirement 7.5: Generate TikTok script format with hook, main points, and call-to-action under 60 seconds reading time
 */
export async function generateTikTokScript(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): Promise<TikTokScriptOutput> {
  try {
    const prompt = buildTikTokPrompt(content, analysis, nicheContext);

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.9, // Higher temperature for creative, engaging content
    });

    // Parse AI response into structured script
    const scriptParts = parseTikTokScript(text);

    // Validate script duration
    const fullScript = `${scriptParts.hook}\n\n${scriptParts.mainContent}\n\n${scriptParts.callToAction}`;
    const estimatedDuration = calculateScriptDuration(fullScript);

    // If script is too long, truncate main content
    let finalScript = fullScript;
    if (estimatedDuration > MAX_SCRIPT_DURATION_SECONDS) {
      finalScript = truncateScript(scriptParts, MAX_SCRIPT_DURATION_SECONDS);
    }

    // Generate hashtags (Requirement 7.7)
    const hashtags = generateHashtags(analysis, nicheContext);

    return {
      platform: "tiktok",
      hook: scriptParts.hook,
      mainContent: scriptParts.mainContent,
      callToAction: scriptParts.callToAction,
      fullScript: finalScript,
      estimatedDuration: calculateScriptDuration(finalScript),
      hashtags,
      estimatedEngagement: calculateEngagementScore(scriptParts, hashtags),
    };
  } catch (error) {
    throw new FormattingError(
      `Failed to generate TikTok script: ${error instanceof Error ? error.message : "Unknown error"}`,
      { content: content.title },
    );
  }
}

/**
 * Build prompt for TikTok script generation
 */
function buildTikTokPrompt(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): string {
  let prompt = `Create an engaging TikTok video script from the following content. The script must be readable in under 60 seconds.

CONTENT:
Title: ${content.title}
Main Message: ${analysis.mainMessage}
Key Points: ${analysis.contentStructure.mainPoints.join("; ")}
Emotional Tone: ${analysis.emotionalTone}

`;

  if (nicheContext) {
    prompt += `NICHE CONTEXT:
Trending Topics: ${nicheContext.trendingTopics.slice(0, 3).join(", ")}
Keywords: ${nicheContext.keywords.slice(0, 5).join(", ")}

`;
  }

  prompt += `SCRIPT REQUIREMENTS:
1. HOOK (first 3 seconds): Start with an attention-grabbing statement or question that creates curiosity
2. MAIN CONTENT: Deliver 2-3 key points in a fast-paced, engaging way. Use short sentences.
3. CALL-TO-ACTION: Clear action for viewers (follow, like, comment, share, check link)
4. Maximum ~150 words total (60 seconds speaking time)
5. Use casual, conversational tone
6. Make it visual-friendly (mention what viewers see)
7. Create urgency or FOMO where appropriate
8. Use pattern interrupts to maintain attention

Format the script with these sections clearly labeled:
HOOK:
[Hook content]

MAIN:
[Main content]

CTA:
[Call to action]

SCRIPT:`;

  return prompt;
}

/**
 * Parse AI response into script parts
 */
function parseTikTokScript(responseText: string): {
  hook: string;
  mainContent: string;
  callToAction: string;
} {
  const lines = responseText.split("\n");
  let hook = "";
  let mainContent = "";
  let callToAction = "";
  let currentSection: "hook" | "main" | "cta" | "none" = "none";

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers
    if (
      trimmed.toLowerCase().includes("hook:") ||
      trimmed.toLowerCase() === "hook"
    ) {
      currentSection = "hook";
      continue;
    }
    if (
      trimmed.toLowerCase().includes("main:") ||
      trimmed.toLowerCase() === "main" ||
      trimmed.toLowerCase().includes("main content:")
    ) {
      currentSection = "main";
      continue;
    }
    if (
      trimmed.toLowerCase().includes("cta:") ||
      trimmed.toLowerCase().includes("call") ||
      trimmed.toLowerCase().includes("action:")
    ) {
      currentSection = "cta";
      continue;
    }

    // Add content to appropriate section
    if (trimmed.length > 0) {
      switch (currentSection) {
        case "hook":
          hook += (hook ? " " : "") + trimmed;
          break;
        case "main":
          mainContent += (mainContent ? " " : "") + trimmed;
          break;
        case "cta":
          callToAction += (callToAction ? " " : "") + trimmed;
          break;
        default:
          // Try to detect hook by position (first substantial text)
          if (!hook && trimmed.length > 20) {
            hook = trimmed;
            currentSection = "main";
          }
          break;
      }
    }
  }

  // Fallback: if sections not clearly marked, split the content
  if (!hook || !mainContent) {
    const fullText = responseText
      .replace(/HOOK:|MAIN:|CTA:|Call to Action:/gi, "")
      .trim();
    const sentences = fullText
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);

    if (sentences.length >= 3) {
      hook = hook || `${sentences[0].trim()}.`;
      mainContent = mainContent || `${sentences.slice(1, -1).join(". ")}.`;
      callToAction =
        callToAction || `${sentences[sentences.length - 1].trim()}.`;
    } else {
      throw new FormattingError("Could not parse TikTok script sections");
    }
  }

  return {
    hook: hook.trim(),
    mainContent: mainContent.trim(),
    callToAction: callToAction.trim(),
  };
}

/**
 * Calculate script duration based on word count
 * Assumes average speaking pace of 2.5 words per second
 */
function calculateScriptDuration(script: string): number {
  const wordCount = script
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  return Math.ceil(wordCount / AVERAGE_WORDS_PER_SECOND);
}

/**
 * Truncate script to fit within duration limit
 * Requirement 7.8: Enforce character limits and truncate gracefully
 */
function truncateScript(
  scriptParts: { hook: string; mainContent: string; callToAction: string },
  maxDurationSeconds: number,
): string {
  const maxWords = Math.floor(maxDurationSeconds * AVERAGE_WORDS_PER_SECOND);

  // Preserve hook and CTA, truncate main content
  const hookWords = scriptParts.hook.split(/\s+/).length;
  const ctaWords = scriptParts.callToAction.split(/\s+/).length;
  const availableWordsForMain = maxWords - hookWords - ctaWords;

  if (availableWordsForMain < 20) {
    // Not enough space, truncate everything proportionally
    const hookPct = 0.3;
    const mainPct = 0.5;
    const ctaPct = 0.2;

    return [
      truncateToWords(scriptParts.hook, Math.floor(maxWords * hookPct)),
      truncateToWords(scriptParts.mainContent, Math.floor(maxWords * mainPct)),
      truncateToWords(scriptParts.callToAction, Math.floor(maxWords * ctaPct)),
    ].join("\n\n");
  }

  const truncatedMain = truncateToWords(
    scriptParts.mainContent,
    availableWordsForMain,
  );
  return `${scriptParts.hook}\n\n${truncatedMain}\n\n${scriptParts.callToAction}`;
}

/**
 * Truncate text to specified word count
 */
function truncateToWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }

  const truncated = words.slice(0, maxWords).join(" ");

  // Try to end at sentence boundary
  const lastPeriod = truncated.lastIndexOf(".");
  if (lastPeriod > truncated.length * 0.7) {
    return truncated.substring(0, lastPeriod + 1);
  }

  return `${truncated}...`;
}

/**
 * Generate relevant hashtags for TikTok
 * Requirement 7.7: Apply platform-specific best practices including hashtag count
 */
function generateHashtags(
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): string[] {
  const allKeywords = [
    ...analysis.seoKeywords.slice(0, 3),
    ...(nicheContext?.keywords.slice(0, 2) || []),
    // Add TikTok-specific trending tags
    "fyp", // For You Page
  ];

  // Convert to hashtags (remove spaces, capitalize)
  const hashtags = allKeywords
    .map((keyword) => {
      const cleanKeyword = keyword
        .replace(/\s+/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
      return cleanKeyword.length > 0 ? `#${cleanKeyword}` : null;
    })
    .filter((tag): tag is string => tag !== null);

  // Add common TikTok engagement tags
  const tiktokTags = ["#foryou", "#viral", "#trending"];
  hashtags.push(...tiktokTags);

  return [...new Set(hashtags)].slice(0, RECOMMENDED_HASHTAG_COUNT);
}

/**
 * Calculate engagement score for TikTok script
 * Requirement 7.10: Generate call-to-action appropriate for each platform
 */
function calculateEngagementScore(
  scriptParts: { hook: string; mainContent: string; callToAction: string },
  hashtags: string[],
): number {
  let score = 5; // Base score

  // Strong hook bonus (question or bold statement)
  const hookLower = scriptParts.hook.toLowerCase();
  if (hookLower.includes("?") || hookLower.length < 100) {
    score += 2;
  }

  // Main content engagement (short, punchy sentences)
  const mainSentences = scriptParts.mainContent
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);
  if (mainSentences.length >= 2 && mainSentences.length <= 5) {
    score += 1;
  }

  // Call-to-action clarity
  const ctaLower = scriptParts.callToAction.toLowerCase();
  const hasClearCTA = /follow|like|comment|share|check|watch|learn|tap/.test(
    ctaLower,
  );
  if (hasClearCTA) {
    score += 2;
  }

  // Hashtag optimization
  if (hashtags.length >= 3 && hashtags.length <= 7) {
    score += 1;
  }

  return Math.min(10, Math.max(1, score));
}

/**
 * Validate TikTok script quality
 * Requirement 7.11: Include confidence score indicating expected quality
 */
export function validateTikTokScript(script: TikTokScriptOutput): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check duration
  if (script.estimatedDuration > MAX_SCRIPT_DURATION_SECONDS) {
    issues.push(`Script is too long (${script.estimatedDuration}s > 60s)`);
  }

  if (script.estimatedDuration < 15) {
    issues.push("Script is too short (less than 15 seconds)");
  }

  // Validate hook
  if (script.hook.length < 20) {
    issues.push("Hook is too short to be effective");
  }

  // Validate main content
  if (script.mainContent.length < 50) {
    issues.push("Main content is too brief");
  }

  // Validate CTA
  if (script.callToAction.length < 10) {
    issues.push("Call-to-action is missing or too short");
  }

  // Check for CTA keywords
  const ctaKeywords = [
    "follow",
    "like",
    "comment",
    "share",
    "check",
    "watch",
    "learn",
    "tap",
  ];
  const hasCTAKeyword = ctaKeywords.some((keyword) =>
    script.callToAction.toLowerCase().includes(keyword),
  );
  if (!hasCTAKeyword) {
    issues.push("Call-to-action lacks clear action verb");
  }

  // Validate hashtags
  if (script.hashtags.length < 2) {
    issues.push("Too few hashtags (recommended: 3-5)");
  }

  if (script.hashtags.length > 10) {
    issues.push("Too many hashtags (recommended: 3-5)");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
