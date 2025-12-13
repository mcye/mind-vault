"use client"

import { ChatInterface } from '@/components/chat-interface'
import { apiFetch, client } from '@/lib/rpc'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { use } from 'react'

export default function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params) // 3. 使用 use 解包
    console.log('【id】页面的id', id)
    const { data: messages, isLoading } = useQuery({
        queryKey: ['chat', id],
        queryFn: () => apiFetch(client.chat[':id'].$get({ param: { id: id } }))
    })

    if (isLoading) {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-4rem)] p-4 max-w-5xl mx-auto">
            <ChatInterface historyChatId={id} initialMessages={messages || []} />
        </div>
    )
}
