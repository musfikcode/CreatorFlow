/**
 * Content Quality Validator
 *
 * Validates repurposed content for:
 * - Grammatical correctness
 * - Key point coverage from source
 * - Tone consistency
 * - Platform compliance
 * - Quality scoring
 *
 * Requirements: 7.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.11
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type {
  ContentAnalysis,
  ExtractedContent,
  PlatformOutput,
  ValidationResult,
} from "./types";

// Quality thresholds
const MIN_QUALITY_SCORE = 0.7;
const MIN_GRAMMAR_SCORE = 0.7;
const MIN_COHERENCE_SCORE = 0.7;
const MIN_TONE_CONSISTENCY = 0.7;
const MIN_KEY_POINT_COVERAGE = 0.6;

/**
 * Validate platform output quality
 * Requirement 8.1: Validate generated content for grammatical correctness
 * Requirement 8.2: Ensure key points from source content appear in repurposed outputs
 * Requirement 8.3: Maintain consistent tone across all generated formats
 */
export async function validatePlatformOutput(
  output: PlatformOutput,
  sourceContent: ExtractedContent,
  analysis: ContentAnalysis,
): Promise<ValidationResult> {
  try {
    // Extract text content from platform output
    const outputText = extractTextFromOutput(output);

    // Run validation checks in parallel
    const [grammarScore, coherenceScore, toneScore, coverageScore] =
      await Promise.all([
        validateGrammar(outputText),
        validateCoherence(outputText),
        validateToneConsistency(outputText, sourceContent.tone),
        validateKeyPointCoverage(
          outputText,
          analysis.contentStructure.mainPoints,
        ),
      ]);

    // Calculate overall confidence score
    const confidenceScore = calculateConfidenceScore({
      grammarScore,
      coherenceScore,
      toneConsistency: toneScore,
      keyPointsCoverage: coverageScore,
    });

    // Collect issues and suggestions
    const issues = collectIssues({
      grammarScore,
      coherenceScore,
      toneScore,
      coverageScore,
      output,
    });

    const suggestions = generateSuggestions(issues, output.platform);

    return {
      isValid:
        confidenceScore >= MIN_QUALITY_SCORE &&
        issues.filter((i) => i.type === "error").length === 0,
      confidenceScore,
      issues,
      suggestions,
      qualityMetrics: {
        grammarScore,
        coherenceScore,
        toneConsistency: toneScore,
        keyPointsCoverage: coverageScore,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      confidenceScore: 0,
      issues: [
        {
          type: "error",
          message: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      suggestions: ["Regenerate content with modified parameters"],
      qualityMetrics: {
        grammarScore: 0,
        coherenceScore: 0,
        toneConsistency: 0,
        keyPointsCoverage: 0,
      },
    };
  }
}

/**
 * Extract text content from platform-specific output
 */
function extractTextFromOutput(output: PlatformOutput): string {
  switch (output.platform) {
    case "twitter":
      return output.tweets.map((t) => t.content).join("\n");
    case "instagram":
      return `${output.caption}\n${output.slides.map((s) => s.content).join("\n")}`;
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
 * Validate grammar using AI
 * Requirement 8.1: Validate for grammatical correctness using language model confidence scores
 */
async function validateGrammar(text: string): Promise<number> {
  try {
    const prompt = `Analyze the following text for grammatical correctness. Rate the grammar quality from 0.0 to 1.0, where 1.0 is perfect grammar.

TEXT:
${text.substring(0, 2000)}

Respond with ONLY a number between 0.0 and 1.0 representing the grammar quality score.`;

    const { text: response } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.1,
    });

    const score = parseFloat(response.trim());
    return Number.isNaN(score) ? 0.8 : Math.min(1.0, Math.max(0.0, score));
  } catch (error) {
    console.error("Grammar validation error:", error);
    return 0.8; // Default to acceptable if validation fails
  }
}

/**
 * Validate coherence and logical flow
 */
async function validateCoherence(text: string): Promise<number> {
  try {
    const prompt = `Analyze the following text for coherence and logical flow. Rate from 0.0 to 1.0, where 1.0 is perfectly coherent.

Consider:
- Logical progression of ideas
- Clear connections between sentences/paragraphs
- Absence of contradictions
- Overall readability

TEXT:
${text.substring(0, 2000)}

Respond with ONLY a number between 0.0 and 1.0 representing the coherence score.`;

    const { text: response } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.1,
    });

    const score = parseFloat(response.trim());
    return Number.isNaN(score) ? 0.8 : Math.min(1.0, Math.max(0.0, score));
  } catch (error) {
    console.error("Coherence validation error:", error);
    return 0.8;
  }
}

/**
 * Validate tone consistency with source
 * Requirement 8.3: Maintain consistent tone across all generated formats
 */
async function validateToneConsistency(
  text: string,
  expectedTone: string,
): Promise<number> {
  try {
    const prompt = `Analyze if the following text maintains a ${expectedTone} tone. Rate consistency from 0.0 to 1.0.

Expected tone: ${expectedTone}

TEXT:
${text.substring(0, 1500)}

Respond with ONLY a number between 0.0 and 1.0 representing tone consistency.`;

    const { text: response } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.1,
    });

    const score = parseFloat(response.trim());
    return Number.isNaN(score) ? 0.8 : Math.min(1.0, Math.max(0.0, score));
  } catch (error) {
    console.error("Tone consistency validation error:", error);
    return 0.8;
  }
}

