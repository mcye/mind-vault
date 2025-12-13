import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "../db"; // 你的 drizzle db 实例
import * as schema from "@repo/shared"; // 你的 schema

// 由于 Cloudflare Workers 的特殊性，我们需要动态传入 context 或 env
// 这里我们定义一个创建 auth 实例的函数
// 由于 Cloudflare Workers 的特殊性，我们需要动态传入 context 或 env
// 这里我们定义一个创建 auth 实例的函数
export const createAuth = (c: any) => {
    const db = createDb(c.env.TURSO_DATABASE_URL, c.env.TURSO_AUTH_TOKEN);
    return betterAuth({
        database: drizzleAdapter(db, {
            provider: "sqlite",
            schema: schema,
        }),
        socialProviders: {
            github: {
                clientId: c.env.GITHUB_CLIENT_ID,
                clientSecret: c.env.GITHUB_CLIENT_SECRET,
            },
            // google: { ... } // 后续可加
        },
        emailAndPassword: {
            enabled: true,
        },
        user: {
            additionalFields: {
                plan: {
                    type: "string",
                    required: false,
                },
                stripeCustomerId: {
                    type: "string",
                    required: false,
                },
                stripeSubscriptionId: {
                    type: "string",
                    required: false,
                },
                stripeCurrentPeriodEnd: {
                    type: "string",
                    required: false,
                }
            }
        },
        secret: c.env.BETTER_AUTH_SECRET, // 必填，生成一个长随机字符串
        trustedOrigins: [
            "http://localhost:3000",
            "https://mind-vault-web.vercel.app/"
        ],
        // 注意：如果是跨域 (Web: localhost:3000, API: localhost:8787)，需要配置 CORS 和 cookie

        // 显式指定 API 挂载路径
        basePath: "/api/auth",

        // 确保 URL 正确 (Cloudflare 生产环境可能需要动态配置)
        baseURL: c.env.API_URL || "http://localhost:8787",
    });
};