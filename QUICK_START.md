# Quick Start Guide
## Chat Unified Claude - Get Running in 10 Minutes

This guide will get you up and running quickly. For comprehensive documentation, see [README_COMPREHENSIVE.md](./README_COMPREHENSIVE.md).

---

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- A Supabase account ([sign up here](https://supabase.com))
- At least one LLM API key (OpenAI or Anthropic)

---

## Step 1: Install Dependencies (2 minutes)

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install pre-commit hooks (optional but recommended)
pip install pre-commit
pre-commit install
```

---

## Step 2: Set Up Supabase (3 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up (~2 minutes)
3. Go to **Project Settings > API**
4. Copy your:
   - Project URL
   - Anon/public key
   - Service role key (keep this secret!)

---

## Step 3: Configure Environment Variables (2 minutes)

### Frontend Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
VITE_PERSONA_API_URL=http://localhost:3001
```

### Backend Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
SUPABASE_ANON_KEY=YOUR-ANON-KEY

# At least one LLM key required
OPENAI_API_KEY=sk-YOUR-OPENAI-KEY
ANTHROPIC_API_KEY=sk-ant-YOUR-ANTHROPIC-KEY
```

---

## Step 4: Run Database Migrations (2 minutes)

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
npx supabase link --project-ref YOUR-PROJECT-REF

# Run migrations
npx supabase db push
```

### Option B: Manual (Copy/Paste SQL)

1. Go to your Supabase project
2. Click **SQL Editor**
3. Run each file in `supabase/migrations/` in order
4. Click **Run** for each file

---

## Step 5: Start the Application (1 minute)

Open two terminal windows:

### Terminal 1: Start Backend Server

```bash
cd server
npm run dev
```

You should see:
```
Server running at http://localhost:3001
```

### Terminal 2: Start Frontend

```bash
npm run dev
```

You should see:
```
  Local:   http://localhost:5173/
```

---

## Step 6: Access the Application

1. Open your browser to [http://localhost:5173](http://localhost:5173)
2. Click **Sign Up** to create an account
3. Verify your email (check inbox)
4. Log in
5. Create your first persona!

---

## Quick Test Checklist

After setup, verify everything works:

- [ ] Frontend loads without errors
- [ ] Backend responds at `http://localhost:3001/health`
- [ ] Can create an account
- [ ] Can log in
- [ ] Can create a persona
- [ ] Can send a chat message
- [ ] Messages appear in real-time

---

## Common Issues & Solutions

### Issue: "Missing environment variable"

**Solution:** Double-check your `.env.local` and `server/.env` files. All required variables must be set.

### Issue: "Cannot connect to database"

**Solution:**
1. Verify your Supabase URL is correct
2. Check that migrations have been run
3. Verify your service role key is correct

### Issue: "LLM error"

**Solution:**
1. Check your API key is valid
2. Verify you have credits in your OpenAI/Anthropic account
3. Check the API key has correct permissions

### Issue: "CORS error"

**Solution:**
This is expected if running on a different port. Make sure:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### Issue: "Port already in use"

**Solution:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

---

## What's Next?

### Essential Reading
- [README_COMPREHENSIVE.md](./README_COMPREHENSIVE.md) - Complete documentation
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) - Security review
- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute

### Development Workflow
1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Run tests: `cd server && npm test`
4. Run linting: `npm run lint`
5. Commit: `git commit -m "feat: add my feature"`
6. Push and create PR

### Testing
```bash
# Run server tests
cd server
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Production Deployment
See the **Deployment** section in [README_COMPREHENSIVE.md](./README_COMPREHENSIVE.md#deployment) for detailed instructions on deploying to:
- Vercel (frontend)
- Render/Railway (backend)
- Or your preferred hosting provider

---

## Security Notes

Before deploying to production:

1. ✅ Change all API keys to production keys
2. ✅ Set `NODE_ENV=production`
3. ✅ Configure `ALLOWED_ORIGINS` in server/.env
4. ✅ Set up admin users in Supabase
5. ✅ Enable database backups
6. ✅ Set up error monitoring
7. ✅ Run security audit: `npm audit`

See [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) for the complete security checklist.

---

## Getting Help

- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/bsk1410/chat-unified-claude/issues)
- 💬 **Questions:** [GitHub Discussions](https://github.com/bsk1410/chat-unified-claude/discussions)
- 📧 **Email:** support@example.com
- 🔒 **Security:** security@example.com (for vulnerabilities)

---

## Project Structure (Quick Reference)

```
chat-unified-claude/
├── src/              # Frontend (React)
├── server/           # Backend (Hono API)
├── supabase/         # Database migrations
├── .env.example      # Frontend env template
└── server/.env.example  # Backend env template
```

---

**Ready to build something amazing!** 🚀

For complete documentation, architecture diagrams, and API reference, see [README_COMPREHENSIVE.md](./README_COMPREHENSIVE.md).
