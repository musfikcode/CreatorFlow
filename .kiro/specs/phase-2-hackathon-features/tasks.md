# Implementation Plan: Phase 2 Hackathon Features

## Overview

This implementation plan breaks down the Phase 2 Hackathon Features into incremental, executable tasks. The system extends CreatorFlow with five major feature areas: AI Niche Research Engine (flagship), Niche-Aware Content Generator, AI Content Repurposing Engine, Content Templates Library, and Creator Analytics Dashboard.

The implementation follows a bottom-up approach: database schema and core services first, then API layer (tRPC routers), background jobs (Inngest functions), and finally frontend components. This ensures each layer has its dependencies available when needed.

**Key Technical Decisions:**
- TypeScript throughout (Next.js 16, tRPC 11, Prisma 7.8)
- Firecrawl SDK for web scraping with rate limiting and caching
- Inngest for background job orchestration
- React Flow extended with 6 new node types
- Performance targets: <5min research, <60s repurposing, <2s dashboard loads

## Tasks

- [x] 1. Database Schema and Type Definitions
  - [x] 1.1 Extend Prisma schema with Phase 2 models
    - Add niche fields to User model (niche, nicheKeywords, competitorUrls, researchFrequency)
    - Create ResearchData model with JSON fields for trendingTopics, contentIdeas, competitorData
    - Create TrendAlert model with userId, topic, score, velocity, status fields
    - Create WorkflowTemplate model with nodeData, connectionData, category fields
    - Create TemplateReview model for template ratings and comments
    - Create AnalyticsSnapshot model with platformData and aggregatedMetrics
    - Add indexes for performance (userId, createdAt, status)
    - Add cascade deletion rules for all new models
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 17.11_


  - [x] 1.2 Generate Prisma migration and update database
    - Run `prisma migrate dev --name phase_2_features`
    - Generate Prisma client with `prisma generate`
    - Verify schema changes in database
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 1.3 Create TypeScript type definitions for JSON fields
    - Create `src/types/research.ts` with TrendingTopic, ContentIdea, CompetitorAnalysis interfaces
    - Create `src/types/analytics.ts` with PlatformMetrics, AggregatedMetrics, AIInsight interfaces
    - Create `src/types/template.ts` with TemplateMetadata and NodeConfiguration interfaces
    - Create `src/types/repurpose.ts` with SourceContent and PlatformOutput interfaces
    - Export all types from `src/types/index.ts`
    - _Requirements: 17.2, 17.5, 17.6_

- [-] 2. Firecrawl Integration and Core Services
  - [x] 2.1 Set up Firecrawl SDK integration
    - Install Firecrawl SDK: `bun add firecrawl`
    - Create `src/lib/firecrawl.ts` with Firecrawl client configuration
    - Add FIRECRAWL_API_KEY to environment variables
    - Implement rate limiting (track requests per hour using Prisma + Neon)
  - Implement 24-hour caching layer using Prisma + Neon
  - Create FirecrawlCache Prisma model
  - Add automatic cache expiration handling
  - Add retry logic with exponential backoff (3 retries, 1s/2s/4s delays)
  - Add 30-second timeout per request
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.6, 18.10_


  - [x] 2.2 Create web scraping service layer
    - Create `src/lib/scraping/google-trends.ts` for Google Trends scraping
    - Create `src/lib/scraping/reddit.ts` for Reddit subreddit data extraction
    - Create `src/lib/scraping/youtube.ts` using YouTube Data API
    - Create `src/lib/scraping/twitter.ts` for Twitter trending hashtags
    - Create `src/lib/scraping/index.ts` with parallel multi-source scraping function
    - Add URL validation before scraping
    - Sanitize HTML content to extract plain text
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 18.7, 18.8_

  - [x] 2.3 Create content repurposing service
    - Create `src/lib/repurpose/extractor.ts` for content extraction (YouTube, blog, podcast)
    - Create `src/lib/repurpose/analyzer.ts` for AI content analysis
    - Create `src/lib/repurpose/formatters/twitter.ts` for Twitter thread generation (280 chars/tweet)
    - Create `src/lib/repurpose/formatters/instagram.ts` for Instagram carousel (8-10 slides)
    - Create `src/lib/repurpose/formatters/linkedin.ts` for LinkedIn posts (3000 char limit)
    - Create `src/lib/repurpose/formatters/blog.ts` for SEO-optimized blog articles
    - Create `src/lib/repurpose/formatters/tiktok.ts` for TikTok scripts (60s reading time)
    - Create `src/lib/repurpose/formatters/email.ts` for email newsletters
    - Create `src/lib/repurpose/validator.ts` for quality validation
    - Create `src/lib/repurpose/index.ts` orchestrating the repurposing flow
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.11_


  - [-] 2.4 Create AI analysis service for research insights
    - Create `src/lib/ai/research-analyzer.ts` for analyzing scraped data
    - Implement trending topic identification (score 0-100)
    - Implement pain point extraction from forums
    - Implement content gap analysis vs competitors
    - Implement content opportunity generation with reasoning
    - Implement keyword extraction for SEO
    - Implement trend velocity calculation (rising/stable/declining)
    - Implement topic clustering to avoid redundancy
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.11_

