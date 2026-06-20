# Project Structure

## Root Directory

```
creatorflow/
├── .kiro/                    # Kiro configuration and steering rules
│   └── steering/            # AI assistant guidance documents
├── prisma/                  # Database schema and migrations
│   ├── migrations/          # Database migration history
│   └── schema.prisma       # Prisma schema definition
├── public/                  # Static assets
│   └── images/             # Image assets (logos, app branding)
├── src/                    # Source code
└── [config files]          # Root-level configuration
```

## Source Directory (`src/`)

### App Router (`src/app/`)
Next.js 16 App Router structure with route groups:

```
app/
├── (auth)/                 # Authentication routes (special layout)
│   ├── login/
│   └── signup/
├── (dashboard)/            # Main application routes
│   ├── (editor)/          # Workflow editor routes
│   └── (rest)/            # Other dashboard pages
├── api/                   # API routes
│   ├── auth/             # Better Auth endpoints
│   ├── inngest/          # Inngest webhook handlers
│   ├── trpc/             # tRPC API handler
│   └── webhooks/         # External webhook receivers
├── layout.tsx            # Root layout
└── globals.css           # Global styles
```

**Route Groups (parentheses):**
- `(auth)` - Separate layout for authentication pages
- `(dashboard)` - Main app layout with navigation
- `(editor)` - Full-screen editor layout for workflow builder
- `(rest)` - Standard dashboard layout for other pages

**Routing:**
- Root `/` redirects to `/workflows` (see `next.config.ts`)
- Auth pages: `/login`, `/signup`
- Dashboard pages nested under `(dashboard)` groups

### Components (`src/components/`)
Reusable React components organized by category:

```
components/
├── ui/                    # shadcn/ui components (buttons, dialogs, etc.)
├── forms/                 # Form components and field wrappers
├── layout/                # Layout components (headers, sidebars, etc.)
└── [feature-specific]/    # Components specific to features
```

**Component Conventions:**
- UI components from shadcn/ui go in `ui/` directory
- Use `"use client"` directive only when needed
- Prefer Server Components by default
- Export named components (avoid default exports for better refactoring)

### Features (`src/features/`)
Feature-specific code organized by domain:

```
features/
├── workflows/             # Workflow management
│   ├── components/       # Workflow-specific UI components
│   ├── hooks/           # Workflow-specific React hooks
│   └── utils/           # Workflow utilities
├── nodes/                # Node system for workflow builder
│   ├── types/           # Node type definitions
│   └── components/      # Node UI components
├── credentials/          # Credential management
└── executions/          # Workflow execution tracking
```

**Feature Organization Pattern:**
Each feature follows a consistent structure:
- `components/` - React components
- `hooks/` - Custom React hooks
- `utils/` - Pure utility functions
- `types/` - TypeScript type definitions
- `api/` - tRPC procedures (if applicable)

### tRPC API (`src/trpc/`)
Type-safe API layer:

```
trpc/
├── routers/              # tRPC router definitions
│   ├── workflow.ts      # Workflow CRUD operations
│   ├── node.ts          # Node operations
│   ├── credential.ts    # Credential management
│   └── execution.ts     # Execution tracking
├── context.ts           # tRPC context (auth, db, etc.)
├── root.ts             # Root router combining all routers
└── react.tsx           # tRPC React client setup
```

**tRPC Conventions:**
- Each feature has its own router file
- Procedures use Zod for input validation
- Context provides authenticated user and Prisma client
- Type safety from server to client with no code generation

### Inngest (`src/inngest/`)
Workflow orchestration functions:

```
inngest/
├── client.ts            # Inngest client configuration
├── functions/           # Inngest function definitions
│   ├── execute-workflow.ts
│   └── [node-handlers]/
└── types.ts            # Inngest event type definitions
```

**Inngest Patterns:**
- Each workflow node type has a handler function
- Event-driven architecture with type-safe events
- Automatic retries and error handling built-in
- Real-time updates via `@inngest/realtime`

### Library (`src/lib/`)
Shared utilities and configurations:

