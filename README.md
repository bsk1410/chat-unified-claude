# SecureSaaS - Secure SaaS Starter Kit

A production-ready, secure SaaS starter kit built with Supabase, React, TypeScript, and Tailwind CSS. Stop worrying about security fundamentals and start shipping features.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-Ready-green.svg)

---

## Features

- **Row Level Security (RLS)** - Built-in policies ensure users can only access their own data
- **Secure Authentication** - Email/password, OAuth (Google, GitHub), with proper session management
- **Audit Logging** - Immutable audit trail for all data changes
- **Secure File Storage** - User-scoped storage with signed URLs
- **Type-Safe Queries** - Auto-generated TypeScript types from your database
- **Beautiful UI** - Modern, responsive design with shadcn/ui and Tailwind CSS
- **Dark Mode** - System-aware theme switching
- **Form Validation** - Zod schemas for client and server validation

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Database/Backend** | Supabase (PostgreSQL + Auth + Storage) |
| **Frontend** | React 18 + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State Management** | TanStack Query + Zustand |
| **Validation** | Zod |
| **Routing** | React Router |
| **Build Tool** | Vite |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- A [Supabase](https://supabase.com) account

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/secure-saas-starter.git
cd secure-saas-starter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

4. Fill in your Supabase credentials in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Database Migrations

Using Supabase CLI:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Or manually run the SQL files in `supabase/migrations/` through the Supabase SQL Editor.

### 5. Create Storage Buckets

In your Supabase dashboard:

1. Go to Storage
2. Create a bucket named `user-files` (private)
3. Create a bucket named `avatars` (public)

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
├── supabase/
│   ├── migrations/          # Database migrations
│   │   ├── 00001_extensions.sql
│   │   ├── 00002_helper_functions.sql
│   │   ├── 00003_audit_log.sql
│   │   ├── 00004_user_profiles.sql
│   │   └── 00005_storage_policies.sql
│   ├── seed.sql             # Seed data
│   └── config.toml          # Supabase config
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── auth/            # Authentication components
│   │   └── layout/          # Layout components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and helpers
│   │   ├── constants.ts     # Centralized constants
│   │   ├── supabase.ts      # Supabase client
│   │   ├── auth.ts          # Auth helpers
│   │   ├── validation.ts    # Zod schemas
│   │   └── errors.ts        # Error handling
│   ├── pages/               # Page components
│   ├── stores/              # Zustand stores
│   └── types/               # TypeScript types
├── security-checklist.md    # Pre-launch security checklist
├── MIGRATION_GUIDE.md       # Guide for adding new tables
└── README.md
```

---

## Adding New Tables

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions on adding new database tables securely.

Quick example:

```sql
CREATE TABLE your_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Apply security in one line
SELECT apply_standard_rls('your_table');
SELECT apply_updated_at_trigger('your_table');
SELECT apply_audit_trigger('your_table');
```

---

## Security

This starter kit includes several security measures out of the box:

### Row Level Security (RLS)

All user data tables have RLS policies that ensure users can only access their own data. The `apply_standard_rls()` function automatically creates:

- SELECT policy (users can read own records)
- INSERT policy (users can create own records)
- UPDATE policy (users can update own records)
- DELETE policy (users can delete own records)

### Audit Logging

The `audit_log` table tracks all INSERT, UPDATE, and DELETE operations on tables with audit triggers. This provides an immutable record of who changed what and when.

### Password Requirements

Strong password requirements are enforced:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Pre-Launch Checklist

See [security-checklist.md](./security-checklist.md) for a comprehensive security checklist before deploying to production.

---

## Customization

### Changing the Theme

Edit the CSS variables in `src/index.css` to customize colors:

```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Change primary color */
  /* ... */
}
```

### Adding OAuth Providers

1. Enable the provider in your Supabase dashboard (Authentication > Providers)
2. Add the provider button in `src/components/auth/LoginForm.tsx`
3. Configure OAuth redirect URLs

### Modifying Routes

Routes are defined in `src/App.tsx` and route constants in `src/lib/constants.ts`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |

> **Note:** Never expose your `SERVICE_ROLE_KEY` in the frontend. Use it only in server-side functions.

---

## Deployment

### Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- A Supabase project set up with all migrations applied
- Environment variables configured
- All tests passing (`npm test` if configured)

### Environment Variables Required

For the frontend (VITE_ prefix required for Vite):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

For the server (if deploying the backend):
```bash
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
ALLOWED_ORIGINS=https://yourdomain.com
```

### Vercel (Recommended for Frontend)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Configure the project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables in the Vercel dashboard
5. Deploy

**Post-Deployment:**
- Verify the build succeeds
- Test authentication flows
- Check that environment variables are properly set
- Configure custom domain (optional)

### Netlify (Alternative for Frontend)

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and import your repository
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Site settings > Environment variables
5. Deploy

**Post-Deployment:**
- Set up redirects for SPA routing (create `_redirects` file in public/)
- Configure custom headers for security
- Test all routes and authentication

### Docker (Full Stack Deployment)

Create a `Dockerfile` in the root:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t secure-saas .
docker run -p 80:80 secure-saas
```

### Server Deployment (Backend)

For the Express server in `/server`:

**Option 1: Railway/Render**
1. Create a new project
2. Connect your GitHub repository
3. Set the root directory to `server/`
4. Add environment variables
5. Deploy

**Option 2: AWS/Google Cloud/Azure**
1. Set up a VM or container service
2. Clone your repository
3. Install dependencies: `cd server && npm install`
4. Set environment variables
5. Start with PM2: `pm2 start src/index.ts --name saas-server`

### Post-Deployment Verification

After deploying, verify:

1. **Security Headers**: Check CSP, X-Frame-Options, etc.
2. **Authentication**: Test login, signup, and OAuth flows
3. **Database**: Verify RLS policies are active
4. **Storage**: Test file upload functionality
5. **API Endpoints**: Verify all endpoints are accessible
6. **Environment Variables**: Ensure no secrets are exposed
7. **Error Handling**: Test error pages and logging
8. **Performance**: Run Lighthouse audit (target: 90+ score)

**Security Checklist Before Production:**
- [ ] All environment variables set correctly
- [ ] HTTPS enabled and enforced
- [ ] RLS policies tested and active
- [ ] Rate limiting configured
- [ ] Error messages don't leak sensitive info
- [ ] CORS configured for production domain only
- [ ] Audit logging enabled
- [ ] Backup strategy in place
- [ ] Monitoring and alerting configured
- [ ] Review [security-checklist.md](./security-checklist.md)

---

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a PR

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Support

- [Documentation](./docs)
- [Issues](https://github.com/yourusername/secure-saas-starter/issues)
- [Discussions](https://github.com/yourusername/secure-saas-starter/discussions)

---

Built with security in mind. Ship with confidence.