- [ ] 3. Checkpoint - Verify core services
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. tRPC API Layer - Research Router
  - [ ] 4.1 Create research router with basic queries
    - Create `src/trpc/routers/research.ts`
    - Implement `getLatest` query to fetch latest ResearchData for user
    - Implement `getTrends` query with filtering by score and category
    - Implement `getIdeas` query with pagination and platform filtering
    - Implement `getAlerts` query for TrendAlert records
    - Add Zod input validation schemas
    - Add proper error handling with TRPCError
    - _Requirements: 2.1, 2.2, 2.4, 2.11, 4.10_


  - [ ] 4.2 Create research router mutations
    - Implement `triggerResearch` mutation to send Inngest event
    - Add rate limiting check (prevent spam, 6-hour cooldown)
    - Implement `updateNiche` mutation to update User preferences
    - Implement `markAlertViewed` mutation for TrendAlert status updates
    - Implement `bookmarkIdea` mutation for saving content ideas
    - Wire up Inngest client for event sending
    - _Requirements: 1.1, 1.10, 3.1, 3.2, 3.6, 4.5, 4.7, 14.7_

- [ ] 5. tRPC API Layer - Repurpose Router
  - [ ] 5.1 Create repurpose router with generation endpoint
    - Create `src/trpc/routers/repurpose.ts`
    - Implement `generate` mutation accepting source content and platforms
    - Add sourceContent Zod schema (type: youtube_url/blog_url/text/podcast_url)
    - Add platforms array validation (twitter/instagram/linkedin/blog/tiktok/email)
    - Integrate with content repurposing service from task 2.3
    - Add niche context injection when enabled
    - Return all platform outputs with quality scores
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.10, 7.9, 8.11_

  - [ ] 5.2 Add content validation endpoint
    - Implement `validateOutput` mutation for quality checking
    - Validate character limits per platform
    - Check grammatical correctness using AI confidence scores
    - Ensure key points from source appear in output
    - Return validation results with quality score
    - _Requirements: 7.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_


- [ ] 6. tRPC API Layer - Analytics Router
  - [ ] 6.1 Create analytics router with queries
    - Create `src/trpc/routers/analytics.ts`
    - Implement `getLatest` query for latest AnalyticsSnapshot
    - Implement `getHistory` query with date range filtering
    - Implement `getInsights` query for AI-generated insights
    - Add pagination for historical data
    - Include platformData and aggregatedMetrics in responses
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.11, 13.1, 13.11_

  - [ ] 6.2 Create analytics refresh mutation
    - Implement `refresh` mutation to trigger manual analytics update
    - Send Inngest event for analytics aggregation job
    - Add rate limiting (prevent excessive refreshes)
    - Return estimated completion time
    - _Requirements: 12.7, 12.8_

- [ ] 7. tRPC API Layer - Template Router
  - [ ] 7.1 Create template router with browse and search
    - Create `src/trpc/routers/template.ts`
    - Implement `browse` query with category filtering
    - Add search functionality (name, description, tags)
    - Add sorting (popular, recent, rating)
    - Return template metadata (node count, credentials required, clone count)
    - Add pagination (50 templates per page)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.11_


  - [ ] 7.2 Create template detail and clone endpoints
    - Implement `getById` query for template details with reviews
    - Implement `clone` mutation to copy template to user's workflows
    - Create new Workflow with nodes and connections from template
    - Append " (Copy)" suffix to cloned workflow name
    - Increment template cloneCount on successful clone
    - Validate workflow integrity before saving
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6, 10.7, 10.8, 10.11_

