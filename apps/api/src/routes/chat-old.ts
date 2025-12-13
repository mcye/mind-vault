import { Hono } from 'hono'
import { Ai } from '@cloudflare/ai'
import { createWorkersAI } from 'workers-ai-provider'
import { convertToModelMessages, streamText } from 'ai'
import { Index } from '@upstash/vector'

type Bindings = {
    AI: any
    UPSTASH_VECTOR_REST_URL: string
    UPSTASH_VECTOR_REST_TOKEN: string
}

const app = new Hono<{ Bindings: Bindings }>()
    .post('/', async (c) => {
        const { messages } = await c.req.json()
        console.log('messages', JSON.stringify(messages))

        const modelMessages = convertToModelMessages(messages)

        // 3. 获取用户最新的一条问题
        const lastUserMessage = modelMessages[modelMessages.length - 1]

        // 4. 提取用户问题
        const content = lastUserMessage.content
        const userQuery = typeof content === 'string'
            ? content
            : content
                .filter((part) => part.type === 'text')
                .map((part) => (part as any).text)
                .join('\n')

        if (!userQuery) {
            return c.json({ error: 'Empty query' }, 400)
        }

        // 1. 用 Cloudflare AI 生成查询向量（关键修复！）
        const ai = new Ai(c.env.AI)
        const embeddingResult = await ai.run('@cf/baai/bge-base-en-v1.5', {
            text: [userQuery] // 输入文本数组
        }) as { data: number[][] } // 返回向量数组

        const queryVector = embeddingResult.data[0] // 取第一个向量（1536 维或你的维度）

        // 2. Upstash 查询（用 vector，非 data）
        const index = new Index({
            url: c.env.UPSTASH_VECTOR_REST_URL,
            token: c.env.UPSTASH_VECTOR_REST_TOKEN,
            cache: false, // Cloudflare Workers 中必须 false
        })

        const ragResult = await index.query({
            vector: queryVector, // ← 修复：传向量数组，非 data 字符串
            topK: 4,
            includeMetadata: true,
            includeData: true // 可选：返回原始数据
        })

        // 3. 构建上下文
        const context = ragResult
            .map(r => r.metadata?.text || r.data || '')
            .filter(Boolean)
            .join('\n\n---\n\n')

        // 2. 关键：用官方出品的 workers-ai-provider 一键包装
        const workersAI = createWorkersAI({ binding: c.env.AI })

        const systemText = `
            你是Mind Vault，一位智能的知识助手。
            请根据以下背景信息，用中文回答用户的问题。
            如果答案不在背景信息中，基于所提供的文档，请礼貌地表示不知道。

            背景信息:
            ${context}
        `

        // 3. 直接用 streamText，一行代码搞定流式 + 类型安全 + 前端完美兼容
        const result = await streamText({
            model: workersAI('@cf/meta/llama-3-8b-instruct'), // 想用 8b 就改成 8b
            system: systemText,
            messages: modelMessages,
        })

        // 4. 一行返回，前端 useChat 完美接收
        return result.toUIMessageStreamResponse()
    })

export default app