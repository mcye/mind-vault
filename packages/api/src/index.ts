import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'

// 初始化 Hono 应用
const app = new Hono<{
  Bindings: {
    DATABASE_URL: string
    DATABASE_AUTH_TOKEN: string
    // 未来在这里添加 R2, AI 等绑定
  }
}>()

// 1. 中间件层
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000'], // 本地开发允许 Next.js 访问
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}))

// 2. 路由定义 (示例: 健康检查)
const routes = app
  .get('/health', (c) => {
    return c.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'mind-vault' 
    })
  })
  // 模拟一个受保护的路由，稍后会结合 Better-Auth
  .get('/me', (c) => {
    // 模拟鉴权逻辑
    const user = { id: 'user_123', plan: 'pro' }
    if (!user) {
        throw new HTTPException(401, { message: "Unauthorized" })
    }
    return c.json({ user })
  })

// 3. 错误处理闭环
app.onError((err, c) => {
  console.error(`${err}`);
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app

// 4. 导出 AppType 类型，供前端使用
// 注意：这里只导出类型，不导出代码，不会增加前端 bundle 体积
export type AppType = typeof routes