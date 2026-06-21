/**
 * Blog Article Formatter
 *
 * Generates SEO-optimized blog articles from analyzed content with:
 * - Proper heading structure (H1, H2, H3)
 * - SEO meta description and keywords
 * - URL-friendly slug
 * - Comprehensive sections with intro and conclusion
 *
 * Requirements: 7.4, 7.7, 7.11
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type {
  BlogArticleOutput,
  ContentAnalysis,
  ExtractedContent,
  NicheContext,
} from "../types";
import { FormattingError } from "../types";

const MAX_META_DESCRIPTION = 160;
const MIN_ARTICLE_LENGTH = 800;
const _RECOMMENDED_READING_TIME = 5; // minutes

/**
 * Generate SEO-optimized blog article from content
 * Requirement 7.4: Generate blog article format with SEO-optimized structure
 */
export async function generateBlogArticle(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): Promise<BlogArticleOutput> {
  try {
    const prompt = buildBlogPrompt(content, analysis, nicheContext);

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
    });

    // Parse AI response into structured article
    const article = parseBlogArticle(text, content, analysis);

    // Generate SEO elements
    const slug = generateSlug(article.title);
    const metaDescription = generateMetaDescription(content, analysis);

    // Calculate reading time
    const wordCount = article.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 WPM average

    return {
      platform: "blog",
      title: article.title,
      metaDescription,
      slug,
      content: article.content,
      sections: article.sections,
      seoKeywords: analysis.seoKeywords.slice(0, 10),
      readingTime,
      estimatedEngagement: calculateEngagementScore(article, nicheContext),
    };
  } catch (error) {
    throw new FormattingError(
      `Failed to generate blog article: ${error instanceof Error ? error.message : "Unknown error"}`,
      { content: content.title },
    );
  }
}

/**
 * Build prompt for blog article generation
 */
function buildBlogPrompt(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): string {
  let prompt = `Write a comprehensive, SEO-optimized blog article from the following content.

CONTENT:
Title: ${content.title}
Main Message: ${analysis.mainMessage}
Key Points: ${analysis.contentStructure.mainPoints.join("; ")}
Core Themes: ${analysis.coreThemes.join(", ")}
Target Audience: ${analysis.targetAudience.demographics}
SEO Keywords: ${analysis.seoKeywords.slice(0, 8).join(", ")}

`;

  if (nicheContext) {
    prompt += `TRENDING TOPICS: ${nicheContext.trendingTopics.slice(0, 3).join(", ")}
TRENDING KEYWORDS: ${nicheContext.keywords.slice(0, 5).join(", ")}

`;
  }

  prompt += `ARTICLE REQUIREMENTS:
1. Create a compelling H1 title (60-70 characters, include primary keyword)
2. Write an engaging introduction that hooks the reader
3. Organize content into 4-6 main sections with H2 headings
4. Include H3 subheadings within sections for better structure
5. Each section should be 200-400 words
6. Use short paragraphs (3-4 sentences) for readability
7. Include actionable insights and practical examples
8. Naturally incorporate SEO keywords throughout (don't force them)
9. End with a strong conclusion that summarizes key takeaways
10. Include a call-to-action in the conclusion
11. Minimum ${MIN_ARTICLE_LENGTH} words total

FORMAT YOUR RESPONSE EXACTLY AS:

TITLE:
[Article title here]

INTRODUCTION:
[Introduction paragraph here]

SECTION: [H2 Heading 1]
[Content for section 1]

SUBSECTION: [H3 Subheading if applicable]
[Subsection content]

SECTION: [H2 Heading 2]
[Content for section 2]

... continue for all sections ...

CONCLUSION:
[Conclusion paragraph with call-to-action]

BLOG ARTICLE:`;

  return prompt;
}

/**
 * Parse AI response into structured blog article
 */
