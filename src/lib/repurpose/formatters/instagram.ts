/**
 * Instagram Carousel Formatter
 *
 * Generates Instagram carousels from analyzed content with:
 * - 8-10 slides with distinct value per slide
 * - Caption under 2,200 characters
 * - Visual suggestions for each slide
 * - Strategic hashtag usage
 *
 * Requirements: 7.2, 7.7, 7.9, 7.11
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type {
  ContentAnalysis,
  ExtractedContent,
  InstagramCarouselOutput,
  NicheContext,
} from "../types";
import { FormattingError } from "../types";

const MAX_CAPTION_LENGTH = 2200;
const MIN_SLIDES = 8;
const MAX_SLIDES = 10;
const RECOMMENDED_HASHTAG_COUNT = 10;
const MAX_CHARS_PER_SLIDE = 150;

/**
 * Generate Instagram carousel from content
 * Requirement 7.2: Generate Instagram carousel format (8-10 slides)
 */
export async function generateInstagramCarousel(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): Promise<InstagramCarouselOutput> {
  try {
    const prompt = buildInstagramPrompt(content, analysis, nicheContext);

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.8,
    });

    // Parse AI response into slides and caption
    const { slides, caption } = parseInstagramCarousel(text);

    // Generate hashtags
    const hashtags = generateInstagramHashtags(analysis, nicheContext);

    // Add hashtags to caption
    const fullCaption = formatCaption(caption, hashtags);

    return {
      platform: "instagram",
      slides,
      caption: fullCaption,
      hashtags,
      totalSlides: slides.length,
      estimatedEngagement: calculateEngagementScore(
        slides,
        fullCaption,
        hashtags,
      ),
    };
  } catch (error) {
    throw new FormattingError(
      `Failed to generate Instagram carousel: ${error instanceof Error ? error.message : "Unknown error"}`,
      { content: content.title },
    );
  }
}

/**
 * Build prompt for Instagram carousel generation
 */
function buildInstagramPrompt(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): string {
  let prompt = `Create an engaging Instagram carousel (8-10 slides) from the following content.

CONTENT:
Title: ${content.title}
Main Message: ${analysis.mainMessage}
Hook: ${analysis.contentStructure.hook}
Key Points: ${analysis.contentStructure.mainPoints.join("; ")}
Themes: ${analysis.coreThemes.join(", ")}
Tone: ${analysis.emotionalTone}

`;

  if (nicheContext) {
    prompt += `TRENDING TOPICS: ${nicheContext.trendingTopics.slice(0, 3).join(", ")}
KEYWORDS: ${nicheContext.keywords.slice(0, 5).join(", ")}

`;
  }

  prompt += `CAROUSEL REQUIREMENTS:
1. Create exactly ${MIN_SLIDES}-${MAX_SLIDES} slides
2. Slide 1: Eye-catching hook that stops scrolling (max ${MAX_CHARS_PER_SLIDE} chars)
3. Slides 2-8: Main points with actionable insights (max ${MAX_CHARS_PER_SLIDE} chars each)
4. Slide 9: Key takeaway or summary
5. Slide 10: Strong call-to-action
6. Each slide must provide DISTINCT value (no repetition)
7. Keep text concise and visual-friendly
8. Include visual suggestions for each slide
9. Write an engaging caption (max ${MAX_CAPTION_LENGTH} chars)

FORMAT YOUR RESPONSE EXACTLY AS:

SLIDE 1:
[Slide content here]
VISUAL: [Visual suggestion]

SLIDE 2:
[Slide content here]
VISUAL: [Visual suggestion]

... continue for all slides ...

CAPTION:
[Full caption here]

CAROUSEL:`;

  return prompt;
}

/**
 * Parse AI response into structured carousel data
 */
function parseInstagramCarousel(responseText: string): {
  slides: Array<{ content: string; order: number; visualSuggestion: string }>;
  caption: string;
} {
  const slides: Array<{
    content: string;
    order: number;
    visualSuggestion: string;
  }> = [];

  // Extract slides
  const slideRegex =
    /SLIDE\s+(\d+):\s*([\s\S]*?)(?:VISUAL:\s*(.*?))?(?=\n\nSLIDE\s+\d+:|CAPTION:|$)/gi;

  let match = slideRegex.exec(responseText);
  while (match !== null) {
    const slideNumber = parseInt(match[1], 10);
    const content = match[2]?.trim() || "";
    const visualSuggestion =
      match[3]?.trim() || "Text overlay on colorful background";

    if (content) {
      slides.push({
        content: validateSlideLength(content),
        order: slideNumber,
        visualSuggestion,
      });
    }

    match = slideRegex.exec(responseText);
  }

  // Extract caption
  const captionMatch = responseText.match(/CAPTION:\s*([\s\S]*?)$/i);
  const caption = captionMatch?.[1]?.trim() || generateDefaultCaption(slides);

  // Validate slide count
  if (slides.length < MIN_SLIDES) {
    throw new FormattingError(
      `Generated only ${slides.length} slides, minimum ${MIN_SLIDES} required`,
    );
  }

  // Limit to MAX_SLIDES
  const finalSlides = slides.slice(0, MAX_SLIDES).map((slide, index) => ({
    ...slide,
    order: index + 1,
  }));

  return { slides: finalSlides, caption };
}

/**
 * Validate and format slide content
 * Requirement 7.9: Each slide has distinct value
 */
