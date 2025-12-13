import { Index } from "@upstash/vector/cloudflare"
import { Ai } from '@cloudflare/ai'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { documents } from "@repo/shared"
import { eq } from "drizzle-orm"
import { parsePdf } from "./pdf"
import { splitText } from "./splitter"

// 定义入参类型
interface ProcessDocumentParams {
  documentId: string
  storageKey: string
  mimeType: string
  env: any // Cloudflare Env
  db: any  // Drizzle DB Instance
}

export async function processDocument({ documentId, storageKey, mimeType, env, db }: ProcessDocumentParams) {
  console.log(`[RAG] Processing ${mimeType}: ${documentId}`)

  try {
    // 1. Update Status -> Processing (不变)
    await db.update(documents)
      .set({ status: 'processing' })
      .where(eq(documents.id, documentId))

    // 2. Download from R2
    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    })
    
    const fileData = await S3.send(new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: storageKey
    }))

    // 3. 核心变更：根据类型解析文本
    let cleanText = ''
    
    if (mimeType === 'application/pdf') {
      // 必须先获取 ArrayBuffer
      const fileBuffer = await fileData.Body?.transformToByteArray()
      if (!fileBuffer) throw new Error("PDF body is empty")
      
      console.log(`[RAG] Parsing PDF content...`)
      cleanText = await parsePdf(fileBuffer)
      
    } else {
      // 默认当作纯文本/Markdown
      cleanText = await fileData.Body?.transformToString() || ''
    }

    if (!cleanText.trim()) {
        throw new Error("Extracted text is empty")
    }

    // 4. Chunking (不变)
    const chunks = await splitText(cleanText)
    console.log(`[RAG] Generated ${chunks.length} chunks from ${mimeType}`)

    // 5. Embeddings & Upstash (不变)
    // ... 这里代码保持原样 ...
    
    // 重新贴一下核心部分以确保你不会删错：
    const ai = new Ai(env.AI)
    const embeddingsResult = await ai.run('@cf/baai/bge-base-en-v1.5', { text: chunks }) as { data: number[][] }
    const vectors = embeddingsResult.data

    const index = new Index({
      url: env.UPSTASH_VECTOR_REST_URL,
      token: env.UPSTASH_VECTOR_REST_TOKEN,
    })

    const vectorRecords = chunks.map((chunk, i) => ({
      id: `${documentId}_${i}`,
      vector: vectors[i],
      metadata: {
        documentId,
        text: chunk,
        page: mimeType === 'application/pdf' ? i + 1 : 1 // 简化处理，实际上 PDF 需要在 parse 时保留页码映射
      }
    }))

    await index.upsert(vectorRecords)

    // 6. Success Status (不变)
    await db.update(documents)
      .set({ status: 'indexed', updatedAt: new Date() })
      .where(eq(documents.id, documentId))
      
    console.log(`[RAG] Success: ${documentId}`)

  } catch (error) {
    // Error handling (不变)
    console.error(`[RAG] Error:`, error)
    await db.update(documents)
      .set({ status: 'failed' })
      .where(eq(documents.id, documentId))
  }
}