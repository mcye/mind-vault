import { Hono } from 'hono'
import { Ai } from '@cloudflare/ai'
import { createWorkersAI } from 'workers-ai-provider'
import { convertToModelMessages, streamText } from 'ai'
import { Index } from '@upstash/vector'
import { createDb } from '../db'
import { chats, messages as messagesTable } from '@repo/shared'
import { eq, desc } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { QuotaManager } from '../lib/quota'

type Bindings = {
  AI: any
  UPSTASH_VECTOR_REST_URL: string
  UPSTASH_VECTOR_REST_TOKEN: string
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
}

type Variables = {
  db: ReturnType<typeof createDb>
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()
  .use('*', authMiddleware) // 保护所有路由

  // ---------------------------------------------------------
  // 1. 获取会话历史列表 (Sidebar 用)
  // ---------------------------------------------------------
  .get('/history', async (c) => {
    const user = c.get('user');
    const userId = user.id;

    const list = await c.var.db.query.chats.findMany({
      where: eq(chats.userId, userId),
      orderBy: [desc(chats.createdAt)],
      limit: 50
    })
    return c.json(list)
  })

  // ---------------------------------------------------------
  // 2. 加载单条会话详情 (刷新页面/点击历史用)
  // ---------------------------------------------------------
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const msgs = await c.var.db.query.messages.findMany({
      where: eq(messagesTable.chatId, id),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    })
    return c.json(msgs)
  })

  // ---------------------------------------------------------
  // 3. 核心对话接口 (RAG + 持久化)
  // ---------------------------------------------------------
  .post('/', async (c) => {
    // 从请求体获取 chatId (如果是新会话则为 undefined)
    const { messages = [], id } = await c.req.json() as { messages: any[], id: string }

    const userId = c.get('user')?.id

    const quota = new QuotaManager(c.env, c.var.db);

    // 1. 检查配额
    const allowed = await quota.checkMessageLimit(userId);
    if (!allowed) {
      return c.json({ error: "Message limit reached. Please upgrade to Pro.", status: 403 }, 403);
    }

    // 提取第一条消息的前20个字作为标题
    // 我们从 messages 数组里找最后一条作为用户输入，但标题用第一条更好
    const lastMsg = messages[messages.length - 1]

    messages.map(msg => {
      if (typeof msg.content === 'string') {
        msg.content = msg.content
      } else {
        msg.content = msg.parts?.[0]?.text || ''
      }
      return msg
    })

    // 如果是新会话，创建一个新会话
    if (messages.length === 1) {
      const title = lastMsg.content.slice(0, 30) || 'New Conversation'
      await c.var.db.insert(chats).values({
        id: id,
        userId,
        title,
        createdAt: new Date(),
      })
    }

    // --- RAG 逻辑 (保持不变) ---
    const content = messages[messages.length - 1].content

    if (!content) return c.json({ error: 'Empty query' }, 400)

    // 向量搜索
    const ai = new Ai(c.env.AI)
    const embeddingResult = await ai.run('@cf/baai/bge-base-en-v1.5', { text: [content] }) as { data: number[][] }

    const index = new Index({
      url: c.env.UPSTASH_VECTOR_REST_URL,
      token: c.env.UPSTASH_VECTOR_REST_TOKEN,
      cache: false,
    })

    const ragResult = await index.query({
      vector: embeddingResult.data[0],
      topK: 4,
      includeMetadata: true,
    })

    const context = ragResult.map(r => r.metadata?.text || '').join('\n\n---\n\n')

    const systemText = `
    你是Mind Vault，一位智能的知识助手。
    请根据以下背景信息，用中文回答用户的问题。
    如果答案不在背景信息中，基于所提供的文档，请礼貌地表示不知道。
    
    背景信息:
    ${context}
    `

    // --- AI 生成 & 持久化 ---
    const workersAI = createWorkersAI({ binding: c.env.AI })

    const result = await streamText({
      model: workersAI('@cf/meta/llama-3-8b-instruct'),
      system: systemText,
      messages: messages,
      // 关键：流结束后的回调，用于存数据库
      onFinish: async (event) => {
        const responseText = event.text
        const now = new Date()

        // 注意：Cloudflare Workers 的执行上下文在响应返回后可能会关闭
        // 使用 c.executionCtx.waitUntil 确保数据库写入能完成
        c.executionCtx.waitUntil((async () => {
          // 1. 保存用户提问
          await c.var.db.insert(messagesTable).values({
            id: crypto.randomUUID(),
            chatId: id,
            role: 'user',
            content: content,
            createdAt: now
          })

          // 2. 保存 AI 回答
          await c.var.db.insert(messagesTable).values({
            id: crypto.randomUUID(),
            chatId: id,
            role: 'assistant',
            content: responseText,
            createdAt: new Date(now.getTime() + 1000) // +1秒确保排序在后
          })
        })())
      }
    })

    // 返回流
    const response = result.toUIMessageStreamResponse()

    // 注意：最好在 AI 响应完成后再扣除，或者在此处预扣
    await quota.incrementMessageCount(userId);
    return response
  })

export default app