function validateSlideLength(content: string): string {
  if (content.length <= MAX_CHARS_PER_SLIDE) {
    return content;
  }

  // Truncate at word boundary
  const truncated = content.substring(0, MAX_CHARS_PER_SLIDE - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  const final =
    lastSpace > MAX_CHARS_PER_SLIDE * 0.8
      ? truncated.substring(0, lastSpace)
      : truncated;

  return `${final}...`;
}

/**
 * Generate default caption if parsing fails
 */
function generateDefaultCaption(
  slides: Array<{ content: string; order: number }>,
): string {
  const firstSlide = slides[0]?.content || "Transform your content";
  return `${firstSlide}\n\nSwipe to learn more 👉`;
}

/**
 * Format caption with hashtags
 */
function formatCaption(caption: string, hashtags: string[]): string {
  // Ensure caption doesn't exceed limit
  const maxCaptionTextLength =
    MAX_CAPTION_LENGTH - hashtags.join(" ").length - 10;
  let finalCaption =
    caption.length > maxCaptionTextLength
      ? `${caption.substring(0, maxCaptionTextLength - 3)}...`
      : caption;

  // Add hashtags at the end
  if (hashtags.length > 0) {
    finalCaption += `\n\n${hashtags.join(" ")}`;
  }

  // Validate total length
  if (finalCaption.length > MAX_CAPTION_LENGTH) {
    // Truncate hashtags if needed
    const availableHashtagSpace = MAX_CAPTION_LENGTH - caption.length - 10;
    const reducedHashtags = hashtags.slice(
      0,
      Math.floor(availableHashtagSpace / 20),
    );
    finalCaption = `${caption}\n\n${reducedHashtags.join(" ")}`;
  }

  return finalCaption;
}

/**
 * Generate Instagram-specific hashtags
 * Requirement 7.7: Apply platform-specific best practices including hashtag count
 */
function generateInstagramHashtags(
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): string[] {
  const keywords = [
    ...analysis.seoKeywords.slice(0, 7),
    ...(nicheContext?.keywords.slice(0, 5) || []),
    ...analysis.coreThemes.slice(0, 3),
  ];

  // Convert to hashtags
  const hashtags = keywords
    .map((keyword) => {
      const cleanKeyword = keyword
        .replace(/\s+/g, "")
        .replace(/[^a-zA-Z0-9]/g, "");
      return cleanKeyword.length > 2 ? `#${cleanKeyword}` : null;
    })
    .filter((tag): tag is string => tag !== null);

  // Remove duplicates and limit to recommended count
  const uniqueHashtags = [...new Set(hashtags)].slice(
    0,
    RECOMMENDED_HASHTAG_COUNT,
  );

  return uniqueHashtags;
}

/**
 * Calculate engagement score
 */
function calculateEngagementScore(
  slides: Array<{ content: string }>,
  caption: string,
  hashtags: string[],
): number {
  let score = 5; // Base score

  // Optimal slide count
  if (slides.length >= MIN_SLIDES && slides.length <= MAX_SLIDES) {
    score += 2;
  }

  // Slide content quality (check for distinct content)
  const uniqueWords = new Set(
    slides.flatMap((slide) => slide.content.toLowerCase().split(/\s+/)),
  );
  if (uniqueWords.size > slides.length * 5) {
    score += 1; // Good variety in content
  }

  // Caption engagement
  const captionLower = caption.toLowerCase();
  const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]/u.test(caption);
  const hasCTA = /swipe|tap|comment|save|share|follow|link|bio/.test(
    captionLower,
  );

  if (hasEmoji) score += 0.5;
  if (hasCTA) score += 1;

  // Hashtag optimization (8-12 is ideal for Instagram)
  if (hashtags.length >= 8 && hashtags.length <= 12) {
    score += 1.5;
  } else if (hashtags.length >= 5) {
    score += 0.5;
  }

  return Math.min(10, Math.max(1, score));
}

/**
 * Validate carousel quality
 * Requirement 7.11: Include confidence score indicating expected quality
 */
export function validateInstagramCarousel(carousel: InstagramCarouselOutput): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check slide count
  if (carousel.totalSlides < MIN_SLIDES) {
    issues.push(`Carousel should have at least ${MIN_SLIDES} slides`);
  }

  if (carousel.totalSlides > MAX_SLIDES) {
    issues.push(`Carousel exceeds maximum of ${MAX_SLIDES} slides`);
  }

  // Validate caption length
  if (carousel.caption.length > MAX_CAPTION_LENGTH) {
    issues.push(`Caption exceeds ${MAX_CAPTION_LENGTH} character limit`);
  }

  // Check for empty slides
  const emptySlides = carousel.slides.filter(
    (slide) => slide.content.trim().length === 0,
  );
  if (emptySlides.length > 0) {
    issues.push(`${emptySlides.length} slide(s) are empty`);
  }

  // Check slide content length
  const longSlides = carousel.slides.filter(
    (slide) => slide.content.length > MAX_CHARS_PER_SLIDE,
  );
  if (longSlides.length > 0) {
    issues.push(`${longSlides.length} slide(s) exceed recommended length`);
  }

  // Validate hashtags
  if (carousel.hashtags.length < 5) {
    issues.push("Consider adding more hashtags (recommended: 8-12)");
  }

  if (carousel.hashtags.length > 30) {
    issues.push("Too many hashtags (Instagram limits to 30)");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
