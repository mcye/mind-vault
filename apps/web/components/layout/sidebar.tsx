"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    MessageSquare,
    LayoutDashboard,
    Files,
    Settings,
    Plus,
    Loader2,
    History,
} from "lucide-react"
import { useEffect, useState } from "react"

import { useQuery } from '@tanstack/react-query'
import { apiFetch, client } from '@/lib/rpc'
import { UserMenu } from "../user-menu"
import { useSession } from '@/lib/auth-client'
import { type User } from "@repo/shared"
import { PayButton } from "../pay-button"

export function Sidebar({ className }: any) {
    const pathname = usePathname()
    const { data: history = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['history'],
        queryFn: async () => {
            return await apiFetch(client.chat.history.$get())
        },
    })
    const { data: session } = useSession()
    const user = session?.user as User

    // 1. 全局导航菜单
    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: "Documents",
            icon: Files,
            href: "/dashboard/documents",
            active: pathname.startsWith("/dashboard/documents"),
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/dashboard/settings",
            active: pathname.startsWith("/dashboard/settings"),
        },
    ]

    // 2. 加载历史会话
    useEffect(() => {
        refetch()
    }, [pathname, refetch]) // 路由变化时刷新，确保新建会话后能看到

    const router = useRouter()

    const handleClickNewChat = () => {
        if (pathname !== "/dashboard/chat") {
            console.log("点击了新建会话")
            // router.push(pathname);
            window.location.href = `/dashboard/chat`;
            router.refresh();
        }
    }

    return (
        <div className={cn("pb-4 h-full border-r bg-card flex flex-col", className)}>
            {/* A. 顶部：Logo 与 新建按钮 */}
            <div className="px-3 py-4 border-b">
                <div className="px-4 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">M</span>
                    </div>
                    <h2 className="text-lg font-bold tracking-tight">Mind Vault</h2>
                </div>
                <Button onClick={handleClickNewChat} className="w-full justify-start gap-2 shadow-sm" variant="default">
                    <Plus className="h-4 w-4" /> New Chat
                </Button>
            </div>

            {/* B. 中部：可滚动区域 (包含 导航菜单 + 历史记录) */}
            <ScrollArea className="flex-1 px-3">
                <div className="space-y-6 py-4">

                    {/* 1. 全局导航 */}
                    <div className="px-1 space-y-1">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-muted/50 rounded-lg transition",
                                    route.active ? "bg-muted text-primary font-semibold" : "text-muted-foreground"
                                )}
                            >
                                <route.icon className={cn("h-4 w-4 mr-3", route.active ? "text-primary" : "text-muted-foreground")} />
                                {route.label}
                            </Link>
                        ))}
                    </div>

                    {/* 分割线 */}
                    <div className="h-[1px] bg-border mx-2" />

                    {/* 2. 历史会话 */}
                    <div className="px-1">
                        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground tracking-wider flex items-center gap-2">
                            <History className="w-3 h-3" />
                            RECENT CHATS
                        </h3>

                        {loading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : history.length === 0 ? (
                            <p className="px-2 text-xs text-muted-foreground">No history yet.</p>
                        ) : (
                            <div className="space-y-1">
                                {history.map((chat) => (
                                    <Link
                                        key={chat.id}
                                        href={`/dashboard/chat/${chat.id}`}
                                        className={cn(
                                            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-muted/50 rounded-lg transition truncate",
                                            pathname === `/dashboard/chat/${chat.id}` ? "bg-muted text-primary font-semibold" : "text-muted-foreground"
                                        )}
                                    >
                                        <MessageSquare className="h-4 w-4 mr-3 shrink-0" />
                                        <span className="truncate">{chat.title || "Untitled Chat"}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            {/* 3. 订阅状态 */}
            <PayButton user={user} />

            {/* C. 底部：用户信息 (可选) */}
            <UserMenu />
        </div>
    )
}