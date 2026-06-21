/**
 * Email Newsletter Formatter
 *
 * Generates email newsletters from analyzed content with:
 * - Compelling subject line
 * - Preview text
 * - Structured body with sections
 * - Clear call-to-action
 * - Professional email formatting
 *
 * Requirements: 7.6, 7.7, 7.8, 7.10, 7.11
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type {
  ContentAnalysis,
  EmailNewsletterOutput,
  ExtractedContent,
  NicheContext,
} from "../types";
import { FormattingError } from "../types";

// Email-specific constants
const MAX_SUBJECT_LENGTH = 60;
const MAX_PREVIEW_LENGTH = 100;
const MAX_EMAIL_LENGTH = 5000;
const _IDEAL_SECTION_COUNT = 4;

/**
 * Generate email newsletter from content
 * Requirement 7.6: Generate email newsletter format with subject line, preview text, and body content
 */
export async function generateEmailNewsletter(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): Promise<EmailNewsletterOutput> {
  try {
    const prompt = buildEmailPrompt(content, analysis, nicheContext);

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
    });

    // Parse AI response into structured email
    const emailParts = parseEmailNewsletter(text);

    // Validate and enforce limits (Requirement 7.8)
    const validatedEmail = validateAndFormatEmail(emailParts);

    return {
      platform: "email",
      subject: validatedEmail.subject,
      previewText: validatedEmail.previewText,
      body: validatedEmail.body,
      sections: validatedEmail.sections,
      callToAction: validatedEmail.callToAction,
      estimatedEngagement: calculateEngagementScore(validatedEmail),
    };
  } catch (error) {
    throw new FormattingError(
      `Failed to generate email newsletter: ${error instanceof Error ? error.message : "Unknown error"}`,
      { content: content.title },
    );
  }
}

/**
 * Build prompt for email newsletter generation
 */
function buildEmailPrompt(
  content: ExtractedContent,
  analysis: ContentAnalysis,
  nicheContext?: NicheContext,
): string {
  let prompt = `Create an engaging email newsletter from the following content.

CONTENT:
Title: ${content.title}
Main Message: ${analysis.mainMessage}
Key Points: ${analysis.contentStructure.mainPoints.join("; ")}
Target Audience: ${analysis.targetAudience.demographics}
Tone: ${content.tone}

`;

  if (nicheContext) {
    prompt += `NICHE CONTEXT:
Trending Topics: ${nicheContext.trendingTopics.slice(0, 3).join(", ")}
Keywords: ${nicheContext.keywords.slice(0, 5).join(", ")}
Pain Points: ${nicheContext.painPoints.slice(0, 3).join(", ")}

`;
  }

  prompt += `EMAIL REQUIREMENTS:
1. SUBJECT LINE: Compelling, curiosity-driven, under 60 characters
2. PREVIEW TEXT: Extends the subject, under 100 characters
3. GREETING: Warm, personalized opening
4. BODY: 3-5 sections with clear headings, valuable content, conversational tone
5. CALL-TO-ACTION: One clear, prominent CTA (reply, click link, read article)
6. CLOSING: Professional sign-off
7. Total length: 500-1000 words
8. Use short paragraphs (2-3 sentences max)
9. Include practical takeaways
10. Make it scannable with headings and formatting

Format the email with these sections clearly labeled:
SUBJECT:
[Subject line]

PREVIEW:
[Preview text]

GREETING:
[Opening greeting]

SECTION 1: [Heading]
[Content]

SECTION 2: [Heading]
[Content]

(Continue with 2-3 more sections)

CTA:
[Call to action]

CLOSING:
[Sign-off]

EMAIL:`;

  return prompt;
}

/**
 * Parse AI response into email structure
 */
