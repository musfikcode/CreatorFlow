/**
 * Content Repurposing Engine - Main Orchestrator
 *
 * Orchestrates the complete content repurposing flow:
 * 1. Extract content from source (YouTube, blog, podcast, text)
 * 2. Analyze content with AI
 * 3. Generate platform-specific outputs
 * 4. Validate quality
 * 5. Regenerate if needed
 *
 * Requirements: 6.1-6.11, 7.1-7.12, 8.1-8.11
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type {
  PlatformType,
  RepurposeRequest,
  RepurposeResponse,
} from "@/types/repurpose";
import { analyzeContent as analyzeExtractedContent } from "./analyzer";
import {
  type ExtractedContent,
  extractContent,
  shouldSummarize,
} from "./extractor";
import { generateBlogArticle } from "./formatters/blog";
import { generateEmailNewsletter } from "./formatters/email";
import { generateInstagramCarousel } from "./formatters/instagram";
import { generateLinkedInPost } from "./formatters/linkedin";
import { generateTikTokScript } from "./formatters/tiktok";
import { generateTwitterThread } from "./formatters/twitter";
import type {
  ContentAnalysis,
  NicheContext,
  PlatformOutput,
  ValidationResult,
} from "./types";
import { RepurposingError } from "./types";
import {
  removeDuplicates,
  shouldRegenerate,
  validatePlatformOutput,
} from "./validator";

/**
 * Main entry point: Repurpose content for multiple platforms
 *
 * @param request - Repurposing request with source and platforms
 * @param nicheContext - Optional niche context for enhancement
 * @returns Repurposed content for all requested platforms
 */