function parseBlogArticle(
  responseText: string,
  content: ExtractedContent,
  _analysis: ContentAnalysis,
): {
  title: string;
  content: string;
  sections: Array<{ heading: string; content: string }>;
} {
  // Extract title
  const titleMatch = responseText.match(/TITLE:\s*(.*?)(?=\n|$)/i);
  const title = titleMatch?.[1]?.trim() || content.title;

  // Extract introduction
  const introMatch = responseText.match(
    /INTRODUCTION:\s*([\s\S]*?)(?=SECTION:|$)/i,
  );
  const introduction = introMatch?.[1]?.trim() || "";

  // Extract sections
  const sections: Array<{ heading: string; content: string }> = [];
  const sectionRegex =
    /SECTION:\s*(.*?)\n([\s\S]*?)(?=SECTION:|CONCLUSION:|$)/gi;

  let match = sectionRegex.exec(responseText);
  while (match !== null) {
    const heading = match[1]?.trim();
    const sectionContent = match[2]?.trim();

    if (heading && sectionContent) {
      sections.push({ heading, content: sectionContent });
    }

    match = sectionRegex.exec(responseText);
  }

  // Extract conclusion
  const conclusionMatch = responseText.match(/CONCLUSION:\s*([\s\S]*?)$/i);
  const conclusion = conclusionMatch?.[1]?.trim() || "";

  // Build full article content
  let fullContent = `# ${title}\n\n`;

  if (introduction) {
    fullContent += `${introduction}\n\n`;
  }

  for (const section of sections) {
    fullContent += `## ${section.heading}\n\n${section.content}\n\n`;
  }

  if (conclusion) {
    fullContent += `## Conclusion\n\n${conclusion}\n`;
  }

  // Validate article has sufficient content
  if (sections.length === 0) {
    throw new FormattingError("Failed to generate article sections");
  }

  return { title, content: fullContent, sections };
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

/**
 * Generate SEO meta description
 * Requirement 7.7: Apply platform-specific best practices
 */
function generateMetaDescription(
  content: ExtractedContent,
  analysis: ContentAnalysis,
): string {
  // Use main message as base
  let description = analysis.mainMessage;

  // Ensure it's within character limit
  if (description.length > MAX_META_DESCRIPTION) {
    // Truncate at word boundary
    const truncated = description.substring(0, MAX_META_DESCRIPTION - 3);
    const lastSpace = truncated.lastIndexOf(" ");
    description = `${truncated.substring(0, lastSpace)}...`;
  }

  // Ensure minimum length (50 chars recommended for SEO)
  if (description.length < 50 && content.summary) {
    description = `${content.summary.substring(0, MAX_META_DESCRIPTION - 3)}...`;
  }

  return description;
}

/**
 * Calculate engagement score for blog article
 */
function calculateEngagementScore(
  article: {
    title: string;
    content: string;
    sections: Array<{ heading: string; content: string }>;
  },
  nicheContext?: NicheContext,
): number {
  let score = 5; // Base score

  // Word count optimization (1500-2500 words is ideal)
  const wordCount = article.content.split(/\s+/).length;
  if (wordCount >= 1500 && wordCount <= 2500) {
    score += 2;
  } else if (wordCount >= 800) {
    score += 1;
  }

  // Section structure (4-6 sections is ideal)
  if (article.sections.length >= 4 && article.sections.length <= 6) {
    score += 1.5;
  } else if (article.sections.length >= 3) {
    score += 0.5;
  }

  // Title optimization (60-70 characters is ideal for SEO)
  const titleLength = article.title.length;
  if (titleLength >= 50 && titleLength <= 70) {
    score += 1;
  }

  // Keyword usage (check if trending keywords appear)
  if (nicheContext) {
    const contentLower = article.content.toLowerCase();
    const keywordMatches = nicheContext.keywords.filter((keyword) =>
      contentLower.includes(keyword.toLowerCase()),
    );
    score += Math.min(1, keywordMatches.length * 0.2);
  }

  // Structure indicators (headings, lists, etc.)
  const hasProperStructure =
    article.content.includes("##") && article.sections.length > 0;
  if (hasProperStructure) {
    score += 0.5;
  }

  // Call-to-action detection
  const contentLower = article.content.toLowerCase();
  const hasCTA =
    /comment|subscribe|share|learn more|read more|contact|download/.test(
      contentLower,
    );
  if (hasCTA) {
    score += 0.5;
  }

  return Math.min(10, Math.max(1, score));
}

/**
 * Validate blog article quality
 * Requirement 7.11: Include confidence score indicating expected quality
 */
export function validateBlogArticle(article: BlogArticleOutput): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check title
  if (!article.title || article.title.length === 0) {
    issues.push("Title is missing");
  }

  if (article.title.length < 30) {
    issues.push("Title is too short (recommended: 50-70 characters)");
  }

  if (article.title.length > 100) {
    issues.push("Title is too long (recommended: 50-70 characters)");
  }

  // Check meta description
  if (!article.metaDescription || article.metaDescription.length === 0) {
    issues.push("Meta description is missing");
  }

  if (article.metaDescription.length > MAX_META_DESCRIPTION) {
    issues.push(`Meta description exceeds ${MAX_META_DESCRIPTION} characters`);
  }

  if (article.metaDescription.length < 50) {
    issues.push("Meta description is too short (minimum 50 characters)");
  }

  // Check content length
  const wordCount = article.content.split(/\s+/).length;
  if (wordCount < MIN_ARTICLE_LENGTH) {
    issues.push(
      `Article is too short (minimum ${MIN_ARTICLE_LENGTH} words recommended)`,
    );
  }

  // Check sections
  if (article.sections.length < 3) {
    issues.push("Article should have at least 3 main sections");
  }

  // Check SEO keywords
  if (article.seoKeywords.length === 0) {
    issues.push("No SEO keywords provided");
  }

  // Check slug
  if (!article.slug || article.slug.length === 0) {
    issues.push("URL slug is missing");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Add structured data for SEO
 */
export function generateStructuredData(article: BlogArticleOutput): object {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.metaDescription,
    keywords: article.seoKeywords.join(", "),
    wordCount: article.content.split(/\s+/).length,
    articleSection: article.sections.map((s) => s.heading),
  };
}
