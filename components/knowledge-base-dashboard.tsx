"use client"

import React, { useState, useEffect, useRef } from "react"
import { Upload, Search, FileText, Database, Cpu, MessageSquare, Loader2, Trash2, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth/auth-context"
import { UserProfile } from "@/components/auth/user-profile"

// API 基礎 URL 設置
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    return `http://${hostname}:8000`
  }
  return 'http://localhost:8000'
}

const API_BASE_URL = getApiBaseUrl()

interface Document {
  id: number
  filename: string
  original_filename: string
  file_size: number
  upload_time: string
}

export const KnowledgeBaseDashboard: React.FC = () => {
  const { user, token, logout } = useAuth()
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Document[]>([])
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [loadingDots, setLoadingDots] = useState("")
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState("query")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 載入用戶文檔和系統狀態
  useEffect(() => {
    if (user && token) {
      checkApiConnection().then((isConnected) => {
        if (isConnected) {
          fetchUserDocuments()
          fetchUserStatus()
        }
      })
    }
  }, [user, token])

  // 檢查API連接狀態
  const checkApiConnection = async (): Promise<boolean> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal,
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      
      clearTimeout(timeoutId)
      const isConnected = response.ok
      setApiConnected(isConnected)
      return isConnected
    } catch (error) {
      console.error("API連接檢查失敗", error)
      setApiConnected(false)
      return false
    }
  }

  // 動畫效果 - 載入中的動畫點
  useEffect(() => {
    if (isLoading || apiConnected === null) {
      const interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev.length >= 3) return ""
          return prev + "."
        })
      }, 400)
      return () => clearInterval(interval)
    }
    return () => {}
  }, [isLoading, apiConnected])

  // 獲取用戶文檔列表
  const fetchUserDocuments = async () => {
    if (!token) return
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${API_BASE_URL}/documents`, {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`API返回錯誤: ${response.status}`)
      }
      
      const data = await response.json()
      setUploadedFiles(data)
    } catch (error: any) {
      console.error("獲取用戶文檔失敗", error)
      setUploadedFiles([])
    }
  }

  // 獲取用戶系統狀態
  const fetchUserStatus = async () => {
    if (!token) return
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${API_BASE_URL}/status`, {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`API返回錯誤: ${response.status}`)
      }
      
      const data = await response.json()
      setSystemStatus(data)
    } catch (error: any) {
      console.error("獲取系統狀態失敗", error)
      setSystemStatus({
        status: "unknown",
        documents_count: 0,
        model_status: "unknown"
      })
    }
  }

  // 處理文件上傳
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !token) return

    setIsLoading(true)
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error(`上傳失敗: ${response.status}`)
        }
      }
      
      // 重新獲取文檔列表
      await fetchUserDocuments()
      await fetchUserStatus()
      
    } catch (error: any) {
      console.error("文件上傳失敗", error)
      alert(`上傳失敗: ${error.message}`)
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 刪除文檔
  const handleDeleteDocument = async (documentId: number) => {
    if (!token) return
    
    if (!confirm('確定要刪除此文檔嗎？')) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`刪除失敗: ${response.status}`)
      }
      
      // 重新獲取文檔列表
      await fetchUserDocuments()
      await fetchUserStatus()
      
    } catch (error: any) {
      console.error("刪除文檔失敗", error)
      alert(`刪除失敗: ${error.message}`)
    }
  }

  // 處理查詢
  const handleQuery = async () => {
    if (!query.trim() || !token) return
    
    setIsLoading(true)
    setResponse("")
    
    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          top_k: 5
        }),
      })
      
      if (!response.ok) {
        throw new Error(`查詢失敗: ${response.status}`)
      }
      
      const data = await response.json()
      setResponse(data.answer)
      
    } catch (error: any) {
      console.error("查詢失敗", error)
      setResponse(`查詢失敗: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW')
  }

  if (!user || !token) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        {/* 頂部導航 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">個人知識庫</h1>
            <p className="text-muted-foreground">
              歡迎回來，{user.full_name || user.username}！
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline">
              <User className="w-3 h-3 mr-1" />
              {user.username}
            </Badge>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              登出
            </Button>
          </div>
        </div>

        {/* 系統狀態 */}
        {systemStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                系統狀態
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {systemStatus.documents_count}
                  </div>
                  <div className="text-sm text-muted-foreground">我的文檔</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {systemStatus.model_status}
                  </div>
                  <div className="text-sm text-muted-foreground">模型狀態</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {systemStatus.status}
                  </div>
                  <div className="text-sm text-muted-foreground">系統狀態</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 主要功能區域 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="query">智能問答</TabsTrigger>
            <TabsTrigger value="upload">文檔管理</TabsTrigger>
            <TabsTrigger value="profile">個人資料</TabsTrigger>
          </TabsList>

          {/* 智能問答 */}
          <TabsContent value="query" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  智能問答
                </CardTitle>
                <CardDescription>
                  基於您上傳的文檔進行智能問答
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="query">問題</Label>
                  <Textarea
                    id="query"
                    placeholder="請輸入您的問題..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  onClick={handleQuery} 
                  disabled={isLoading || !query.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      查詢中{loadingDots}
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      開始查詢
                    </>
                  )}
                </Button>
                
                {response && (
                  <div className="space-y-2">
                    <Label>回答</Label>
                    <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                      {response}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 文檔管理 */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  文檔管理
                </CardTitle>
                <CardDescription>
                  上傳和管理您的個人文檔
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">上傳文檔</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".txt,.md,.pdf,.docx"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    支持 TXT、MD、PDF、DOCX 格式
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>我的文檔 ({uploadedFiles.length})</Label>
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{file.original_filename}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatFileSize(file.file_size)} • {formatDate(file.upload_time)}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDocument(file.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadedFiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>還沒有上傳任何文檔</p>
                    <p className="text-sm">上傳文檔後即可開始智能問答</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 個人資料 */}
          <TabsContent value="profile" className="space-y-4">
            <UserProfile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 