- [ ] 8. Update tRPC Root Router
  - [ ] 8.1 Wire up new routers to root router
    - Update `src/trpc/root.ts` to include researchRouter
    - Add repurposeRouter, analyticsRouter, templateRouter
    - Export updated appRouter type for client usage
    - Verify type safety end-to-end
    - _Requirements: All API requirements_

- [ ] 9. Checkpoint - Verify API layer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Inngest Functions - Niche Research Job
  - [ ] 10.1 Create niche research orchestration function
    - Create `src/inngest/functions/niche-research.ts`
    - Define Inngest function triggered by `research/trigger` event
    - Set 5-minute timeout for research job
    - Implement parallel scraping of all sources (Google Trends, Reddit, YouTube, Twitter)
    - Call Firecrawl service for each source with error handling
    - Pass scraped data to AI analysis service
    - Store results in ResearchData table with 7-day expiration
    - Send notification to user on completion
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.8, 2.9, 3.4, 19.1_


  - [ ] 10.2 Implement competitor tracking in research job
    - Add competitor URL scraping when competitorUrls provided
    - Extract posting frequency, engagement metrics, content themes
    - Calculate content gaps by comparing with user's niche data
    - Store competitor insights in ResearchData.competitorData
    - _Requirements: 1.6, 2.4_

  - [ ] 10.3 Add retry logic and error handling
    - Implement exponential backoff for failed scraping requests (1s, 2s, 4s)
    - Handle rate limiting from Firecrawl API
    - Log errors to Sentry with context (userId, niche, source)
    - Send failure notification if all retries exhausted
    - Mark job as failed after 3 retry attempts
    - _Requirements: 1.9, 18.2, 18.5, 20.1, 20.2_

- [ ] 11. Inngest Functions - Scheduled Research
  - [ ] 11.1 Create scheduled research trigger function
    - Create `src/inngest/functions/scheduled-research.ts`
    - Implement daily cron trigger (6:00 AM user timezone)
    - Implement weekly cron trigger (Monday 6:00 AM)
    - Query users with researchFrequency=daily or weekly
    - Send `research/trigger` event for each user
    - Implement idempotence to prevent duplicate execution
    - Track research job history with execution times
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.9, 3.10_


  - [ ] 11.2 Add data archival job
    - Create function to archive ResearchData older than 30 days
    - Run daily at midnight
    - Delete or move to cold storage
    - _Requirements: 3.7_

- [ ] 12. Inngest Functions - Trend Monitoring
  - [ ] 12.1 Create real-time trend monitoring function
    - Create `src/inngest/functions/trend-monitor.ts`
    - Trigger on new ResearchData creation
    - Identify trending topics with score > 80
    - Create TrendAlert records for high-score topics
    - Deduplicate alerts (check existing alerts for same topic)
    - Set 48-hour expiration on alerts
    - Limit to 5 alerts per day per user
    - _Requirements: 4.1, 4.3, 4.4, 4.8, 4.9_

  - [ ] 12.2 Implement trend alert notifications
    - Send Discord/Slack/Email notification within 5 minutes
    - Include topic name, score, velocity, recommended platforms
    - Include source URLs for verification
    - Navigate to pre-filled content generator on click
    - Track alert response time
    - _Requirements: 4.2, 4.3, 4.6, 4.7, 4.10_

- [ ] 13. Inngest Functions - Content Repurposing Job
  - [ ] 13.1 Create content repurposing background job
    - Create `src/inngest/functions/repurpose-content.ts`
    - Set 60-second timeout for repurposing
    - Extract content based on source type (YouTube/blog/podcast/text)
    - Generate all platform formats in parallel
    - Run quality validation on each output
    - Regenerate if quality score < 0.7
    - Store outputs with confidence scores
    - _Requirements: 6.1, 6.4, 6.5, 6.9, 7.12, 8.4, 8.10, 19.2_


