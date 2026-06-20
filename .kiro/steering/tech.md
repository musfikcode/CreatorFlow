# Technology Stack

## Core Technologies

### Frontend
- **Next.js 16** - React framework with App Router (redirects `/` to `/workflows`)
- **React 19** - UI library with React Compiler enabled
- **TypeScript 5.9+** - Type-safe development (strict mode)
- **TailwindCSS v4** - Utility-first styling with @tailwindcss/postcss
- **React Flow (@xyflow/react)** - Visual workflow builder with drag-and-drop

### Backend
- **Node.js** - Runtime environment
- **tRPC 11** - End-to-end type-safe APIs (no code generation needed)
- **Prisma 7.8** - Type-safe ORM with PostgreSQL adapter
- **PostgreSQL** - Relational database
- **Better Auth (@polar-sh/better-auth)** - Authentication with session management

### State Management & Data Fetching
- **Jotai** - Atomic state management
- **TanStack Query (React Query)** - Server state management
- **Zod 4** - Runtime schema validation and type inference

### Workflow Engine
- **Inngest 3.54** - Serverless workflow orchestration
  - Automatic retries and error handling
  - Event-driven architecture
  - Real-time execution monitoring via @inngest/realtime
  - Durable execution guarantees

### UI Components
- **Radix UI** - Unstyled, accessible component primitives
- **shadcn/ui** - Customizable component library built on Radix
- **Lucide React** - Icon library
- **class-variance-authority** - Type-safe component variants
- **tailwind-merge & clsx** - Utility class merging

### AI Integration
- **Vercel AI SDK** - Unified interface for multiple AI models
- **@ai-sdk/openai** - OpenAI GPT-4 integration
- **@ai-sdk/anthropic** - Claude integration
- **@ai-sdk/google** - Gemini integration
- **@ai-sdk/deepseek** - DeepSeek integration

### Platform Integrations
- **Stripe** - Payment webhooks and processing
- **Discord/Slack** - Notification channels
- **Google Forms** - Form triggers

### Developer Tools
- **Bun** - Fast package manager and runtime (preferred)
- **Biome** - Fast linter and formatter (replaces ESLint/Prettier)
- **mprocs** - Multi-process runner for development
- **dotenv-cli** - Environment variable management

### DevOps & Monitoring
- **Vercel** - Hosting and edge deployment
- **Sentry (@sentry/nextjs)** - Error tracking and performance monitoring
- **Vercel Analytics** - Web analytics

## Database Schema

### Key Models
- **User** - Authentication and user data
- **Workflow** - Workflow definitions with nodes and connections
- **Node** - Individual workflow steps (triggers, actions)
- **Connection** - Links between nodes with input/output mapping
- **Execution** - Workflow run history with status tracking
- **Credential** - Encrypted API keys and tokens (AES-256)

### Node Types
- **Triggers**: INITIAL, MANUAL_TRIGGER, HTTP_REQUEST, GOOGLE_FORM_TRIGGER, STRIPE_TRIGGER
- **Actions**: GEMINI, ANTHROPIC, OPENAI, DEEPSEEK, DISCORD, SLACK

### Credential Types
- OPENAI, ANTHROPIC, GEMINI, DEEPSEEK

## Common Commands

### Development
```bash
# Start Next.js dev server
bun dev

# Start Inngest dev server (for workflow execution)
bun inngest

# Run all development services (Next.js + Inngest)
bun dev:all

# Start ngrok tunnel for webhooks
bun ngrok:dev
```

### Database
```bash
# Generate Prisma client
prisma generate

# Open Prisma Studio (database GUI)
bun prisma:studio

# Push schema changes to database
prisma db push

# Create migration
prisma migrate dev
```

### Code Quality
```bash
# Run Biome linter
bun lint

# Format code with Biome
bun format

# Type check
tsc --noEmit
```

### Build & Deploy
```bash
# Build for production
bun build

# Start production server
bun start
```

## Code Conventions

### File Organization
- **src/app/** - Next.js App Router pages and API routes
  - **(auth)/** - Authentication pages (login, signup)
  - **(dashboard)/** - Main application routes with nested groups
  - **api/** - API routes (auth, inngest, trpc, webhooks)
- **src/components/** - Reusable React components
- **src/features/** - Feature-specific code (workflows, nodes, etc.)
- **src/lib/** - Shared utilities and helpers
- **src/trpc/** - tRPC router definitions
- **src/inngest/** - Inngest workflow functions
- **src/hooks/** - Custom React hooks
- **src/config/** - Configuration files
- **src/generated/prisma/** - Generated Prisma client

### TypeScript Conventions
- Use strict mode
- Prefer type inference over explicit types
- Use `interface` for public APIs, `type` for internal unions/intersections
- Leverage tRPC for API type safety (no manual type definitions needed)
- Use Zod schemas for validation and type inference

### Biome Configuration
- **Indentation**: 2 spaces
- **Formatter**: Enabled with auto-formatting
- **Linter**: Recommended rules + Next.js and React domains
- **Auto-organize imports**: Enabled
- **VCS**: Git integration enabled

### Component Patterns
- Use `"use client"` directive for client components
- Use `"use server"` for server actions
- Prefer Server Components by default
- Use Radix UI + shadcn/ui for consistent accessible components
- Leverage `class-variance-authority` for component variants

### State Management
- **Local state**: useState, useReducer
- **Global state**: Jotai atoms
- **Server state**: TanStack Query with tRPC
- **URL state**: nuqs for type-safe search params

### Security
- Credentials encrypted with AES-256 using `cryptr`
- API keys stored in environment variables
- Row-level security via Prisma middleware
- Better Auth handles session management
- HTTPS-only in production

## Environment Variables

Required environment variables (see `.env.local`):
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret key
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key
- `DEEPSEEK_API_KEY` - DeepSeek API key
- `INNGEST_SIGNING_KEY` - Inngest signing key
- `INNGEST_EVENT_KEY` - Inngest event key
- `NGROK_URL` - Ngrok tunnel URL (for webhooks)
- `NEXT_PUBLIC_*` - Client-side environment variables

## Performance Considerations

- React Compiler enabled for automatic optimization
- Edge runtime for API routes where possible
- Prisma connection pooling with pg adapter
- React Flow virtualization for large workflows
- Code splitting via Next.js automatic chunking
- Optimistic UI updates for better UX

## Testing Strategy

- Unit tests for business logic
- Integration tests for API routes (tRPC procedures)
- E2E tests for critical workflows
- Property-based testing for workflow execution correctness