export async function repurposeContent(
  request: RepurposeRequest,
): Promise<RepurposeResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Extract content from source (Requirements 6.1-6.5)
    const extracted = await extractContent(request.source);

    // Step 2: Check if content needs summarization (Requirement 6.9)
    let processedContent = extracted;
    if (shouldSummarize(extracted)) {
      processedContent = await summarizeContent(extracted);
    }

    // Convert ExtractedContent to expected format for analyzer
    const contentForAnalysis: import("./types").ExtractedContent = {
      title: processedContent.title || "Untitled",
      rawContent: processedContent.text,
      summary: processedContent.text.substring(0, 500),
      keyPoints: extractKeyPoints(processedContent.text),
      themes: [],
      tone: "professional",
      targetAudience: "General audience",
      quotableSegments: extractQuotableSegments(processedContent.text),
      metadata: {
        sourceType:
          request.source.type === "youtube_url"
            ? "youtube"
            : request.source.type === "blog_url"
              ? "blog"
              : request.source.type === "podcast_url"
                ? "podcast"
                : "text",
        sourceUrl: processedContent.sourceUrl,
        wordCount: processedContent.text.split(/\s+/).length,
        estimatedReadTime: Math.ceil(
          processedContent.text.split(/\s+/).length / 200,
        ),
        extractedAt: new Date().toISOString(),
      },
    };

    // Step 3: Analyze content with AI (Requirements 6.6-6.8)
    const nicheContext: NicheContext | undefined = request.includeNicheContext
      ? {
          trendingTopics: [],
          keywords: [],
          painPoints: [],
          competitorGaps: [],
        }
      : undefined;

    const analysis = await analyzeExtractedContent(
      contentForAnalysis,
      nicheContext,
    );

    // Step 4: Generate platform-specific outputs (Requirements 7.1-7.6)
    const outputs: PlatformOutput[] = [];
    const validationResults: Record<string, ValidationResult> = {};

    for (const platform of request.platforms) {
      let output: PlatformOutput;
      let attempts = 0;
      const maxAttempts = 2; // Requirement 8.4: Regenerate if quality < 0.7

      while (attempts < maxAttempts) {
        try {
          // Generate platform-specific content
          output = await generateForPlatform(
            platform,
            contentForAnalysis,
            analysis,
            nicheContext,
          );

          // Step 5: Validate quality (Requirements 8.1-8.7)
          const validation = await validatePlatformOutput(
            output,
            contentForAnalysis,
            analysis,
          );

          validationResults[platform] = validation;

          // Check if regeneration needed (Requirement 8.4)
          if (shouldRegenerate(validation) && attempts < maxAttempts - 1) {
            console.log(
              `Quality below threshold for ${platform}, regenerating...`,
            );
            attempts++;
            continue;
          }

          // Remove duplicates (Requirement 8.5)
          output = removeDuplicatesFromOutput(output);

          outputs.push(output);
          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new RepurposingError(
              `Failed to generate ${platform} content after ${maxAttempts} attempts`,
              "GENERATION_FAILED",
              { platform, error },
            );
          }
        }
      }
    }

    const _processingTime = Date.now() - startTime;

    // Build response
    const result: RepurposeResponse = {
      outputs: outputs.map((output) => ({
        platform: output.platform,
        content: getContentFromOutput(output),
        qualityScore: validationResults[output.platform]?.confidenceScore || 0,
        metadata: getMetadataFromOutput(output),
      })),
      sourceAnalysis: {
        keyPoints: analysis.contentStructure.mainPoints,
        themes: analysis.coreThemes,
        tone: contentForAnalysis.tone,
        targetAudience: analysis.targetAudience.demographics,
        quotableSegments: contentForAnalysis.quotableSegments,
      },
      nicheContextUsed: !!request.includeNicheContext,
    };

    return result;
  } catch (error) {
    throw new RepurposingError(
      `Content repurposing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      "REPURPOSING_FAILED",
      { error },
    );
  }
}

/**
 * Generate content for specific platform
 * Requirements 7.1-7.6: Platform-specific output generation
 */
async function generateForPlatform(
  platform: PlatformType,
  content: import("./types").ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): Promise<PlatformOutput> {
  switch (platform) {
    case "twitter":
      return await generateTwitterThread(content, analysis, nicheContext);
    case "instagram":
      return await generateInstagramCarousel(content, analysis, nicheContext);
    case "linkedin":
      return await generateLinkedInPost(content, analysis, nicheContext);
    case "blog":
      return await generateBlogArticle(content, analysis, nicheContext);
    case "tiktok":
      return await generateTikTokScript(content, analysis, nicheContext);
    case "email":
      return await generateEmailNewsletter(content, analysis, nicheContext);
    default:
      throw new RepurposingError(
        `Unsupported platform: ${platform}`,
        "UNSUPPORTED_PLATFORM",
      );
  }
}

/**
 * Summarize content if it exceeds maximum length
 * Requirement 6.9: Use summarization before repurposing if content exceeds 50,000 characters
 */
async function summarizeContent(
  content: ExtractedContent,
): Promise<ExtractedContent> {
  try {
    const prompt = `Summarize the following content, preserving key points, main themes, and important details. Keep the summary comprehensive but under 10,000 words.

TITLE: ${content.title || ""}
CONTENT:
${content.text.substring(0, 50000)}

Provide a detailed summary that captures:
1. Main message and core themes
2. Key points and arguments
3. Important data or examples
4. Conclusions or recommendations

SUMMARY:`;

    const { text: summary } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3,
    });

    return {
      ...content,
      text: summary,
      requiresSummarization: false,
    };
  } catch (error) {
    console.error("Summarization failed, using truncated content:", error);
    // Fallback: truncate content
    return {
      ...content,
      text: content.text.substring(0, 40000),
      requiresSummarization: false,
    };
  }
}

/**
 * Extract key points from text (simple extraction)
 */
function extractKeyPoints(text: string): string[] {
  // Split into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 50);

  // Take first 5 substantial sentences as key points
  return sentences.slice(0, Math.min(5, sentences.length));
}

/**
 * Extract quotable segments (short, impactful statements)
 */
function extractQuotableSegments(text: string): string[] {
  const sentences = text.split(/[.!?]+/).map((s) => s.trim());

  // Find sentences between 50-150 characters (tweetable)
  const quotable = sentences.filter((s) => s.length >= 50 && s.length <= 150);

  return quotable.slice(0, 5);
}

/**
 * Remove duplicates from platform output
 * Requirement 8.5: Detect and remove duplicate sentences
 */
function removeDuplicatesFromOutput(output: PlatformOutput): PlatformOutput {
  switch (output.platform) {
    case "twitter":
      return {
        ...output,
        tweets: output.tweets.map((tweet) => ({
          ...tweet,
          content: removeDuplicates(tweet.content),
        })),
      };
    case "instagram":
      return {
        ...output,
        caption: removeDuplicates(output.caption),
        slides: output.slides.map((slide) => ({
          ...slide,
          content: removeDuplicates(slide.content),
        })),
      };
    case "linkedin":
      return {
        ...output,
        content: removeDuplicates(output.content),
      };
    case "blog":
      return {
        ...output,
        content: removeDuplicates(output.content),
      };
    case "tiktok":
      return {
        ...output,
        fullScript: removeDuplicates(output.fullScript),
      };
    case "email":
      return {
        ...output,
        body: removeDuplicates(output.body),
      };
    default:
      return output;
  }
}

/**
 * Extract content string from platform output
 */
function getContentFromOutput(output: PlatformOutput): string {
  switch (output.platform) {
    case "twitter":
      return output.tweets.map((t) => t.content).join("\n\n");
    case "instagram":
      return output.caption;
    case "linkedin":
      return output.content;
    case "blog":
      return output.content;
    case "tiktok":
      return output.fullScript;
    case "email":
      return output.body;
    default:
      return "";
  }
}

/**
 * Extract metadata from platform output
 */
function getMetadataFromOutput(
  output: PlatformOutput,
): Record<string, string | number> {
  switch (output.platform) {
    case "twitter":
      return {
        characterCount: output.tweets.reduce(
          (sum, t) => sum + t.characterCount,
          0,
        ),
        slideCount: output.totalTweets,
        hashtagCount: output.hashtags.length,
      };
    case "instagram":
      return {
        characterCount: output.caption.length,
        slideCount: output.totalSlides,
        hashtagCount: output.hashtags.length,
      };
    case "linkedin":
      return {
        characterCount: output.characterCount,
        hashtagCount: output.hashtags.length,
      };
    case "blog":
      return {
        estimatedReadTime: `${output.readingTime} min`,
      };
    case "tiktok":
      return {
        estimatedReadTime: `${output.estimatedDuration}s`,
        hashtagCount: output.hashtags.length,
      };
    case "email":
      return {};
    default:
      return {};
  }
}

export * from "./analyzer";
export type { ExtractedContent } from "./extractor";
// Export all submodules for direct access
export { extractContent } from "./extractor";
export { generateBlogArticle } from "./formatters/blog";
export { generateEmailNewsletter } from "./formatters/email";
export { generateInstagramCarousel } from "./formatters/instagram";
export { generateLinkedInPost } from "./formatters/linkedin";
export { generateTikTokScript } from "./formatters/tiktok";
export { generateTwitterThread } from "./formatters/twitter";
export * from "./types";
export * from "./validator";
