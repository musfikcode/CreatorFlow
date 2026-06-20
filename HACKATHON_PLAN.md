# CreatorFlow - Content Creator Workflow Manager

## 🎯 Problem Statement

Content creators spend 60-70% of their time on repetitive tasks instead of creating content:
- Manually posting the same content across 5+ platforms
- Tracking sponsorship deliverables and payments
- Responding to similar comments/DMs repeatedly
- Analyzing performance metrics from different platforms
- Managing collaboration requests and contracts
- Scheduling content calendars manually

**The Cost**: A creator earning $5000/month wastes $3000 worth of time on admin tasks.

## 💡 Solution

**CreatorFlow** is an AI-powered workflow automation platform built specifically for content creators. It automates repetitive tasks, centralizes multi-platform management, and uses AI to optimize content strategy - letting creators focus on what they do best: creating.

### Key Features

#### Phase 1 (Current - Base Platform)
- ✅ Visual workflow builder with drag-and-drop interface
- ✅ AI integrations (OpenAI, Anthropic, Gemini, DeepSeek)
- ✅ Communication channels (Discord, Slack)
- ✅ Payment tracking (Stripe webhooks)
- ✅ Form automation (Google Forms)
- ✅ HTTP requests for custom integrations

#### Phase 2 (Hackathon Additions - UNIQUE FEATURES)
- 🔍 **AI Niche Research Engine** (FLAGSHIP FEATURE): Automated trend discovery and content strategy
  - User enters their niche → Platform scrapes internet using Firecrawl
  - Real-time trend detection (Google Trends, Reddit, YouTube, Twitter)
  - Competitor content analysis and insights
  - Pain point mining from forums/discussions
  - AI-generated content opportunities based on research
  - Weekly/daily automated research reports
  - **Time Saved**: 10+ hours/week of manual research
  
- 🎨 **AI Content Repurposing Engine**: Transform one piece of content into multiple formats
  - YouTube video → Twitter thread + Instagram carousel + LinkedIn post + Blog article
  - Podcast episode → Show notes + Audiograms + Quote graphics + Newsletter
  - **Enhanced**: Uses niche research data for better optimization
  
- 🧠 **Niche-Aware AI Content Generator**: Smart content creation with research insights
  - Every AI generation incorporates trending topics from niche research
  - Automatically includes high-performing keywords
  - Addresses real pain points discovered from scraping
  - Learns from competitor strategies
  - Platform-specific optimization
  - **Unique**: Not generic AI - deeply personalized to niche
  
- 📊 **Creator Analytics Dashboard**: Unified metrics from all platforms
  - Cross-platform performance comparison
  - Best posting times analysis
  - Audience growth tracking
  - Revenue analytics (sponsorships, products, memberships)
  - Research-driven insights
  
- 🤖 **AI Comment/DM Responder**: Smart auto-responses for common questions
  - Learns from your previous responses
  - Handles FAQs automatically
  - Escalates complex queries to you
  
- 📅 **Smart Content Calendar**: AI-powered scheduling with research integration
  - Suggests optimal posting times per platform
  - Content gap analysis from niche research
  - Trend-based recommendations (real-time)
  - Competitor activity alerts
  
- 💰 **Sponsorship Manager**: Track deals and deliverables
  - Contract tracking
  - Deliverable checklists
  - Payment reminders
  - ROI reporting for brands
  
- 🎬 **Content Templates Library**: Pre-built workflows for creators
  - "Niche Research → Weekly Content Calendar" (NEW)
  - "Trend Alert → Rapid Content Creation" (NEW)
  - "Competitor Tracker → Strategy Insights" (NEW)
  - "YouTube Upload → Multi-platform Distribution"
  - "Podcast Episode → Content Suite"
  - "Sponsorship Onboarding → Deliverable Tracking"
  - "Weekly Newsletter → Social Teasers"

## 🎯 Target Audience

### Primary (TAM: 50M+ globally)
- YouTubers (500K-5M subscribers)
- Instagram Creators (100K-1M followers)
- TikTok Creators (500K-5M followers)
- Podcast Hosts (10K-100K listeners)
- Newsletter Writers (5K-50K subscribers)

