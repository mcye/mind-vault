import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL, // 指向你的 Hono API (例如 http://localhost:8787)
});

// 导出常用的 Hook
export const { useSession, signIn, signOut } = authClient;