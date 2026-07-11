import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes('YOUR_DATABASE_URL_HERE'),
        'You forgot to change the default URL'
      ),
    DIRECT_URL: z.string().url().optional(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Better Auth secret key
    BETTER_AUTH_SECRET: z.string().min(1),
    // Optional: AWS S3 Storage (can be disabled for local dev)
    AWS_S3_BUCKET_NAME: z.string().min(1).optional(),
    AWS_S3_REGION: z.string().min(1).optional(),
    AWS_S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    // Optional: Vercel deployment vars
    VERCEL_BRANCH_URL: z.string().min(1).optional(),
    VERCEL_URL: z.string().min(1).optional(),
    PORT: z.string().min(1).optional(),
    // Optional: OAuth providers
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    // Optional: Vercel Blob storage (for vendor quote file uploads)
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    // Optional: Resend email service (required for OTP login, password reset, email verification)
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).default('noreply@oswp.app'),
    // Etta AI Agent
    AI_GATEWAY_API_KEY: z.string().min(1).optional(), // Vercel AI Gateway API key
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(), // For embeddings (text-embedding-3-small)
    JWT_SECRET: z.string().min(1).optional(), // For guest concierge tokens
    ETTA_MODEL: z.string().min(1).optional(), // e.g. "anthropic/claude-haiku-4.5" or "openai/gpt-4o"
    // Telegram bot (couple-bot channel)
    TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
    TELEGRAM_BOT_USERNAME: z.string().min(1).optional(),
    TELEGRAM_WEBHOOK_SECRET: z.string().min(1).optional(),
    TELEGRAM_DEBOUNCE_MS: z.coerce.number().int().positive().optional(),
    TELEGRAM_SESSION_GAP_MS: z.coerce.number().int().positive().optional(),
    TELEGRAM_SESSION_MAX_MESSAGES: z.coerce.number().int().positive().optional(),
    TELEGRAM_SESSION_MAX_CHARS: z.coerce.number().int().positive().optional(),
    // Vercel Cron shared secret (protects /api/cron/* routes)
    CRON_SECRET: z.string().min(1).optional(),
    // Optional: PostHog server-side analytics. Falls back to the public key
    // (same project) when a dedicated server key is not supplied.
    POSTHOG_KEY: z.string().min(1).optional(),
    POSTHOG_HOST: z.string().url().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_APP_URL for Better Auth — falls back to https://${VERCEL_BRANCH_URL} if not set
    NEXT_PUBLIC_APP_URL: z
      .string()
      .optional()
      .transform(
        (val) =>
          val ??
          (process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : undefined)
      )
      .pipe(z.string().url().optional()),
    // Optional: PostHog client-side analytics (product + template instrumentation).
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
    AWS_S3_REGION: process.env.AWS_S3_REGION,
    AWS_S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID,
    AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    PORT: process.env.PORT,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    ETTA_MODEL: process.env.ETTA_MODEL,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
    TELEGRAM_DEBOUNCE_MS: process.env.TELEGRAM_DEBOUNCE_MS,
    TELEGRAM_SESSION_GAP_MS: process.env.TELEGRAM_SESSION_GAP_MS,
    TELEGRAM_SESSION_MAX_MESSAGES: process.env.TELEGRAM_SESSION_MAX_MESSAGES,
    TELEGRAM_SESSION_MAX_CHARS: process.env.TELEGRAM_SESSION_MAX_CHARS,
    CRON_SECRET: process.env.CRON_SECRET,
    POSTHOG_KEY: process.env.POSTHOG_KEY,
    POSTHOG_HOST: process.env.POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
})