function parseEmailNewsletter(responseText: string): {
  subject: string;
  previewText: string;
  greeting: string;
  sections: Array<{ heading: string; content: string }>;
  callToAction: string;
  closing: string;
} {
  const lines = responseText.split("\n");
  let subject = "";
  let previewText = "";
  let greeting = "";
  const sections: Array<{ heading: string; content: string }> = [];
  let callToAction = "";
  let closing = "";

  let currentSection:
    | "subject"
    | "preview"
    | "greeting"
    | "section"
    | "cta"
    | "closing"
    | "none" = "none";
  let currentSectionHeading = "";
  let currentSectionContent = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers
    if (trimmed.toLowerCase().includes("subject:")) {
      currentSection = "subject";
      subject = trimmed.replace(/subject:/i, "").trim();
      continue;
    }
    if (trimmed.toLowerCase().includes("preview:")) {
      currentSection = "preview";
      previewText = trimmed.replace(/preview:/i, "").trim();
      continue;
    }
    if (trimmed.toLowerCase().includes("greeting:")) {
      currentSection = "greeting";
      continue;
    }
    if (trimmed.toLowerCase().match(/section \d+:/i)) {
      // Save previous section if exists
      if (currentSectionHeading && currentSectionContent) {
        sections.push({
          heading: currentSectionHeading,
          content: currentSectionContent.trim(),
        });
      }

      currentSection = "section";
      currentSectionHeading = trimmed.replace(/section \d+:/i, "").trim();
      currentSectionContent = "";
      continue;
    }
    if (
      trimmed.toLowerCase().includes("cta:") ||
      trimmed.toLowerCase().includes("call to action:")
    ) {
      // Save last section if exists
      if (currentSectionHeading && currentSectionContent) {
        sections.push({
          heading: currentSectionHeading,
          content: currentSectionContent.trim(),
        });
        currentSectionHeading = "";
        currentSectionContent = "";
      }

      currentSection = "cta";
      continue;
    }
    if (trimmed.toLowerCase().includes("closing:")) {
      currentSection = "closing";
      continue;
    }

    // Add content to appropriate section
    if (trimmed.length > 0) {
      switch (currentSection) {
        case "subject":
          subject += (subject ? " " : "") + trimmed;
          break;
        case "preview":
          previewText += (previewText ? " " : "") + trimmed;
          break;
        case "greeting":
          greeting += (greeting ? "\n" : "") + trimmed;
          break;
        case "section":
          currentSectionContent +=
            (currentSectionContent ? "\n" : "") + trimmed;
          break;
        case "cta":
          callToAction += (callToAction ? "\n" : "") + trimmed;
          break;
        case "closing":
          closing += (closing ? "\n" : "") + trimmed;
          break;
      }
    }
  }

  // Save last section if exists
  if (currentSectionHeading && currentSectionContent) {
    sections.push({
      heading: currentSectionHeading,
      content: currentSectionContent.trim(),
    });
  }

  // Fallback parsing if structure not detected
  if (!subject || sections.length === 0) {
    const fallback = fallbackParseEmail(responseText);
    return {
      subject: subject || fallback.subject,
      previewText: previewText || fallback.previewText,
      greeting: greeting || fallback.greeting,
      sections: sections.length > 0 ? sections : fallback.sections,
      callToAction: callToAction || fallback.callToAction,
      closing: closing || fallback.closing,
    };
  }

  return {
    subject,
    previewText,
    greeting,
    sections,
    callToAction,
    closing,
  };
}

/**
 * Fallback email parsing when structured format not detected
 */
function fallbackParseEmail(text: string): {
  subject: string;
  previewText: string;
  greeting: string;
  sections: Array<{ heading: string; content: string }>;
  callToAction: string;
  closing: string;
} {
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);

  const subject =
    paragraphs[0]?.substring(0, MAX_SUBJECT_LENGTH) || "Important Update";
  const previewText =
    paragraphs[1]?.substring(0, MAX_PREVIEW_LENGTH) || subject;
  const greeting = paragraphs[2] || "Hello,";

  // Create sections from middle paragraphs
  const sections: Array<{ heading: string; content: string }> = [];
  for (let i = 3; i < Math.min(paragraphs.length - 2, 6); i++) {
    sections.push({
      heading: `Key Point ${i - 2}`,
      content: paragraphs[i],
    });
  }

  const callToAction =
    paragraphs[paragraphs.length - 2] ||
    "Reply to this email if you have questions.";
  const closing = paragraphs[paragraphs.length - 1] || "Best regards";

  return { subject, previewText, greeting, sections, callToAction, closing };
}

/**
 * Validate and enforce email format constraints
 * Requirement 7.8: Enforce character limits and truncate gracefully
 */
