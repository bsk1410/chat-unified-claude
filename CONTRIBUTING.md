# Contributing to Chat Unified Claude

Thank you for your interest in contributing to Chat Unified Claude! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Security](#security)
- [Questions](#questions)

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members
- Be open to constructive criticism

### Unacceptable Behavior

- Harassment, discrimination, or intimidation
- Trolling or insulting comments
- Publishing others' private information
- Any conduct that could be considered unprofessional

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- Node.js 18 or higher
- npm 9 or higher
- Git
- A code editor (VS Code recommended)
- A Supabase account (for testing)
- Basic knowledge of TypeScript, React, and SQL

### First Steps

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/chat-unified-claude.git
   cd chat-unified-claude
   ```

3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/bsk1410/chat-unified-claude.git
   ```

4. **Install dependencies**:
   ```bash
   # Frontend
   npm install

   # Backend
   cd server
   npm install
   cd ..
   ```

5. **Set up environment variables** (see README.md for details)

6. **Create a branch** for your contribution:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Setup

### Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- Better Comments
- GitLens

### VS Code Settings

Add to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Development Workflow

1. **Start the backend server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend** (in another terminal):
   ```bash
   npm run dev
   ```

3. **Make your changes** in your feature branch

4. **Test your changes** thoroughly

5. **Commit and push** following our conventions

---

## Project Structure

### Understanding the Codebase

```
chat-unified-claude/
├── src/                      # Frontend React application
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and helpers
│   ├── pages/                # Page components
│   ├── stores/               # State management
│   └── types/                # TypeScript types
│
├── server/                   # Backend API
│   └── src/
│       ├── db/               # Database client
│       ├── lib/              # Server utilities
│       ├── middleware/       # Express/Hono middleware
│       ├── routes/           # API endpoints
│       └── services/         # Business logic
│
├── supabase/                 # Database migrations
│   └── migrations/           # SQL files
│
└── tests/                    # Test files
```

### Key Files

- `server/src/lib/constants.ts`: Server configuration
- `src/lib/constants.ts`: Client configuration
- `server/src/lib/validation.ts`: API input validation
- `src/lib/api-client.ts`: Frontend API client
- `server/src/middleware/auth.ts`: Authentication logic

---

## Coding Standards

### TypeScript

- **Use explicit types** when type inference isn't clear
- **Avoid `any`** - use `unknown` if you must
- **Use interfaces** for object shapes
- **Use type aliases** for unions and intersections

```typescript
// Good
interface User {
  id: string;
  email: string;
  name?: string;
}

// Avoid
const user: any = { ... };
```

### React Components

- **Use functional components** with hooks
- **Extract complex logic** into custom hooks
- **Keep components small** and focused (< 200 lines)
- **Use TypeScript** for props

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### Naming Conventions

- **Files**: `kebab-case.ts`, `PascalCase.tsx` for components
- **Variables/Functions**: `camelCase`
- **Components**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

```typescript
// Good
const MAX_RETRIES = 3;
interface UserProfile { ... }
function fetchUserData() { ... }

// Avoid
const max_retries = 3;
interface userProfile { ... }
function FetchUserData() { ... }
```

### Code Organization

1. **Imports** (grouped and sorted):
   ```typescript
   // External libraries
   import { useState } from 'react';
   import { z } from 'zod';

   // Internal modules
   import { Button } from '@/components/ui/button';
   import { useAuth } from '@/hooks/useAuth';

   // Types
   import type { User } from '@/types';
   ```

2. **Constants** at the top
3. **Type definitions**
4. **Component/function** implementation
5. **Exports** at the bottom

### Comments

- **Use JSDoc** for public functions and complex logic
- **Explain WHY**, not what (code should be self-explanatory)
- **Update comments** when updating code
- **Remove commented-out code**

```typescript
/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - The raw user input
 * @returns Sanitized string safe for rendering
 */
export function sanitizeInput(input: string): string {
  // Remove script tags to prevent XSS
  return input.replace(/<script.*?>.*?<\/script>/gi, '');
}
```

---

## Testing Guidelines

### Test Philosophy

- **Write tests first** when fixing bugs
- **Test behavior**, not implementation
- **Keep tests simple** and focused
- **Mock external dependencies**

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('sanitizeInput', () => {
  it('should remove script tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    const output = sanitizeInput(input);
    expect(output).toBe('Hello');
  });

  it('should preserve safe HTML', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const output = sanitizeInput(input);
    expect(output).toContain('<p>');
    expect(output).toContain('<strong>');
  });
});
```

### What to Test

#### Unit Tests (Required)
- Utility functions
- Validation logic
- Data transformations
- Business logic

#### Integration Tests (Encouraged)
- API endpoints
- Database operations
- Authentication flows

#### E2E Tests (Nice to have)
- Critical user flows
- Multi-step processes

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/lib/sanitize.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Commit Messages

### Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `security`: Security fixes

### Examples

```bash
feat(auth): add OAuth support for GitHub