```
lib/
├── db.ts               # Prisma client singleton
├── auth.ts             # Better Auth configuration
├── utils.ts            # General utilities (cn, etc.)
├── constants.ts        # Application constants
└── validators/         # Shared Zod schemas
```

### Hooks (`src/hooks/`)
Custom React hooks for cross-feature concerns:

```
hooks/
├── use-workflow.ts     # Workflow state management
├── use-nodes.ts        # Node operations
└── use-auth.ts         # Authentication hooks
```

### Configuration (`src/config/`)
Application configuration files:

```
config/
├── site.ts             # Site metadata and constants
├── nodes.ts            # Node type configurations
└── integrations.ts     # Integration configurations
```

## Database Schema Organization

### Prisma Models
Located in `prisma/schema.prisma`:

**Authentication:**
- User, Session, Account, Verification

**Workflow System:**
- Workflow, Node, Connection, Execution

**Credentials:**
- Credential (encrypted storage for API keys)

**Relationships:**
- User → Workflows (one-to-many)
- Workflow → Nodes, Connections, Executions (one-to-many)
- Node → Connections (many-to-many via fromNode/toNode)
- Credential → Nodes (one-to-many)

### Migrations
Database migrations in `prisma/migrations/` follow chronological naming:
- Format: `YYYYMMDDHHMMSS_description/`
- Contains SQL migration files
- Applied sequentially in order

## Configuration Files

### Root Level
- `next.config.ts` - Next.js configuration (Sentry, redirects)
- `biome.json` - Biome linter and formatter rules
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.ts` - TailwindCSS configuration
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - shadcn/ui component configuration
- `prisma.config.ts` - Prisma configuration
- `mprocs.yaml` - Multi-process development configuration

### Environment Files
- `.env.local` - Local environment variables (not committed)
- `.env.example` - Example environment variables (template)

## Asset Organization

### Public Directory
```
public/
└── images/
    ├── appLogo/           # CreatorFlow branding
    │   ├── logo.png
    │   ├── logo.svg
    │   └── logo.webp
    └── logos/             # Third-party service logos
        ├── anthropic.svg
        ├── deepseek.svg
        ├── discord.svg
        ├── gemini.svg
        ├── openai.svg
        ├── slack.svg
        └── stripe.svg
```

## Code Organization Best Practices

### Import Order
Biome auto-organizes imports in this order:
1. React and Next.js imports
2. Third-party library imports
3. Internal imports (components, utils, types)
4. Relative imports
5. Style imports

### File Naming
- **Components**: PascalCase (`WorkflowBuilder.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: camelCase with `.types.ts` suffix
- **Hooks**: camelCase starting with `use-` (`use-workflow.ts`)
- **API routes**: kebab-case (`workflow-execution.ts`)

### Directory Patterns
- Group related files together by feature
- Keep components close to where they're used
- Extract to shared locations only when reused 3+ times
- Co-locate tests with source files (`*.test.ts`)

### Generated Code
- `src/generated/prisma/` - Prisma client (generated, not committed)
- `.next/` - Next.js build output (generated, not committed)
- `node_modules/` - Dependencies (generated, not committed)

## Development Workflow

1. **Start development servers**: `bun dev:all` (Next.js + Inngest)
2. **Database changes**: Update `schema.prisma` → `prisma db push` or `prisma migrate dev`
3. **Generate Prisma client**: Automatic on build, or manual with `prisma generate`
4. **Code formatting**: Automatic on save (Biome), or manual with `bun format`
5. **Type checking**: `tsc --noEmit` for TypeScript validation

## Key Architectural Patterns

### Type Safety Flow
```
Zod Schema → Prisma Model → tRPC Procedure → React Component
     ↓            ↓              ↓                 ↓
  Validation   Database      API Layer          UI
```

### Workflow Execution Flow
```
User Action → tRPC Mutation → Inngest Event → Workflow Handler → Node Execution → Database Update
```

### Authentication Flow
```
Better Auth → Session Middleware → tRPC Context → Protected Procedures
```

### State Management Layers
- **URL State**: nuqs (search params, filters)
- **Local State**: useState (form inputs, UI state)
- **Global State**: Jotai (workflow editor, node selection)
- **Server State**: TanStack Query + tRPC (data fetching, caching)
