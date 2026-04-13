# OSWP — The Open Source Wedding Project

**Plan your wedding without handing your guest list to a SaaS company.**

OSWP is an AI-native, self-hostable wedding planning platform. It handles guest management, RSVP collection, vendor tracking, and your wedding website — with Etta, an AI wedding assistant built in. You own your data, your schema, and your deployment.

[![License: PolyForm Noncommercial](https://img.shields.io/badge/license-PolyForm%20Noncommercial-blue)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)

---

## What it does

**Guest & RSVP management**
- Organize guests into households, tag them by relationship or group, and track attendance likelihood before invitations go out
- Create multiple events (ceremony, rehearsal dinner, after-party) and invite different guest subsets to each
- Collect RSVPs with custom questions — dietary restrictions, song requests, or anything else you need
- Filter, sort, and search your guest list; switch between card and table views

**Vendor management**
- Track vendors with quotes (flat fee or per-guest), files, and notes in one place
- Preview PDFs and images inline without leaving the app

**Wedding website**
- Generate a custom website with a unique URL for your guests
- Password-protect it, toggle RSVP collection on/off, and upload a cover photo

**Etta — AI wedding assistant**
- Built-in AI agent with a dual-persona chat interface
- Helps couples think through planning decisions, draft communications, and get unstuck

**Multi-user support**
- Invite a partner, coordinator, or family member to co-manage the wedding
- Org-scoped permissions keep each couple's data separate

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 + React 19 (App Router, Server Components) |
| Language | TypeScript (strict mode) |
| API | tRPC v11 |
| Database | PostgreSQL via Prisma v7 |
| Auth | Better Auth (self-hosted, open source) |
| AI | Claude (Anthropic) via Etta agent |
| Styling | Tailwind CSS + shadcn/ui |
| Validation | Zod v4 |
| Storage | Vercel Blob (optional) |
| Observability | OpenTelemetry |

---

## Getting started

### Prerequisites

- Node.js v18+
- PostgreSQL (or a [Supabase](https://supabase.com/) free-tier project)
- An [Anthropic API key](https://console.anthropic.com/) (optional — only needed for Etta)

### 1. Clone and install

```bash
git clone https://github.com/dccakes/SCV.git
cd oswp
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Required variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"

# Auth
BETTER_AUTH_SECRET="your-secret-key"   # openssl rand -base64 32
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Optional:

```bash
# Social login
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# File storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=""

# Etta AI assistant
ANTHROPIC_API_KEY=""
```

### 3. Set up the database

```bash
npx prisma db push
npx prisma generate
```

Optionally seed with sample data:

```bash
npx prisma db seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Self-hosting

OSWP is built to run anywhere. Three paths are supported:

| Path | Best for |
|---|---|
| **Vercel + Supabase** | Easiest setup, free tier, zero infrastructure |
| **Docker Compose** | VPS or homelab |
| **Fly.io** | Managed infrastructure, one-command deploys |

→ **[Full self-hosting guide](docs/self-hosting.md)** — environment variables, reverse proxy setup, security checklist, and troubleshooting.

### Quick deploy to Vercel

1. Fork this repo
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add your environment variables (see [docs/self-hosting.md](docs/self-hosting.md) for the full reference)
4. Deploy

Vercel runs `npm install`, generates the Prisma client, and builds automatically.

---

## Development commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test:unit` | Run unit tests (Jest) |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Fix auto-fixable lint errors |
| `npm run prettier:fix` | Fix formatting |
| `npx prisma studio` | Open database GUI (port 5555) |
| `npx prisma migrate dev` | Run a new migration |

---

## Project structure

```
server/
├── domains/          # Business entities (Event, Guest, Household, etc.)
│   └── event/
│       ├── event.repository.ts   # Database access
│       ├── event.service.ts      # Business logic
│       ├── event.validator.ts    # Zod schemas
│       ├── event.types.ts        # Domain types
│       └── event.router.ts       # tRPC router (thin)
├── application/      # Cross-domain orchestration
└── infrastructure/   # Database, email, storage

app/                  # Next.js App Router pages
components/           # React components
tests/
└── unit/             # Jest unit tests
```

See `CLAUDE.md` for architecture guidelines and the domain migration plan.

---

## Database schema

Core models:

- **User** — accounts and auth
- **Wedding** — the couple's wedding record (org-scoped)
- **Event** — ceremony, reception, and other events
- **Household** — guest group at a shared address
- **Guest** — individual guests
- **Invitation** — guest ↔ event link with RSVP status
- **Question / Answer** — custom RSVP questions and responses
- **Vendor** — vendor contacts, quotes, and files
- **Website** — wedding website configuration

Full schema in `prisma/schema.prisma`.

---

## Community

Questions, ideas, and show-and-tells live in [GitHub Discussions](https://github.com/dccakes/SCV/discussions):

- **[Q&A](https://github.com/dccakes/SCV/discussions/categories/q-a)** — stuck on setup or a feature? Ask here.
- **[Ideas](https://github.com/dccakes/SCV/discussions/categories/ideas)** — propose features before opening a PR.
- **[Show and Tell](https://github.com/dccakes/SCV/discussions/categories/show-and-tell)** — share your OSWP deployment.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) to get set up and submit your first PR. All contributions — bug reports, feature proposals, and pull requests — are welcome.

---

## Troubleshooting

**Prisma client not found**
```bash
npx prisma generate
```

**Database connection error**
- Verify `DATABASE_URL` is correct
- For Supabase: use the "Connection Pooling" URL for `DATABASE_URL`

**Port 3000 in use**
```bash
lsof -ti:3000 | xargs kill -9
# or
PORT=3001 npm run dev
```

**TypeScript errors after pulling changes**
```bash
rm -rf .next node_modules package-lock.json
npm install
npx prisma generate
npm run build
```

---

## License

[PolyForm Noncommercial License](LICENSE) — free for personal use, open to review and contribution.
