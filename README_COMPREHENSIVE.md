# Chat Unified Claude - Persona Engine

> A production-ready, secure chat infrastructure with multi-persona support, advanced memory strategies, and enterprise-grade security features.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-Ready-green.svg)
![Security](https://img.shields.io/badge/Security-Hardened-green.svg)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Chat Unified Claude is a sophisticated persona-based chat infrastructure designed for building intelligent conversational applications. It supports multiple LLM providers, advanced memory strategies, and provides a robust foundation for creating various types of AI personas from simulated individuals to specialized trading assistants.

### Key Capabilities

- **Multi-Persona Architecture**: Create and manage multiple AI personas with distinct personalities and capabilities
- **Advanced Memory Management**: Choose between simple facts, RAG (vector search), or hybrid memory strategies
- **Multi-LLM Support**: Seamlessly switch between OpenAI GPT and Anthropic Claude models
- **Enterprise Security**: Built-in rate limiting, input sanitization, CORS protection, and role-based access control
- **Real-time Streaming**: Server-sent events for smooth, real-time chat experiences
- **Context Management**: Intelligent context window management with automatic summarization
- **Trading Journal**: Specialized support for trading pattern recognition and decision support

---

## Features

### Core Features

#### Authentication & Security
- Secure email/password authentication with Supabase Auth
- OAuth support (Google, GitHub, Apple)
- Row Level Security (RLS) for all user data
- JWT-based API authentication
- Rate limiting (60 requests/minute default, configurable)
- Input sanitization to prevent XSS attacks
- CORS protection with configurable origins
- Role-based access control (RBAC)

#### Persona Management
- Four persona types:
  - **Simulated Person**: Practice conversations with public figures
  - **Journal Assistant**: Trading pattern recall and decision support
  - **Companion**: Human-like chat with memory
  - **Custom**: Build your own persona type

#### Memory Strategies
- **Array Strategy**: Simple fact-based memory (key-value pairs)
- **RAG Strategy**: Vector-based semantic search through documents
- **Hybrid Strategy**: Combination of facts and document search

#### Chat Features
- Real-time streaming responses with SSE
- Context-aware conversations
- Automatic context summarization when approaching token limits
- Message history with pagination
- Conversation archiving
- Multi-conversation support per persona

#### Developer Experience
- Comprehensive TypeScript types
- React Query for efficient data fetching
- Zustand for state management
- Extensive logging with debug UI
- Detailed error messages
- API client with automatic token handling

---

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React UI]
        Auth[Auth Components]
        Chat[Chat Components]
        API_Client[API Client]
    end

    subgraph "API Layer"
        Gateway[Hono API Gateway]
        Rate[Rate Limiter]
        AuthMW[Auth Middleware]
        Routes[API Routes]
    end

    subgraph "Business Logic"
        Persona[Persona Service]
        Memory[Memory Service]
        Context[Context Builder]
        Summarizer[Summarization Service]
    end

    subgraph "LLM Providers"
        OpenAI[OpenAI GPT]
        Claude[Anthropic Claude]
    end

    subgraph "Data Layer"
        Supabase[(Supabase PostgreSQL)]
        Vector[(pgvector)]
    end

    UI --> API_Client
    API_Client --> Gateway
    Gateway --> Rate
    Rate --> AuthMW
    AuthMW --> Routes
    Routes --> Persona
    Routes --> Memory
    Routes --> Context
    Context --> Summarizer
    Persona --> Supabase
    Memory --> Supabase
    Memory --> Vector
    Persona --> OpenAI
    Persona --> Claude
    Context --> OpenAI
    Context --> Claude
```

### Data Flow - Chat Request

```mermaid
sequenceDiagram
    participant User
    participant React
    participant API
    participant Auth
    participant Context
    participant LLM
    participant DB

    User->>React: Send Message
    React->>API: POST /api/v1/chat
    API->>Auth: Verify JWT Token
    Auth->>API: User Verified
    API->>DB: Get Conversation & Persona
    DB->>API: Return Data
    API->>DB: Get Recent Messages
    DB->>API: Return Messages
    API->>Context: Build Context
    Context->>DB: Retrieve Memory (if RAG)
    DB->>Context: Return Relevant Docs
    Context->>API: Return Context
    API->>LLM: Send Prompt
    LLM->>API: Stream Response
    API->>React: SSE Chunks
    API->>DB: Save Messages
    React->>User: Display Response
