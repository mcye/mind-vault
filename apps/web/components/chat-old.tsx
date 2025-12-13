'use client'



import { useChat } from '@ai-sdk/react' // v5+ 正确导入

import { useState, useEffect, useRef } from 'react'

import { Send, Bot, User, Loader2, Copy, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'

import { ScrollArea } from '@/components/ui/scroll-area'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { Card } from '@/components/ui/card'

import { toast } from 'sonner' // 可选，shadcn toast

import { DefaultChatTransport } from "ai";



const API_URL = process.env.NEXT_PUBLIC_API_URL



interface ChatInterfaceProps {
    id?: string // 当前会话 ID
    initialMessages?: any[] // 历史记录
}

export function ChatInterface({ id, initialMessages = [] }: ChatInterfaceProps) {

    // v5: 用 useState 自己管理 input（Hook 不管了）

    const [input, setInput] = useState('')



    // v5: api 是顶层参数，不是对象

    const {

        messages, // UIMessage[]，结构变了：用 parts 访问内容

        status, // 'ready' | 'submitted' | 'streaming' | 'error'

        sendMessage, // 发送消息的核心方法

        regenerate, // 重新生成（替换 reload）

        error, // 错误对象

        stop, // 停止流式

        setMessages, // 手动更新消息

    } = useChat({

        transport: new DefaultChatTransport({

            api: `${API_URL}/chat`,

        }),

        onError: (err) => toast.error('聊天出错：' + err.message),

        onFinish: ({ message }) => console.log('AI 回复完成：', message),

    })



    // isLoading 替换：用 status 判断

    const isLoading = status === 'submitted' || status === 'streaming'



    const messagesEndRef = useRef<HTMLDivElement>(null)



    // 自动滚动

    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

    }, [messages, status])



    // 提交表单（替换 handleSubmit）

    const handleSubmit = (e: React.FormEvent) => {

        e.preventDefault()

        if (!input.trim() || isLoading) return



        // v5: 用 sendMessage 发送文本，支持流式

        sendMessage({ text: input })

        setInput('') // 清空输入

    }



    // 输入变化（替换 handleInputChange）

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        setInput(e.target.value)

    }



    // 复制消息

    const copyToClipboard = async (text: string) => {

        await navigator.clipboard.writeText(text)

        toast.success('已复制')

    }



    // 提取消息内容（v5: UIMessage 用 parts，非 content）

    const getMessageText = (msg: any) => { // any 临时绕过，生产用 UIMessage 类型

        return msg.parts?.map((p: any) => p.text || p.text || '').filter(Boolean).join('') || ''

    }



    return (

        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto p-4 gap-4">

            {/* 标题 */}

            <div className="text-center">

                <h1 className="text-3xl font-bold tracking-tight">AI 知识库助手</h1>

                <p className="text-muted-foreground mt-2">基于 Llama-3-8B + RAG（你的文档）</p>

            </div>



            {/* 消息区 */}

            <Card className="flex-1 overflow-hidden bg-muted/30">

                <ScrollArea className="h-full p-6">

                    {messages.length === 0 && (

                        <div className="text-center mt-32 text-muted-foreground">

                            <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />

                            <p className="text-lg">开始聊天吧～</p>

                            <p className="text-sm mt-2">试问：“文档总结是什么？”</p>

                        </div>

                    )}



                    <div className="space-y-6">

                        {messages.map((m) => (

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

                                    {/* v5: 用 getMessageText 提取 parts */}

                                    <div className="whitespace-pre-wrap text-sm leading-relaxed">

                                        {getMessageText(m)}

                                    </div>



                                    {/* Assistant 消息的按钮 */}

                                    {m.role === 'assistant' && (

                                        <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(getMessageText(m))}>

                                                <Copy className="w-3.5 h-3.5" />

                                            </Button>

                                            <Button size="sm" variant="ghost" onClick={() => regenerate()} disabled={isLoading}>

                                                <RefreshCw className="w-3.5 h-3.5" />

                                            </Button>

                                            {isLoading && (

                                                <Button size="sm" variant="ghost" onClick={stop}>

                                                    停止

                                                </Button>

                                            )}

                                        </div>

                                    )}

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



                        {/* Loading 状态 */}

                        {status === 'submitted' && (

                            <div className="flex gap-4 justify-start">

                                <Avatar className="shrink-0">

                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">

                                        <Bot size={20} />

                                    </AvatarFallback>

                                </Avatar>

                                <div className="bg-background border rounded-2xl px-5 py-3 shadow-sm">

                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">

                                        <Loader2 className="w-4 h-4 animate-spin" />

                                        <span>思考中...</span>

                                    </div>

                                </div>

                            </div>

                        )}

                        <div ref={messagesEndRef} />

                    </div>

                </ScrollArea>

            </Card>



            {/* 输入表单：v5 新写法 */}

            <form onSubmit={handleSubmit} className="flex gap-3 bg-background p-4 rounded-2xl border shadow-lg">

                <Input

                    value={input}

                    onChange={handleInputChange}

                    placeholder="问我关于文档的问题..."

                    className="flex-1 text-base"

                    disabled={isLoading}

                    autoFocus

                />

                <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-xl">

                    <Send className="w-5 h-5" />

                </Button>

            </form>



            {/* 错误显示 */}

            {error && <p className="text-red-500 text-center">错误：{error.message}</p>}

        </div>

    )

}