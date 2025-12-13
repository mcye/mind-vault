import { Redis } from '@upstash/redis/cloudflare';
import { documents } from '@repo/shared';
import { eq, sql } from 'drizzle-orm';
import { createDb } from '../db';

export class QuotaManager {
    private redis: Redis;
    private db: ReturnType<typeof createDb>;

    constructor(env: any, db: ReturnType<typeof createDb>) {
        this.redis = Redis.fromEnv(env);
        this.db = db;
    }

    // 获取用户本月已发送消息数
    async getMessageCount(userId: string): Promise<number> {
        const key = this.getMessageKey(userId);
        return await this.redis.get<number>(key) || 0;
    }

    // 增加消息计数
    async incrementMessageCount(userId: string): Promise<number> {
        const key = this.getMessageKey(userId);
        // 自增
        const count = await this.redis.incr(key);
        // 如果是第一次，设置过期时间（例如 30 天后重置，或者逻辑上按自然月处理）
        if (count === 1) {
            await this.redis.expire(key, 30 * 24 * 60 * 60);
        }
        return count;
    }

    // 检查是否允许发送 (硬编码限制，Phase 6 会变成动态获取 plan)
    async checkMessageLimit(userId: string): Promise<boolean> {
        const count = await this.getMessageCount(userId);
        const LIMIT = 2; // 免费用户限制 50 条
        return count < LIMIT;
    }

    private getMessageKey(userId: string) {
        // 按月轮转 key，例如 "usage:msg:user_123:2025-12"
        const date = new Date();
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        return `usage:msg:${userId}:${monthKey}`;
    }

    // 获取用户已用存储空间 (Bytes)
    async getUsedStorage(userId: string): Promise<number> {
        // select sum(size) from documents where user_id = ?
        const result = await this.db
            .select({
                totalSize: sql<number>`sum(${documents.size})`
            })
            .from(documents)
            .where(eq(documents.userId, userId));

        return result[0]?.totalSize || 0;
    }

    // 检查是否允许上传 (传入新文件大小)
    async checkStorageLimit(userId: string, newFileSize: number): Promise<boolean> {
        const used = await this.getUsedStorage(userId);
        const LIMIT_MB = 0.1;
        const LIMIT_BYTES = LIMIT_MB * 1024 * 1024;

        return (used + newFileSize) <= LIMIT_BYTES;
    }
}