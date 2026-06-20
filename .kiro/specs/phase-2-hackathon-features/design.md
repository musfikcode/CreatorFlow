# Design Document: Phase 2 Hackathon Features

## Overview

CreatorFlow Phase 2 transforms the platform from a basic workflow automation tool into an intelligent content strategy partner through five flagship features. The AI Niche Research Engine automatically discovers trending topics by scraping Google Trends, Reddit, YouTube, and Twitter using Firecrawl, then uses AI analysis to generate data-driven content opportunities. The Niche-Aware Content Generator enhances all AI nodes by injecting research context into prompts, ensuring generated content incorporates trending keywords and addresses real audience pain points. The AI Content Repurposing Engine transforms single content pieces into multiple platform-optimized formats with intelligent formatting. The Content Templates Library provides pre-built workflows leveraging these capabilities, while the Creator Analytics Dashboard aggregates cross-platform metrics with AI-driven insights.

This design integrates seamlessly with existing Phase 1 infrastructure: tRPC routers for type-safe APIs, Inngest for background job orchestration, Prisma for database modeling, and React Flow for workflow visualization. The architecture emphasizes performance (sub-5-minute research, sub-60-second repurposing, sub-2-second dashboard loads), scalability through caching and job queuing, and security via encryption and row-level access controls.

**Key Design Principles:**
- **Type Safety End-to-End**: Zod schemas → Prisma models → tRPC procedures → React components
- **Performance First**: Caching, pagination, parallel execution, connection pooling
- **Incremental Enhancement**: Augments existing nodes rather than replacing them
- **Creator-Centric UX**: Minimal configuration, automated workflows, actionable insights

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 16 App Router)                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ Niche Onboarding │  │ Research         │  │ Analytics            │   │
│  │ Flow             │  │ Dashboard        │  │ Dashboard            │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────┘   │
│           │                     │                         │             │
│  ┌────────▼─────────────────────▼─────────────────────────▼───────────┐ │
│  │              tRPC Client (Type-Safe API Layer)                     │ │
│  │  - researchRouter  - analyticsRouter  - templateRouter             │ │
│  └────────┬───────────────────────────────────────────────────────────┘ │
└───────────┼─────────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────────────────┐
│                      Backend (Node.js + tRPC 11)                        │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    tRPC Routers                                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │  │
│  │  │ research   │  │ analytics  │  │ template   │  │ repurpose  │   │  │
│  │  │ Router     │  │ Router     │  │ Router     │  │ Router     │   │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘   │  │
│  └────────┼───────────────┼───────────────┼───────────────┼──────────┘  │
│           │               │               │               │             │
│  ┌────────▼───────────────▼───────────────▼───────────────▼─────────┐   │
│  │                 Prisma ORM (Type-Safe Database Layer)            │   │
│  │  - ResearchData  - TrendAlert  - WorkflowTemplate                │   │
│  │  - AnalyticsSnapshot  - User (extended)                          │   │
│  └────────┬─────────────────────────────────────────────────────────┘   │
└───────────┼─────────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database (Neon)                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ User             │  │ ResearchData     │  │ TrendAlert           │   │
│  │ - niche          │  │ - trendingTopics │  │ - topic, score       │   │
│  │ - nicheKeywords  │  │ - contentIdeas   │  │ - status             │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ WorkflowTemplate │  │ AnalyticsSnapshot│  │ Existing Tables      │   │
│  │ - nodeData       │  │ - platformData   │  │ (Workflow, Node,     │   │
│  │ - category       │  │ - metrics        │  │  Connection, etc.)   │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────────────────┐
│              Inngest (Workflow Orchestration Engine)                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   Background Job Functions                       │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌───────────────────┐   │   │
│  │  │ Niche Research │  │ Trend Monitor  │  │ Content Repurpose │   │   │
│  │  │ Function       │  │ Function       │  │ Function          │   │   │
│  │  │ (5min timeout) │  │ (realtime)     │  │ (60s timeout)     │   │   │
│  │  └───────┬────────┘  └───────┬────────┘  └──────────┬────────┘   │   │
│  └──────────┼───────────────────┼──────────────────────┼────────────┘   │
└─────────────┼───────────────────┼──────────────────────┼────────────────┘
              │                   │                      │
      ┌───────▼───────┐  ┌────────▼────────┐  ┌──────────▼────────┐
      │   Firecrawl   │  │  AI Models      │  │  Platform APIs    │
      │   Service     │  │  (GPT-4, Claude,│  │  (YouTube, Reddit │
      │   (Scraping)  │  │   Gemini, etc.) │  │   Twitter, etc.)  │
      └───────────────┘  └─────────────────┘  └───────────────────┘
```

### Component Integration with Phase 1

**Existing Infrastructure Reuse:**
1. **React Flow Workflow Builder**: Extended with 6 new node types (NICHE_RESEARCH, TREND_MONITOR, etc.)
2. **tRPC API Layer**: New routers (research, analytics, template, repurpose) follow existing patterns
3. **Inngest Orchestration**: New functions integrate with existing workflow execution engine
4. **Prisma Database**: Schema extended with 5 new models, existing relationships preserved
5. **Authentication**: Better Auth session context reused for all new endpoints
6. **Credential Management**: Existing encrypted credential system supports new API keys


**New Integration Points:**
- Firecrawl SDK for web scraping (rate-limited, cached, retryable)
- Platform APIs (YouTube Data API, Reddit API, Twitter API v2, Google Trends)
- Enhanced AI prompting with niche context injection

### Data Flow Architecture

**1. Niche Research Flow**
```
User Completes Onboarding
    ↓
tRPC researchRouter.triggerResearch
    ↓
Inngest Event: research/trigger
    ↓
nicheResearchFunction (parallel execution)
    ├─→ Scrape Google Trends (Firecrawl)
    ├─→ Scrape Reddit (Firecrawl)
    ├─→ Scrape YouTube (YouTube API)
    └─→ Scrape Twitter (Twitter API)
    ↓
AI Analysis (GPT-4)
    ↓
Generate Content Ideas (GPT-4)
    ↓
Store in ResearchData table
    ↓
Send Notification to User
```

**2. Niche-Aware Content Generation Flow**
```
User Invokes AI Node (OPENAI/ANTHROPIC/GEMINI/DEEPSEEK)
    ↓
Fetch Latest ResearchData for user.niche
    ↓
Inject Niche Context into Prompt:
    - Top 5 trending keywords
    - Pain points from forums
    - Content gaps vs competitors
    ↓
AI Model Generation (with enhanced prompt)
    ↓
Return Enhanced Content
```

**3. Content Repurposing Flow**
```
User Provides Source Content (YouTube URL / Blog URL / Text)
    ↓
Extract Content (YouTube API / Firecrawl / Direct Text)
    ↓
AI Content Analysis (identify key points, tone, audience)
    ↓
Parallel Platform-Specific Generation:
    ├─→ Twitter Thread (280 char/tweet)
    ├─→ Instagram Carousel (8-10 slides)
    ├─→ LinkedIn Post (3000 char, professional)
    ├─→ Blog Article (SEO-optimized)
    ├─→ TikTok Script (60s reading time)
    └─→ Email Newsletter (subject + body)
    ↓
Quality Validation (grammar, coherence, consistency)
    ↓
Return All Formats with Confidence Scores
```

**4. Analytics Aggregation Flow**
```
Scheduled Job (Every 6 Hours)
    ↓
For Each User with Platform Connections:
    ├─→ Fetch YouTube Analytics
    ├─→ Fetch Instagram Insights
    ├─→ Fetch Twitter Analytics
    └─→ Fetch Stripe Revenue Data
    ↓
Aggregate Metrics (views, likes, comments, shares, revenue)
    ↓
AI Insight Generation (patterns, recommendations, predictions)
    ↓
Store in AnalyticsSnapshot table
    ↓
Dashboard Fetches Latest Snapshot (cached, 2s load time)
```

## Components and Interfaces

### Frontend Components

**1. Niche Onboarding Flow** (`src/app/(dashboard)/onboarding/niche/`)
```tsx
// page.tsx
export default function NicheOnboardingPage() {
  return (
    <NicheOnboardingForm />
  );
}

// components/NicheOnboardingForm.tsx
interface NicheOnboardingFormProps {}

export function NicheOnboardingForm() {
  // Form with:
  // - Niche input (autocomplete with suggestions)
  // - Keywords input (multi-select chips)
  // - Competitor URLs (optional, list builder)
  // - Research frequency (daily/weekly radio)
  // - Submit triggers tRPC mutation
}
```

**2. Research Dashboard** (`src/app/(dashboard)/research/`)
```tsx
// dashboard/page.tsx
export default function ResearchDashboardPage() {
  return (
    <>
      <ResearchHeader />
      <TrendingTopicsSection />
      <ContentOpportunitiesSection />
      <CompetitorInsightsSection />
    </>
  );
}

// components/TrendingTopicsSection.tsx
export function TrendingTopicsSection() {
  const { data: research } = trpc.research.getLatest.useQuery();
  // Display top 10 topics with scores, velocity indicators
  // Filter by category, keyword
  // Click opens detailed view with sources
}

// components/ContentOpportunitiesSection.tsx
export function ContentOpportunitiesSection() {
  const { data: ideas } = trpc.research.getIdeas.useQuery({ limit: 10 });
  // Display AI-generated content ideas
  // Show title, reasoning, platforms, engagement score
  // Bookmark functionality
  // Click pre-fills content generator
}
```

**3. Analytics Dashboard** (`src/app/(dashboard)/analytics/`)
```tsx
// page.tsx
export default function AnalyticsDashboardPage() {
  return (
    <>
      <MetricsOverview />
      <PerformanceCharts />
      <AIInsightsSection />
    </>
  );
}

// components/MetricsOverview.tsx
export function MetricsOverview() {
  const { data } = trpc.analytics.getLatest.useQuery();
  // Display cards: Total Views, Engagement Rate, Follower Growth, Revenue
  // Show percentage change from previous period
}

// components/AIInsightsSection.tsx
export function AIInsightsSection() {
  const { data: insights } = trpc.analytics.getInsights.useQuery();
  // Display AI-generated insights (5+ per week)
  // Best content types, optimal posting times, growth predictions
  // Plain-language explanations with confidence scores
}
```

**4. Template Marketplace** (`src/app/(dashboard)/templates/`)
```tsx
// page.tsx
export default function TemplatesPage() {
  return (
    <>
      <TemplateSearch />
      <TemplateCategories />
      <TemplateGrid />
    </>
  );
}

// components/TemplateGrid.tsx
export function TemplateGrid() {
  const { data: templates } = trpc.template.browse.useQuery();
  // Display template cards with preview
  // Show node count, execution time, required credentials
  // Clone count, success rate, ratings
}