### Secondary
- Content Creator Agencies
- Social Media Managers
- Influencer Marketing Agencies
- Personal Brand Consultants

### Geographic Focus
- **Phase 1**: English-speaking creators (US, UK, Canada, Australia, India)
- **Phase 2**: Expand to Spanish, Portuguese, Hindi markets

## 💰 Business Model

### Pricing Tiers

**Free Tier** - "Starter Creator"
- 100 workflow executions/month
- 3 active workflows
- 2 platform connections
- Basic analytics
- Community support

**Pro Tier** - $19/month - "Growing Creator"
- 5,000 executions/month
- Unlimited workflows
- Unlimited platform connections
- AI content repurposing (50 uses/month)
- Advanced analytics
- Priority support
- **Target**: Creators earning $1K-10K/month

**Business Tier** - $49/month - "Professional Creator"
- 25,000 executions/month
- Everything in Pro
- AI content repurposing (500 uses/month)
- Team collaboration (3 members)
- White-label reports for sponsors
- API access
- **Target**: Creators earning $10K-50K/month

**Agency Tier** - $199/month - "Creator Agency"
- 100,000 executions/month
- Everything in Business
- Unlimited team members
- Multi-client management
- Custom integrations
- Dedicated account manager
- **Target**: Agencies managing 10+ creators

### Revenue Projections (Year 1)

| Month | Free Users | Pro Users | Business Users | Agency Users | MRR |
|-------|-----------|-----------|----------------|--------------|-----|
| 1-3   | 100       | 5         | 0              | 0            | $95 |
| 4-6   | 500       | 25        | 3              | 0            | $622 |
| 7-9   | 2000      | 100       | 15             | 2            | $2,633 |
| 10-12 | 5000      | 300       | 50             | 5            | $9,695 |

**Year 1 Target**: $10K MRR, 5,000+ users

### Additional Revenue Streams
1. **Template Marketplace**: Creators sell their workflows (20% commission)
2. **Affiliate Partnerships**: Revenue share with integrated platforms
3. **Sponsored Integrations**: Platforms pay to be featured
4. **White-label Licensing**: Sell to agencies/platforms

## 🏆 Competitive Advantage

### vs Zapier/Make/n8n
- ❌ Generic automation tools
- ❌ Complex for non-technical users
- ❌ No creator-specific features
- ❌ Expensive for individual creators

### vs Buffer/Hootsuite
- ❌ Only social media scheduling
- ❌ No workflow automation
- ❌ No AI content repurposing
- ❌ Limited integrations

### CreatorFlow Advantages
- ✅ Built specifically for content creators
- ✅ **AI Niche Research Engine** (UNIQUE - no competitor has this)
- ✅ **Niche-aware content generation** (smarter than generic AI)
- ✅ AI-powered content repurposing
- ✅ Real-time trend detection and alerts
- ✅ Automated competitor intelligence
- ✅ Visual workflow builder (no coding)
- ✅ Affordable pricing for individuals
- ✅ Comprehensive creator toolkit
- ✅ Template marketplace
- ✅ Multi-platform analytics

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: TailwindCSS v4
- **Components**: Radix UI + shadcn/ui
- **State Management**: Jotai
- **Workflow Builder**: React Flow (@xyflow/react)
- **Forms**: React Hook Form + Zod validation
- **API Client**: tRPC + TanStack Query

### Backend
- **Runtime**: Node.js
- **API**: tRPC (type-safe APIs)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Better Auth
- **Workflow Engine**: Inngest (serverless workflows)
- **File Storage**: Vercel Blob (planned)
- **Email**: Resend (planned)

### AI & Integrations
- **AI Models**: OpenAI GPT-4, Anthropic Claude, Google Gemini, DeepSeek
- **AI SDK**: Vercel AI SDK
- **Web Scraping**: Firecrawl (niche research and trend discovery)
- **Data Sources**: Google Trends API, Reddit API, YouTube Data API, Twitter API
- **Payment Processing**: Stripe
- **Communication**: Discord, Slack
- **Forms**: Google Forms
- **Social Media**: Twitter API, Instagram Graph API (planned)
- **Video**: YouTube Data API (planned)