- [ ] 14. Inngest Functions - Analytics Aggregation
  - [ ] 14.1 Create analytics aggregation scheduled job
    - Create `src/inngest/functions/analytics-aggregation.ts`
    - Run every 6 hours via cron schedule
    - Query users with connected platforms
    - Fetch YouTube Analytics, Instagram Insights, Twitter metrics
    - Fetch Stripe revenue data if integrated
    - Calculate aggregated metrics (total views, engagements, follower growth)
    - Calculate engagement rates per platform
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.11_

  - [ ] 14.2 Generate AI insights from analytics data
    - Analyze performance data to identify best content types
    - Calculate optimal posting times using historical engagement
    - Detect engagement anomalies (spikes/drops)
    - Compare performance against niche trends if available
    - Generate 5+ actionable insights per week
    - Recommend content topics based on high performers
    - Store insights in AnalyticsSnapshot.insights with confidence scores
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.10, 13.11_

  - [ ] 14.3 Implement caching for analytics data
    - Cache aggregated snapshots with 1-hour TTL
    - Handle platform API unavailability gracefully
    - Display staleness indicator if data > 6 hours old
    - _Requirements: 12.8, 12.9, 19.8_

- [ ] 15. Checkpoint - Verify Inngest functions
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 16. Enhanced AI Nodes - Niche Context Injection
  - [ ] 16.1 Update existing AI node handlers with niche context
    - Update `src/features/nodes/handlers/openai-handler.ts` to fetch ResearchData
    - Update `src/features/nodes/handlers/anthropic-handler.ts` similarly
    - Update `src/features/nodes/handlers/gemini-handler.ts` similarly
    - Update `src/features/nodes/handlers/deepseek-handler.ts` similarly
    - Add toggle option to enable/disable niche context per node
    - Inject top 5 trending keywords into AI prompts
    - Inject pain points and content gaps into prompts
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 16.2 Add niche context metadata tracking
    - Display which research insights were used in node output
    - Warn user if research data is stale (> 7 days)
    - Log research data version used for each generation
    - Track content performance for refinement
    - _Requirements: 5.7, 5.8, 5.9, 5.10, 5.11_

- [ ] 17. New Workflow Node Types
  - [ ] 17.1 Create NICHE_RESEARCH node type
    - Create `src/features/nodes/types/niche-research-node.tsx`
    - Add node configuration UI (niche, keywords input)
    - Implement node handler that triggers research job
    - Output ResearchData to downstream nodes
    - Display execution status (pending/running/completed)
    - _Requirements: 16.1, 16.7, 16.9, 16.10_


  - [ ] 17.2 Create TREND_MONITOR node type
    - Create `src/features/nodes/types/trend-monitor-node.tsx`
    - Add configuration for minimum trend score threshold
    - Implement handler that checks for new trending topics
    - Output TrendAlert records to downstream nodes
    - _Requirements: 16.2, 16.8, 16.10_

  - [ ] 17.3 Create CONTENT_IDEA_GENERATOR node type
    - Create `src/features/nodes/types/content-idea-generator-node.tsx`
    - Add configuration for number of ideas and target platforms
    - Implement handler that generates content ideas from research data
    - Output ContentIdea array with reasoning and engagement scores
    - _Requirements: 16.3, 16.10_

  - [ ] 17.4 Create COMPETITOR_TRACKER node type
    - Create `src/features/nodes/types/competitor-tracker-node.tsx`
    - Add configuration for competitor URLs
    - Implement handler that scrapes and analyzes competitor data
    - Output competitor insights and content gaps
    - _Requirements: 16.4, 16.10_

  - [ ] 17.5 Create CONTENT_REPURPOSER node type
    - Create `src/features/nodes/types/content-repurposer-node.tsx`
    - Add configuration for source content and target platforms
    - Implement handler that triggers repurposing job
    - Output platform-specific content with quality scores
    - Add preview functionality for generated outputs
    - _Requirements: 16.5, 16.8, 16.10_


  - [ ] 17.6 Create NICHE_AWARE_CONTENT_GENERATOR node type
    - Create `src/features/nodes/types/niche-aware-generator-node.tsx`
    - Wrap existing AI nodes with niche context injection
    - Add toggle to enable/disable niche awareness
    - Display research insights used in generation
    - _Requirements: 16.6, 16.10_

  - [ ] 17.7 Register new node types in node registry
    - Update `src/config/nodes.ts` to include all 6 new node types
    - Add node icons and descriptions
    - Configure node input/output schemas
    - Add to workflow builder node palette
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ] 18. Frontend - Niche Onboarding Flow
  - [ ] 18.1 Create niche onboarding page and components
    - Create `src/app/(dashboard)/onboarding/niche/page.tsx`
    - Create `src/components/onboarding/NicheOnboardingForm.tsx`
    - Add niche input field with autocomplete suggestions
    - Add keyword multi-select chips (3-10 keywords)
    - Add competitor URLs list builder (optional, max 5)
    - Add research frequency radio buttons (daily/weekly)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.11_

  - [ ] 18.2 Wire up onboarding to tRPC mutations
    - Call `research.updateNiche` mutation on form submit
    - Validate niche is not empty before submission
    - Trigger immediate research job after completion
    - Display estimated completion time (5 minutes)
    - Navigate to research dashboard after onboarding
    - _Requirements: 14.6, 14.7, 14.8, 14.10_


  - [ ] 18.3 Add onboarding skip and re-prompt logic
    - Allow users to skip onboarding
    - Re-prompt after 7 days if skipped
    - Store onboarding completion status in user preferences
    - _Requirements: 14.9_

