import { createMiddleware } from 'hono/factory';
import { createAuth } from '../lib/auth';
import * as schema from '@repo/shared';

type AuthEnv = {
    Variables: {
        user: typeof schema.user.$inferSelect;
        session: typeof schema.session.$inferSelect;
    }
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
    const auth = createAuth(c);

    // 验证 Session
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    // 将用户信息注入 Context
    const user = {
        ...session.user,
        image: session.user.image ?? null, // 如果是 undefined, 强制转为 null
        stripeSubscriptionId: session.user.stripeSubscriptionId ?? null,
        stripeCurrentPeriodEnd: session.user.stripeCurrentPeriodEnd ? new Date(session.user.stripeCurrentPeriodEnd) : null,
        stripeCustomerId: session.user.stripeCustomerId ?? null,
        plan: (session.user.plan as "free" | "pro") ?? "free",
    };

    const sessionData = {
        ...session.session,
        ipAddress: session.session.ipAddress ?? null,
        userAgent: session.session.userAgent ?? null,
    };

    c.set('user', user);
    c.set('session', sessionData);

    await next();
});