### DevOps & Monitoring
- **Hosting**: Vercel
- **Database Hosting**: Neon/Supabase
- **Error Tracking**: Sentry
- **Analytics**: Vercel Analytics
- **CI/CD**: GitHub Actions

### Development Tools
- **Package Manager**: Bun
- **Linting**: Biome
- **Type Safety**: TypeScript strict mode
- **API Testing**: Postman/Insomnia

## 📈 Go-to-Market Strategy

### Phase 1: Launch (Month 1-2)
1. **Product Hunt Launch**
   - Prepare demo video
   - Create launch page
   - Gather early supporters
   - Target: Top 5 product of the day

2. **Content Marketing**
   - Blog: "10 Hours Saved: Automating Your Creator Workflow"
   - YouTube: Tutorial videos
   - Twitter: Daily tips thread
   - LinkedIn: Thought leadership

3. **Community Building**
   - Discord server for users
   - Weekly office hours
   - Feature request board
   - Beta tester program

### Phase 2: Growth (Month 3-6)
1. **Influencer Partnerships**
   - Offer free Business tier to micro-influencers (50K-200K)
   - Case studies and testimonials
   - Affiliate program (30% recurring commission)

2. **Template Marketplace Launch**
   - Seed with 20+ high-quality templates
   - Invite power users to contribute
   - Revenue share program

3. **SEO & Content**
   - Target keywords: "content creator automation", "multi-platform posting"
   - Comparison pages: "CreatorFlow vs Zapier for Creators"
   - How-to guides and tutorials

### Phase 3: Scale (Month 7-12)
1. **Platform Partnerships**
   - Integration partnerships with creator platforms
   - Co-marketing campaigns
   - Featured in platform directories

2. **Agency Program**
   - Dedicated agency tier
   - White-label options
   - Partner directory

3. **International Expansion**
   - Localization (Spanish, Portuguese, Hindi)
   - Regional payment methods
   - Local influencer partnerships

## 🎨 Unique Features to Build (Priority Order)

### 1. AI Niche Research Engine (HIGHEST PRIORITY - FLAGSHIP)
**User Story**: "I enter my niche, and CreatorFlow automatically researches trending topics, competitor strategies, and gives me data-backed content ideas every week."

**Why This Is THE Differentiator:**
- No competitor offers automated niche research
- Solves the biggest creator pain point: "What should I create?"
- Transforms CreatorFlow from automation tool → strategic partner
- Creates massive time savings (10+ hours/week)
- Network effect: Better data as more creators use it

**Implementation**:
- **New Models** (Prisma):
  ```prisma
  model User {
    niche          String?
    nicheKeywords  String[]
    researchData   ResearchData[]
  }
  
  model ResearchData {
    userId           String
    niche            String
    trendingTopics   Json   // Array of topics with scores
    contentIdeas     Json   // AI-generated opportunities
    competitorData   Json   // Competitor analysis
    keywords         String[]
    scrapedSources   Json   // URLs and data sources
    createdAt        DateTime
    expiresAt        DateTime
  }
  ```

- **New Node Types**:
  1. `NICHE_RESEARCH` - Firecrawl scraping + AI analysis
  2. `TREND_MONITOR` - Real-time trend alerts
  3. `CONTENT_IDEA_GENERATOR` - AI generates ideas from research
  4. `COMPETITOR_TRACKER` - Monitor competitor activity

- **New Pages**:
  - `/onboarding/niche` - Niche setup flow
  - `/research/dashboard` - View research insights
  - `/research/trends` - Trending topics in niche
  - `/research/competitors` - Competitor analysis

