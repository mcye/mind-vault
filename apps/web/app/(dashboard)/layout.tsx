import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-full relative">
            {/* Desktop Sidebar: 隐藏在移动端 (hidden md:flex) */}
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
                <Sidebar />
            </div>

            {/* Main Content */}
            <main className="md:pl-72 pb-10">
                {/* Mobile Header */}
                <div className="flex items-center p-4 md:hidden border-b mb-4">
                    <MobileSidebar />
                    <span className="ml-4 font-bold text-lg">Mind Vault</span>
                </div>

                {/* 页面内容 */}
                <div className="px-4 md:px-8">
                    {children}
                </div>
            </main>
        </div>
    )
}