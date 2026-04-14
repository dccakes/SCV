# Contributing to OSWP

Thanks for your interest in contributing to The Open Source Wedding Project. Whether you're fixing a bug, proposing a feature, or improving the docs — every contribution helps couples plan their weddings without handing their data to a SaaS company.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

---

## Code of Conduct

This project follows a standard contributor code of conduct. Be respectful, constructive, and welcoming to contributors of all backgrounds. Report unacceptable behavior to the project maintainers.

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm v10+
- PostgreSQL 14+ (or Docker)
- Git

### Development setup

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/oswp.git
   cd oswp
   ```

3. **Add the upstream remote**
   ```bash
   git remote add upstream https://github.com/dccakes/SCV.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up the database**

   Option A: Docker (recommended)
   ```bash
   docker compose up -d
   ```

   Option B: Use your own PostgreSQL instance

6. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Minimum required:
   ```
   DATABASE_URL="postgresql://oswp:oswp_password@localhost:5432/oswp_db"
   BETTER_AUTH_SECRET="your-secret-key"
   ```

7. **Set up the database schema**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

9. Open [http://localhost:3000](http://localhost:3000)

---

## How to Contribute

### Reporting bugs

Before opening a bug report, check existing issues to avoid duplicates. A good bug report includes:

- A clear, descriptive title
- Exact steps to reproduce
- What you expected vs. what happened
- Your environment (OS, Node version, browser)
- Screenshots or code snippets if relevant

### Suggesting features

Open a **GitHub Discussion** before filing a feature request as an issue. This lets us validate the idea with the community before anyone writes code. Good feature proposals include:

- The problem you're trying to solve for couples (not just a technical ask)
- Why existing behavior doesn't cover it
- Any alternatives you've considered

### Good first issues

Look for issues labeled:

- `good first issue` — straightforward entry points
- `help wanted` — issues where community input is needed
- `documentation` — docs improvements (no code required)

### Pull requests

1. **Create a branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Write tests first** — OSWP follows TDD. Write the failing test before the implementation.

3. **Implement your changes** following the [style guidelines](#style-guidelines)

4. **Run the test suite and linter**
   ```bash
   npm run test:unit
   npm run lint
   npm run prettier
   ```

5. **Commit** following [Conventional Commits](#commit-messages)

6. **Push to your fork**
   ```bash
   git push origin feat/your-feature-name
   ```

7. **Open a PR** against the `main` branch

---

## Style Guidelines

### Architecture

OSWP uses a domain-driven structure. Before writing code, read `CLAUDE.md` — it explains where logic goes (router vs. service vs. repository) and how tests should be written.

| Layer | Responsibility |
|---|---|
| Router | Input validation, auth checks, delegate to service |
| Service | Business logic, domain rules |
| Repository | Database queries only (Prisma) |
| Application | Cross-domain orchestration |

### TypeScript

- Strict mode — no `any`, use `unknown` if needed
- No `@ts-ignore` or `eslint-disable` — fix the underlying issue
- Mark component props `Readonly<Props>`
- Use Zod schemas for all validation; derive TypeScript types with `z.infer`

### React

- Server Components by default — `'use client'` only when necessary
- Use `react-hook-form` + Zod for all forms
- Mobile-first responsive design with Tailwind (`md:` and `lg:` breakpoints)

### Formatting

```bash
npm run prettier:fix
npm run lint:fix
```

---

## Commit Messages

OSWP follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change that isn't a feature or fix |
| `test` | Adding or fixing tests |
| `chore` | Build tooling, dependencies |

### Examples

```
feat(guests): add attendance likelihood slider

fix(rsvp): correct dietary restriction validation for plus-ones

docs: update CONTRIBUTING.md with GitHub Discussions workflow

refactor(event): move date validation from router to service
```

---

## Pull Request Process

1. **CI must pass** — all tests and lint checks are required
2. **Keep scope tight** — one feature or fix per PR is easier to review
3. **Update docs** if your change affects user-facing behavior
4. **Respond to review feedback** promptly — stale PRs may be closed
5. **Squash commits** if requested before merge

### PR title format

Same as commit messages: `type(scope): description`

### PR description template

- **What** changed
- **Why** it was needed
- **How to test** it
- **Screenshots** (if UI changes)

---

## Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test:unit` | Run unit tests |
| `npm run test:unit -- --coverage` | Tests with coverage |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Fix lint errors |
| `npm run prettier` | Check formatting |
| `npm run prettier:fix` | Fix formatting |
| `npx prisma db push` | Push schema to database |
| `npx prisma studio` | Open database GUI |

---

## Project Structure

```
server/
├── domains/          # Business entities (Event, Guest, Household, etc.)
├── application/      # Cross-domain orchestration
└── infrastructure/   # Database, email, storage

app/                  # Next.js App Router pages
components/           # React components
tests/
└── unit/             # Jest unit tests
prisma/
└── schema.prisma     # Database schema
```

---

## Community

- **Questions or ideas?** → [GitHub Discussions](https://github.com/dccakes/SCV/discussions)
- **Found a bug?** → [Open an Issue](https://github.com/dccakes/SCV/issues)
- **Building something with OSWP?** → Share it in Discussions under Show & Tell

We use GitHub Discussions as the default forum for everything that isn't a confirmed bug or active PR. If you're not sure whether something belongs in an issue, start a discussion.

---

## License

By contributing to OSWP, you agree that your contributions will be licensed under the same [PolyForm Noncommercial License](LICENSE) that covers the project.

---

Thank you for contributing. Every improvement — no matter how small — helps couples plan their wedding on their own terms.
