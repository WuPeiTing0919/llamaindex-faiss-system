import type { Metadata } from 'next'
import './globals.css'
import { ViewportProvider } from '@/components/ui/viewport-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth/auth-context'

export const metadata: Metadata = {
  title: '企業知識庫系統',
  description: '使用 LlamaIndex 和 FAISS 構建的企業級知識檢索系統',
  generator: 'Next.js',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <ViewportProvider>
              {children}
            </ViewportProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
