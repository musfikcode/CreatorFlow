/**
 * AI Content Analyzer Service
 *
 * Analyzes extracted content using AI models to identify:
 * - Main message and core themes
 * - Pain points and actionable insights
 * - Target audience characteristics
 * - Suggested platforms for distribution
 * - SEO keywords and content structure
 *
 * Requirements: 6.6, 6.7, 6.8, 7.9
 */

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type {
  ContentAnalysis,
  ExtractedContent,
  NicheContext,
  OutputPlatform,
} from "./types";
import { AnalysisError } from "./types";

/**
 * Analyze content using AI
 * @param content Extracted content to analyze
 * @param nicheContext Optional niche context for enhanced analysis
 * @param aiModel AI model to use (default: openai)
 * @returns Content analysis with insights
 */
export async function analyzeContent(
  content: ExtractedContent,
  nicheContext?: NicheContext,
  aiModel: "openai" | "anthropic" | "gemini" = "openai",
): Promise<ContentAnalysis> {
  try {
    // Select AI model
    const model = getAIModel(aiModel);

    // Build analysis prompt
    const prompt = buildAnalysisPrompt(content, nicheContext);

    // Generate analysis using AI
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.7,
    });

    // Parse AI response into structured analysis
    const analysis = parseAnalysisResponse(text);

    return analysis;
  } catch (error) {
    throw new AnalysisError(
      `Failed to analyze content: ${error instanceof Error ? error.message : "Unknown error"}`,
      { originalError: error },
    );
  }
}

/**
 * Get AI model based on selection
 */
function getAIModel(modelName: "openai" | "anthropic" | "gemini") {
  switch (modelName) {
    case "openai":
      return openai("gpt-4o");
    case "anthropic":
      return anthropic("claude-3-5-sonnet-20241022");
    case "gemini":
      return google("gemini-2.0-flash-exp");
    default:
      return openai("gpt-4o");
  }
}

/**
 * Build analysis prompt for AI
 */
function buildAnalysisPrompt(
  content: ExtractedContent,
  nicheContext?: NicheContext,
): string {
  let prompt = `Analyze the following content and provide detailed insights in JSON format.

CONTENT TO ANALYZE:
Title: ${content.title}
Summary: ${content.summary}
Key Points: ${content.keyPoints.join("; ")}
Tone: ${content.tone}
Word Count: ${content.metadata.wordCount}

RAW CONTENT:
${content.rawContent.substring(0, 5000)}${content.rawContent.length > 5000 ? "..." : ""}

`;

  // Add niche context if available
  if (nicheContext) {
    prompt += `NICHE CONTEXT:
Trending Topics: ${nicheContext.trendingTopics.join(", ")}
Keywords: ${nicheContext.keywords.join(", ")}
Pain Points: ${nicheContext.painPoints.join(", ")}
Trend Velocity: ${nicheContext.trendVelocity || "unknown"}

`;
  }

  prompt += `Provide a comprehensive analysis in the following JSON structure:
{
  "mainMessage": "One-sentence summary of the core message",
  "coreThemes": ["theme1", "theme2", "theme3"],
  "painPoints": ["pain point 1", "pain point 2"],
  "actionableInsights": ["insight 1", "insight 2", "insight 3"],
  "emotionalTone": "Describe the emotional tone",
  "targetAudience": {
    "demographics": "Target demographic description",
    "interests": ["interest1", "interest2", "interest3"],
    "painPoints": ["audience pain point 1", "audience pain point 2"]
  },
  "suggestedPlatforms": ["twitter", "linkedin", "blog"],
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "contentStructure": {
    "hook": "Compelling hook statement",
    "mainPoints": ["main point 1", "main point 2", "main point 3"],
    "conclusion": "Strong conclusion statement"
  }
}

Respond ONLY with valid JSON. Do not include any explanatory text outside the JSON structure.`;

  return prompt;
}

/**
 * Parse AI response into structured ContentAnalysis
 */
