# CreatorFlow Tech Stack

Here's a comprehensive breakdown of the tech stack for your hackathon mentor:

## Frontend Layer

**Framework & UI**
- **Next.js 16** (App Router) - React framework with server-side rendering and file-based routing
- **React 19** - UI library with React Compiler for automatic optimizations
- **TypeScript 5.9+** - Type safety across the entire application
- **TailwindCSS v4** - Utility-first CSS framework for rapid styling
- **React Flow (@xyflow/react)** - Visual workflow builder with drag-and-drop node system

**UI Components**
- **Radix UI** - Accessible, unstyled component primitives
- **shadcn/ui** - Pre-built component library on top of Radix
- **Lucide React** - Icon system
- **class-variance-authority** - Type-safe component variants

## Backend Layer

**API & Database**
- **tRPC 11** - End-to-end type-safe API (no code generation, types flow from server to client)
- **Prisma 7.8** - Type-safe ORM for database operations
- **PostgreSQL** - Relational database for data persistence
- **Better Auth (@polar-sh/better-auth)** - Modern authentication with session management

**Workflow Engine**
- **Inngest 3.54** - Serverless workflow orchestration
  - Handles retry logic and error recovery
  - Event-driven architecture
  - Durable execution guarantees
  - Real-time monitoring via @inngest/realtime

## State Management

- **Jotai** - Atomic state management for global UI state
- **TanStack Query (React Query)** - Server state caching and synchronization with tRPC
- **nuqs** - Type-safe URL search parameter management
- **Zod 4** - Runtime schema validation and TypeScript type inference

## AI Integration

**Vercel AI SDK** - Unified interface for multiple AI providers:
- **@ai-sdk/openai** - GPT-4 for content generation
- **@ai-sdk/anthropic** - Claude for content analysis
- **@ai-sdk/google** - Gemini for multimodal tasks
- **@ai-sdk/deepseek** - DeepSeek for cost-effective AI operations

## External Integrations

- **Stripe** - Payment webhooks and processing
- **Discord SDK** - Notifications and bot interactions
- **Slack SDK** - Team notifications
- **Google Forms API** - Form submission triggers

## Security & Encryption

- **cryptr** - AES-256 encryption for API keys and credentials
- **Better Auth** - Secure session management with httpOnly cookies
- **Environment Variables** - Secrets management via .env.local

## Developer Tools

- **Bun** - Fast package manager and JavaScript runtime (replaces npm/yarn)
- **Biome** - Fast linter and formatter (replaces ESLint + Prettier)
- **mprocs** - Multi-process orchestration for running dev servers
- **dotenv-cli** - Environment variable loading

## Deployment & Monitoring

- **Vercel** - Edge deployment platform
- **Sentry (@sentry/nextjs)** - Error tracking and performance monitoring
- **Vercel Analytics** - Web analytics and user insights

## Development Workflow

```bash
# Development servers
bun dev          # Next.js dev server
bun inngest      # Inngest workflow engine
bun dev:all      # Both servers simultaneously

# Database management
prisma generate  # Generate Prisma client
prisma db push   # Sync schema to database
prisma migrate   # Create migrations

# Code quality
bun lint         # Biome linter
bun format       # Biome formatter
```

---

## Architecture Diagram (Mermaid)

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 16 App Router]
        B[React 19 + TypeScript]
        C[React Flow Visual Builder]
        D[TailwindCSS + shadcn/ui]
        E[Jotai State Management]
    end

    subgraph "API Layer"
        F[tRPC 11 Type-Safe API]
        G[Zod Validation]
        H[TanStack Query]
    end

    subgraph "Backend Services"
        I[Prisma ORM]
        J[PostgreSQL Database]
        K[Better Auth]
        L[Inngest Workflow Engine]
    end

    subgraph "AI Services"
        M[Vercel AI SDK]
        N1[OpenAI GPT-4]
        N2[Anthropic Claude]
        N3[Google Gemini]
        N4[DeepSeek]
    end

    subgraph "External Integrations"
        O1[Stripe Webhooks]
        O2[Discord API]
        O3[Slack API]
        O4[Google Forms]
    end

    subgraph "Infrastructure"
        P[Vercel Edge Deployment]
        Q[Sentry Monitoring]
        R[Encrypted Credentials]
    end

    A --> F
    B --> A
    C --> A
    D --> B
    E --> B
    F --> G
    F --> H
    F --> I
    I --> J
    F --> K
    F --> L
    L --> M
    M --> N1
    M --> N2
    M --> N3
    M --> N4
    L --> O1
    L --> O2
    L --> O3
    L --> O4
    A --> P
    P --> Q
    J --> R
    K --> J

    style A fill:#0070f3
    style F fill:#398ccb
    style L fill:#6366f1
    style M fill:#10b981
    style J fill:#336791
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant Next.js
    participant tRPC
    participant Prisma
    participant PostgreSQL
    participant Inngest
    participant AI APIs
    participant External APIs

    User->>Next.js: Interact with UI
    Next.js->>tRPC: Type-safe API call
    tRPC->>Prisma: Query/Mutation
    Prisma->>PostgreSQL: SQL Operation
    PostgreSQL-->>Prisma: Data Response
    Prisma-->>tRPC: Typed Data
    tRPC-->>Next.js: Response
    
    User->>Next.js: Trigger Workflow
    Next.js->>tRPC: Execute Workflow
    tRPC->>Inngest: Send Event
    
    loop Workflow Execution
        Inngest->>AI APIs: AI Node Execution
        AI APIs-->>Inngest: Generated Content
        Inngest->>External APIs: Integration Actions
        External APIs-->>Inngest: Action Results
        Inngest->>PostgreSQL: Update Execution Status
    end
    
    Inngest-->>Next.js: Real-time Updates
    Next.js-->>User: Show Results
```

## Key Architecture Benefits

1. **End-to-End Type Safety**: TypeScript → Zod → Prisma → tRPC → React (no type mismatches possible)
2. **Serverless Scalability**: Inngest handles workflow orchestration without managing infrastructure
3. **Real-time Updates**: Inngest realtime provides live execution status to users
4. **Security First**: Encrypted credentials, session-based auth, row-level security
5. **Developer Experience**: Fast builds with Bun, instant feedback with Biome, type inference everywhere
6. **Cost Efficiency**: Edge deployment on Vercel, pay-per-execution with Inngest

This stack was chosen to maximize development speed during the hackathon while maintaining production-grade reliability for scaling after the event.