- [ ] 19. Frontend - Research Dashboard
  - [ ] 19.1 Create research dashboard page structure
    - Create `src/app/(dashboard)/research/page.tsx`
    - Create `src/components/research/ResearchHeader.tsx` with refresh button
    - Create layout with sections: Trending Topics, Content Opportunities, Competitor Insights
    - Add data freshness timestamp display
    - _Requirements: 15.1, 15.5, 15.10_

  - [ ] 19.2 Create trending topics section
    - Create `src/components/research/TrendingTopicsSection.tsx`
    - Display top 10 topics sorted by score descending
    - Show trend velocity indicators (rising/stable/declining icons)
    - Add filtering by category and keyword
    - Show source attribution for each topic
    - Click opens detailed view with scraped sources
    - _Requirements: 15.1, 15.2, 15.4, 15.9, 15.10, 15.11_

  - [ ] 19.3 Create content opportunities section
    - Create `src/components/research/ContentOpportunitiesSection.tsx`
    - Display AI-generated content ideas with titles and reasoning
    - Show estimated engagement predictions
    - Show target platforms for each idea
    - Add bookmark functionality for saving ideas
    - Click pre-fills content generator with idea context
    - _Requirements: 15.3, 15.7_


  - [ ] 19.4 Create competitor insights section
    - Create `src/components/research/CompetitorInsightsSection.tsx`
    - Display when competitor URLs are configured
    - Show competitor activity metrics (posting frequency, engagement)
    - Show identified content gaps
    - _Requirements: 15.6_

  - [ ] 19.5 Add manual refresh and export functionality
    - Wire up manual refresh button to tRPC mutation
    - Add export functionality (JSON/CSV download)
    - Show loading states during refresh
    - Display historical trend comparison
    - _Requirements: 15.5, 15.8, 15.10_

- [ ] 20. Frontend - Analytics Dashboard
  - [ ] 20.1 Create analytics dashboard page structure
    - Create `src/app/(dashboard)/analytics/page.tsx`
    - Create `src/components/analytics/MetricsOverview.tsx` with metric cards
    - Create `src/components/analytics/PerformanceCharts.tsx` for visualizations
    - Create `src/components/analytics/AIInsightsSection.tsx` for insights
    - Add date range filtering (7-day, 30-day, 90-day)
    - Add platform filtering
    - _Requirements: 12.10, 13.10_

  - [ ] 20.2 Create metrics overview cards
    - Display Total Views, Engagement Rate, Follower Growth, Revenue
    - Show percentage change from previous period
    - Use shadcn/ui Card components
    - Add loading skeletons
    - _Requirements: 12.2, 12.3, 12.4, 12.11_


  - [ ] 20.3 Create performance charts
    - Add line chart for follower growth trends
    - Add bar chart for content performance comparison
    - Add platform breakdown visualization
    - Use recharts or similar charting library
    - _Requirements: 12.4, 12.5_

  - [ ] 20.4 Create AI insights display
    - Display AI-generated insights (5+ per week)
    - Show insight type icons (performance/timing/content/growth)
    - Include plain-language explanations
    - Display confidence scores
    - Show supporting data for each insight
    - Highlight actionable insights
    - _Requirements: 13.1, 13.2, 13.5, 13.7, 13.10, 13.11_

  - [ ] 20.5 Add data refresh and staleness handling
    - Add manual refresh button
    - Display staleness indicator if data > 6 hours old
    - Show loading states during refresh
    - Handle platform API unavailability gracefully
    - _Requirements: 12.7, 12.8, 12.9_

  - [ ] 20.6 Optimize dashboard load performance
    - Implement caching with 1-hour TTL
    - Use React Query for data prefetching
    - Ensure <2 second initial load time
    - Add pagination for historical data (20 items per page)
    - _Requirements: 19.3, 19.4, 19.8_