```

### Memory Architecture

```mermaid
graph LR
    subgraph "Array Strategy"
        A1[User Input] --> A2[Extract Facts]
        A2 --> A3[Store as JSON]
        A3 --> A4[Include in Context]
    end

    subgraph "RAG Strategy"
        R1[User Input] --> R2[Chunk Documents]
        R2 --> R3[Generate Embeddings]
        R3 --> R4[Store in Vector DB]
        R4 --> R5[Semantic Search]
        R5 --> R6[Include in Context]
    end

    subgraph "Hybrid Strategy"
        H1[User Input] --> H2{Split}
        H2 --> H3[Facts Array]
        H2 --> H4[Document RAG]
        H3 --> H5[Merge Context]
        H4 --> H5
    end
```

### Component Structure

```
chat-unified-claude/
├── src/                          # Frontend React application
│   ├── components/
│   │   ├── auth/                # Authentication components
│   │   ├── chat/                # Chat UI components
│   │   ├── persona/             # Persona management
│   │   ├── debug/               # Debug panel
│   │   ├── layout/              # Layout components
│   │   └── ui/                  # Reusable UI components (shadcn/ui)
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and helpers
│   │   ├── api-client.ts       # API client
│   │   ├── auth.ts             # Auth helpers
│   │   ├── supabase.ts         # Supabase client
│   │   └── validation.ts       # Validation schemas
│   ├── pages/                   # Page components
│   ├── stores/                  # Zustand stores
│   └── types/                   # TypeScript types
│
├── server/                      # Backend API server
│   └── src/
│       ├── db/                  # Database client and types
│       ├── lib/                 # Server utilities
│       │   ├── constants.ts    # Configuration
│       │   ├── validation.ts   # Input validation
│       │   └── sanitize.ts     # Input sanitization
│       ├── middleware/          # Express/Hono middleware
│       │   ├── auth.ts         # JWT authentication
│       │   ├── error-handler.ts # Error handling
│       │   ├── rate-limit.ts   # Rate limiting
│       │   └── request-logger.ts # Request logging
│       ├── routes/              # API route handlers
│       │   ├── chat.ts         # Chat endpoints
│       │   ├── personas.ts     # Persona CRUD
│       │   ├── conversations.ts # Conversation management
│       │   ├── memory.ts       # Memory management
│       │   ├── trades.ts       # Trading journal
│       │   └── admin.ts        # Admin endpoints
│       └── services/            # Business logic services
│           ├── llm/             # LLM provider integrations
│           │   ├── anthropic.ts
│           │   ├── openai.ts
│           │   └── types.ts
│           ├── context-builder.ts # Context management
│           ├── memory.ts        # Memory strategies
│           ├── summarization.ts # Auto-summarization
│           ├── token-counter.ts # Token counting
│           └── logger.ts        # Logging service
│
└── supabase/                    # Database migrations and config
    └── migrations/              # SQL migration files
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript 5.9 | Type safety |
| Vite | Build tool |
| TanStack Query | Server state management |
| Zustand | Client state management |
| React Router | Routing |
| shadcn/ui | UI component library |
| Tailwind CSS | Styling |
| Zod | Runtime validation |

### Backend
| Technology | Purpose |
|------------|---------|
| Hono | Web framework |
| TypeScript | Type safety |
| @hono/node-server | Node.js adapter |
| Supabase | Database & auth |
| OpenAI SDK | GPT integration |
| Anthropic SDK | Claude integration |
| js-tiktoken | Token counting |
| Zod | Input validation |

### Database
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary database |
| pgvector | Vector storage for embeddings |
| Supabase Auth | Authentication |
| Supabase Storage | File storage |

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account and project
- At least one LLM API key (OpenAI or Anthropic)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/bsk1410/chat-unified-claude
cd chat-unified-claude

# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Note your Project URL and anon/public key

### 3. Configure Environment Variables

#### Frontend (.env.local)
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_PERSONA_API_URL=http://localhost:3001
```

#### Backend (server/.env)
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# LLM Keys (at least one required)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Production CORS (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com
```

