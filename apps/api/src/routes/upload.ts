import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { QuotaManager } from '../lib/quota'
import { createDb } from '../db'
import { authMiddleware } from '../middleware/auth'

// 验证请求体
const uploadSchema = z.object({
  size: z.number(),
  filename: z.string(),
  contentType: z.string(),
})

type Bindings = {
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
}

type Variables = {
  db: ReturnType<typeof createDb>
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()
  .use('*', authMiddleware)
  .post('/presign', zValidator('json', uploadSchema), async (c) => {
    const { filename, contentType, size } = c.req.valid('json')
    const env = c.env
    const userId = c.get('user')?.id

    // 1. 检查总配额
    const quota = new QuotaManager(c.env, c.var.db);
    const allowed = await quota.checkStorageLimit(userId!, size);

    if (!allowed) {
      throw new HTTPException(403, {
        message: "Storage limit exceeded (50MB). Please upgrade or delete old files."
      })
    }

    // 初始化 S3 Client (R2 兼容)
    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    })

    // 生成唯一文件 Key (避免文件名冲突)
    // 格式: uploads/{timestamp}-{random}-{filename}
    const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${filename}`

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    // 生成有效期 10 分钟的上传链接
    const url = await getSignedUrl(S3, command, { expiresIn: 600 })

    return c.json({
      url,
      key, // 把 Key 返回给前端，前端上传成功后需要把这个 Key 存到数据库
    })
  })

export default app