- [ ] 21. Frontend - Template Marketplace
  - [ ] 21.1 Create template marketplace page
    - Create `src/app/(dashboard)/templates/page.tsx`
    - Create `src/components/templates/TemplateSearch.tsx` with search input
    - Create `src/components/templates/TemplateCategories.tsx` for category filters
    - Create `src/components/templates/TemplateGrid.tsx` for template cards
    - Add sorting options (popular, recent, rating)
    - _Requirements: 9.1, 9.2_


  - [ ] 21.2 Create template card component
    - Create `src/components/templates/TemplateCard.tsx`
    - Display template name, description, category
    - Show node count, estimated execution time
    - Show required credentials with icons
    - Display popularity metrics (clone count, success rate, ratings)
    - Show verified badge for CreatorFlow team templates
    - Highlight missing credentials
    - _Requirements: 9.3, 9.4, 9.6, 9.7, 9.10, 9.11_

  - [ ] 21.3 Create template detail dialog
    - Create `src/components/templates/TemplateDetailDialog.tsx`
    - Show complete workflow structure preview
    - Display author, creation date, last updated date
    - Show detailed description and use case
    - Display user ratings and reviews
    - Add clone button
    - Show template-specific documentation
    - _Requirements: 9.8, 9.9, 9.10, 10.10_

  - [ ] 21.4 Implement template cloning flow
    - Wire up clone button to tRPC mutation
    - Show loading state during cloning
    - Navigate to workflow editor after successful clone
    - Display success notification
    - Prompt for missing credentials if needed
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.9_

  - [ ] 21.5 Add filtering and search functionality
    - Filter by category (research_strategy, content_distribution, etc.)
    - Filter by required integrations
    - Search by name, description, tags
    - Apply filters reactively with URL state management
    - _Requirements: 9.2, 9.5_


- [ ] 22. Pre-Built Templates Creation
  - [ ] 22.1 Create template: Weekly Niche Research to Content Calendar
    - Design workflow with NICHE_RESEARCH → CONTENT_IDEA_GENERATOR → calendar output
    - Configure with weekly schedule trigger
    - Add template metadata (description, category, tags)
    - Test execution in development environment
    - Mark as verified CreatorFlow template
    - _Requirements: 11.1, 11.9_

  - [ ] 22.2 Create template: Trend Alert to Rapid Content Creation
    - Design workflow with TREND_MONITOR → NICHE_AWARE_CONTENT_GENERATOR → multi-platform distribution
    - Configure real-time trigger on trending topics
    - Add template metadata
    - _Requirements: 11.2, 11.9_

  - [ ] 22.3 Create template: Competitor Tracker to Strategy Insights
    - Design workflow with COMPETITOR_TRACKER → analysis → insights report
    - Configure daily schedule
    - Add template metadata
    - _Requirements: 11.3, 11.9_

  - [ ] 22.4 Create template: YouTube Video to Multi-Platform Distribution
    - Design workflow with CONTENT_REPURPOSER → platform-specific outputs → distribution
    - Configure for YouTube URL input
    - Add template metadata
    - _Requirements: 11.4, 11.9_

  - [ ] 22.5 Create template: Podcast Episode to Content Suite
    - Design workflow with CONTENT_REPURPOSER → multiple format outputs
    - Configure for podcast URL/transcript input
    - Add template metadata
    - _Requirements: 11.5, 11.9_


  - [ ] 22.6 Create template: Blog Post to Social Media Campaign
    - Design workflow with CONTENT_REPURPOSER → social platform outputs
    - Configure for blog URL input
    - Add template metadata
    - _Requirements: 11.6, 11.9_

  - [ ] 22.7 Create additional 4 templates to reach 10 total
    - Design creative workflows leveraging Phase 2 features
    - Include variety of use cases (content creation, research, analytics)
    - Add metadata and estimated time savings
    - Test all templates for successful execution
    - _Requirements: 11.7, 11.9, 11.10_

  - [ ] 22.8 Seed templates into database
    - Create database seed script for pre-built templates
    - Run seed script to populate WorkflowTemplate table
    - Verify templates appear in marketplace
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 23. Checkpoint - Verify frontend and templates
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Performance Optimization
  - [ ] 24.1 Implement database connection pooling
    - Configure Prisma connection pool with minimum 10 connections
    - Add connection timeout settings
    - Monitor connection usage
    - _Requirements: 19.5_


  - [ ] 24.2 Add database indexes for performance
    - Verify indexes on userId, createdAt, status fields
    - Add composite indexes for frequently queried combinations
    - Test query performance with EXPLAIN ANALYZE
    - _Requirements: 19.6_

  - [ ] 24.3 Implement caching layer
    - Add Redis or in-memory caching for research data (1-hour TTL)
    - Cache Firecrawl results (24-hour TTL)
    - Cache analytics snapshots (1-hour TTL)
    - Add cache invalidation on data updates
    - _Requirements: 1.10, 18.4, 19.8_

  - [ ] 24.4 Add request queuing for AI API calls
    - Implement job queue using Inngest or Bull
    - Prevent API quota exhaustion
    - Add retry logic for failed requests
    - Monitor queue depth and processing time
    - _Requirements: 19.11_

  - [ ] 24.5 Implement API rate limiting
    - Add rate limiting middleware: 100 requests per minute per user
    - Return 429 status code when limit exceeded
    - Add rate limit headers in responses
    - _Requirements: 3.6, 19.10_

