"use client"

import React from "react"
import { useAuth } from "@/components/auth/auth-context"
import { AuthPage } from "./auth-page"
import { KnowledgeBaseDashboard } from "@/components/knowledge-base-dashboard"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useAuth()

  // 載入中顯示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  // 如果用戶已登入，顯示知識庫儀表板
  if (user) {
    return <KnowledgeBaseDashboard />
  }

  // 如果用戶未登入，顯示認證頁面
  return <AuthPage />
}