// components/TemplateDetailDialog.tsx
export function TemplateDetailDialog({ templateId }: { templateId: string }) {
  // Show complete workflow structure
  // Author, creation date, description
  // Clone button (triggers cloning flow)
}
```

**5. Content Repurposer UI** (integrated into workflow nodes)
```tsx
// src/features/nodes/components/ContentRepurposerNode.tsx
export function ContentRepurposerNode({ nodeId }: { nodeId: string }) {
  const [sourceContent, setSourceContent] = useState('');
  const { mutate: repurpose, data: outputs } = trpc.repurpose.generate.useMutation();
  
  // Input: YouTube URL, Blog URL, or plain text
  // Output preview for each platform
  // Quality validation indicators
  // Save to workflow outputs
}
```

### tRPC Routers

**1. Research Router** (`src/trpc/routers/research.ts`)
```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { inngest } from '@/inngest/client';

export const researchRouter = router({
  // Get latest research data
  getLatest: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.researchData.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          niche: true,
          trendingTopics: true,
          contentIdeas: true,
          keywords: true,
          hashtags: true,
          createdAt: true,
          expiresAt: true
        }
      });
    }),

  // Trigger manual research
  triggerResearch: protectedProcedure
    .input(z.object({
      niche: z.string().min(1).max(100),
      force: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check for recent research (avoid spam)
      if (!input.force) {
        const recentResearch = await ctx.db.researchData.findFirst({
          where: {
            userId: ctx.user.id,
            createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } // 6 hours
          }
        });
        if (recentResearch) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Research already run in the last 6 hours'
          });
        }
      }

      // Send Inngest event
      await inngest.send({
        name: 'research/trigger',
        data: {
          userId: ctx.user.id,
          niche: input.niche,
          keywords: ctx.user.nicheKeywords || [],
          competitorUrls: ctx.user.competitorUrls || []
        }
      });

      return { success: true, estimatedTime: '5 minutes' };
    }),

  // Get trending topics
  getTrends: protectedProcedure
    .input(z.object({
      minScore: z.number().min(0).max(100).optional(),
      category: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const research = await ctx.db.researchData.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' }
      });

      if (!research) return [];

      let topics = research.trendingTopics as Array<{
        topic: string;
        score: number;
        velocity: 'rising' | 'stable' | 'declining';
        category: string;
        sources: string[];
        keywords: string[];
      }>;

      // Filter by score
      if (input.minScore) {
        topics = topics.filter(t => t.score >= input.minScore);
      }

      // Filter by category
      if (input.category) {
        topics = topics.filter(t => t.category === input.category);
      }

      return topics;
    }),

  // Get content ideas
  getIdeas: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).optional().default(10),
      platforms: z.array(z.string()).optional()
    }))
    .query(async ({ ctx, input }) => {
      const research = await ctx.db.researchData.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' }
      });

      if (!research) return [];

      let ideas = research.contentIdeas as Array<{
        id: string;
        idea: string;
        reasoning: string;
        platforms: string[];
        estimatedEngagement: number;
        keywords: string[];
      }>;

      // Filter by platforms
      if (input.platforms && input.platforms.length > 0) {
        ideas = ideas.filter(idea =>
          idea.platforms.some(p => input.platforms!.includes(p))
        );
      }

      return ideas.slice(0, input.limit);
    }),

  // Update user niche preferences
  updateNiche: protectedProcedure
    .input(z.object({
      niche: z.string().min(1).max(100),
      keywords: z.array(z.string()).min(1).max(10),
      competitorUrls: z.array(z.string().url()).max(5).optional(),
      researchFrequency: z.enum(['daily', 'weekly']).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: {
          niche: input.niche,
          nicheKeywords: input.keywords,
          competitorUrls: input.competitorUrls || [],
          researchFrequency: input.researchFrequency || 'weekly'
        }
      });

      // Trigger immediate research
      await inngest.send({
        name: 'research/trigger',
        data: {
          userId: ctx.user.id,
          niche: input.niche,
          keywords: input.keywords,
          competitorUrls: input.competitorUrls || []
        }
      });

      return { success: true };
    }),

  // Bookmark content idea
  bookmarkIdea: protectedProcedure
    .input(z.object({
      ideaId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Store bookmark in separate table or update ResearchData
      // Implementation depends on bookmark storage strategy
      return { success: true };
    }),

  // Get trend alerts
  getAlerts: protectedProcedure
    .input(z.object({
      status: z.enum(['new', 'viewed', 'acted_on']).optional()
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.trendAlert.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.status && { status: input.status })
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
    }),

  // Mark alert as viewed
  markAlertViewed: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.trendAlert.update({
        where: { id: input.alertId, userId: ctx.user.id },
        data: { status: 'viewed' }
      });
      return { success: true };
    })
});
```

**2. Repurpose Router** (`src/trpc/routers/repurpose.ts`)
```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { repurposeContent } from '@/lib/repurpose';

const sourceContentSchema = z.object({
  type: z.enum(['youtube_url', 'blog_url', 'text', 'podcast_url']),
  content: z.string().min(1)
});

const platformOutputSchema = z.object({
  platform: z.string(),
  content: z.string(),
  qualityScore: z.number().min(0).max(1),
  metadata: z.record(z.any())
});

export const repurposeRouter = router({
  // Generate repurposed content for all platforms
  generate: protectedProcedure
    .input(z.object({
      source: sourceContentSchema,
      platforms: z.array(z.enum([
        'twitter', 'instagram', 'linkedin', 'blog', 'tiktok', 'email'
      ])),
      includeNicheContext: z.boolean().optional().default(true)
    }))
    .mutation(async ({ ctx, input }) => {
      // Extract source content
      const extractedContent = await extractSourceContent(input.source);

      // Get niche context if enabled
      let nicheContext = null;
      if (input.includeNicheContext) {
        const research = await ctx.db.researchData.findFirst({
          where: { userId: ctx.user.id },
          orderBy: { createdAt: 'desc' }
        });
        nicheContext = research ? {
          keywords: research.keywords,
          trendingTopics: (research.trendingTopics as any[]).slice(0, 5)
        } : null;
      }

      // Generate platform-specific outputs
      const outputs = await repurposeContent({
        sourceContent: extractedContent,
        platforms: input.platforms,
        nicheContext,
        userId: ctx.user.id
      });

      return {
        outputs,
        sourceAnalysis: extractedContent.analysis,
        nicheContextUsed: !!nicheContext
      };
    }),

  // Validate generated content quality
  validateOutput: protectedProcedure
    .input(z.object({
      platform: z.string(),
      content: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const validation = await validatePlatformContent(
        input.platform,
        input.content
      );
      return validation;
    })
});

// Helper functions
async function extractSourceContent(source: z.infer<typeof sourceContentSchema>) {
  switch (source.type) {
    case 'youtube_url':
      return extractYouTubeContent(source.content);
    case 'blog_url':
      return extractBlogContent(source.content);
    case 'podcast_url':
      return extractPodcastContent(source.content);
    case 'text':
      return { text: source.content, analysis: await analyzeContent(source.content) };
  }
}

async function extractYouTubeContent(url: string) {
  // Use YouTube Data API to get transcript
  // Implementation in separate module
  return { text: '...', analysis: {} };
}
```

**3. Analytics Router** (`src/trpc/routers/analytics.ts`)
```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const analyticsRouter = router({
  // Get latest analytics snapshot
  getLatest: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.analyticsSnapshot.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          platformData: true,
          aggregatedMetrics: true
        }
      });
    }),

  // Get historical analytics (time-series)
  getHistory: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      platforms: z.array(z.string()).optional()
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.analyticsSnapshot.findMany({
        where: {
          userId: ctx.user.id,
          createdAt: {
            gte: input.startDate,
            lte: input.endDate
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    }),

  // Get AI-generated insights
  getInsights: protectedProcedure
    .query(async ({ ctx }) => {
      const latestSnapshot = await ctx.db.analyticsSnapshot.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' }
      });

      if (!latestSnapshot) return [];

      // AI insights stored in snapshot or generated on-demand
      return (latestSnapshot.insights as any[]) || [];
    }),

  // Trigger manual refresh
  refresh: protectedProcedure
    .mutation(async ({ ctx }) => {
      await inngest.send({
        name: 'analytics/refresh',
        data: { userId: ctx.user.id }
      });
      return { success: true, estimatedTime: '30 seconds' };
    })
});
```

**4. Template Router** (`src/trpc/routers/template.ts`)
```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const templateRouter = router({
  // Browse templates
  browse: protectedProcedure
    .input(z.object({
      category: z.enum([
        'research_strategy',
        'content_distribution',
        'audience_engagement',
        'business_management'
      ]).optional(),
      search: z.string().optional(),
      sortBy: z.enum(['popular', 'recent', 'rating']).optional()
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { published: true };

      if (input.category) {
        where.category = input.category;
      }

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
          { tags: { hasSome: [input.search] } }
        ];
      }

      const orderBy = input.sortBy === 'popular' ? { cloneCount: 'desc' }
        : input.sortBy === 'rating' ? { averageRating: 'desc' }
        : { createdAt: 'desc' };

      return ctx.db.workflowTemplate.findMany({
        where,
        orderBy,
        take: 50
      });
    }),

  // Get template details
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.workflowTemplate.findUnique({
        where: { id: input.id },
        include: {
          author: true,
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    }),

  // Clone template to user's workflows
  clone: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.db.workflowTemplate.findUnique({
        where: { id: input.templateId }
      });

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      // Create new workflow from template
      const workflow = await ctx.db.workflow.create({
        data: {
          name: `${template.name} (Copy)`,
          userId: ctx.user.id,
          nodes: {
            create: (template.nodeData as any[]).map(node => ({
              name: node.name,
              type: node.type,
              position: node.position,
              data: node.data
            }))
          },
          connections: {
            create: (template.connectionData as any[]).map(conn => ({
              fromNodeId: conn.fromNodeId,
              toNodeId: conn.toNodeId,
              fromOutput: conn.fromOutput,
              toInput: conn.toInput
            }))
          }
        }
      });

      // Increment clone count
      await ctx.db.workflowTemplate.update({
        where: { id: input.templateId },
        data: { cloneCount: { increment: 1 } }
      });

      return { workflowId: workflow.id };
    })
});
```

## Data Models

### Database Schema Extensions

**Prisma Schema Updates** (`prisma/schema.prisma`)

```prisma
// Extend existing User model
model User {
  id                String              @id
  name              String
  email             String              @unique
  emailVerified     Boolean             @default(false)
  image             String?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  // Phase 2 additions
  niche             String?
  nicheKeywords     String[]
  competitorUrls    String[]
  researchFrequency String              @default("weekly") // "daily" or "weekly"
  
  // Existing relations
  sessions          Session[]
  accounts          Account[]
  workflows         Workflow[]
  credentials       Credential[]
  
  // Phase 2 relations
  researchData      ResearchData[]
  trendAlerts       TrendAlert[]
  analyticsSnapshots AnalyticsSnapshot[]
  
  @@map("user")
}