### 4. Run Database Migrations

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push
```

Or manually run the SQL files in `supabase/migrations/` through the Supabase SQL Editor.

### 5. Start Development Servers

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

---

## Configuration

### Server Configuration

All server configuration is centralized in `server/src/lib/constants.ts`:

```typescript
// Token limits
MAX_CONTEXT_TOKENS: 32000
RESERVE_FOR_RESPONSE: 4000
SUMMARIZATION_THRESHOLD: 0.8  // Trigger at 80% of budget

// Memory
MEMORY_RETRIEVAL_COUNT: 5      // Default docs to retrieve
MAX_FACTS_PER_PERSONA: 100
MAX_CHUNK_TOKENS: 500

// Rate Limiting
REQUESTS_PER_WINDOW: 60        // Requests per minute
WINDOW_MS: 60000               // 1 minute

// LLM Models
OPENAI_CHAT_MODEL: 'gpt-4-turbo'
ANTHROPIC_CHAT_MODEL: 'claude-3-5-sonnet-20241022'
```

### Client Configuration

Frontend configuration in `src/lib/constants.ts`:

```typescript
// API
PERSONA_ENGINE.API_URL: 'http://localhost:3001'
PERSONA_ENGINE.API_VERSION: 'v1'

// Defaults
DEFAULT_MAX_CONTEXT_TOKENS: 32000
DEFAULT_SUMMARIZATION_THRESHOLD: 0.8
DEFAULT_MEMORY_RETRIEVAL_COUNT: 5

// Debug
DEBUG_ENABLED: true (in development)
LOG_RETENTION_COUNT: 500
```

---

## Security

This application implements multiple layers of security:

### Authentication
- Supabase Auth with JWT tokens
- Automatic token refresh
- Secure session storage
- PKCE flow for OAuth

### Authorization
- Row Level Security (RLS) on all user data
- JWT verification on every API request
- Role-based access control for admin routes
- User-scoped Supabase client

### Input Validation
- Zod schemas for all API inputs
- Input sanitization to prevent XSS
- URL sanitization to prevent protocol attacks
- Filename sanitization to prevent path traversal

### Rate Limiting
- 60 requests/minute default (configurable)
- Per-user and per-IP tracking
- Stricter limits (5/min) for sensitive operations
- Automatic cleanup of expired entries

### CORS Protection
- Configurable allowed origins
- Credentials support for cross-origin requests
- Proper preflight handling

### Error Handling
- Generic error messages in production
- Detailed logs server-side only
- No stack traces leaked to clients
- Request ID tracking for debugging

### Secrets Management
- Environment variables for all secrets
- No hardcoded credentials
- Separate dev/prod configurations
- .env files in .gitignore

---

## API Documentation

### Base URL
Development: `http://localhost:3001/api/v1`

### Authentication
All endpoints (except `/health`) require a Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Personas
```
GET    /personas                  # List all personas
GET    /personas/:id              # Get persona details
POST   /personas                  # Create persona
PATCH  /personas/:id              # Update persona
DELETE /personas/:id              # Delete persona
POST   /personas/:id/import       # Import documents
```

#### Chat
```
POST   /chat                      # Send message (non-streaming)
POST   /chat/stream               # Send message (SSE streaming)
```

#### Conversations
```
GET    /conversations             # List conversations
GET    /conversations/:id         # Get conversation with messages
POST   /conversations             # Create conversation
DELETE /conversations/:id         # Delete conversation
POST   /conversations/:id/archive # Archive conversation
```

#### Memory (Facts)
```
GET    /personas/:id/facts        # List facts
POST   /personas/:id/facts        # Create fact
PATCH  /personas/:id/facts/:factId # Update fact
DELETE /personas/:id/facts/:factId # Delete fact
```

#### Memory (Documents)
```
GET    /personas/:id/documents    # List documents
POST   /personas/:id/documents    # Create documents
DELETE /personas/:id/documents/:docId # Delete document
POST   /personas/:id/documents/search # Semantic search
```