- **Firecrawl Integration**:
  ```typescript
  // Research orchestrator
  async function runNicheResearch(userId: string, niche: string) {
    // 1. Scrape multiple sources
    const googleTrends = await scrapeGoogleTrends(niche);
    const redditData = await scrapeReddit(niche);
    const youtubeData = await scrapeYouTube(niche);
    const twitterData = await scrapeTwitter(niche);
    
    // 2. AI analysis
    const analysis = await aiAnalyze({
      sources: [googleTrends, redditData, youtubeData, twitterData],
      niche,
      previousResearch: await getPreviousResearch(userId)
    });
    
    // 3. Generate content opportunities
    const ideas = await generateContentIdeas(analysis);
    
    // 4. Save to database
    await saveResearchData(userId, {
      trendingTopics: analysis.trends,
      contentIdeas: ideas,
      keywords: analysis.keywords
    });
    
    // 5. Notify user
    await notifyUser(userId, "New research insights available!");
  }
  ```

- **Workflow Integration**:
  - Research data accessible in all content generation nodes
  - Auto-include trending keywords option
  - Competitor insights available as context

**Technical Challenges**:
- Rate limiting on data sources → Implement caching
- Data freshness → Scheduled background jobs
- Cost management → Smart scraping (only new data)

### 2. Niche-Aware Content Generator (HIGH PRIORITY)
**User Story**: "When I generate content, it automatically incorporates trending topics from my niche research and addresses pain points my audience actually has."

**Implementation**:
- Enhance existing AI nodes to accept research context
- New prompt engineering that incorporates:
  - Trending keywords
  - Pain points from forums
  - Competitor gaps
  - Performance predictions
- New node: `NICHE_AWARE_CONTENT_GENERATOR`

### 3. AI Content Repurposing Engine (HIGH PRIORITY)
**User Story**: "I upload a YouTube video, and CreatorFlow automatically creates a Twitter thread, Instagram carousel, LinkedIn post, and blog article."

**Implementation**:
- New node type: "Content Repurposer"
- Input: Video URL/transcript, blog post, podcast audio
- AI analyzes content and generates multiple formats
- Output: Platform-specific content with optimal formatting
- **Enhanced**: Uses niche research to optimize repurposed content

### 4. Content Templates Library (MEDIUM PRIORITY)
**User Story**: "I browse pre-built workflows and clone them to my account."

**Implementation**:
- New page: `/templates`
- Categories: Research & Strategy, YouTube, Podcast, Newsletter, Social Media
- **New Templates**:
  - "Weekly Niche Research → Content Calendar"
  - "Trend Alert → Rapid Content Creation"
  - "Competitor Tracker → Strategy Insights"
- One-click clone functionality
- Community-contributed templates

### 5. Creator Analytics Dashboard (MEDIUM PRIORITY)
**User Story**: "I see all my metrics from YouTube, Instagram, Twitter, and Stripe in one dashboard."

**Implementation**:
- New page: `/dashboard/analytics`
- Aggregate data from multiple sources
- Charts: Growth trends, engagement rates, revenue
- AI insights: "Your Instagram engagement is 30% higher on Tuesdays"
- **Enhanced**: Compare performance against niche trends

### 6. Smart Scheduling (LOW PRIORITY)
**User Story**: "CreatorFlow suggests the best time to post based on my audience data."

**Implementation**:
- Analyze historical performance data
- ML model for optimal posting times
- Calendar view with suggestions
- Auto-schedule feature

### 7. Sponsorship Manager (LOW PRIORITY - Post-Hackathon)
**User Story**: "I track all my sponsorship deals, deliverables, and payments in one place."

**Implementation**:
- New section: `/sponsorships`
- Deal tracking with status
- Deliverable checklists
- Payment reminders via workflow

## 📊 Success Metrics

### Hackathon Metrics
- ✅ Working demo with 3 unique features
- ✅ Professional documentation
- ✅ Live deployment
- ✅ Demo video (3-5 minutes)
- ✅ Clear differentiation from tutorial project

### Post-Hackathon Metrics (3 months)
- 500+ registered users
- 50+ paying customers
- $1,000+ MRR
- 10+ testimonials
- 4.5+ star rating

### Long-term Metrics (12 months)
- 10,000+ registered users
- 500+ paying customers
- $10,000+ MRR
- Featured in creator newsletters/podcasts
- Partnership with major creator platform

## 🚀 Implementation Timeline

