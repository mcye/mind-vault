import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ThemeProvider } from "@/components/theme-provider" // 导入

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mind Vault',
  description: 'AI Knowledge Base',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // 添加 suppressHydrationWarning 避免 hydration 报错
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}