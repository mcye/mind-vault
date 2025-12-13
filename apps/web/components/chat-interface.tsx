'use client'

import { useChat } from '@ai-sdk/react'
import { useRef, useState, useEffect } from "react"
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { DefaultChatTransport } from "ai"
import { usePathname, useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface ChatInterfaceProps {
    historyChatId?: string // 当前会话 ID
    initialMessages?: any[] // 历史记录
}

export function ChatInterface({ historyChatId, initialMessages = [] }: ChatInterfaceProps) {
    const [input, setInput] = useState('')
    const pathname = usePathname()
    const router = useRouter()

    const {
        id,
        messages,
        status,
        sendMessage,
        stop,
        setMessages,
    } = useChat({
        transport: new DefaultChatTransport({
            api: `${API_URL}/chat`,
            // @ts-ignore: Custom fetch to support credentials
            fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
        }),
        onError: (err) => {
            if (err.message.includes('403')) {
                toast.warning('您已达到本月免费消息限额，请升级 Pro 解锁更多额度。', {
                    duration: 5000,
                });
            } else {
                toast.error('聊天出错：' + err.message);
            }
        },
        onFinish: (data) => {
            console.log('【ChatInterface】onFinish', data)
            // 如果是新会话，更新 URL 并通知 Sidebar
            if (id && data.messages.length === 2) {
                window.history.pushState({ id: id }, '', `/dashboard/chat/${id}`)
                // router.replace(`/dashboard/chat/${id}`, { scroll: false });
            }
        },
    }) as any

    // 手动同步历史记录
    useEffect(() => {
        if (initialMessages && initialMessages.length > 0) {
            setMessages(initialMessages)
        }
    }, [initialMessages, setMessages])

    const isLoading = status === 'submitted'
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, status])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        // 使用 sendMessage 发送
        sendMessage({ content: input })
        setInput('')
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value)
    }

    const getMessageText = (msg: any) => {
        if (typeof msg.content === 'string') return msg.content
        return msg.parts?.map((p: any) => p.text).join('') || ''
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight">AI 知识库助手</h1>
                <p className="text-muted-foreground mt-2">基于 Llama-3-8B + RAG（你的文档）</p>
            </div>
            <Card className="flex-1 overflow-hidden bg-muted/30">
                <ScrollArea className="h-full p-6">
                    {messages.length === 0 && (
                        <div className="text-center mt-32 text-muted-foreground">
                            <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">开始一个新的话题</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {messages.map((m: any) => (
                            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.role === 'assistant' && (
                                    <Avatar className="shrink-0">
                                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                            <Bot size={20} />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`group relative max-w-2xl rounded-2xl px-5 py-3 shadow-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'
                                    }`}>
                                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {getMessageText(m)}
                                    </div>
                                </div>
                                {m.role === 'user' && (
                                    <Avatar className="shrink-0">
                                        <AvatarFallback className="bg-secondary">
                                            <User size={20} />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4 justify-start">
                                <Avatar className="shrink-0">
                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                        <Bot size={20} />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="bg-background border rounded-2xl px-5 py-3 shadow-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </Card>

            <form onSubmit={handleSubmit} className="flex gap-3 bg-background p-4 rounded-2xl border shadow-lg">
                <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="问点什么..."
                    className="flex-1 text-base"
                    disabled={isLoading}
                    autoFocus
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-xl">
                    <Send className="w-5 h-5" />
                </Button>
            </form>
        </div>
    )
}