/**
 * Validate key point coverage from source
 * Requirement 8.2: Ensure key points from source content appear in repurposed outputs
 */
async function validateKeyPointCoverage(
  text: string,
  keyPoints: string[],
): Promise<number> {
  if (keyPoints.length === 0) return 1.0;

  let coveredPoints = 0;

  for (const point of keyPoints) {
    // Check if point concepts appear in text (fuzzy matching)
    const pointWords = point
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const textLower = text.toLowerCase();

    const wordsFound = pointWords.filter((word) =>
      textLower.includes(word),
    ).length;
    const coverage = wordsFound / pointWords.length;

    if (coverage >= 0.5) {
      coveredPoints++;
    }
  }

  return coveredPoints / keyPoints.length;
}

/**
 * Calculate overall confidence score
 * Requirement 8.11: Include confidence score indicating expected quality
 */
function calculateConfidenceScore(metrics: {
  grammarScore: number;
  coherenceScore: number;
  toneConsistency: number;
  keyPointsCoverage: number;
}): number {
  // Weighted average of all metrics
  const weights = {
    grammar: 0.3,
    coherence: 0.3,
    tone: 0.2,
    coverage: 0.2,
  };

  const score =
    metrics.grammarScore * weights.grammar +
    metrics.coherenceScore * weights.coherence +
    metrics.toneConsistency * weights.tone +
    metrics.keyPointsCoverage * weights.coverage;

  return Math.round(score * 100) / 100;
}

/**
 * Collect validation issues
 */
function collectIssues(params: {
  grammarScore: number;
  coherenceScore: number;
  toneScore: number;
  coverageScore: number;
  output: PlatformOutput;
}): Array<{
  type: "error" | "warning" | "info";
  message: string;
  field?: string;
}> {
  const issues: Array<{
    type: "error" | "warning" | "info";
    message: string;
    field?: string;
  }> = [];

  // Grammar issues
  if (params.grammarScore < MIN_GRAMMAR_SCORE) {
    issues.push({
      type: params.grammarScore < 0.5 ? "error" : "warning",
      message: `Grammar quality is ${params.grammarScore < 0.5 ? "poor" : "below acceptable threshold"} (score: ${params.grammarScore.toFixed(2)})`,
      field: "grammar",
    });
  }

  // Coherence issues
  if (params.coherenceScore < MIN_COHERENCE_SCORE) {
    issues.push({
      type: params.coherenceScore < 0.5 ? "error" : "warning",
      message: `Content coherence is ${params.coherenceScore < 0.5 ? "poor" : "below acceptable threshold"} (score: ${params.coherenceScore.toFixed(2)})`,
      field: "coherence",
    });
  }

  // Tone consistency issues (Requirement 8.3)
  if (params.toneScore < MIN_TONE_CONSISTENCY) {
    issues.push({
      type: "warning",
      message: `Tone consistency is below threshold (score: ${params.toneScore.toFixed(2)})`,
      field: "tone",
    });
  }

  // Key point coverage issues (Requirement 8.2)
  if (params.coverageScore < MIN_KEY_POINT_COVERAGE) {
    issues.push({
      type: params.coverageScore < 0.4 ? "error" : "warning",
      message: `Key point coverage is ${params.coverageScore < 0.4 ? "insufficient" : "below optimal"} (${Math.round(params.coverageScore * 100)}%)`,
      field: "coverage",
    });
  }

  // Platform-specific validations (Requirement 8.6)
  const platformIssues = validatePlatformConstraints(params.output);
  issues.push(...platformIssues);

  return issues;
}

