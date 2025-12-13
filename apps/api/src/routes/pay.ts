import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { createStripe } from '../lib/stripe';
import { createDb } from '../db';
import { user } from '@repo/shared';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

type Bindings = {
    STRIPE_SECRET_KEY: string;
    STRIPE_PRICE_ID: string;
    FRONTEND_URL: string;
}

type Variables = {
    db: ReturnType<typeof createDb>
}

const app = new Hono<{ Variables: Variables, Bindings: Bindings }>()
    .use('*', authMiddleware)
    .post('/checkout', async (c) => {
        const currentUser = c.get('user');
        const stripe = createStripe(c.env.STRIPE_SECRET_KEY);

        // 1. 确保用户有 Stripe Customer ID
        let customerId = currentUser.stripeCustomerId;
        console.log(customerId)

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: currentUser.email,
                name: currentUser.name,
                metadata: {
                    userId: currentUser.id, // 关键：把 userId 存入 Stripe 元数据，方便 Webhook 回调时匹配
                },
            });
            customerId = customer.id;
            console.log(customerId)

            // 回写到数据库
            await c.var.db.update(user)
                .set({ stripeCustomerId: customerId })
                .where(eq(user.id, currentUser.id));
        }

        // 2. 创建 Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: c.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${c.env.FRONTEND_URL}/dashboard?success=true`,
            cancel_url: `${c.env.FRONTEND_URL}/dashboard?canceled=true`,
            metadata: {
                userId: currentUser.id,
            },
        });

        if (!session.url) {
            throw new HTTPException(500, { message: "Failed to create checkout session" });
        }

        return c.json({ url: session.url });
    });

export default app;