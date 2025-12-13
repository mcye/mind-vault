"use client"

import { ChatInterface } from '@/components/chat-interface'
import { use } from 'react'

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    console.log('【page】页面的id', id)
    return (
        <div className="h-[calc(100vh-4rem)] p-4 max-w-5xl mx-auto">
            <ChatInterface key={id} />
        </div>
    )
}