#### Trading Journal
```
GET    /trades                    # List trade setups
GET    /trades/:id                # Get trade details
POST   /trades                    # Create trade setup
PATCH  /trades/:id                # Update trade
DELETE /trades/:id                # Delete trade
POST   /trades/similar            # Find similar trades
```

#### Admin
```
GET    /admin/settings            # Get system settings
GET    /admin/usage               # Get usage statistics
GET    /admin/logs                # Get logs (filtered)
POST   /admin/logs/clear          # Clear logs
GET    /admin/logs/export         # Export logs as JSON
```

### Request Examples

#### Create a Persona
```bash
POST /api/v1/personas
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Albert Einstein",
  "type": "simulated_person",
  "system_prompt": "You are Albert Einstein. Respond with deep physics knowledge and creative thinking.",
  "memory_strategy": "array",
  "max_context_tokens": 32000
}
```

#### Send Chat Message (Streaming)
```bash
POST /api/v1/chat/stream
Content-Type: application/json
Authorization: Bearer <token>

{
  "persona_id": "uuid-here",
  "message": "Tell me about relativity"
}

# Response: Server-Sent Events
data: {"type":"start","conversation_id":"uuid"}
data: {"type":"chunk","content":"Special"}
data: {"type":"chunk","content":" relativity"}
data: {"type":"done","message_id":"uuid","token_count":150}
```

---

## Deployment

### Environment Preparation

1. **Database**: Ensure all migrations are applied to production Supabase
2. **Environment Variables**: Set all required env vars in your hosting platform
3. **CORS**: Configure `ALLOWED_ORIGINS` with your production domain(s)
4. **API Keys**: Use separate API keys for production

### Backend Deployment

#### Option 1: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./
RUN npm run build
CMD ["node", "dist/index.js"]
```

#### Option 2: Node.js Platforms (Render, Railway, etc.)
```bash
# Build command
cd server && npm install && npm run build

# Start command
cd server && npm start

# Environment variables
# Set all variables from server/.env.example
```

### Frontend Deployment

#### Vercel
```bash
# Build command
npm run build

# Output directory
dist

# Environment variables
# Add all from .env.example with VITE_ prefix
```

#### Netlify
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
# Add all from .env.example
```

### Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database migrations applied
- [ ] CORS origins configured
- [ ] API keys are production keys (not dev keys)
- [ ] Admin users configured in Supabase
- [ ] SSL/TLS certificates active
- [ ] Rate limiting tested
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Backups configured for database
- [ ] Monitoring/alerting set up

---

## Development

### Project Structure Best Practices

1. **Constants**: All configuration in `/lib/constants.ts`
2. **Types**: Shared types in `/types/`
3. **Validation**: Zod schemas in `/lib/validation.ts`
4. **API Client**: Centralized in `src/lib/api-client.ts`
5. **Components**: Organized by feature (auth, chat, persona, etc.)

### Code Style

```bash
# Lint code
npm run lint

# Type check
npm run typecheck  # (if you add this script)
```

### Adding a New API Endpoint

1. **Define validation schema** in `server/src/lib/validation.ts`
2. **Create route handler** in appropriate file in `server/src/routes/`
3. **Add types** to `server/src/db/types.ts`
4. **Add client method** in `src/lib/api-client.ts`
5. **Add frontend types** in `src/types/`
6. **Test the endpoint**

### Debug Panel

Access the debug panel in development:
- Click the bug icon in the bottom right
- View all API requests and responses
- Filter by log level and category
- Export logs for analysis

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── services/
│   ├── middleware/
│   └── utils/
├── integration/             # Integration tests
│   ├── api/
│   └── database/
└── e2e/                     # End-to-end tests
    └── flows/
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { sanitize } from '../lib/sanitize';

describe('sanitize', () => {
  it('should escape HTML entities', () => {
    const input = '<script>alert("xss")</script>';
    const output = sanitize.html(input);
    expect(output).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
});
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit with descriptive messages
6. Push to your fork
7. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/bsk1410/chat-unified-claude/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bsk1410/chat-unified-claude/discussions)
- **Email**: support@example.com

---

## Acknowledgments

- Built with [Supabase](https://supabase.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Powered by [OpenAI](https://openai.com) and [Anthropic](https://anthropic.com)

---

Built with security and scalability in mind. Ship with confidence.
