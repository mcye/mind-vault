import { HTTPException } from 'hono/http-exception'
import { Hono } from 'hono';
import { createDb } from './db';
import { cors } from 'hono/cors';
import uploads from './routes/upload';
import documents from './routes/documents';
import chat from './routes/chat';
import { createAuth } from './lib/auth';
import webhookRouter from './routes/webhook';
import pay from './routes/pay';

// 定义绑定类型
type Bindings = {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
};

// 将 DB 注入到 Hono 的 Context 变量中
type Variables = {
  db: ReturnType<typeof createDb>;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 配置 CORS (非常重要，否则前端 fetch 会跨域失败)
app.use('/*', cors({
  origin: [
    'http://localhost:3000',
    'https://hypervigilant-monnie-supratemporal.ngrok-free.dev',
    'https://mind-vault-lyart.vercel.app'], // 允许前端地址
  allowHeaders: ['Content-Type', 'Authorization'], // 👈 加上 better-auth 可能用到的 header
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'Set-Cookie'], // 👈 增加 exposeHeaders
  maxAge: 600,
  credentials: true, // 允许携带 Cookiehttps://mind-vault-web.vercel.app/
}))

// 中间件：初始化 DB 并注入 Context
app.use('*', async (c, next) => {
  const db = createDb(c.env.TURSO_DATABASE_URL, c.env.TURSO_AUTH_TOKEN);
  c.set('db', db);
  await next();
});

app.route('/api/webhook', webhookRouter);

// 挂载 Better Auth 路由
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  console.log(`[Auth Debug] Method: ${c.req.method}, Path: ${c.req.path}`);
  const auth = createAuth(c);
  return auth.handler(c.req.raw);
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({
      error: err.message,
    }, err.status);
  }
  return c.json({
    error: 'Internal Server Error',
  }, 500);
});

const routes = app
  .get('/health', (c) => c.json({ status: 'ok' }))
  .route('/uploads', uploads) // 挂载 /uploads 路由
  .route('/documents', documents)
  .route('/chat', chat)
  .route('/pay', pay)

export default app;
export type AppType = typeof routes;