- [ ] 25. Error Handling and Monitoring
  - [ ] 25.1 Integrate Sentry error tracking
    - Configure Sentry for all Inngest functions
    - Log errors with context (userId, workflow, node type)
    - Set up error alerting thresholds
    - _Requirements: 20.1_


  - [ ] 25.2 Add email notifications for failures
    - Send email when scheduled research job fails
    - Send email when AI API quota exceeded
    - Send email when repurposing job fails
    - Include error details and retry information
    - _Requirements: 20.4, 20.7_

  - [ ] 25.3 Implement health check endpoints
    - Create `/api/health` endpoint for system status
    - Check database connectivity
    - Check Inngest availability
    - Check external API availability (Firecrawl, AI providers)
    - _Requirements: 20.5_

  - [ ] 25.4 Add execution metrics tracking
    - Track success rate, average duration, error rate per node type
    - Store metrics in database or monitoring service
    - Create dashboard for monitoring metrics
    - Set up alerts for degraded performance
    - _Requirements: 20.6_

  - [ ] 25.5 Implement graceful degradation
    - Return partial results when content repurposing partially fails
    - Display cached data when platform APIs are unavailable
    - Queue requests when AI API quota exceeded
    - _Requirements: 20.3, 20.7_

- [ ] 26. Security and Compliance
  - [ ] 26.1 Encrypt sensitive user data
    - Ensure Firecrawl API keys encrypted with AES-256
    - Encrypt competitor URLs if they contain sensitive info
    - Use existing Cryptr implementation from Phase 1
    - _Requirements: 18.1_


  - [ ] 26.2 Add row-level security for data access
    - Ensure all ResearchData queries filter by userId
    - Ensure TrendAlert queries filter by userId
    - Ensure AnalyticsSnapshot queries filter by userId
    - Add Prisma middleware for automatic filtering
    - _Requirements: 17.11_

  - [ ] 26.3 Validate and sanitize user inputs
    - Validate URLs before scraping (prevent SSRF attacks)
    - Sanitize HTML content from scraped sources
    - Validate niche keywords (max length, no special chars)
    - Add XSS prevention in user-generated content
    - _Requirements: 1.10, 6.10, 14.6, 18.8_

  - [ ] 26.4 Implement CORS and CSRF protection
    - Configure CORS for API endpoints
    - Add CSRF tokens for mutations
    - Verify Better Auth session tokens
    - _Requirements: Security best practices_