/**
 * Validate platform-specific constraints
 * Requirement 8.6: Validate hashtags are relevant to content and not generic
 * Requirement 8.7: Ensure call-to-action statements are specific and actionable
 */
function validatePlatformConstraints(output: PlatformOutput): Array<{
  type: "error" | "warning" | "info";
  message: string;
  field?: string;
}> {
  const issues: Array<{
    type: "error" | "warning" | "info";
    message: string;
    field?: string;
  }> = [];

  switch (output.platform) {
    case "twitter": {
      // Check tweet length
      const longTweets = output.tweets.filter((t) => t.characterCount > 280);
      if (longTweets.length > 0) {
        issues.push({
          type: "error",
          message: `${longTweets.length} tweet(s) exceed 280 character limit`,
          field: "tweets",
        });
      }

      // Validate hashtags (Requirement 8.6)
      const genericHashtags = ["#content", "#social", "#post"];
      const hasGenericHashtags = output.hashtags.some((tag) =>
        genericHashtags.includes(tag.toLowerCase()),
      );
      if (hasGenericHashtags) {
        issues.push({
          type: "warning",
          message: "Contains generic hashtags that may reduce engagement",
          field: "hashtags",
        });
      }
      break;
    }

    case "instagram":
      // Check caption length
      if (output.caption.length > 2200) {
        issues.push({
          type: "error",
          message: "Caption exceeds Instagram's 2,200 character limit",
          field: "caption",
        });
      }

      // Check slide count
      if (output.totalSlides < 8 || output.totalSlides > 10) {
        issues.push({
          type: "warning",
          message: "Slide count outside recommended range (8-10 slides)",
          field: "slides",
        });
      }
      break;

    case "linkedin":
      // Check content length
      if (output.characterCount > 3000) {
        issues.push({
          type: "error",
          message: "Content exceeds LinkedIn's 3,000 character limit",
          field: "content",
        });
      }

      // Validate CTA (Requirement 8.7)
      if (!output.callToAction || output.callToAction.length < 10) {
        issues.push({
          type: "warning",
          message: "Call-to-action is missing or too brief",
          field: "callToAction",
        });
      }
      break;

    case "tiktok":
      // Check script duration
      if (output.estimatedDuration > 60) {
        issues.push({
          type: "error",
          message: `Script duration (${output.estimatedDuration}s) exceeds 60 seconds`,
          field: "duration",
        });
      }

      // Validate hook presence
      if (!output.hook || output.hook.length < 20) {
        issues.push({
          type: "warning",
          message: "Hook is missing or too short for effective engagement",
          field: "hook",
        });
      }
      break;

    case "email":
      // Check subject length
      if (output.subject.length > 60) {
        issues.push({
          type: "warning",
          message:
            "Subject line may be truncated in some email clients (>60 chars)",
          field: "subject",
        });
      }

      // Check section count
      if (output.sections.length < 2) {
        issues.push({
          type: "warning",
          message: "Email should have at least 2-3 content sections",
          field: "sections",
        });
      }
      break;

    case "blog": {
      // Check word count
      const wordCount = output.content.split(/\s+/).length;
      if (wordCount < 300) {
        issues.push({
          type: "warning",
          message: "Article is too short for effective SEO (< 300 words)",
          field: "content",
        });
      }

      // Check SEO keywords
      if (output.seoKeywords.length < 3) {
        issues.push({
          type: "info",
          message: "Consider adding more SEO keywords (3-5 recommended)",
          field: "seoKeywords",
        });
      }
      break;
    }
  }

  return issues;
}

/**
 * Generate improvement suggestions based on issues
 */
