import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { documents } from '@repo/shared'
import { desc, eq } from 'drizzle-orm'
import { createDb } from '../db'
import { processDocument } from '../lib/rag'
import { authMiddleware } from '../middleware/auth'
import { QuotaManager } from '../lib/quota'

// 定义绑定类型 (根据你的实际情况调整)
type Bindings = {
  DATABASE_URL: string
  DATABASE_AUTH_TOKEN: string
  AI: any // Cloudflare Workers AI Binding
  UPSTASH_VECTOR_REST_URL: string
  UPSTASH_VECTOR_REST_TOKEN: string
}

type Variables = {
  db: ReturnType<typeof createDb>
}

// 2. 创建文档记录
const createDocumentSchema = z.object({
  title: z.string(),
  storageKey: z.string(),
  size: z.number(),
  mimeType: z.string().optional(),
  url: z.string(),
})

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .use('*', authMiddleware)

  // 1. 获取文档列表
  .get('/', async (c) => {
    const user = c.get('user');
    const userId = user.id;

    const docs = await c.var.db.query.documents.findMany({
      where: eq(documents.userId, userId),
      orderBy: [desc(documents.createdAt)],
    })

    return c.json(docs)
  })
  .post('/', zValidator('json', createDocumentSchema), async (c) => {
    const body = c.req.valid('json')
    const userId = c.get('user')?.id
    const newId = crypto.randomUUID() // 手动生成 ID 方便后续使用

    const [newDoc] = await c.var.db.insert(documents).values({
      id: newId,
      userId: userId,
      title: body.title,
      storageKey: body.storageKey,
      size: body.size,
      mimeType: body.mimeType,
      url: body.url,
      status: 'pending',
    }).returning()

    // 核心变更：触发后台异步任务
    // c.executionCtx.waitUntil 告诉 Workers runtime：
    // "即使我已经给前端返回了 response，不要杀掉这个 Worker，等这个 Promise 跑完"
    c.executionCtx.waitUntil(
      processDocument({
        documentId: newId,
        storageKey: body.storageKey,
        mimeType: body.mimeType || 'text/plain',
        env: c.env,
        db: c.var.db
      })
    )

    return c.json(newDoc)
  })

export default app