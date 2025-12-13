// apps/api/src/lib/stripe.ts
import Stripe from 'stripe';

// 为了兼容 Cloudflare Workers，我们需要按需初始化
export const createStripe = (apiKey: string) => {
    return new Stripe(apiKey, {
        apiVersion: '2025-11-17.clover', // 使用最新版或你锁定的版本
        httpClient: Stripe.createFetchHttpClient(), // 关键：使用 Fetch API 适配 Edge 环境
    });
};