### Week 1: Foundation & FLAGSHIP Feature
- [x] Rebrand to CreatorFlow
- [ ] **AI Niche Research Engine (FLAGSHIP)**
  - [ ] Firecrawl integration setup
  - [ ] Database schema for research data
  - [ ] Niche onboarding flow
  - [ ] Google Trends scraping
  - [ ] Reddit/forum scraping
  - [ ] AI analysis pipeline
  - [ ] Research dashboard UI
- [ ] Update README and documentation

### Week 2: Content Generation & Integration
- [ ] **Niche-Aware Content Generator**
  - [ ] Enhance AI nodes with research context
  - [ ] New prompt templates
  - [ ] Trend integration logic
- [ ] **AI Content Repurposing Engine**
  - [ ] Content analyzer
  - [ ] Platform-specific formatters
  - [ ] Quality validation
- [ ] Add YouTube integration node
- [ ] Add Twitter/X integration node

### Week 3: Templates & Analytics
- [ ] **Content Templates Library**
  - [ ] Research-based templates
  - [ ] Template marketplace UI
  - [ ] Clone functionality
- [ ] **Creator Analytics Dashboard**
  - [ ] Multi-platform data aggregation
  - [ ] Visualization components
  - [ ] AI insights generator
- [ ] Add Instagram integration (basic)

### Week 4: Polish & Launch
- [ ] UI/UX improvements for creator audience
- [ ] Onboarding flow with niche setup
- [ ] Performance optimization
- [ ] Create demo video showcasing research engine
- [ ] Write hackathon documentation
- [ ] Prepare pitch deck
- [ ] Deploy to production
- [ ] Practice demo presentation

## 📝 Hackathon Documentation Checklist

- [ ] Problem Statement (1 page)
- [ ] Solution Overview (1 page)
- [ ] Technical Architecture (2 pages)
- [ ] Unique Features Explanation (2 pages)
- [ ] Business Model & Market Analysis (2 pages)
- [ ] Demo Screenshots (5-10 images)
- [ ] Demo Video (3-5 minutes)
- [ ] Installation/Setup Guide (1 page)
- [ ] Future Roadmap (1 page)
- [ ] Team & Contributions (if applicable)

## 🎯 Pitch Deck Outline

1. **Hook**: "Content creators waste 70% of their time on admin tasks"
2. **Problem**: Show pain points with real creator quotes
3. **Solution**: Introduce CreatorFlow with demo
4. **How It Works**: Visual workflow example
5. **Unique Features**: Highlight AI repurposing, analytics, templates
6. **Market Size**: 50M+ creators globally, $100B+ creator economy
7. **Business Model**: Pricing tiers and revenue projections
8. **Traction**: Early user feedback, testimonials (if available)
9. **Tech Stack**: Impressive modern stack
10. **Ask**: What you need (funding, partnerships, users)

---

**Next Steps**: Start implementing unique features!


---

## 🔬 Technical Deep Dive: Niche Research Engine

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Onboarding                          │
│          (Enter niche: "sustainable fashion")               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Research Orchestrator (Inngest)                │
│  • Scheduled jobs (daily/weekly)                            │
│  • Event-driven triggers                                    │
│  • Parallel scraping execution                              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  Data Scrapers   │    │  AI Analysis     │
│  (Firecrawl)     │───>│  Pipeline        │
└──────────────────┘    └──────────────────┘
   │   │   │   │              │
   │   │   │   └──────┐       │
   ▼   ▼   ▼   ▼      │       ▼
 Google Reddit YouTube Twitter  ┌──────────────────┐
 Trends Forums  Data   Trends   │ Content Ideas    │
                                │ Generator        │
                                └────────┬─────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │  PostgreSQL DB       │
                              │  • ResearchData      │
                              │  • TrendingTopics    │
                              │  • ContentIdeas      │
                              └──────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │  Research Dashboard  │
                              │  & Workflow Nodes    │
                              └──────────────────────┘
