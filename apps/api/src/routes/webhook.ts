import { Hono } from 'hono';
import { createStripe } from '../lib/stripe';
import { createDb } from '../db';
import { user } from '@repo/shared';
import { eq } from 'drizzle-orm';

type Bindings = {
    STRIPE_WEBHOOK_SECRET: string;
    STRIPE_SECRET_KEY: string;
};

type Variables = {
    db: ReturnType<typeof createDb>
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

    .post('/', async (c) => {
        const signature = c.req.header('Stripe-Signature');
        const body = await c.req.text(); // 获取原始文本 Body 用于验证签名

        if (!signature || !c.env.STRIPE_WEBHOOK_SECRET) {
            return c.text('Missing signature or secret', 400);
        }

        const stripe = createStripe(c.env.STRIPE_SECRET_KEY);
        let event;

        // 1. 验证签名 (防止伪造请求)
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                c.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return c.text(`Webhook Error: ${err.message}`, 400);
        }

        // 2. 处理业务逻辑
        const session = event.data.object as any;

        try {
            switch (event.type) {
                // A. 首次订阅成功 / 支付成功
                case 'checkout.session.completed': {
                    // metadata.userId 是我们在 /checkout 接口塞进去的
                    const userId = session.metadata?.userId;
                    if (!userId) break;

                    const subscriptionId = session.subscription;

                    // 获取订阅详情以知道过期时间
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                    await c.var.db.update(user)
                        .set({
                            plan: 'pro',
                            stripeSubscriptionId: subscriptionId,
                            stripeCustomerId: session.customer,
                            stripeCurrentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
                        })
                        .where(eq(user.id, userId));

                    console.log(`User ${userId} upgraded to PRO`);
                    break;
                }

                // B. 续费成功 (周期性扣款)
                case 'invoice.payment_succeeded': {
                    const subscriptionId = session.subscription;
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                    // 通过 customerId 或 subscriptionId 反查用户并更新过期时间
                    // 这里简化逻辑，假设我们能在 metadata 里拿到，或者通过 subscriptionId 查库
                    // 注意: invoice 事件的 metadata 可能为空，最好通过 stripeSubscriptionId 查库
                    await c.var.db.update(user)
                        .set({
                            stripeCurrentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
                        })
                        .where(eq(user.stripeSubscriptionId, subscriptionId));

                    break;
                }

                // C. 订阅取消或支付失败
                case 'customer.subscription.deleted': // 订阅被完全删除
                case 'invoice.payment_failed': // 扣款失败
                    const subscriptionId = session.subscription;

                    await c.var.db.update(user)
                        .set({
                            plan: 'free', // 降级回免费
                            stripeCurrentPeriodEnd: null
                        })
                        .where(eq(user.stripeSubscriptionId, subscriptionId));

                    console.log(`Subscription ${subscriptionId} ended/failed`);
                    break;
            }
        } catch (error) {
            console.error('Error handling webhook event:', error);
            return c.text('Internal Server Error', 500);
        }

        return c.text('OK', 200);
    });

export default app;