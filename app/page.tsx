"use client"

import React from "react"
import { useAuth, KnowledgeBaseDashboard, ApiConfigError } from "@/components"
import { AuthPage } from "./auth-page"
import { Loader2 } from "lucide-react"

// API URL 配置檢查
const checkApiConfig = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return true
  }
  
  // 在生產環境中檢查
  if (typeof window !== 'undefined' && 
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1') {
    return false
  }
  
  return true // 本地開發環境允許
}

export default function HomePage() {
  const { user, isLoading } = useAuth()

  // 檢查 API 配置
  const apiConfigured = checkApiConfig()

  // 如果 API 未配置，顯示配置錯誤頁面
  if (!apiConfigured) {
    return <ApiConfigError />
  }

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