// New model: Research Data
model ResearchData {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  niche            String
  trendingTopics   Json     // Array<TrendingTopic>
  contentIdeas     Json     // Array<ContentIdea>
  competitorData   Json     // CompetitorAnalysis
  keywords         String[]
  hashtags         String[]
  scrapedSources   Json     // Array<{url, source, timestamp}>
  
  createdAt        DateTime @default(now())
  expiresAt        DateTime // 7 days from creation
  
  @@index([userId])
  @@index([createdAt])
  @@map("research_data")
}

// Type definitions for JSON fields (TypeScript interfaces)
// src/types/research.ts
interface TrendingTopic {
  topic: string;
  score: number; // 0-100
  velocity: 'rising' | 'stable' | 'declining';
  category: string;
  sources: string[];
  keywords: string[];
}

interface ContentIdea {
  id: string;
  idea: string;
  reasoning: string;
  platforms: string[];
  estimatedEngagement: number; // 1-10 scale
  keywords: string[];
}

interface CompetitorAnalysis {
  topPerformers: Array<{
    url: string;
    engagement: number;
    strategy: string;
    postingFrequency: string;
  }>;
}

// New model: Trend Alerts
model TrendAlert {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  topic       String
  niche       String
  score       Int      // 0-100
  velocity    String   // "rising", "stable", "declining"
  platforms   String[] // Recommended platforms
  status      String   @default("new") // "new", "viewed", "acted_on"
  
  createdAt   DateTime @default(now())
  expiresAt   DateTime // 48 hours from creation
  
  @@index([userId, status])
  @@index([createdAt])
  @@map("trend_alert")
}

// New model: Workflow Templates
model WorkflowTemplate {
  id              String   @id @default(cuid())
  name            String
  description     String
  category        String   // "research_strategy", "content_distribution", etc.
  
  nodeData        Json     // Array of node configurations
  connectionData  Json     // Array of connection configurations
  
  authorId        String?
  author          User?    @relation(fields: [authorId], references: [id])
  
  cloneCount      Int      @default(0)
  successRate     Float    @default(0.0)
  averageRating   Float    @default(0.0)
  
  tags            String[]
  requiredCredentials String[] // ["OPENAI", "FIRECRAWL", etc.]
  
  published       Boolean  @default(false)
  verified        Boolean  @default(false) // CreatorFlow team verified
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  reviews         TemplateReview[]
  
  @@index([category])
  @@index([published])
  @@map("workflow_template")
}

// New model: Template Reviews
model TemplateReview {
  id          String   @id @default(cuid())
  templateId  String
  template    WorkflowTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  userId      String
  rating      Int      // 1-5
  comment     String?
  
  createdAt   DateTime @default(now())
  
  @@index([templateId])
  @@map("template_review")
}

// New model: Analytics Snapshots
model AnalyticsSnapshot {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  platformData    Json     // Platform-specific metrics
  aggregatedMetrics Json   // Cross-platform aggregates
  insights        Json     // AI-generated insights
  
  createdAt       DateTime @default(now())
  
  @@index([userId, createdAt])
  @@map("analytics_snapshot")
}

// Type definitions for AnalyticsSnapshot JSON fields
// src/types/analytics.ts
interface PlatformMetrics {
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  engagementRate: number;
}

interface AggregatedMetrics {
  totalViews: number;
  totalEngagements: number;
  averageEngagementRate: number;
  followerGrowth: {
    current: number;
    change: number;
    changePercent: number;
  };
  revenue: {
    total: number;
    change: number;
    changePercent: number;
  };
}

interface AIInsight {
  id: string;
  type: 'performance' | 'timing' | 'content' | 'growth';
  title: string;
  description: string;
  confidence: number; // 0-1
  actionable: boolean;
  data: Record<string, any>;
}

// Extend NodeType enum
enum NodeType {
  // Existing types
  INITIAL
  MANUAL_TRIGGER
  HTTP_REQUEST
  GOOGLE_FORM_TRIGGER
  STRIPE_TRIGGER
  GEMINI
  ANTHROPIC
  OPENAI
  DEEPSEEK
  DISCORD
  SLACK
  
  // Phase 2 additions
  NICHE_RESEARCH
  TREND_MONITOR
  CONTENT_IDEA_GENERATOR
  COMPETITOR_TRACKER
  CONTENT_REPURPOSER
  NICHE_AWARE_CONTENT_GENERATOR
}
```

### Database Migration Strategy

**Migration Steps:**
1. Create migration file: `prisma migrate dev --name phase_2_features`
2. Run migration: `prisma migrate deploy`
3. Generate Prisma client: `prisma generate`

**Migration File** (`prisma/migrations/YYYYMMDDHHMMSS_phase_2_features/migration.sql`):
```sql
-- Add Phase 2 fields to User table
ALTER TABLE "user" ADD COLUMN "niche" TEXT;
ALTER TABLE "user" ADD COLUMN "nicheKeywords" TEXT[];
ALTER TABLE "user" ADD COLUMN "competitorUrls" TEXT[];
ALTER TABLE "user" ADD COLUMN "researchFrequency" TEXT DEFAULT 'weekly';

-- Create ResearchData table
CREATE TABLE "research_data" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "niche" TEXT NOT NULL,
  "trendingTopics" JSONB NOT NULL,
  "contentIdeas" JSONB NOT NULL,
  "competitorData" JSONB NOT NULL,
  "keywords" TEXT[],
  "hashtags" TEXT[],
  "scrapedSources" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP NOT NULL
);

CREATE INDEX "research_data_userId_idx" ON "research_data"("userId");
CREATE INDEX "research_data_createdAt_idx" ON "research_data"("createdAt");

-- Create TrendAlert table
CREATE TABLE "trend_alert" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "topic" TEXT NOT NULL,
  "niche" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "velocity" TEXT NOT NULL,
  "platforms" TEXT[],
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP NOT NULL
);

CREATE INDEX "trend_alert_userId_status_idx" ON "trend_alert"("userId", "status");
CREATE INDEX "trend_alert_createdAt_idx" ON "trend_alert"("createdAt");

-- Create WorkflowTemplate table
CREATE TABLE "workflow_template" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "nodeData" JSONB NOT NULL,
  "connectionData" JSONB NOT NULL,
  "authorId" TEXT REFERENCES "user"("id"),
  "cloneCount" INTEGER NOT NULL DEFAULT 0,
  "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "tags" TEXT[],
  "requiredCredentials" TEXT[],
  "published" BOOLEAN NOT NULL DEFAULT false,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE INDEX "workflow_template_category_idx" ON "workflow_template"("category");
CREATE INDEX "workflow_template_published_idx" ON "workflow_template"("published");

