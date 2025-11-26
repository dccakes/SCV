import 'dotenv/config'

import { defineConfig } from 'prisma/config'

// For prisma generate, we don't need a real DATABASE_URL
// Only migrations/seed/push need it
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/placeholder'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'node --import dotenv/config prisma/seed.mjs',
  },
  datasource: {
    url: databaseUrl,
  },
})