- [ ] 27. Testing and Quality Assurance
  - [ ] 27.1 Write unit tests for core services
    - Test Firecrawl integration with mocked responses
    - Test AI analysis service with sample data
    - Test content repurposing formatters
    - Test research data processing logic
    - Aim for >80% code coverage on critical paths
    - _Requirements: All feature requirements_

  - [ ] 27.2 Write integration tests for tRPC routers
    - Test research router queries and mutations
    - Test repurpose router with sample content
    - Test analytics router data aggregation
    - Test template router cloning flow
    - Mock Inngest events and verify behavior
    - _Requirements: All API requirements_


  - [ ] 27.3 Write E2E tests for critical workflows
    - Test niche onboarding → research job → dashboard display
    - Test content repurposing end-to-end flow
    - Test template cloning and execution
    - Test analytics aggregation and insights display
    - Use Playwright or Cypress for E2E testing
    - _Requirements: All feature requirements_

  - [ ] 27.4 Perform manual testing and bug fixes
    - Test all features in staging environment
    - Verify performance targets (<5min research, <60s repurposing, <2s dashboard)
    - Test error scenarios (API failures, rate limits, invalid inputs)
    - Fix identified bugs and edge cases
    - _Requirements: 19.1, 19.2, 19.3_

- [ ] 28. Documentation and Deployment
  - [ ] 28.1 Update API documentation
    - Document all new tRPC routers and procedures
    - Add JSDoc comments to all public functions
    - Generate API reference documentation
    - _Requirements: All API requirements_

  - [ ] 28.2 Create user documentation
    - Write guide for niche onboarding
    - Write guide for using research dashboard
    - Write guide for content repurposing
    - Write guide for template marketplace
    - Add inline help tooltips in UI
    - _Requirements: 14.1, 15.1, 9.1_

  - [ ] 28.3 Update environment variable documentation
    - Document FIRECRAWL_API_KEY requirement
    - Document optional platform API keys (YouTube, Twitter, etc.)
    - Update .env.example with Phase 2 variables
    - _Requirements: 18.1_


  - [ ] 28.4 Deploy to production
    - Run database migrations on production database
    - Deploy backend services with new Inngest functions
    - Deploy frontend with new pages and components
    - Verify all environment variables configured
    - Monitor error rates and performance after deployment
    - _Requirements: All requirements_

- [ ] 29. Final checkpoint - Complete verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks build incrementally on previous work
- Each task references specific requirements for traceability
- Checkpoints ensure validation at key milestones
- Testing tasks are integrated throughout implementation (not separate phase)
- Performance targets: <5min research, <60s repurposing, <2s dashboard loads
- Security is built-in from the start (encryption, validation, access control)
- The implementation leverages existing Phase 1 infrastructure (tRPC, Inngest, Prisma, Better Auth)
- All code examples use TypeScript with Next.js 16, tRPC 11, and Prisma 7.8

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1", "5.1", "6.1", "7.1"] },
    { "id": 4, "tasks": ["4.2", "5.2", "6.2", "7.2", "8.1"] },
    { "id": 5, "tasks": ["10.1", "10.2", "11.1", "12.1", "13.1", "14.1"] },
    { "id": 6, "tasks": ["10.3", "11.2", "12.2", "14.2", "14.3"] },
    { "id": 7, "tasks": ["16.1", "16.2"] },
    { "id": 8, "tasks": ["17.1", "17.2", "17.3", "17.4", "17.5", "17.6"] },
    { "id": 9, "tasks": ["17.7", "18.1", "19.1", "20.1", "21.1"] },
    { "id": 10, "tasks": ["18.2", "18.3", "19.2", "19.3", "19.4", "20.2", "20.3", "21.2"] },
    { "id": 11, "tasks": ["19.5", "20.4", "20.5", "21.3", "21.4", "21.5"] },
    { "id": 12, "tasks": ["20.6", "22.1", "22.2", "22.3", "22.4", "22.5", "22.6", "22.7"] },
    { "id": 13, "tasks": ["22.8", "24.1", "24.2", "24.3"] },
    { "id": 14, "tasks": ["24.4", "24.5", "25.1", "25.2", "25.3"] },
    { "id": 15, "tasks": ["25.4", "25.5", "26.1", "26.2", "26.3", "26.4"] },
    { "id": 16, "tasks": ["27.1", "27.2"] },
    { "id": 17, "tasks": ["27.3", "27.4"] },
    { "id": 18, "tasks": ["28.1", "28.2", "28.3"] },
    { "id": 19, "tasks": ["28.4"] }
  ]
}
```