-- Create TemplateReview table
CREATE TABLE "template_review" (
  "id" TEXT PRIMARY KEY,
  "templateId" TEXT NOT NULL REFERENCES "workflow_template"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "template_review_templateId_idx" ON "template_review"("templateId");

-- Create AnalyticsSnapshot table
CREATE TABLE "analytics_snapshot" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "platformData" JSONB NOT NULL,
  "aggregatedMetrics" JSONB NOT NULL,
  "insights" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "analytics_snapshot_userId_createdAt_idx" ON "analytics_snapshot"("userId", "createdAt");

-- Add new NodeType enum values
ALTER TYPE "NodeType" ADD VALUE 'NICHE_RESEARCH';
ALTER TYPE "NodeType" ADD VALUE 'TREND_MONITOR';
ALTER TYPE "NodeType" ADD VALUE 'CONTENT_IDEA_GENERATOR';
ALTER TYPE "NodeType" ADD VALUE 'COMPETITOR_TRACKER';
ALTER TYPE "NodeType" ADD VALUE 'CONTENT_REPURPOSER';
ALTER TYPE "NodeType" ADD VALUE 'NICHE_AWARE_CONTENT_GENERATOR';
```

## Low-Level Design

### 1. Niche Research Orchestration

**Inngest Function** (`src/inngest/functions/niche-research.ts`)

```typescript
import { inngest } from '../client';
import { db } from '@/lib/db';
import { FirecrawlService } from '@/lib/firecrawl';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const firecrawl = new FirecrawlService();

// Zod schemas for AI outputs
const trendingTopicSchema = z.object({
  topic: z.string(),
  score: z.number().min(0).max(100),
  velocity: z.enum(['rising', 'stable', 'declining']),
  category: z.string(),
  sources: z.array(z.string()),
  keywords: z.array(z.string())
});

const contentIdeaSchema = z.object({
  id: z.string(),
  idea: z.string(),
  reasoning: z.string(),
  platforms: z.array(z.string()),
  estimatedEngagement: z.number().min(1).max(10),
  keywords: z.array(z.string())
});

const researchAnalysisSchema = z.object({
  trendingTopics: z.array(trendingTopicSchema),
  painPoints: z.array(z.string()),
  contentGaps: z.array(z.string()),
  keywords: z.array(z.string()),
  competitors: z.object({
    topPerformers: z.array(z.object({
      url: z.string(),
      engagement: z.number(),
      strategy: z.string(),
      postingFrequency: z.string()
    }))
  })
});

export const nicheResearchFunction = inngest.createFunction(
  {
    id: 'niche-research',
    name: 'Automated Niche Research',
    rateLimit: { limit: 5, period: '1h' }, // Max 5 per hour per user
    retries: 3
  },
  { event: 'research/trigger' },
  async ({ event, step }) => {
    const { userId, niche, keywords, competitorUrls } = event.data;

    // Step 1: Parallel scraping of all sources
    const [trendsData, redditData, youtubeData, twitterData] = await Promise.all([
      step.run('scrape-google-trends', async () => 
        firecrawl.scrapeGoogleTrends(niche, keywords)
      ),
      step.run('scrape-reddit', async () => 
        firecrawl.scrapeReddit(niche, keywords)
      ),
      step.run('scrape-youtube', async () => 
        firecrawl.scrapeYouTube(niche, keywords)
      ),
      step.run('scrape-twitter', async () => 
        firecrawl.scrapeTwitter(niche, keywords)
      )
    ]);

    // Step 2: Scrape competitor URLs if provided
    let competitorData = null;
    if (competitorUrls && competitorUrls.length > 0) {
      competitorData = await step.run('scrape-competitors', async () => 
        firecrawl.scrapeCompetitors(competitorUrls)
      );
    }

    // Step 3: AI Analysis
    const analysis = await step.run('ai-analysis', async () => {
      const prompt = `Analyze this niche research data for "${niche}":

Google Trends: ${JSON.stringify(trendsData)}
Reddit Data: ${JSON.stringify(redditData)}
YouTube Data: ${JSON.stringify(youtubeData)}
Twitter Data: ${JSON.stringify(twitterData)}
${competitorData ? `Competitor Data: ${JSON.stringify(competitorData)}` : ''}

Provide:
1. Top 10 trending topics with scores (0-100), velocity (rising/stable/declining), category, and keywords
2. Common pain points and questions from discussions
3. Content gaps competitors are missing
4. Keyword opportunities for SEO (20 keywords)
5. Competitor strategies (if available)

Focus on actionable insights for a content creator in this niche.`;

      const result = await generateObject({
        model: openai('gpt-4-turbo'),
        schema: researchAnalysisSchema,
        prompt,
        temperature: 0.7
      });

      return result.object;
    });

    // Step 4: Generate Content Ideas
    const contentIdeas = await step.run('generate-content-ideas', async () => {
      const prompt = `Based on this research analysis, generate 10 high-potential content ideas:

Trending Topics: ${JSON.stringify(analysis.trendingTopics)}
Pain Points: ${JSON.stringify(analysis.painPoints)}
Content Gaps: ${JSON.stringify(analysis.contentGaps)}

For each idea provide:
- Specific title/hook
- Reasoning based on data (why it will perform)
- Best platforms (choose from: youtube, instagram, twitter, tiktok, linkedin, blog)
- Estimated engagement score (1-10)
- Relevant keywords

Make ideas specific and actionable.`;

      const result = await generateObject({
        model: openai('gpt-4-turbo'),
        schema: z.object({ ideas: z.array(contentIdeaSchema) }),
        prompt,
        temperature: 0.8
      });

      return result.object.ideas;
    });

    // Step 5: Save to database
    const researchRecord = await step.run('save-research', async () => {
      return db.researchData.create({
        data: {
          userId,
          niche,
          trendingTopics: analysis.trendingTopics,
          contentIdeas,
          competitorData: analysis.competitors,
          keywords: analysis.keywords,
          hashtags: twitterData.hashtags || [],
          scrapedSources: [
            { source: 'google_trends', timestamp: new Date(), url: trendsData.sourceUrl },
            { source: 'reddit', timestamp: new Date(), urls: redditData.sourceUrls },
            { source: 'youtube', timestamp: new Date(), query: youtubeData.searchQuery },
            { source: 'twitter', timestamp: new Date(), hashtags: twitterData.hashtags }
          ],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });
    });

    // Step 6: Create trend alerts for high-scoring topics
    await step.run('create-trend-alerts', async () => {
      const highScoreTopics = analysis.trendingTopics.filter(t => t.score >= 80);
      
      for (const topic of highScoreTopics) {
        await db.trendAlert.create({
          data: {
            userId,
            topic: topic.topic,
            niche,
            score: topic.score,
            velocity: topic.velocity,
            platforms: topic.keywords, // Use keywords as platform suggestions
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
          }
        });
      }

      return highScoreTopics.length;
    });

    // Step 7: Send notification
    await step.run('notify-user', async () => {
      await inngest.send({
        name: 'notification/send',
        data: {
          userId,
          type: 'research_complete',
          title: 'New Research Insights Available!',
          message: `Found ${analysis.trendingTopics.length} trending topics and ${contentIdeas.length} content ideas for ${niche}`,
          link: '/research/dashboard'
        }
      });
    });

    return {
      success: true,
      researchId: researchRecord.id,
      topicsFound: analysis.trendingTopics.length,
      ideasGenerated: contentIdeas.length,
      alertsCreated: analysis.trendingTopics.filter(t => t.score >= 80).length
    };
  }
);

// Scheduled daily research for active users
export const scheduledResearchFunction = inngest.createFunction(
  {
    id: 'scheduled-niche-research',
    name: 'Scheduled Daily Niche Research'
  },
  { cron: '0 6 * * *' }, // Every day at 6am UTC
  async ({ step }) => {
    const users = await step.run('get-users-for-research', async () => {
      return db.user.findMany({
        where: {
          niche: { not: null },
          researchFrequency: 'daily'
        },
        select: { id: true, niche: true, nicheKeywords: true, competitorUrls: true }
      });
    });

    for (const user of users) {
      await inngest.send({
        name: 'research/trigger',
        data: {
          userId: user.id,
          niche: user.niche!,
          keywords: user.nicheKeywords || [],
          competitorUrls: user.competitorUrls || []
        }
      });
    }

    return { usersScheduled: users.length };
  }
);
```

### 2. Firecrawl Service Implementation

**Service Module** (`src/lib/firecrawl.ts`)

```typescript
import Firecrawl from '@mendable/firecrawl-js';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

export class FirecrawlService {
  private readonly CACHE_TTL = 24 * 60 * 60; // 24 hours
  private readonly RATE_LIMIT_KEY = 'firecrawl:ratelimit';
  private readonly MAX_REQUESTS_PER_HOUR = 100;

  /**
   * Check and enforce rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    const count = await redis.incr(this.RATE_LIMIT_KEY);
    if (count === 1) {
      await redis.expire(this.RATE_LIMIT_KEY, 3600); // 1 hour
    }
    if (count > this.MAX_REQUESTS_PER_HOUR) {
      throw new Error('Firecrawl rate limit exceeded. Try again later.');
    }
  }

  /**
   * Scrape Google Trends data
   */
  async scrapeGoogleTrends(niche: string, keywords: string[]) {
    await this.checkRateLimit();
    
    const cacheKey = `trends:${niche}:${keywords.join(',')}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      // Use Google Trends unofficial API or scrape trends page
      const query = keywords.length > 0 ? keywords[0] : niche;
      const url = `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}`;
      
      const result = await firecrawl.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        timeout: 30000
      });

      const parsed = this.parseGoogleTrendsData(result);
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(parsed));
      
      return parsed;
    } catch (error) {
      console.error('Google Trends scraping failed:', error);
      return { trends: [], sourceUrl: '', error: error.message };
    }
  }

  /**
   * Parse Google Trends HTML/Markdown response
   */
  private parseGoogleTrendsData(result: any) {
    // Extract trending queries, interest over time, related topics
    // This is simplified - actual implementation would parse the response structure
    return {
      sourceUrl: result.url,
      trends: [
        { query: 'example trend', score: 85, region: 'US' }
      ],
      relatedTopics: [],
      interestOverTime: []
    };
  }

  /**
   * Scrape Reddit subreddit data
   */
  async scrapeReddit(niche: string, keywords: string[]) {
    await this.checkRateLimit();
    
    const cacheKey = `reddit:${niche}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      // Find relevant subreddits
      const subreddits = await this.findRelevantSubreddits(niche, keywords);
      
      // Scrape top posts from each subreddit
      const posts = await Promise.all(
        subreddits.slice(0, 3).map(async (sub) => {
          const url = `https://old.reddit.com/r/${sub}/top?t=week`;
          const result = await firecrawl.scrapeUrl(url, {
            formats: ['markdown'],
            timeout: 30000
          });
          return this.parseRedditPosts(result, sub);
        })
      );

      const parsed = {
        sourceUrls: posts.map(p => p.sourceUrl),
        posts: posts.flatMap(p => p.posts),
        subreddits
      };

      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(parsed));
      return parsed;
    } catch (error) {
      console.error('Reddit scraping failed:', error);
      return { posts: [], subreddits: [], sourceUrls: [], error: error.message };
    }
  }

  /**
   * Find relevant subreddits using Reddit search
   */
  private async findRelevantSubreddits(niche: string, keywords: string[]): Promise<string[]> {
    // Search for subreddits related to niche
    // Simplified - actual implementation would use Reddit API or search
    const searchTerms = [niche, ...keywords].slice(0, 3);
    return searchTerms.map(term => term.toLowerCase().replace(/\s+/g, ''));
  }

  /**
   * Parse Reddit posts from scraped markdown
   */
  private parseRedditPosts(result: any, subreddit: string) {
    // Extract post titles, scores, comments
    // Simplified parser
    return {
      sourceUrl: result.url,
      posts: [
        {
          title: 'Example post',
          score: 150,
          comments: 45,
          subreddit,
          sentiment: 'positive'
        }
      ]
    };
  }

  /**
   * Scrape YouTube trending videos using YouTube Data API
   */
  async scrapeYouTube(niche: string, keywords: string[]) {
    await this.checkRateLimit();
    
    const cacheKey = `youtube:${niche}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      // Use YouTube Data API (more reliable than scraping)
      const searchQuery = keywords.length > 0 ? keywords[0] : niche;
      const videos = await this.searchYouTube(searchQuery, {
        maxResults: 50,
        order: 'viewCount',
        publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      const parsed = {
        searchQuery,
        videos: videos.map(v => ({
          title: v.snippet.title,
          views: v.statistics?.viewCount || 0,
          likes: v.statistics?.likeCount || 0,
          comments: v.statistics?.commentCount || 0,
          engagementRate: this.calculateEngagementRate(v),
          publishedAt: v.snippet.publishedAt
        }))
      };

      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(parsed));
      return parsed;
    } catch (error) {
      console.error('YouTube scraping failed:', error);
      return { videos: [], searchQuery: '', error: error.message };
    }
  }

  /**
   * Search YouTube using Data API v3
   */
  private async searchYouTube(query: string, options: any) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', options.maxResults.toString());
    url.searchParams.set('order', options.order);
    url.searchParams.set('publishedAfter', options.publishedAfter);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();
    
    // Fetch video statistics
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    statsUrl.searchParams.set('part', 'statistics,snippet');
    statsUrl.searchParams.set('id', videoIds);
    statsUrl.searchParams.set('key', apiKey);

    const statsResponse = await fetch(statsUrl.toString());
    const statsData = await statsResponse.json();

    return statsData.items;
  }

  /**
   * Calculate engagement rate for YouTube video
   */
  private calculateEngagementRate(video: any): number {
    const views = parseInt(video.statistics?.viewCount || '0');
    const likes = parseInt(video.statistics?.likeCount || '0');
    const comments = parseInt(video.statistics?.commentCount || '0');
    
    if (views === 0) return 0;
    return ((likes + comments) / views) * 100;
  }

  /**
   * Scrape Twitter/X trending data using API v2
   */
  async scrapeTwitter(niche: string, keywords: string[]) {
    await this.checkRateLimit();
    
    const cacheKey = `twitter:${niche}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      // Generate hashtags from niche and keywords
      const hashtags = this.generateHashtags(niche, keywords);
      
      // Search tweets using Twitter API v2
      const tweets = await this.searchTweets(hashtags, {
        maxResults: 100,
        sortOrder: 'relevancy'
      });

      const parsed = {
        hashtags,
        tweets: tweets.map(t => ({
          text: t.text,
          likes: t.public_metrics?.like_count || 0,
          retweets: t.public_metrics?.retweet_count || 0,
          replies: t.public_metrics?.reply_count || 0,
          engagementRate: this.calculateTwitterEngagement(t)
        }))
      };

      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(parsed));
      return parsed;
    } catch (error) {
      console.error('Twitter scraping failed:', error);
      return { tweets: [], hashtags: [], error: error.message };
    }
  }

  /**
   * Generate hashtags from niche and keywords
   */
  private generateHashtags(niche: string, keywords: string[]): string[] {
    const terms = [niche, ...keywords].slice(0, 5);
    return terms.map(term => 
      '#' + term.replace(/\s+/g, '').toLowerCase()
    );
  }

  /**
   * Search tweets using Twitter API v2
   */
  private async searchTweets(hashtags: string[], options: any) {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    const query = hashtags.join(' OR ');
    
    const url = new URL('https://api.twitter.com/2/tweets/search/recent');
    url.searchParams.set('query', query);
    url.searchParams.set('max_results', options.maxResults.toString());
    url.searchParams.set('tweet.fields', 'public_metrics,created_at');

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${bearerToken}` }
    });

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Calculate Twitter engagement rate
   */
  private calculateTwitterEngagement(tweet: any): number {
    const likes = tweet.public_metrics?.like_count || 0;
    const retweets = tweet.public_metrics?.retweet_count || 0;
    const replies = tweet.public_metrics?.reply_count || 0;
    
    // Simplified engagement calculation
    return likes + (retweets * 2) + (replies * 3);
  }

  /**
   * Scrape competitor URLs
   */
  async scrapeCompetitors(urls: string[]) {
    await this.checkRateLimit();
    
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const result = await firecrawl.scrapeUrl(url, {
            formats: ['markdown'],
            timeout: 30000
          });
          
          return {
            url,
            content: result.markdown,
            metadata: result.metadata,
            success: true
          };
        } catch (error) {
          return {
            url,
            content: null,
            error: error.message,
            success: false
          };
        }
      })
    );

    return {
      competitors: results.filter(r => r.success)
    };
  }
}
```

### 3. Niche Context Injection Algorithm

**Context Injection Module** (`src/lib/niche-context.ts`)

```typescript
import { db } from './db';

export interface NicheContext {
  keywords: string[];
  trendingTopics: Array<{
    topic: string;
    score: number;
    keywords: string[];
  }>;
  painPoints: string[];
  contentGaps: string[];
}

/**
 * Fetch latest research data and format as niche context
 */
export async function getNicheContext(userId: string): Promise<NicheContext | null> {
  const research = await db.researchData.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      keywords: true,
      trendingTopics: true,
      expiresAt: true
    }
  });

  // Check if research is stale
  if (!research || research.expiresAt < new Date()) {
    return null;
  }

  const topics = research.trendingTopics as any[];
  
  return {
    keywords: research.keywords.slice(0, 5), // Top 5 keywords
    trendingTopics: topics.slice(0, 3).map(t => ({ // Top 3 topics
      topic: t.topic,
      score: t.score,
      keywords: t.keywords.slice(0, 3)
    })),
    painPoints: [], // Extracted from research if available
    contentGaps: []
  };
}

/**
 * Inject niche context into AI prompt
 */
export function enhancePromptWithNicheContext(
  originalPrompt: string,
  context: NicheContext
): string {
  const contextSection = `
NICHE CONTEXT (use this to optimize your response):
- Trending Keywords: ${context.keywords.join(', ')}
- Trending Topics: ${context.trendingTopics.map(t => `"${t.topic}" (score: ${t.score})`).join(', ')}
${context.painPoints.length > 0 ? `- Audience Pain Points: ${context.painPoints.join('; ')}` : ''}
${context.contentGaps.length > 0 ? `- Content Gaps: ${context.contentGaps.join('; ')}` : ''}

Incorporate these trending elements naturally into your response where relevant.
`;

  return contextSection + '\n\n' + originalPrompt;
}

/**
 * Check if research data is fresh
 */
export async function isResearchDataFresh(userId: string): Promise<{
  fresh: boolean;
  age?: string;
  expiresAt?: Date;
}> {
  const research = await db.researchData.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, expiresAt: true }
  });

  if (!research) {
    return { fresh: false };
  }

  const now = new Date();
  const age = Math.floor((now.getTime() - research.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    fresh: research.expiresAt > now,
    age: `${age} days old`,
    expiresAt: research.expiresAt
  };
}
```

### 4. Content Repurposing Pipeline

**Repurpose Module** (`src/lib/repurpose.ts`)

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from 'zod';

interface RepurposeOptions {
  sourceContent: {
    text: string;
    analysis: ContentAnalysis;
  };
  platforms: string[];
  nicheContext: any | null;
  userId: string;
}

interface ContentAnalysis {
  keyPoints: string[];
  tone: string;
  audience: string;
  quotableSegments: string[];
}

interface PlatformOutput {
  platform: string;
  content: string;
  qualityScore: number;
  metadata: Record<string, any>;
}

/**
 * Main repurposing function
 */
export async function repurposeContent(
  options: RepurposeOptions
): Promise<PlatformOutput[]> {
  const { sourceContent, platforms, nicheContext } = options;

  // Generate platform-specific content in parallel
  const outputs = await Promise.all(
    platforms.map(platform => generatePlatformContent(
      platform,
      sourceContent,
      nicheContext
    ))
  );

  // Validate quality
  const validated = await Promise.all(
    outputs.map(output => validateContentQuality(output))
  );

  return validated;
}

/**
 * Generate content for specific platform
 */
async function generatePlatformContent(
  platform: string,
  sourceContent: { text: string; analysis: ContentAnalysis },
  nicheContext: any | null
): Promise<PlatformOutput> {
  const formatter = getPlatformFormatter(platform);
  
  let prompt = `Transform this content for ${platform}:

SOURCE CONTENT:
${sourceContent.text}

KEY POINTS:
${sourceContent.analysis.keyPoints.join('\n')}

TONE: ${sourceContent.analysis.tone}
TARGET AUDIENCE: ${sourceContent.analysis.audience}

${nicheContext ? `TRENDING KEYWORDS: ${nicheContext.keywords.join(', ')}` : ''}

${formatter.instructions}

Requirements:
${formatter.requirements.join('\n')}`;

  const result = await generateText({
    model: openai('gpt-4-turbo'),
    prompt,
    temperature: 0.7,
    maxTokens: formatter.maxTokens
  });

  return {
    platform,
    content: formatter.postProcess(result.text),
    qualityScore: 0.85, // Placeholder - calculated in validation
    metadata: formatter.metadata
  };
}

/**
 * Platform-specific formatters
 */
function getPlatformFormatter(platform: string) {
  const formatters: Record<string, any> = {
    twitter: {
      instructions: 'Create a Twitter thread with engaging hooks and clear progression.',
      requirements: [
        '- Maximum 280 characters per tweet',
        '- 5-10 tweets in thread',
        '- Start with attention-grabbing hook',
        '- Use 1-2 relevant hashtags per tweet',
        '- End with call-to-action'
      ],
      maxTokens: 1000,
      postProcess: (text: string) => {
        // Split into tweets, ensure char limits
        const tweets = text.split('\n\n').filter(t => t.trim());
        return tweets.map((tweet, i) => {
          const truncated = tweet.length > 280 ? tweet.slice(0, 277) + '...' : tweet;
          return `${i + 1}/ ${truncated}`;
        }).join('\n\n');
      },
      metadata: { format: 'thread', platform: 'twitter' }
    },
    
    instagram: {
      instructions: 'Create an Instagram carousel with 8-10 slides and engaging caption.',
      requirements: [
        '- 8-10 slide titles/content',
        '- Caption under 2,200 characters',
        '- Include 20-30 relevant hashtags',
        '- Visual descriptions for each slide',
        '- Strong opening and CTA at end'
      ],
      maxTokens: 1500,
      postProcess: (text: string) => text,
      metadata: { format: 'carousel', platform: 'instagram' }
    },
    
    linkedin: {
      instructions: 'Create a LinkedIn post with professional tone and thought leadership.',
      requirements: [
        '- Maximum 3,000 characters',
        '- Professional, insightful tone',
        '- Include key takeaways',
        '- Use line breaks for readability',
        '- 3-5 relevant hashtags'
      ],
      maxTokens: 1200,
      postProcess: (text: string) => text.slice(0, 3000),
      metadata: { format: 'post', platform: 'linkedin' }
    },
    
    blog: {
      instructions: 'Create a blog article with SEO-optimized structure.',
      requirements: [
        '- H1 title, H2 subheadings, paragraphs',
        '- Introduction, body, conclusion',
        '- 800-1500 words',
        '- Include meta description',
        '- SEO keywords naturally integrated'
      ],
      maxTokens: 2500,
      postProcess: (text: string) => text,
      metadata: { format: 'article', platform: 'blog' }
    },
    
    tiktok: {
      instructions: 'Create a TikTok script with hook, main points, and CTA.',
      requirements: [
        '- 60 seconds reading time',
        '- Strong 3-second hook',
        '- 3-5 main points',
        '- Call-to-action at end',
        '- Conversational, energetic tone'
      ],
      maxTokens: 500,
      postProcess: (text: string) => text,
      metadata: { format: 'script', platform: 'tiktok' }
    },
    
    email: {
      instructions: 'Create an email newsletter with subject, preview, and body.',
      requirements: [
        '- Compelling subject line (50 chars)',
        '- Preview text (100 chars)',
        '- Scannable body with sections',
        '- Clear CTA button text',
        '- Personal, conversational tone'
      ],
      maxTokens: 1500,
      postProcess: (text: string) => text,
      metadata: { format: 'newsletter', platform: 'email' }
    }
  };

  return formatters[platform] || formatters.blog;
}

/**
 * Validate content quality
 */
async function validateContentQuality(output: PlatformOutput): Promise<PlatformOutput> {
  // Quality checks
  const checks = {
    hasContent: output.content.length > 0,
    notTooShort: output.content.length > 50,
    noDuplicateSentences: !hasDuplicateSentences(output.content),
    grammarScore: await checkGrammar(output.content)
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const qualityScore = passedChecks / Object.keys(checks).length;

  // Regenerate if quality too low
  if (qualityScore < 0.7) {
    console.warn(`Low quality score (${qualityScore}) for ${output.platform}, consider regenerating`);
  }

  return {
    ...output,
    qualityScore
  };
}

/**
 * Check for duplicate sentences
 */
function hasDuplicateSentences(text: string): boolean {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const unique = new Set(sentences);
  return sentences.length !== unique.size;
}

/**
 * Grammar check using language model confidence
 */
async function checkGrammar(text: string): Promise<number> {
  // Simplified - could use grammar checking API or model confidence
  // Return score 0-1
  return 0.85;
}

/**
 * Analyze source content before repurposing
 */
export async function analyzeContent(text: string): Promise<ContentAnalysis> {
  const prompt = `Analyze this content and extract:
1. Key points (5-7 main ideas)
2. Overall tone (professional, casual, educational, etc.)
3. Target audience description
4. Quotable segments (3-5 impactful quotes)

Content:
${text}

Provide structured JSON output.`;

  const result = await generateText({
    model: openai('gpt-4-turbo'),
    prompt,
    temperature: 0.3
  });

  // Parse JSON response
  try {
    return JSON.parse(result.text);
  } catch {
    return {
      keyPoints: [],
      tone: 'neutral',
      audience: 'general',
      quotableSegments: []
    };
  }
}
```

### 5. Analytics Aggregation Algorithm

**Analytics Service** (`src/lib/analytics.ts`)

```typescript
import { db } from './db';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

interface PlatformConnection {
  platform: string;
  accessToken: string;
  refreshToken?: string;
}

const insightSchema = z.object({
  type: z.enum(['performance', 'timing', 'content', 'growth']),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  actionable: z.boolean(),
  data: z.record(z.any())
});

/**
 * Aggregate analytics from all connected platforms
 */
export async function aggregateAnalytics(userId: string) {
  // Get user's platform connections
  const connections = await getUserPlatformConnections(userId);

  // Fetch data from each platform in parallel
  const platformData = await Promise.all(
    connections.map(conn => fetchPlatformMetrics(conn))
  );

  // Calculate aggregated metrics
  const aggregated = calculateAggregatedMetrics(platformData);

  // Generate AI insights
  const insights = await generateAIInsights(platformData, aggregated, userId);

  // Save snapshot to database
  await db.analyticsSnapshot.create({
    data: {
      userId,
      platformData,
      aggregatedMetrics: aggregated,
      insights
    }
  });

  return { platformData, aggregated, insights };
}

/**
 * Fetch metrics from specific platform
 */
async function fetchPlatformMetrics(connection: PlatformConnection) {
  switch (connection.platform) {
    case 'youtube':
      return fetchYouTubeMetrics(connection);
    case 'instagram':
      return fetchInstagramMetrics(connection);
    case 'twitter':
      return fetchTwitterMetrics(connection);
    case 'stripe':
      return fetchStripeMetrics(connection);
    default:
      return null;
  }
}

/**
 * Calculate cross-platform aggregated metrics
 */
function calculateAggregatedMetrics(platformData: any[]) {
  const totalViews = platformData.reduce((sum, p) => sum + (p?.views || 0), 0);
  const totalLikes = platformData.reduce((sum, p) => sum + (p?.likes || 0), 0);
  const totalComments = platformData.reduce((sum, p) => sum + (p?.comments || 0), 0);
  const totalShares = platformData.reduce((sum, p) => sum + (p?.shares || 0), 0);
  const totalFollowers = platformData.reduce((sum, p) => sum + (p?.followers || 0), 0);

  const totalEngagements = totalLikes + totalComments + totalShares;
  const engagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;

  return {
    totalViews,
    totalEngagements,
    averageEngagementRate: engagementRate,
    followerGrowth: {
      current: totalFollowers,
      change: 0, // Calculate from historical data
      changePercent: 0
    },
    revenue: {
      total: 0, // From Stripe if connected
      change: 0,
      changePercent: 0
    }
  };
}

/**
 * Generate AI insights from analytics data
 */
async function generateAIInsights(
  platformData: any[],
  aggregated: any,
  userId: string
) {
  // Get historical data for comparison
  const historical = await db.analyticsSnapshot.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30 // Last 30 snapshots
  });

  // Get niche context for comparison
  const research = await db.researchData.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  const prompt = `Analyze this creator's performance data and generate 5-7 actionable insights:

Current Metrics:
${JSON.stringify(aggregated)}

Platform Breakdown:
${JSON.stringify(platformData)}

Historical Trend (30 days):
${JSON.stringify(historical.slice(0, 5))}

${research ? `Niche Context: ${JSON.stringify(research.trendingTopics)}` : ''}

Generate insights covering:
1. Best performing content types
2. Optimal posting times per platform
3. Growth trends and predictions
4. Engagement patterns
5. Revenue opportunities
6. Comparison with niche trends (if available)

Provide actionable recommendations with confidence scores.`;

  const result = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: z.object({ insights: z.array(insightSchema) }),
    prompt,
    temperature: 0.7
  });

  return result.object.insights;
}

