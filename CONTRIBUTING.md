# Contributing to SCV

First off, thank you for considering contributing to SCV! It's people like you that make SCV such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How Can I Contribute?](#how-can-i-contribute)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v10 or higher
- PostgreSQL 14+ (or use Docker)
- Git

### Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork locally**
   ```bash
   git clone https://github.com/YOUR_USERNAME/SCV.git
   cd SCV
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

   Option A: Using Docker (recommended)
   ```bash
   docker compose up -d
   ```

   Option B: Use your own PostgreSQL instance

6. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials:
   ```
   DATABASE_URL="postgresql://scv:scv_password@localhost:5432/scv_db"
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

9. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed and what you expected**
- **Include your environment details** (OS, Node version, browser)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **A clear and descriptive title**
- **A detailed description** of the proposed enhancement
- **Explain why this would be useful** to most users
- **List any alternatives you've considered**

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues for newcomers
- `help wanted` - Issues that need community help
- `documentation` - Documentation improvements

### Pull Requests

1. **Create a branch** for your changes
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our [style guidelines](#style-guidelines)

3. **Write or update tests** as needed

4. **Run the test suite**
   ```bash
   npm run test:unit
   npm run lint
   npm run prettier
   ```

5. **Commit your changes** following our [commit message guidelines](#commit-messages)

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** against the `main` branch

## Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types - use proper typing
- Use interfaces for object shapes
- Prefer `const` over `let`

### Code Formatting

We use Prettier for code formatting. Run before committing:

```bash
npm run prettier:fix
```

### Linting

We use ESLint for code quality. Run:

```bash
npm run lint:fix
```

### Testing

- Write unit tests for new features
- Maintain or improve code coverage
- Tests should be in the `tests/` directory
- Follow the existing test patterns

```bash
npm run test:unit
npm run test:unit -- --coverage
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). Each commit message should be structured as:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `build`: Changes to build system or dependencies
- `ci`: Changes to CI configuration
- `chore`: Other changes that don't modify src or test files

### Examples

```
feat(guest-list): add bulk import functionality

fix(rsvp): correct validation for dietary restrictions

docs: update installation instructions in README

refactor(api): simplify tRPC router structure
```

## Pull Request Process

1. **Ensure CI passes** - All tests and linting must pass
2. **Update documentation** if needed
3. **Add yourself to contributors** (if this is your first contribution)
4. **Request a review** from maintainers
5. **Address review feedback** promptly
6. **Squash commits** if requested before merge

### PR Title Format

PR titles should follow the same format as commit messages:

```
feat(scope): description of changes
```

### PR Description

Include in your PR description:

- **What** changes were made
- **Why** the changes were necessary
- **How** to test the changes
- **Screenshots** (if UI changes)

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run test:unit` | Run unit tests |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run prettier` | Check formatting |
| `npm run prettier:fix` | Fix formatting |
| `npm run db:push` | Push Prisma schema |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                 # Utilities and helpers
├── server/
│   ├── api/            # tRPC API routers
│   ├── domains/        # Domain-driven modules
│   └── infrastructure/ # Database and external services
├── styles/             # Global styles
└── middleware.ts       # Next.js middleware

prisma/
└── schema.prisma       # Database schema

tests/
└── unit/               # Jest unit tests
```

## Community

- **Questions?** Open a GitHub Discussion
- **Found a bug?** Open an Issue
- **Have an idea?** Start a Discussion first

## License

By contributing to SCV, you agree that your contributions will be licensed under the same [PolyForm Noncommercial License](LICENSE) that covers the project.

---

Thank you for contributing! Every contribution, no matter how small, makes a difference.