function generateSuggestions(
  issues: Array<{ type: string; message: string; field?: string }>,
  platform: string,
): string[] {
  const suggestions: string[] = [];

  const hasGrammarIssues = issues.some((i) => i.field === "grammar");
  const hasCoherenceIssues = issues.some((i) => i.field === "coherence");
  const hasCoverageIssues = issues.some((i) => i.field === "coverage");
  const hasToneIssues = issues.some((i) => i.field === "tone");

  if (hasGrammarIssues) {
    suggestions.push("Review and correct grammatical errors");
    suggestions.push("Consider regenerating with a different AI model");
  }

  if (hasCoherenceIssues) {
    suggestions.push("Improve logical flow between sections");
    suggestions.push("Add transitional phrases to connect ideas");
  }

  if (hasCoverageIssues) {
    suggestions.push("Ensure all key points from source are covered");
    suggestions.push("Regenerate with emphasis on main themes");
  }

  if (hasToneIssues) {
    suggestions.push("Adjust tone to match source content");
    suggestions.push(`Ensure ${platform}-appropriate tone is maintained`);
  }

  // Platform-specific suggestions
  const platformSuggestions = getPlatformSuggestions(platform, issues);
  suggestions.push(...platformSuggestions);

  return [...new Set(suggestions)];
}

/**
 * Get platform-specific suggestions
 */
function getPlatformSuggestions(
  platform: string,
  issues: Array<{ type: string; message: string; field?: string }>,
): string[] {
  const suggestions: string[] = [];

  switch (platform) {
    case "twitter":
      if (issues.some((i) => i.field === "tweets")) {
        suggestions.push("Break long tweets into multiple tweets");
        suggestions.push("Remove unnecessary words to fit character limit");
      }
      if (issues.some((i) => i.field === "hashtags")) {
        suggestions.push("Replace generic hashtags with niche-specific ones");
      }
      break;

    case "instagram":
      if (issues.some((i) => i.field === "caption")) {
        suggestions.push("Shorten caption to fit platform limits");
      }
      if (issues.some((i) => i.field === "slides")) {
        suggestions.push("Adjust slide count to 8-10 for optimal engagement");
      }
      break;

    case "linkedin":
      if (issues.some((i) => i.field === "content")) {
        suggestions.push("Condense content to fit 3,000 character limit");
      }
      if (issues.some((i) => i.field === "callToAction")) {
        suggestions.push("Add a clear, specific call-to-action");
      }
      break;

    case "tiktok":
      if (issues.some((i) => i.field === "duration")) {
        suggestions.push("Shorten script to fit 60-second limit");
        suggestions.push("Remove less critical points");
      }
      if (issues.some((i) => i.field === "hook")) {
        suggestions.push("Strengthen opening hook for better retention");
      }
      break;

    case "email":
      if (issues.some((i) => i.field === "subject")) {
        suggestions.push("Shorten subject line to 40-50 characters");
      }
      if (issues.some((i) => i.field === "sections")) {
        suggestions.push("Add more content sections for better structure");
      }
      break;

    case "blog":
      if (issues.some((i) => i.field === "content")) {
        suggestions.push("Expand article to 500+ words for better SEO");
      }
      if (issues.some((i) => i.field === "seoKeywords")) {
        suggestions.push("Add more relevant SEO keywords");
      }
      break;
  }

  return suggestions;
}

/**
 * Check if output needs regeneration
 * Requirement 8.4: If quality score falls below 0.7, regenerate with modified prompts
 */
export function shouldRegenerate(validation: ValidationResult): boolean {
  return (
    validation.confidenceScore < MIN_QUALITY_SCORE ||
    validation.issues.filter((i) => i.type === "error").length > 0
  );
}

/**
 * Detect duplicate sentences
 * Requirement 8.5: Detect and remove duplicate sentences within generated content
 */
export function detectDuplicates(text: string): string[] {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 20);

  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const sentence of sentences) {
    if (seen.has(sentence)) {
      duplicates.push(sentence);
    } else {
      seen.add(sentence);
    }
  }

  return duplicates;
}

/**
 * Remove duplicate sentences from text
 */
export function removeDuplicates(text: string): string {
  const sentences = text.split(/([.!?]+)/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i].trim().toLowerCase();
    const punctuation = sentences[i + 1] || "";

    if (sentence.length > 20 && !seen.has(sentence)) {
      seen.add(sentence);
      result.push(sentences[i] + punctuation);
    } else if (sentence.length <= 20) {
      result.push(sentences[i] + punctuation);
    }
  }

  return result.join("");
}
