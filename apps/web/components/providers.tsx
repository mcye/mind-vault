'use client'

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { Toaster, toast } from 'sonner'

declare module '@tanstack/react-query' {
    interface Register {
        defaultError: Error
        mutationMeta: {
            suppressError?: boolean
        }
        queryMeta: {
            suppressError?: boolean
        }
    }
}


export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // 默认数据不过期时间：1分钟
                        staleTime: 60 * 1000,
                        // 失败重试次数：1次 (避免 404 死循环重试)
                        retry: 1,
                        // 窗口聚焦时重新获取
                        refetchOnWindowFocus: false,
                    },
                },
                // 全局 Query 错误拦截
                queryCache: new QueryCache({
                    onError: (error, query) => {
                        if (query?.meta?.suppressError) return
                        toast.error(`Error: ${error.message}`)
                    },
                }),
                // 全局 Mutation 错误拦截 (用于 POST/PUT/DELETE)
                mutationCache: new MutationCache({
                    onError: (error, _variables, _context, mutation) => {
                        if (mutation?.meta?.suppressError) return
                        toast.error(`Action Failed: ${error.message}`)
                    },
                }),
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* 开发工具，生产环境会自动移除 */}
            <ReactQueryDevtools initialIsOpen={false} />
            {/* 全局 Toast 组件 */}
            <Toaster position="top-right" richColors />
        </QueryClientProvider>
    )
}