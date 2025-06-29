"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Cpu, 
  Database, 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Server,
  Zap,
  BarChart3,
  Clock,
  HardDrive,
  Wifi,
  AlertTriangle
} from "lucide-react"
import { useAuth } from '@/components/auth/auth-context'

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

interface SystemInfo {
  api_status: 'connected' | 'disconnected' | 'error'
  model_name: string
  embedding_model: string
  response_time: number
  documents_count: number
  index_size: number
  memory_usage: string
  cpu_usage: string
  uptime: string
}

export const SystemSettings: React.FC = () => {
  const { token } = useAuth()
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  // 檢查系統狀態
  const checkSystemStatus = async () => {
    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      // 檢查 API 健康狀態
      const healthResponse = await fetch(`${API_BASE_URL}/health`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      
      const responseTime = Date.now() - startTime
      
      if (!healthResponse.ok) {
        throw new Error('API 連接失敗')
      }
      
      // 獲取系統狀態
      const statusResponse = await fetch(`${API_BASE_URL}/status`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      
      if (!statusResponse.ok) {
        throw new Error('無法獲取系統狀態')
      }
      
      const statusData = await statusResponse.json()
      
      setSystemInfo({
        api_status: 'connected',
        model_name: 'DeepSeek Chat',
        embedding_model: 'BAAI/bge-base-zh',
        response_time: responseTime,
        documents_count: statusData.documents_count || 0,
        index_size: statusData.index_size || 0,
        memory_usage: statusData.memory_usage || 'N/A',
        cpu_usage: statusData.cpu_usage || 'N/A',
        uptime: calculateUptime()
      })
      
      setLastChecked(new Date())
      
    } catch (error) {
      console.error('系統狀態檢查失敗:', error)
      setSystemInfo({
        api_status: 'error',
        model_name: 'DeepSeek Chat',
        embedding_model: 'BAAI/bge-base-zh',
        response_time: Date.now() - startTime,
        documents_count: 0,
        index_size: 0,
        memory_usage: 'N/A',
        cpu_usage: 'N/A',
        uptime: 'N/A'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 計算運行時間（模擬）
  const calculateUptime = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    return `${hours}h ${minutes}m`
  }

  // 組件載入時檢查狀態
  useEffect(() => {
    checkSystemStatus()
  }, [token])

  // 格式化數字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-TW').format(num)
  }

  // 獲取狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600'
      case 'disconnected': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  // 獲取狀態圖標
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />
      case 'disconnected': return <AlertTriangle className="h-4 w-4" />
      case 'error': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            系統設定與監控
          </CardTitle>
          <CardDescription>
            查看系統狀態、AI 模型配置和性能監控
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 系統狀態概覽 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              系統狀態
            </CardTitle>
            <CardDescription>
              {lastChecked ? `最後更新: ${lastChecked.toLocaleTimeString('zh-TW')}` : '正在載入...'}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkSystemStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新狀態
          </Button>
        </CardHeader>
        <CardContent>
          {systemInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* API 連接狀態 */}
              <div className="flex items-center space-x-3">
                <div className={`${getStatusColor(systemInfo.api_status)}`}>
                  {getStatusIcon(systemInfo.api_status)}
                </div>
                <div>
                  <div className="font-medium">API 連接</div>
                  <div className="text-sm text-muted-foreground">
                    {systemInfo.api_status === 'connected' ? '正常' : '異常'}
                  </div>
                </div>
              </div>

              {/* 響應時間 */}
              <div className="flex items-center space-x-3">
                <Zap className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium">響應時間</div>
                  <div className="text-sm text-muted-foreground">
                    {systemInfo.response_time}ms
                  </div>
                </div>
              </div>

              {/* 文檔數量 */}
              <div className="flex items-center space-x-3">
                <Database className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="font-medium">文檔數量</div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(systemInfo.documents_count)}
                  </div>
                </div>
              </div>

              {/* 索引大小 */}
              <div className="flex items-center space-x-3">
                <HardDrive className="w-4 h-4 text-orange-600" />
                <div>
                  <div className="font-medium">索引大小</div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(systemInfo.index_size)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>正在載入系統狀態...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI 模型配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cpu className="w-5 h-5 mr-2" />
            AI 模型配置
          </CardTitle>
          <CardDescription>
            當前使用的 AI 模型和配置信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 語言模型 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">語言模型 (LLM)</span>
                <Badge variant="default">DeepSeek</Badge>
              </div>
              <div className="pl-4 space-y-2 text-sm text-muted-foreground">
                <div>模型: {systemInfo?.model_name || 'DeepSeek Chat'}</div>
                <div>版本: 最新版</div>
                <div>狀態: 
                  <span className="text-green-600 ml-1">運行中</span>
                </div>
              </div>
            </div>

            {/* 嵌入模型 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">嵌入模型</span>
                <Badge variant="secondary">BGE</Badge>
              </div>
              <div className="pl-4 space-y-2 text-sm text-muted-foreground">
                <div>模型: {systemInfo?.embedding_model || 'BAAI/bge-base-zh'}</div>
                <div>語言: 中文優化</div>
                <div>狀態: 
                  <span className="text-green-600 ml-1">運行中</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 系統性能指標 */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              性能指標
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">記憶體使用</div>
                <div className="text-lg font-semibold">
                  {systemInfo?.memory_usage || 'N/A'}
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">CPU 使用率</div>
                <div className="text-lg font-semibold">
                  {systemInfo?.cpu_usage || 'N/A'}
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">運行時間</div>
                <div className="text-lg font-semibold">
                  {systemInfo?.uptime || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 連接設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="w-5 h-5 mr-2" />
            連接設定
          </CardTitle>
          <CardDescription>
            後端 API 服務器連接配置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <span className="font-medium">後端 API URL:</span>
              <code className="ml-2 px-2 py-1 bg-muted rounded text-sm">
                {API_BASE_URL}
              </code>
            </div>
            <div>
              <span className="font-medium">前端 URL:</span>
              <code className="ml-2 px-2 py-1 bg-muted rounded text-sm">
                {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}
              </code>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">網路狀態:</span>
              <div className="flex items-center space-x-1">
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">已連接</span>
              </div>
            </div>
          </div>

          {systemInfo?.api_status === 'error' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                無法連接到後端 API 服務器。請檢查服務器是否正在運行，或聯繫系統管理員。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 