```

### Data Collection Strategy

**Sources & What We Scrape:**

1. **Google Trends**
   - Rising search queries in niche
   - Geographic distribution
   - Related topics and queries
   - Search volume trends (last 30 days)

2. **Reddit**
   - Subreddit discovery for niche
   - Top posts (week/month)
   - Common questions and pain points
   - Discussion sentiment analysis

3. **YouTube**
   - Top videos in niche (last 7 days)
   - Trending video topics and titles
   - Engagement patterns (views/likes ratio)
   - Comment sentiment

4. **Twitter/X**
   - Trending hashtags in niche
   - Viral threads in topic
   - Influencer activity
   - Engagement metrics

5. **Competitor URLs** (optional)
   - Content posting frequency
   - Topics covered
   - Engagement performance
   - Content format analysis

### Database Schema

```prisma
model User {
  id                String   @id @default(cuid())
  niche             String?
  nicheKeywords     String[]
  competitorUrls    String[]
  researchFrequency String   @default("weekly") // daily, weekly
  researchData      ResearchData[]
  createdAt         DateTime @default(now())
}

model ResearchData {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  niche            String
  
  // Trending topics with scores
  trendingTopics   Json     // Array<{topic: string, score: number, sources: string[], keywords: string[]}>
  
  // AI-generated content ideas
  contentIdeas     Json     // Array<{idea: string, reasoning: string, platforms: string[], estimatedEngagement: number}>
  
  // Competitor insights
  competitorData   Json     // {topPerformers: Array<{url: string, engagement: number, strategy: string}>}
  
  // Keywords and hashtags
  keywords         String[]
  hashtags         String[]
  
  // Source URLs for transparency
  scrapedSources   Json     // Array<{url: string, source: string, timestamp: string}>
  
  // Metadata
  createdAt        DateTime @default(now())
  expiresAt        DateTime // Research freshness (7-30 days)
  
  @@index([userId])
  @@index([createdAt])
}

model TrendAlert {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  topic       String
  niche       String
  score       Int      // Trending score (0-100)
  status      String   @default("new") // new, viewed, acted_on
  createdAt   DateTime @default(now())
  
  @@index([userId, status])
}
```

### API Routes (tRPC)

```typescript
// src/trpc/routers/research.ts

export const researchRouter = router({
  // Get latest research for user's niche
  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const research = await ctx.db.researchData.findFirst({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return research;
  }),

  // Trigger manual research
  triggerResearch: protectedProcedure
    .input(z.object({ niche: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Send Inngest event to start research
      await inngest.send({
        name: 'research/trigger',
        data: { userId: ctx.user.id, niche: input.niche }
      });
      return { success: true };
    }),

  // Get trending topics
  getTrends: protectedProcedure.query(async ({ ctx }) => {
    const research = await ctx.db.researchData.findFirst({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return research?.trendingTopics || [];
  }),

  // Get content ideas
  getIdeas: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const research = await ctx.db.researchData.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' }
      });
      const ideas = research?.contentIdeas || [];
      return input.limit ? ideas.slice(0, input.limit) : ideas;
    }),

  // Update user niche
  updateNiche: protectedProcedure
    .input(z.object({
      niche: z.string(),
      keywords: z.array(z.string()).optional(),
      competitorUrls: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: {
          niche: input.niche,
          nicheKeywords: input.keywords,
          competitorUrls: input.competitorUrls
        }
      });
      return { success: true };
    })
});
```

### Inngest Functions

```typescript
// src/inngest/functions/niche-research.ts

import { inngest } from '../client';
import Firecrawl from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

