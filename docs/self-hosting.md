# Self-Hosting OSWP

OSWP is designed to be self-hosted. You own your data, your schema, and your deployment — no SaaS vendor in between you and your guest list.

This guide covers three paths:

1. [Vercel + Supabase](#vercel--supabase-recommended) — easiest, free for personal use
2. [Docker Compose](#docker-compose) — any server or VPS
3. [Fly.io](#flyio) — one-command deploys on managed infrastructure

---

## Requirements

All paths require:

- **PostgreSQL 14+** — database
- **Node.js 18+** — required for local dev; not needed for Docker/Vercel deploys
- An **Anthropic API key** — optional, only needed for Etta AI assistant

---

## Vercel + Supabase (Recommended)

Best for: couples who want zero infrastructure maintenance and a free tier.

### 1. Fork the repo

[Fork OSWP on GitHub](https://github.com/dccakes/oswp) to your own account.

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for provisioning (~2 min)
3. Go to **Project Settings → Database** and copy:
   - **Connection string (Transaction mode)** → use as `DATABASE_URL`
   - **Connection string (Session mode / Direct)** → use as `DIRECT_URL`

### 3. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your fork
2. Add environment variables:

```bash
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
BETTER_AUTH_SECRET="your-secret"   # openssl rand -base64 32
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

3. Click **Deploy**

Vercel runs `npm install`, `prisma generate`, and `next build` automatically.

### 4. Run the database migration

After your first deploy, open the Vercel dashboard → your project → **Functions** → run:

```bash
npx prisma db push
```

Or connect to Supabase SQL editor and run the migration manually. Your schema is in `prisma/schema.prisma`.

### Optional: Enable file uploads

Add a [Vercel Blob store](https://vercel.com/docs/storage/vercel-blob) from your Vercel dashboard. Once linked, `BLOB_READ_WRITE_TOKEN` is auto-injected — vendor file uploads work immediately.

### Optional: Enable Etta AI assistant

```bash
ANTHROPIC_API_KEY="sk-ant-..."
JWT_SECRET="your-jwt-secret"   # openssl rand -base64 32
```

Or use the Vercel AI Gateway for a single key across providers:

```bash
AI_GATEWAY_API_KEY="aigw_..."
ETTA_MODEL="anthropic/claude-haiku-4.5"
```

---

## Docker Compose

Best for: self-hosted servers, VPS (DigitalOcean, Hetzner, Linode), or homelab.

### 1. Clone the repo

```bash
git clone https://github.com/dccakes/oswp.git
cd oswp
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
DATABASE_URL="postgresql://oswp:oswp_password@db:5432/oswp_db"
DIRECT_URL="postgresql://oswp:oswp_password@db:5432/oswp_db"
BETTER_AUTH_SECRET="your-secret"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

### 3. Start the stack

```bash
docker compose up -d
```

This starts:
- `db` — PostgreSQL 16
- `app` — OSWP Next.js app on port 3000

### 4. Run migrations

```bash
docker compose exec app npx prisma db push
```

### 5. (Optional) Set up a reverse proxy

For HTTPS, put OSWP behind nginx or Caddy:

**Caddy (automatic HTTPS):**

```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

**nginx:**

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Updating

```bash
git pull origin main
docker compose build
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

---

## Fly.io

Best for: managed infrastructure without the Vercel ecosystem.

### 1. Install Fly CLI

```bash
brew install flyctl
flyctl auth login
```

### 2. Clone and configure

```bash
git clone https://github.com/dccakes/oswp.git
cd oswp
flyctl launch --no-deploy
```

### 3. Provision a Postgres database

```bash
flyctl postgres create
flyctl postgres attach <db-app-name>
```

This auto-sets `DATABASE_URL` in your Fly app secrets.

### 4. Set remaining secrets

```bash
flyctl secrets set \
  BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  NEXT_PUBLIC_APP_URL="https://your-app.fly.dev" \
  DIRECT_URL="$(flyctl postgres connect --database-url)"
```

### 5. Deploy

```bash
flyctl deploy
```

### 6. Run migrations

```bash
flyctl ssh console -C "npx prisma db push"
```

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled for production) |
| `DIRECT_URL` | Recommended | Direct (non-pooled) PostgreSQL URL — required for migrations |
| `BETTER_AUTH_SECRET` | Yes | Session secret — `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Yes | Your public URL (e.g. `https://wedding.yourdomain.com`) |
| `ANTHROPIC_API_KEY` | No | Enables Etta AI assistant |
| `AI_GATEWAY_API_KEY` | No | Vercel AI Gateway key (alternative to Anthropic key) |
| `ETTA_MODEL` | No | AI model for Etta (default: `anthropic/claude-haiku-4.5`) |
| `JWT_SECRET` | No | Required if Etta is enabled — `openssl rand -base64 32` |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob — enables vendor file uploads |
| `AWS_S3_BUCKET_NAME` | No | S3 bucket — alternative to Vercel Blob for file storage |
| `AWS_S3_REGION` | No | S3 region |
| `AWS_S3_ACCESS_KEY_ID` | No | S3 access key |
| `AWS_S3_SECRET_ACCESS_KEY` | No | S3 secret key |
| `RESEND_API_KEY` | No | Email via Resend — enables OTP login and password reset |
| `EMAIL_FROM` | No | Verified sender address for Resend |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth — enables social login |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth secret |
| `GOOGLE_CLIENT_ID` | No | Google OAuth — enables social login |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret |

---

## Troubleshooting

**Prisma client not found**

```bash
npx prisma generate
```

**`DATABASE_URL must start with postgresql://`**

Check for typos. Supabase pooled URLs use port `6543`, direct URLs use `5432`.

**Auth session not persisting**

`BETTER_AUTH_SECRET` must be consistent across restarts. If you change it, all active sessions are invalidated.

**`NEXT_PUBLIC_APP_URL` is wrong**

This must match the exact URL users hit — including scheme and domain. Mismatch breaks OAuth redirects and email links.

**Database connection error (Supabase)**

Use the **Transaction mode** pooled URL for `DATABASE_URL` (port 6543) and the **Session mode** direct URL for `DIRECT_URL` (port 5432). Running migrations requires `DIRECT_URL`.

**Port 3000 in use (Docker)**

```yaml
# docker-compose.yml
ports:
  - "3001:3000"   # Change host port to 3001
```

**TypeScript errors after pulling changes**

```bash
rm -rf .next node_modules
npm install
npx prisma generate
npm run build
```

---

## Security checklist for production

- [ ] `BETTER_AUTH_SECRET` is a random 32-byte secret, not a placeholder
- [ ] `JWT_SECRET` is set if Etta is enabled
- [ ] `DATABASE_URL` uses a non-superuser Postgres role with limited permissions
- [ ] `NEXT_PUBLIC_APP_URL` is your actual domain, not localhost
- [ ] HTTPS is enforced (Vercel and Fly.io handle this; Docker needs a reverse proxy)
- [ ] `.env` is in `.gitignore` — never commit secrets to version control

---

## Getting help

- [GitHub Issues](https://github.com/dccakes/oswp/issues) — bugs and questions
- [GitHub Discussions](https://github.com/dccakes/oswp/discussions) — setup help, ideas, show & tell