Implemented GitHub OAuth flow using Supabase Auth.
Added login button and callback handler.

Closes #123

---

fix(chat): prevent XSS in message display

Added input sanitization to escape HTML entities
before rendering user messages.

SECURITY FIX

---

docs(readme): update installation instructions

Added section about environment variable setup
and clarified Supabase configuration steps.
```

### Guidelines

- Use the **imperative mood** ("add feature" not "added feature")
- **Capitalize** the first letter of the subject
- **No period** at the end of the subject
- **Limit subject line** to 50 characters
- **Wrap body** at 72 characters
- **Explain what and why**, not how
- **Reference issues** in the footer

---

## Pull Request Process

### Before Submitting

1. **Update from upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Run linting**:
   ```bash
   npm run lint
   ```

4. **Build successfully**:
   ```bash
   npm run build
   ```

5. **Update documentation** if needed

### Creating the PR

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub

3. **Fill out the PR template** completely:
   - What does this PR do?
   - Why is this change needed?
   - How was it tested?
   - Screenshots (if UI changes)
   - Related issues

### PR Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to break)
- [ ] Documentation update

## Testing
How has this been tested?

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing performed

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally

## Screenshots (if applicable)

## Related Issues
Closes #(issue number)
```

### Review Process

1. **Automated checks** must pass (linting, tests, build)
2. **At least one approval** from a maintainer required
3. **Address review comments** promptly
4. **Keep PR updated** with main branch
5. **Squash commits** if requested

### After Merge

1. **Delete your branch**:
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update your local main**:
   ```bash
   git checkout main
   git pull upstream main
   ```

---

## Security

### Reporting Security Issues

**DO NOT** open a public issue for security vulnerabilities.

Instead:
1. Email security@example.com
2. Include "SECURITY" in the subject line
3. Provide detailed description
4. Wait for response before disclosure

### Security Best Practices

When contributing:

- **Never commit secrets** (.env files, API keys, passwords)
- **Sanitize user input** in all places it's rendered
- **Validate all inputs** on both client and server
- **Use parameterized queries** to prevent SQL injection
- **Follow principle of least privilege**
- **Keep dependencies updated**
- **Run security audits**: `npm audit`

### Security Checklist for PRs

- [ ] No hardcoded secrets or credentials
- [ ] User input is sanitized
- [ ] API inputs are validated
- [ ] Authentication is properly checked
- [ ] Authorization is enforced
- [ ] Errors don't leak sensitive information
- [ ] Dependencies are up to date
- [ ] No new security warnings from `npm audit`

---

## Documentation

### When to Update Docs

Update documentation when:
- Adding a new feature
- Changing API endpoints
- Modifying configuration
- Fixing a bug that changes behavior
- Adding new environment variables

### Documentation Locations

- **README.md**: Overview, quick start, basic usage
- **API docs**: In code comments and README
- **Architecture**: Diagrams in README
- **Configuration**: Comments in constants files
- **Deployment**: Deployment section in README

### Writing Good Docs

- Be **concise but complete**
- Use **examples** liberally
- Include **code samples**
- Add **screenshots** for UI features
- Keep **up to date** with code changes
- Use **proper markdown** formatting

---

## Questions?

### Where to Ask

- **General questions**: [GitHub Discussions](https://github.com/bsk1410/chat-unified-claude/discussions)
- **Bug reports**: [GitHub Issues](https://github.com/bsk1410/chat-unified-claude/issues)
- **Feature requests**: [GitHub Issues](https://github.com/bsk1410/chat-unified-claude/issues) with "enhancement" label
- **Security issues**: security@example.com

### Getting Help

Before asking:
1. Check existing issues and discussions
2. Read the README and documentation
3. Search the codebase for similar implementations
4. Try to solve it yourself (learning opportunity!)

When asking:
1. Be specific about the problem
2. Include relevant code snippets
3. Describe what you've tried
4. Provide error messages and logs
5. Mention your environment (OS, Node version, etc.)

---

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- GitHub contributors page

Thank you for contributing to Chat Unified Claude!

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).
