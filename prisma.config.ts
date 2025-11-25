import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'node --import dotenv/config prisma/seed.mjs',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
