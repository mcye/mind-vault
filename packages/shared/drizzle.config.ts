import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// 加载根目录的 .env 文件
dotenv.config({ path: '../../.env' });

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
} satisfies Config;