function validateAndFormatEmail(emailParts: {
  subject: string;
  previewText: string;
  greeting: string;
  sections: Array<{ heading: string; content: string }>;
  callToAction: string;
  closing: string;
}): {
  subject: string;
  previewText: string;
  body: string;
  sections: Array<{ heading: string; content: string }>;
  callToAction: string;
} {
  // Validate and truncate subject line
  let subject = emailParts.subject.trim();
  if (subject.length > MAX_SUBJECT_LENGTH) {
    const lastSpace = subject.lastIndexOf(" ", MAX_SUBJECT_LENGTH - 3);
    subject =
      subject.substring(0, lastSpace > 0 ? lastSpace : MAX_SUBJECT_LENGTH - 3) +
      "...";
  }

  // Validate and truncate preview text
  let previewText = emailParts.previewText.trim();
  if (previewText.length > MAX_PREVIEW_LENGTH) {
    const lastSpace = previewText.lastIndexOf(" ", MAX_PREVIEW_LENGTH - 3);
    previewText = `${previewText.substring(
      0,
      lastSpace > 0 ? lastSpace : MAX_PREVIEW_LENGTH - 3,
    )}...`;
  }

  // Build body with proper formatting
  let body = `${emailParts.greeting}\n\n`;

  for (const section of emailParts.sections) {
    body += `## ${section.heading}\n\n${section.content}\n\n`;
  }

  body += `---\n\n${emailParts.callToAction}\n\n${emailParts.closing}`;

  // Truncate body if exceeds max length
  if (body.length > MAX_EMAIL_LENGTH) {
    body =
      body.substring(0, MAX_EMAIL_LENGTH - 50) +
      "\n\n[Content truncated for length]";
  }

  return {
    subject,
    previewText,
    body,
    sections: emailParts.sections,
    callToAction: emailParts.callToAction,
  };
}

/**
 * Calculate engagement score for email
 * Requirement 7.10: Generate call-to-action appropriate for each platform
 */
function calculateEngagementScore(email: {
  subject: string;
  previewText: string;
  body: string;
  sections: Array<{ heading: string; content: string }>;
  callToAction: string;
}): number {
  let score = 5; // Base score

  // Subject line optimization
  const subjectLower = email.subject.toLowerCase();
  const hasQuestion = subjectLower.includes("?");
  const hasNumbers = /\d+/.test(email.subject);
  const hasPersonalization = /you|your/i.test(email.subject);

  if (hasQuestion || hasNumbers || hasPersonalization) {
    score += 1;
  }

  if (email.subject.length >= 30 && email.subject.length <= 50) {
    score += 1; // Optimal length
  }

  // Preview text alignment
  if (email.previewText.length >= 40) {
    score += 1;
  }

  // Section count optimization
  if (email.sections.length >= 3 && email.sections.length <= 5) {
    score += 1;
  }

  // Body length optimization (not too short, not too long)
  const wordCount = email.body.split(/\s+/).length;
  if (wordCount >= 300 && wordCount <= 1000) {
    score += 1;
  }

  // Clear CTA
  const ctaKeywords = [
    "click",
    "read",
    "reply",
    "download",
    "register",
    "join",
    "learn",
    "watch",
    "check",
  ];
  const hasClearCTA = ctaKeywords.some((keyword) =>
    email.callToAction.toLowerCase().includes(keyword),
  );
  if (hasClearCTA) {
    score += 1;
  }

  return Math.min(10, Math.max(1, score));
}

/**
 * Validate email newsletter quality
 * Requirement 7.11: Include confidence score indicating expected quality
 */
export function validateEmailNewsletter(email: EmailNewsletterOutput): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Validate subject line
  if (email.subject.length === 0) {
    issues.push("Subject line is missing");
  } else if (email.subject.length > MAX_SUBJECT_LENGTH) {
    issues.push(`Subject line exceeds ${MAX_SUBJECT_LENGTH} characters`);
  } else if (email.subject.length < 20) {
    issues.push("Subject line is too short (recommended: 30-50 characters)");
  }

  // Validate preview text
  if (email.previewText.length === 0) {
    issues.push("Preview text is missing");
  } else if (email.previewText.length > MAX_PREVIEW_LENGTH) {
    issues.push(`Preview text exceeds ${MAX_PREVIEW_LENGTH} characters`);
  }

  // Validate sections
  if (email.sections.length < 2) {
    issues.push("Email should have at least 2 content sections");
  } else if (email.sections.length > 6) {
    issues.push("Email has too many sections (recommended: 3-5)");
  }

  // Check for empty sections
  const emptySections = email.sections.filter(
    (section) => section.content.trim().length < 50,
  );
  if (emptySections.length > 0) {
    issues.push(`${emptySections.length} section(s) have insufficient content`);
  }

  // Validate CTA
  if (email.callToAction.length === 0) {
    issues.push("Call-to-action is missing");
  } else if (email.callToAction.length < 20) {
    issues.push("Call-to-action is too brief");
  }

  // Validate body length
  const wordCount = email.body.split(/\s+/).length;
  if (wordCount < 200) {
    issues.push("Email body is too short (recommended: 300-1000 words)");
  } else if (wordCount > 1500) {
    issues.push("Email body is too long (may have lower engagement)");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
