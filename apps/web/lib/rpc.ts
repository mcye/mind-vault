import { hc } from 'hono/client'
import { ClientResponse } from 'hono/client'
import type { AppType } from '@repo/api/src/index'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export const client = hc<AppType>(API_URL, {
  headers: {
    'Content-Type': 'application/json', // 默认 JSON
  },
  init: {
    credentials: 'include', // 👈 关键：允许跨域携带 Cookie
  }
})

/**
 * 通用 Fetcher Wrapper
 * 作用：拦截 Hono RPC 的响应，如果 status 不是 2xx，则抛出错误，
 * 让 React Query 能捕获到 Error 并触发全局 onError。
 */
export async function apiFetch<T>(
  request: Promise<ClientResponse<T>>
): Promise<T> {
  const res = await request
  if (!res.ok) {
    // 尝试解析后端抛出的 HTTPException JSON
    let errorMessage = 'Unknown Error'
    try {
      const text = await res.text()
      try {
        const errorData = JSON.parse(text) as { message?: string, error?: string }
        errorMessage = errorData.message || errorData.error || res.statusText
      } catch {
        // 如果不是 JSON，直接使用文本内容
        errorMessage = text || res.statusText
      }
    } catch {
      errorMessage = res.statusText
    }
    // 抛出错误，触发 React Query 的 onError
    throw new Error(errorMessage)
  }
  // 成功，返回解析后的 JSON 数据
  return res.json() as Promise<T>
}