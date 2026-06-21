# CreatorFlow

> AI-powered workflow automation for content creators.

## The Problem

Content creators spend **60-70% of their time** on repetitive admin tasks instead of creating:
- Manually posting the same content across 5+ platforms
- Tracking sponsorship deliverables and payments
- Responding to repetitive comments and DMs
- Analyzing performance metrics scattered across platforms
- Managing collaboration requests

A creator earning $5,000/month wastes roughly $3,000 worth of time on admin work.

## The Solution

CreatorFlow is an automation platform built specifically for creators. It combines a visual workflow builder, AI content tools, and platform integrations to eliminate the busywork — so you can focus on creating.

---

## Features

### Visual Workflow Builder
Drag-and-drop editor for building automations without code. Connect triggers and actions, monitor executions in real time, and handle errors automatically with built-in retries.

### AI Content Repurposing
Turn one piece of content into a full multi-platform suite:
- YouTube video → Twitter thread + Instagram carousel + LinkedIn post + blog article
- Podcast episode → show notes + audiograms + newsletter
- Blog post → social media content suite

Supported output formats: Twitter/X threads, Instagram carousels, LinkedIn posts, blog articles, YouTube descriptions, email newsletters, TikTok scripts, podcast show notes.

### Trend Research & Alerts (Phase 2)
Stay ahead of your niche with automated research:
- Trending topic discovery across platforms
- Competitor content analysis via Firecrawl
- Keyword and hashtag recommendations
- Scheduled research runs (daily / weekly)
- Real-time trend alerts with velocity scores

### Content Template Marketplace (Phase 2)
Browse and clone community-built workflows:
- Pre-built templates for common creator workflows
- Ratings, reviews, and clone counts
- Verified templates from top creators
- One-click setup with required credentials checklist

### Analytics Dashboard (Phase 2)
Unified metrics across all your platforms:
- Cross-platform performance comparison
- Aggregated views, engagements, followers, and revenue
- AI-generated insights and recommendations
- Historical snapshots for trend tracking

### Platform Integrations
- **AI Models**: OpenAI GPT-4, Anthropic Claude, Google Gemini, DeepSeek
- **Notifications**: Discord, Slack
- **Payments**: Stripe webhooks
- **Forms**: Google Forms triggers
- **Research**: Firecrawl web scraping, YouTube Data API

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9+ (strict) |
| Styling | TailwindCSS v4 |
| Workflow UI | React Flow (@xyflow/react) |
| API | tRPC 11 (end-to-end type safety) |
| Database | PostgreSQL + Prisma 7 |
| Auth | Better Auth |
| Workflow Engine | Inngest 3 (durable, event-driven) |
| State | Jotai + TanStack Query |
| Validation | Zod 4 |
| UI Components | Radix UI + shadcn/ui |
| AI SDK | Vercel AI SDK |
| Payments | Polar |
| Monitoring | Sentry + Vercel Analytics |
| Package Manager | Bun |

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (or Node.js 18+)
- PostgreSQL database (local or [Neon](https://neon.tech))
- API keys for the integrations you want to use

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/creatorflow.git
cd creatorflow

# 2. Install dependencies
bun install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Set up the database
bun prisma generate
bun prisma db push

# 5. Start the development servers
bun dev:all
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/workflows` automatically.

### Development Commands

```bash
bun dev          # Next.js dev server only
bun inngest      # Inngest dev server only (workflow execution)
bun dev:all      # Both servers together (recommended)
bun ngrok:dev    # Start ngrok tunnel for webhook testing
```

### Database Commands

```bash
bun prisma generate    # Regenerate Prisma client after schema changes
bun prisma:studio      # Open Prisma Studio GUI
prisma db push         # Push schema changes without a migration
prisma migrate dev     # Create and apply a named migration
```

### Code Quality

```bash
bun lint      # Run Biome linter
bun format    # Format with Biome
tsc --noEmit  # Type check
```

---

## How It Works

1. **Create a workflow** — open the visual editor and start from scratch or a template
2. **Add a trigger** — manual click, webhook, Stripe event, Google Form submission, or HTTP request
3. **Add actions** — AI generation, Discord/Slack notifications, or chain multiple steps
4. **Configure** — set credentials, prompts, and output formats per node
5. **Execute** — run manually or let triggers fire automatically
6. **Monitor** — watch real-time execution logs and status updates

---

## Database Schema

### Core Models
- **User** — auth, profile, niche settings, and competitor URLs
- **Workflow** — workflow definitions with node and connection data
- **Node** — individual steps (triggers and actions)
- **Connection** — edges between nodes with input/output mapping
- **Execution** — run history with status and logs
- **Credential** — AES-256 encrypted API keys per user

### Phase 2 Models
- **ResearchData** — cached trend research results with expiry
- **TrendAlert** — individual alerts with velocity and platform scores
- **WorkflowTemplate** — community templates with ratings and clone counts
- **TemplateReview** — user reviews and ratings for templates
- **AnalyticsSnapshot** — periodic cross-platform metrics snapshots

### Node Types
- **Triggers**: `MANUAL_TRIGGER`, `HTTP_REQUEST`, `GOOGLE_FORM_TRIGGER`, `STRIPE_TRIGGER`
- **Actions**: `OPENAI`, `ANTHROPIC`, `GEMINI`, `DEEPSEEK`, `DISCORD`, `SLACK`

---

## Pricing

| Tier | Price | Executions | Workflows |
|---|---|---|---|
| Free | $0 | 100/mo | 3 |
| Pro | $19/mo | 5,000/mo | Unlimited |
| Business | $49/mo | 25,000/mo | Unlimited |
| Agency | $199/mo | 100,000/mo | Unlimited |

---

## Roadmap

### Phase 1 ✅
- [x] Visual workflow builder
- [x] AI integrations (OpenAI, Anthropic, Gemini, DeepSeek)
- [x] Triggers: manual, HTTP, Stripe, Google Forms
- [x] Actions: Discord, Slack
- [x] Credential management (AES-256 encrypted)
- [x] Execution history and real-time monitoring
- [x] Inngest-powered durable execution

### Phase 2 ✅
- [x] Trend research engine with Firecrawl
- [x] Trend alerts with velocity scoring
- [x] Workflow template marketplace
- [x] Template reviews and ratings
- [x] Cross-platform analytics snapshots
- [x] User niche and competitor URL configuration

### Phase 3 (Upcoming)
- [ ] YouTube and Twitter/X integrations
- [ ] Instagram integration
- [ ] Smart content scheduling with AI recommendations
- [ ] Team collaboration
- [ ] Mobile app
- [ ] Workflow API for developers

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