export const nicheResearchFunction = inngest.createFunction(
  {
    id: 'niche-research',
    name: 'Automated Niche Research',
    rateLimit: {
      limit: 5, // Max 5 research jobs per hour
      period: '1h'
    }
  },
  { event: 'research/trigger' },
  async ({ event, step }) => {
    const { userId, niche } = event.data;

    // Step 1: Scrape Google Trends
    const trendsData = await step.run('scrape-google-trends', async () => {
      const query = `${niche} trends`;
      const results = await firecrawl.scrapeUrl(`https://trends.google.com/trends/explore?q=${encodeURIComponent(niche)}`);
      return parseTrendsData(results);
    });

    // Step 2: Scrape Reddit (parallel)
    const redditData = await step.run('scrape-reddit', async () => {
      const subreddits = await findRelevantSubreddits(niche);
      const posts = await Promise.all(
        subreddits.map(sub => firecrawl.scrapeUrl(`https://reddit.com/r/${sub}/top?t=week`))
      );
      return parseRedditData(posts);
    });

    // Step 3: Scrape YouTube
    const youtubeData = await step.run('scrape-youtube', async () => {
      // Use YouTube Data API (more reliable than scraping)
      const searchResults = await searchYouTube(niche, { maxResults: 50, order: 'viewCount' });
      return analyzeYouTubeData(searchResults);
    });

    // Step 4: Scrape Twitter/X
    const twitterData = await step.run('scrape-twitter', async () => {
      const hashtags = generateHashtags(niche);
      const tweets = await searchTweets(hashtags, { resultType: 'popular', count: 100 });
      return analyzeTwitterData(tweets);
    });

    // Step 5: AI Analysis
    const analysis = await step.run('ai-analysis', async () => {
      const prompt = `Analyze this niche research data for "${niche}":
      
      Google Trends: ${JSON.stringify(trendsData)}
      Reddit Data: ${JSON.stringify(redditData)}
      YouTube Data: ${JSON.stringify(youtubeData)}
      Twitter Data: ${JSON.stringify(twitterData)}
      
      Provide:
      1. Top 10 trending topics (scored 0-100)
      2. Common pain points and questions
      3. Content gaps competitors are missing
      4. Keyword opportunities for SEO
      5. Optimal content formats for this niche`;

      const response = await generateObject({
        model: openai('gpt-4-turbo'),
        schema: researchAnalysisSchema,
        prompt
      });

      return response.object;
    });

    // Step 6: Generate Content Ideas
    const contentIdeas = await step.run('generate-content-ideas', async () => {
      const prompt = `Based on this research analysis, generate 10 high-potential content ideas:
      ${JSON.stringify(analysis)}
      
      For each idea provide:
      - Specific title/hook
      - Reasoning (why it will perform)
      - Best platforms
      - Estimated engagement (1-10 scale)`;

      const response = await generateObject({
        model: openai('gpt-4-turbo'),
        schema: contentIdeasSchema,
        prompt
      });

      return response.object.ideas;
    });

    // Step 7: Save to Database
    await step.run('save-research', async () => {
      await db.researchData.create({
        data: {
          userId,
          niche,
          trendingTopics: analysis.trendingTopics,
          contentIdeas,
          competitorData: analysis.competitors,
          keywords: analysis.keywords,
          hashtags: twitterData.hashtags,
          scrapedSources: [
            { source: 'google_trends', timestamp: new Date() },
            { source: 'reddit', timestamp: new Date() },
            { source: 'youtube', timestamp: new Date() },
            { source: 'twitter', timestamp: new Date() }
          ],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });
    });

    // Step 8: Send Notification
    await step.run('notify-user', async () => {
      await sendNotification(userId, {
        title: 'New Research Insights Available!',
        message: `Found ${analysis.trendingTopics.length} trending topics and ${contentIdeas.length} content ideas for ${niche}`,
        link: '/research/dashboard'
      });
    });

    return { success: true, topicsFound: analysis.trendingTopics.length };
  }
);

// Scheduled daily research for active users
export const scheduledResearchFunction = inngest.createFunction(
  {
    id: 'scheduled-niche-research',
    name: 'Scheduled Daily Niche Research'
  },
  { cron: '0 6 * * *' }, // Every day at 6am
  async ({ step }) => {
    const users = await step.run('get-users', async () => {
      return db.user.findMany({
        where: {
          niche: { not: null },
          researchFrequency: 'daily'
        }
      });
    });

    for (const user of users) {
      await inngest.send({
        name: 'research/trigger',
        data: { userId: user.id, niche: user.niche! }
      });
    }

    return { usersTriggered: users.length };
  }
);
```

### Environment Variables

```bash
# Add to .env.local
FIRECRAWL_API_KEY=fc-xxx
YOUTUBE_DATA_API_KEY=AIzaSy...
TWITTER_BEARER_TOKEN=Bearer xxx
```

---

**Next Steps**: Start implementing the niche research engine!