function parseAnalysisResponse(responseText: string): ContentAnalysis {
  try {
    // Extract JSON from response (handle cases where AI adds extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.mainMessage || !parsed.coreThemes || !parsed.targetAudience) {
      throw new Error("Missing required fields in AI response");
    }

    // Ensure suggestedPlatforms contains valid platform names
    const validPlatforms: OutputPlatform[] = [
      "twitter",
      "instagram",
      "linkedin",
      "blog",
      "tiktok",
      "email",
    ];

    const suggestedPlatforms = (parsed.suggestedPlatforms || [])
      .filter((p: string) => validPlatforms.includes(p as OutputPlatform))
      .slice(0, 6);

    // Construct ContentAnalysis with defaults for missing optional fields
    const analysis: ContentAnalysis = {
      mainMessage: parsed.mainMessage,
      coreThemes: parsed.coreThemes || [],
      painPoints: parsed.painPoints || [],
      actionableInsights: parsed.actionableInsights || [],
      emotionalTone: parsed.emotionalTone || "neutral",
      targetAudience: {
        demographics: parsed.targetAudience?.demographics || "General audience",
        interests: parsed.targetAudience?.interests || [],
        painPoints: parsed.targetAudience?.painPoints || [],
      },
      suggestedPlatforms:
        suggestedPlatforms.length > 0
          ? suggestedPlatforms
          : ["twitter", "linkedin"],
      seoKeywords: parsed.seoKeywords || [],
      contentStructure: {
        hook: parsed.contentStructure?.hook || "",
        mainPoints: parsed.contentStructure?.mainPoints || [],
        conclusion: parsed.contentStructure?.conclusion || "",
      },
    };

    return analysis;
  } catch (error) {
    throw new AnalysisError(
      `Failed to parse AI analysis response: ${error instanceof Error ? error.message : "Unknown error"}`,
      { responseText },
    );
  }
}

/**
 * Enhance analysis with niche context
 * Requirement 7.9: Incorporate trending keywords into repurposed content
 */
export function enhanceAnalysisWithNiche(
  analysis: ContentAnalysis,
  nicheContext: NicheContext,
): ContentAnalysis {
  return {
    ...analysis,
    // Merge niche keywords with SEO keywords
    seoKeywords: [
      ...new Set([
        ...analysis.seoKeywords,
        ...nicheContext.keywords.slice(0, 5),
      ]),
    ],
    // Merge pain points
    painPoints: [
      ...new Set([
        ...analysis.painPoints,
        ...nicheContext.painPoints.slice(0, 3),
      ]),
    ],
    // Add trending topics to core themes
    coreThemes: [
      ...new Set([
        ...analysis.coreThemes,
        ...nicheContext.trendingTopics.slice(0, 2),
      ]),
    ],
  };
}

/**
 * Determine optimal platforms based on content characteristics
 * Requirement 6.7: Detect target audience characteristics
 */
export function determineOptimalPlatforms(
  content: ExtractedContent,
  analysis: ContentAnalysis,
): OutputPlatform[] {
  const platforms: OutputPlatform[] = [];

  // Twitter: good for short insights and threads
  if (
    content.metadata.wordCount < 5000 ||
    content.quotableSegments.length > 0
  ) {
    platforms.push("twitter");
  }

  // LinkedIn: professional content
  if (
    content.tone === "professional" ||
    analysis.targetAudience.demographics.toLowerCase().includes("professional")
  ) {
    platforms.push("linkedin");
  }

  // Instagram: visual, inspirational, or educational content
  if (
    content.tone === "inspirational" ||
    content.tone === "educational" ||
    content.tone === "entertaining"
  ) {
    platforms.push("instagram");
  }

  // Blog: long-form, educational content
  if (
    content.metadata.wordCount > 1000 ||
    content.tone === "educational" ||
    analysis.seoKeywords.length > 5
  ) {
    platforms.push("blog");
  }

  // TikTok: short, entertaining content
  if (
    content.tone === "entertaining" ||
    content.tone === "inspirational" ||
    content.metadata.estimatedReadTime < 5
  ) {
    platforms.push("tiktok");
  }

  // Email: comprehensive content suitable for newsletters
  if (content.metadata.wordCount > 500) {
    platforms.push("email");
  }

  // Return at least 2 platforms
  if (platforms.length === 0) {
    return ["twitter", "linkedin"];
  }

  return [...new Set(platforms)];
}