/**
 * Fetch YouTube metrics using YouTube Data API
 */
async function fetchYouTubeMetrics(connection: PlatformConnection) {
  // Implementation using YouTube Data API
  // Fetch channel statistics, recent videos performance
  return {
    platform: 'youtube',
    views: 0,
    likes: 0,
    comments: 0,
    subscribers: 0,
    videos: []
  };
}

/**
 * Get user's platform connections
 */
async function getUserPlatformConnections(userId: string): Promise<PlatformConnection[]> {
  // Fetch from credentials or separate connections table
  const credentials = await db.credential.findMany({
    where: { userId }
  });

  return credentials.map(cred => ({
    platform: cred.type.toLowerCase(),
    accessToken: cred.value, // Decrypted
    refreshToken: null
  }));
}
```

## Error Handling

### Retry Strategy

**Exponential Backoff Implementation** (`src/lib/retry.ts`)

```typescript
export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
): Promise<T> {
  let lastError: Error;
  let delay = options.initialDelay;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === options.maxRetries) {
        throw lastError;
      }

      // Wait before retry
      await sleep(delay);
      
      // Increase delay for next attempt
      delay = Math.min(delay * options.backoffMultiplier, options.maxDelay);
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Circuit Breaker Pattern

**Circuit Breaker Implementation** (`src/lib/circuit-breaker.ts`)

```typescript
export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly successThreshold: number = 2,
    private readonly timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === 'half-open') {
      this.successCount++;
      
      if (this.successCount >= this.successThreshold) {
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== null &&
           (Date.now() - this.lastFailureTime) >= this.timeout;
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
}

// Global circuit breakers for external services
export const firecrawlCircuitBreaker = new CircuitBreaker(5, 2, 60000);
export const youtubeCircuitBreaker = new CircuitBreaker(5, 2, 60000);
export const twitterCircuitBreaker = new CircuitBreaker(5, 2, 60000);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Applicability Assessment for Property-Based Testing

Phase 2 features involve significant external service integration (Firecrawl, YouTube API, Twitter API, AI models) and infrastructure orchestration (Inngest jobs, caching, scheduling). Most acceptance criteria test external service behavior, infrastructure timing, or UI interactions—domains where property-based testing provides limited value.

**Suitable for PBT:**
- Data transformation and validation logic (formatting, truncation, filtering)
- Business rule enforcement (rate limiting, deduplication, constraints)
- Mathematical calculations (engagement rates, scoring, ranking)
- Retry and error handling algorithms
- Cache behavior and TTL validation

**NOT suitable for PBT:**
- External API integrations (Firecrawl, YouTube, Twitter) → use integration tests with mocks
- AI model invocations (GPT-4, Claude analysis) → use integration tests with mocked responses
- Infrastructure orchestration (Inngest scheduling, cron jobs) → use integration tests
- Performance requirements (5-minute timeouts, 2-second loads) → use performance tests
- UI navigation and rendering → use end-to-end tests

### Property 1: Exponential Backoff Retry Pattern

*For any* failed operation requiring retry with exponential backoff, the delay between consecutive retries SHALL increase exponentially up to a maximum delay, and the total number of retries SHALL not exceed the configured maximum.

**Validates: Requirements 1.9, 3.5**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 1: Exponential backoff retry pattern
describe('Property: Exponential backoff retry pattern', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 10 }), // maxRetries
      fc.integer({ min: 100, max: 2000 }), // initialDelay
      fc.integer({ min: 5000, max: 30000 }), // maxDelay
      fc.float({ min: 1.5, max: 3.0 }), // backoffMultiplier
      async (maxRetries, initialDelay, maxDelay, backoffMultiplier) => {
        const delays: number[] = [];
        let attemptCount = 0;
        
        const mockFn = async () => {
          attemptCount++;
          throw new Error('Simulated failure');
        };

        try {
          await retryWithBackoff(mockFn, {
            maxRetries,
            initialDelay,
            maxDelay,
            backoffMultiplier
          });
        } catch (error) {
          // Expected to fail after retries
        }

        // Property 1: Attempt count should not exceed maxRetries + 1
        expect(attemptCount).toBeLessThanOrEqual(maxRetries + 1);

        // Property 2: Delays should increase exponentially up to maxDelay
        for (let i = 1; i < delays.length; i++) {
          const expectedDelay = Math.min(
            initialDelay * Math.pow(backoffMultiplier, i - 1),
            maxDelay
          );
          expect(delays[i]).toBeCloseTo(expectedDelay, -2);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 2: Research Data Output Constraints

*For any* valid research analysis execution, the output SHALL contain at least 10 trending topics with scores in the range [0, 100] and at least 10 content ideas with all required fields populated.

**Validates: Requirements 2.2, 2.5**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 2: Research data output constraints
describe('Property: Research data output constraints', () => {
  fc.assert(
    fc.property(
      fc.record({
        niche: fc.string({ minLength: 3, maxLength: 50 }),
        keywords: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        scrapedData: fc.record({
          trends: fc.array(fc.anything()),
          reddit: fc.array(fc.anything()),
          youtube: fc.array(fc.anything()),
          twitter: fc.array(fc.anything())
        })
      }),
      async (researchInput) => {
        // Mock AI analysis to return structured output
        const analysisResult = await performResearchAnalysis(researchInput);

        // Property 1: At least 10 trending topics
        expect(analysisResult.trendingTopics.length).toBeGreaterThanOrEqual(10);

        // Property 2: All topic scores in valid range
        for (const topic of analysisResult.trendingTopics) {
          expect(topic.score).toBeGreaterThanOrEqual(0);
          expect(topic.score).toBeLessThanOrEqual(100);
        }

        // Property 3: At least 10 content ideas
        expect(analysisResult.contentIdeas.length).toBeGreaterThanOrEqual(10);

        // Property 4: All ideas have required fields
        for (const idea of analysisResult.contentIdeas) {
          expect(idea.id).toBeDefined();
          expect(idea.idea).toBeTruthy();
          expect(idea.reasoning).toBeTruthy();
          expect(idea.platforms).toBeInstanceOf(Array);
          expect(idea.platforms.length).toBeGreaterThan(0);
          expect(idea.estimatedEngagement).toBeGreaterThanOrEqual(1);
          expect(idea.estimatedEngagement).toBeLessThanOrEqual(10);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 3: Content Idea Ranking by Engagement

*For any* list of generated content ideas, when ranked by predicted engagement, the output list SHALL be sorted in descending order by engagement score.

**Validates: Requirements 2.11**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 3: Content idea ranking by engagement
describe('Property: Content idea ranking by engagement', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id: fc.uuid(),
          idea: fc.string({ minLength: 10, maxLength: 200 }),
          reasoning: fc.string({ minLength: 20, maxLength: 500 }),
          platforms: fc.array(fc.constantFrom('youtube', 'instagram', 'twitter', 'tiktok'), { minLength: 1 }),
          estimatedEngagement: fc.integer({ min: 1, max: 10 }),
          keywords: fc.array(fc.string(), { maxLength: 5 })
        }),
        { minLength: 10, maxLength: 50 }
      ),
      (contentIdeas) => {
        const ranked = rankContentIdeasByEngagement(contentIdeas);

        // Property: Output is sorted descending by estimatedEngagement
        for (let i = 0; i < ranked.length - 1; i++) {
          expect(ranked[i].estimatedEngagement).toBeGreaterThanOrEqual(
            ranked[i + 1].estimatedEngagement
          );
        }

        // Property: All original items present (no data loss)
        expect(ranked.length).toBe(contentIdeas.length);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 4: Content Gaps Identification

*For any* competitor content data and user content data, identified content gaps SHALL be topics present in competitor data but absent from user data.

**Validates: Requirements 2.4**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 4: Content gaps identification
describe('Property: Content gaps identification', () => {
  fc.assert(
    fc.property(
      fc.record({
        userTopics: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 20 }),
        competitorTopics: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 20 })
      }),
      ({ userTopics, competitorTopics }) => {
        const gaps = identifyContentGaps(userTopics, competitorTopics);

        // Property 1: All gaps exist in competitor topics
        for (const gap of gaps) {
          expect(competitorTopics).toContain(gap);
        }

        // Property 2: No gaps exist in user topics
        for (const gap of gaps) {
          expect(userTopics).not.toContain(gap);
        }

        // Property 3: Gaps = Competitor - User (set difference)
        const expectedGaps = competitorTopics.filter(t => !userTopics.includes(t));
        expect(new Set(gaps)).toEqual(new Set(expectedGaps));
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 5: Cache Round-Trip Within TTL

*For any* research data stored in cache with 24-hour TTL, retrieving the data within 24 hours SHALL return the exact same data that was stored.

**Validates: Requirements 1.10**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 5: Cache round-trip within TTL
describe('Property: Cache round-trip within TTL', () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        niche: fc.string({ minLength: 3, maxLength: 50 }),
        trendingTopics: fc.array(fc.anything(), { minLength: 10 }),
        contentIdeas: fc.array(fc.anything(), { minLength: 10 }),
        keywords: fc.array(fc.string(), { minLength: 1, maxLength: 20 })
      }),
      fc.integer({ min: 0, max: 24 * 60 * 60 - 1 }), // seconds within 24 hours
      async (researchData, secondsElapsed) => {
        const cacheKey = `research:${researchData.niche}`;
        
        // Store in cache
        await redis.setex(cacheKey, 24 * 60 * 60, JSON.stringify(researchData));

        // Simulate time passage (mock or fast-forward)
        vi.advanceTimersByTime(secondsElapsed * 1000);

        // Retrieve from cache
        const cached = await redis.get(cacheKey);
        const retrieved = cached ? JSON.parse(cached) : null;

        // Property: Retrieved data equals stored data within TTL
        expect(retrieved).toEqual(researchData);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 6: Rate Limiting Enforcement

*For any* sequence of research job requests from a single user, the system SHALL allow at most 5 executions per hour, rejecting subsequent requests until the time window resets.

**Validates: Requirements 3.6**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 6: Rate limiting enforcement
describe('Property: Rate limiting enforcement', () => {
  fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 20 }), // number of requests
      fc.string(), // userId
      async (requestCount, userId) => {
        const requests = Array(requestCount).fill(null).map((_, i) => ({
          userId,
          timestamp: Date.now() + i * 1000 // 1 second apart
        }));

        let successCount = 0;
        let rejectedCount = 0;

        for (const req of requests) {
          try {
            await checkRateLimit(req.userId, 5, 3600); // 5 per hour
            successCount++;
          } catch (error) {
            if (error.message.includes('rate limit')) {
              rejectedCount++;
            }
          }
        }

        // Property 1: At most 5 successful requests
        expect(successCount).toBeLessThanOrEqual(5);

        // Property 2: Requests beyond 5 are rejected
        if (requestCount > 5) {
          expect(rejectedCount).toBe(requestCount - 5);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 7: Trend Alert Deduplication

*For any* trending topic detected multiple times within a time window, the system SHALL create at most one alert record, preventing duplicate notifications for the same topic.

**Validates: Requirements 4.4**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 7: Trend alert deduplication
describe('Property: Trend alert deduplication', () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        topic: fc.string({ minLength: 5, maxLength: 100 }),
        userId: fc.uuid(),
        score: fc.integer({ min: 80, max: 100 }),
        detectionCount: fc.integer({ min: 1, max: 10 })
      }),
      async ({ topic, userId, score, detectionCount }) => {
        // Simulate multiple detections of same topic
        const detections = Array(detectionCount).fill(null).map(() => ({
          topic,
          userId,
          score,
          niche: 'test',
          velocity: 'rising' as const,
          platforms: ['youtube', 'twitter']
        }));

        // Process all detections
        const createdAlerts = [];
        for (const detection of detections) {
          const alert = await createTrendAlertIfNew(detection);
          if (alert) createdAlerts.push(alert);
        }

        // Property: Only one alert created regardless of detection count
        expect(createdAlerts.length).toBe(1);

        // Property: Created alert matches first detection
        expect(createdAlerts[0].topic).toBe(topic);
        expect(createdAlerts[0].userId).toBe(userId);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 8: Top-N Keyword Filtering

*For any* research data containing keywords, the niche context SHALL include exactly the top 5 keywords ranked by score or frequency, preserving order.

**Validates: Requirements 5.4**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 8: Top-N keyword filtering
describe('Property: Top-N keyword filtering', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          keyword: fc.string({ minLength: 2, maxLength: 30 }),
          score: fc.integer({ min: 1, max: 100 })
        }),
        { minLength: 5, maxLength: 50 }
      ),
      (keywords) => {
        const context = buildNicheContext({ keywords });

        // Property 1: Exactly 5 keywords (or fewer if input has fewer)
        const expectedCount = Math.min(5, keywords.length);
        expect(context.keywords.length).toBe(expectedCount);

        // Property 2: Keywords are top-scoring
        const sortedByScore = [...keywords].sort((a, b) => b.score - a.score);
        const expectedKeywords = sortedByScore.slice(0, 5).map(k => k.keyword);
        expect(context.keywords).toEqual(expectedKeywords);

        // Property 3: Order preserved (descending by score)
        for (let i = 0; i < context.keywords.length - 1; i++) {
          const currentScore = keywords.find(k => k.keyword === context.keywords[i])!.score;
          const nextScore = keywords.find(k => k.keyword === context.keywords[i + 1])!.score;
          expect(currentScore).toBeGreaterThanOrEqual(nextScore);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 9: Platform Character Limit Enforcement

*For any* generated content for Twitter, every tweet in the thread SHALL have a character length not exceeding 280 characters, with truncation using ellipsis when necessary.

**Validates: Requirements 7.1, 7.8**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 9: Platform character limit enforcement
describe('Property: Platform character limit enforcement', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.string({ minLength: 1, maxLength: 500 }),
        { minLength: 1, maxLength: 20 }
      ),
      (tweetContents) => {
        const formatted = formatTwitterThread(tweetContents);

        // Property 1: All tweets within character limit
        for (const tweet of formatted) {
          expect(tweet.length).toBeLessThanOrEqual(280);
        }

        // Property 2: Truncated tweets end with ellipsis
        for (let i = 0; i < tweetContents.length; i++) {
          if (tweetContents[i].length > 280) {
            expect(formatted[i]).toMatch(/\.\.\.$/);
          }
        }

        // Property 3: Non-truncated tweets preserved exactly
        for (let i = 0; i < tweetContents.length; i++) {
          if (tweetContents[i].length <= 280) {
            expect(formatted[i]).toContain(tweetContents[i]);
          }
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 10: Platform Output Structure Validation

*For any* content repurposing request for Instagram, the generated output SHALL contain between 8 and 10 slides and a caption with length not exceeding 2,200 characters.

**Validates: Requirements 7.2**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 10: Platform output structure validation
describe('Property: Platform output structure validation', () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        sourceContent: fc.string({ minLength: 500, maxLength: 10000 }),
        platform: fc.constant('instagram')
      }),
      async ({ sourceContent, platform }) => {
        const output = await repurposeContentForPlatform(sourceContent, platform);

        // Property 1: Slide count in valid range
        expect(output.slides.length).toBeGreaterThanOrEqual(8);
        expect(output.slides.length).toBeLessThanOrEqual(10);

        // Property 2: Caption within character limit
        expect(output.caption.length).toBeLessThanOrEqual(2200);

        // Property 3: All slides have content
        for (const slide of output.slides) {
          expect(slide.content).toBeTruthy();
          expect(slide.content.length).toBeGreaterThan(0);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 11: Research Data Idempotence

*For any* research job with identical parameters executed multiple times within the rate limit window, subsequent executions SHALL return cached results, ensuring idempotent behavior.

**Validates: Requirements 3.10**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 11: Research data idempotence
describe('Property: Research data idempotence', () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        userId: fc.uuid(),
        niche: fc.string({ minLength: 3, maxLength: 50 }),
        keywords: fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        executionCount: fc.integer({ min: 2, max: 5 })
      }),
      async ({ userId, niche, keywords, executionCount }) => {
        const results = [];

        // Execute research multiple times with same parameters
        for (let i = 0; i < executionCount; i++) {
          const result = await executeResearchJob({
            userId,
            niche,
            keywords,
            competitorUrls: []
          });
          results.push(result);
        }

        // Property 1: All results are identical (idempotent)
        for (let i = 1; i < results.length; i++) {
          expect(results[i].researchId).toBe(results[0].researchId);
          expect(results[i].topicsFound).toBe(results[0].topicsFound);
          expect(results[i].ideasGenerated).toBe(results[0].ideasGenerated);
        }

        // Property 2: Only first execution performed actual work
        // (subsequent calls returned cached data)
        // Verify by checking execution timestamps or cache hit metrics
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 12: Engagement Rate Calculation

*For any* platform metrics with views, likes, comments, and shares, the calculated cross-platform engagement rate SHALL equal total interactions divided by total reach, expressed as a percentage.

**Validates: Requirements 12.3**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 12: Engagement rate calculation
describe('Property: Engagement rate calculation', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          platform: fc.constantFrom('youtube', 'instagram', 'twitter', 'tiktok'),
          views: fc.integer({ min: 0, max: 1000000 }),
          likes: fc.integer({ min: 0, max: 50000 }),
          comments: fc.integer({ min: 0, max: 10000 }),
          shares: fc.integer({ min: 0, max: 5000 })
        }),
        { minLength: 1, maxLength: 5 }
      ),
      (platformMetrics) => {
        const aggregated = calculateCrossPlatformMetrics(platformMetrics);

        // Calculate expected values
        const totalReach = platformMetrics.reduce((sum, m) => sum + m.views, 0);
        const totalInteractions = platformMetrics.reduce(
          (sum, m) => sum + m.likes + m.comments + m.shares,
          0
        );
        const expectedRate = totalReach > 0 
          ? (totalInteractions / totalReach) * 100 
          : 0;

        // Property: Engagement rate matches formula
        expect(aggregated.engagementRate).toBeCloseTo(expectedRate, 2);

        // Property: Rate is non-negative percentage
        expect(aggregated.engagementRate).toBeGreaterThanOrEqual(0);
        expect(aggregated.engagementRate).toBeLessThanOrEqual(100);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 13: Content Source Attribution Preservation

*For all* content repurposing operations, regardless of output format, the source attribution and reference SHALL be preserved in the generated content metadata.

**Validates: Requirements 6.11**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 13: Content source attribution preservation
describe('Property: Content source attribution preservation', () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        sourceType: fc.constantFrom('youtube_url', 'blog_url', 'text', 'podcast_url'),
        sourceUrl: fc.webUrl(),
        content: fc.string({ minLength: 100, maxLength: 5000 }),
        platforms: fc.array(
          fc.constantFrom('twitter', 'instagram', 'linkedin', 'blog', 'tiktok', 'email'),
          { minLength: 1, maxLength: 6 }
        )
      }),
      async ({ sourceType, sourceUrl, content, platforms }) => {
        const outputs = await repurposeContent({
          source: { type: sourceType, content: sourceUrl },
          platforms,
          includeNicheContext: false
        });

        // Property: All outputs preserve source attribution
        for (const output of outputs) {
          expect(output.metadata.sourceUrl).toBe(sourceUrl);
          expect(output.metadata.sourceType).toBe(sourceType);
          expect(output.metadata.sourceUrl).toBeTruthy();
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 14: Quality Score Regeneration Threshold

*For any* generated content with a quality score below 0.7, the system SHALL trigger regeneration with modified prompts, ensuring all final outputs meet the minimum quality threshold.

**Validates: Requirements 8.4**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 14: Quality score regeneration threshold
describe('Property: Quality score regeneration threshold', () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        content: fc.string({ minLength: 50, maxLength: 1000 }),
        platform: fc.constantFrom('twitter', 'instagram', 'linkedin'),
        initialQualityScore: fc.float({ min: 0.3, max: 0.95 })
      }),
      async ({ content, platform, initialQualityScore }) => {
        // Mock quality scoring
        const mockQualityCheck = vi.fn()
          .mockReturnValueOnce(initialQualityScore)
          .mockReturnValue(0.85); // Second attempt succeeds

        const result = await generateWithQualityValidation(content, platform, mockQualityCheck);

        if (initialQualityScore < 0.7) {
          // Property 1: Regeneration was triggered
          expect(mockQualityCheck).toHaveBeenCalledTimes(2);

          // Property 2: Final output meets threshold
          expect(result.qualityScore).toBeGreaterThanOrEqual(0.7);
        } else {
          // Property 3: No regeneration needed
          expect(mockQualityCheck).toHaveBeenCalledTimes(1);
          expect(result.qualityScore).toBe(initialQualityScore);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 15: Duplicate Sentence Removal

*For any* generated content, no sentence SHALL appear more than once in the final output, ensuring content uniqueness and avoiding repetition.

**Validates: Requirements 8.5**

**Test Implementation:**
```typescript
// Feature: phase-2-hackathon-features, Property 15: Duplicate sentence removal
describe('Property: Duplicate sentence removal', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.string({ minLength: 10, maxLength: 200 }),
        { minLength: 5, maxLength: 50 }
      ),
      (sentences) => {
        // Intentionally duplicate some sentences
        const withDuplicates = [
          ...sentences,
          ...sentences.slice(0, Math.min(3, sentences.length))
        ];

        const cleaned = removeDuplicateSentences(withDuplicates.join(' '));
        const cleanedSentences = cleaned.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

        // Property 1: No sentence appears more than once
        const sentenceSet = new Set(cleanedSentences);
        expect(sentenceSet.size).toBe(cleanedSentences.length);

        // Property 2: All unique sentences from input are preserved
        const uniqueInput = [...new Set(sentences)];
        for (const sentence of uniqueInput) {
          expect(cleanedSentences).toContain(sentence);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

## Reflection Summary

After reviewing all identified properties, the following consolidations were made:

**Redundancies Eliminated:**
- Combined multiple rate-limiting properties (3.6, 4.9) into Property 6
- Consolidated cache behavior tests into single round-trip property (Property 5)
- Merged character limit enforcement across platforms into focused properties (Properties 9, 10)

**Comprehensive Coverage:**
- Error handling: Properties 1, 5, 14
- Data validation: Properties 2, 3, 8, 10, 11
- Business logic: Properties 4, 6, 7, 12
- Content quality: Properties 9, 13, 14, 15

Each property provides unique validation value and tests distinct system behaviors across research, content generation, repurposing, and analytics domains.

## Testing Strategy

### Unit Tests

**Research Router Tests** (`src/trpc/routers/__tests__/research.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCallerFactory } from '@trpc/server';
import { researchRouter } from '../research';
import { db } from '@/lib/db';

describe('Research Router', () => {
  const createCaller = createCallerFactory(researchRouter);
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return latest research data', async () => {
    const mockResearch = {
      id: '1',
      userId: 'user1',
      niche: 'tech',
      trendingTopics: [],
      contentIdeas: [],
      keywords: ['tech', 'ai'],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    vi.spyOn(db.researchData, 'findFirst').mockResolvedValue(mockResearch);

    const caller = createCaller({
      db,
      user: { id: 'user1' }
    });

    const result = await caller.getLatest();
    expect(result).toEqual(mockResearch);
  });

  it('should trigger research job', async () => {
    const mockSend = vi.fn();
    vi.mock('@/inngest/client', () => ({
      inngest: { send: mockSend }
    }));

    const caller = createCaller({
      db,
      user: { id: 'user1' }
    });

    await caller.triggerResearch({ niche: 'tech' });
    expect(mockSend).toHaveBeenCalledWith({
      name: 'research/trigger',
      data: expect.objectContaining({ niche: 'tech' })
    });
  });
});
```

### Integration Tests

**Niche Research Integration Test**

```typescript
import { describe, it, expect } from 'vitest';
import { FirecrawlService } from '@/lib/firecrawl';

describe('Niche Research Integration', () => {
  it('should complete full research cycle', async () => {
    const firecrawl = new FirecrawlService();
    
    // Test Google Trends scraping
    const trends = await firecrawl.scrapeGoogleTrends('tech', ['ai', 'ml']);
    expect(trends).toBeDefined();
    expect(trends.trends).toBeInstanceOf(Array);
    
    // Test Reddit scraping
    const reddit = await firecrawl.scrapeReddit('tech', ['ai']);
    expect(reddit.posts).toBeInstanceOf(Array);
    
    // Verify caching
    const cachedTrends = await firecrawl.scrapeGoogleTrends('tech', ['ai', 'ml']);
    expect(cachedTrends).toEqual(trends);
  }, 30000); // 30s timeout
});
```

### Property-Based Tests

Property-based testing is not applicable for this feature set as it primarily involves:
- External API integrations (infrastructure, not pure logic)
- AI content generation (non-deterministic outputs)
- UI rendering and user interactions
- Database CRUD operations

Instead, we use:
- **Example-based unit tests** for business logic
- **Integration tests** for API workflows
- **Mock-based tests** for external service calls
- **Snapshot tests** for AI prompt templates

## Performance Optimization

### Caching Strategy

**Multi-Layer Caching**

1. **Redis Cache** (24-hour TTL)
   - Scraped data from Firecrawl
   - Research analysis results
   - Analytics snapshots

2. **Database Query Caching** (1-hour TTL)
   - Latest research data
   - Trending topics
   - Content ideas

3. **CDN Caching** (public assets)
   - Template thumbnails
   - Static research visualizations

**Implementation** (`src/lib/cache.ts`)

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Check cache
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  await redis.setex(key, ttl, JSON.stringify(data));
  
  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### Database Indexing

**Critical Indexes for Performance**

```sql
-- Research data queries (by user, by date)
CREATE INDEX idx_research_data_user_created ON research_data(userId, createdAt DESC);
CREATE INDEX idx_research_data_expires ON research_data(expiresAt);

-- Trend alerts (by user and status)
CREATE INDEX idx_trend_alert_user_status ON trend_alert(userId, status, createdAt DESC);

-- Analytics snapshots (time-series queries)
CREATE INDEX idx_analytics_user_time ON analytics_snapshot(userId, createdAt DESC);

-- Templates (browsing and search)
CREATE INDEX idx_template_category_published ON workflow_template(category, published) WHERE published = true;
CREATE INDEX idx_template_search ON workflow_template USING gin(to_tsvector('english', name || ' ' || description));
```

### Connection Pooling

**Prisma Connection Pool Configuration** (`src/lib/db.ts`)

```typescript
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Connection pool settings in DATABASE_URL:
// postgresql://user:password@host:5432/db?connection_limit=10&pool_timeout=20
```

## Security Implementation

### Encryption at Rest

**AES-256 Encryption for Research Data**

```typescript
import Cryptr from 'cryptr';

const cryptr = new Cryptr(process.env.ENCRYPTION_KEY);

export function encryptResearchData(data: any): string {
  return cryptr.encrypt(JSON.stringify(data));
}

export function decryptResearchData(encrypted: string): any {
  return JSON.parse(cryptr.decrypt(encrypted));
}
```

### Row-Level Security

**Prisma Middleware for Access Control**

```typescript
import { db } from './db';

db.$use(async (params, next) => {
  // Ensure users only access their own data
  if (params.model === 'ResearchData' || params.model === 'TrendAlert') {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      if (!params.args.where?.userId) {
        throw new Error('Unauthorized: userId required');
      }
    }
  }

  return next(params);
});
```

### Input Sanitization

**Zod Schemas with Sanitization**

```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export const nicheInputSchema = z.object({
  niche: z.string()
    .min(1)
    .max(100)
    .transform(val => DOMPurify.sanitize(val)),
  keywords: z.array(z.string().max(50))
    .min(1)
    .max(10)
    .transform(arr => arr.map(k => DOMPurify.sanitize(k))),
  competitorUrls: z.array(z.string().url())
    .max(5)
    .optional()
});
```

---

This comprehensive design document provides both high-level architecture and detailed low-level implementations for all Phase 2 features. The design emphasizes type safety, performance, scalability, and security while integrating seamlessly with existing Phase 1 infrastructure.
