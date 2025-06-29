"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
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
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Star,
  Eye,
  EyeOff
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
  response_time: number
  documents_count: number
  index_size: number
  memory_usage: string
  cpu_usage: string
  uptime: string
  current_model: {
    name: string
    provider: string
    model_id: string
    api_key_set: boolean
  }
  embedding_model: {
    name: string
    provider: string
    description: string
  }
}

interface AIModel {
  id: number
  name: string
  provider: string
  model_id: string
  api_base_url?: string
  description?: string
  is_built_in: boolean
  is_active: boolean
  created_at: string
  created_by_username?: string
}

interface UserModelPreference {
  id: number
  model_id: number
  model_name: string
  provider: string
  api_key_set: boolean
  is_default: boolean
  created_at: string
}

interface CreateModelForm {
  name: string
  provider: string
  model_id: string
  api_base_url: string
  description: string
}

export const SystemSettings: React.FC = () => {
  const { token } = useAuth()
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  
  // AI 模型相關狀態
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [userPreferences, setUserPreferences] = useState<UserModelPreference[]>([])
  const [isCreateModelOpen, setIsCreateModelOpen] = useState(false)
  const [isPreferenceDialogOpen, setIsPreferenceDialogOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  
  // 表單狀態
  const [createModelForm, setCreateModelForm] = useState<CreateModelForm>({
    name: '',
    provider: '',
    model_id: '',
    api_base_url: '',
    description: ''
  })
  
  const [preferenceForm, setPreferenceForm] = useState({
    api_key: '',
    is_default: false
  })

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
        response_time: responseTime,
        documents_count: statusData.documents_count || 0,
        index_size: statusData.index_size || 0,
        memory_usage: statusData.memory_usage || 'N/A',
        cpu_usage: statusData.cpu_usage || 'N/A',
        uptime: calculateUptime(),
        current_model: statusData.current_model || {
          name: 'DeepSeek Chat',
          provider: 'deepseek',
          model_id: 'deepseek-chat',
          api_key_set: false
        },
        embedding_model: statusData.embedding_model || {
          name: 'BAAI/bge-base-zh',
          provider: 'huggingface',
          description: '向量化文檔'
        }
      })
      
      setLastChecked(new Date())
      
    } catch (error) {
      console.error('系統狀態檢查失敗:', error)
      setSystemInfo({
        api_status: 'error',
        response_time: Date.now() - startTime,
        documents_count: 0,
        index_size: 0,
        memory_usage: 'N/A',
        cpu_usage: 'N/A',
        uptime: 'N/A',
        current_model: {
          name: 'DeepSeek Chat',
          provider: 'deepseek',
          model_id: 'deepseek-chat',
          api_key_set: false
        },
        embedding_model: {
          name: 'BAAI/bge-base-zh',
          provider: 'huggingface',
          description: '向量化文檔'
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 載入可用模型
  const loadAvailableModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-models`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      
      if (response.ok) {
        const models = await response.json()
        setAvailableModels(models)
      }
    } catch (error) {
      console.error('載入模型失敗:', error)
    }
  }

  // 載入用戶偏好
  const loadUserPreferences = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/model-preferences`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      
      if (response.ok) {
        const preferences = await response.json()
        setUserPreferences(preferences)
      }
    } catch (error) {
      console.error('載入用戶偏好失敗:', error)
    }
  }

  // 創建自定義模型
  const handleCreateModel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-models/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createModelForm)
      })
      
      if (response.ok) {
        setIsCreateModelOpen(false)
        setCreateModelForm({
          name: '',
          provider: '',
          model_id: '',
          api_base_url: '',
          description: ''
        })
        await loadAvailableModels()
      } else {
        alert('創建模型失敗')
      }
    } catch (error) {
      console.error('創建模型失敗:', error)
      alert('創建模型失敗')
    }
  }

  // 刪除自定義模型
  const handleDeleteModel = async (modelId: number) => {
    if (!confirm('確定要刪除這個模型嗎？')) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/ai-models/custom/${modelId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        await loadAvailableModels()
        await loadUserPreferences()
      } else {
        alert('刪除模型失敗')
      }
    } catch (error) {
      console.error('刪除模型失敗:', error)
      alert('刪除模型失敗')
    }
  }

  // 設定模型偏好
  const handleSetPreference = async () => {
    if (!selectedModel) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/model-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: selectedModel.id,
          api_key: preferenceForm.api_key || null,
          is_default: preferenceForm.is_default
        })
      })
      
      if (response.ok) {
        setIsPreferenceDialogOpen(false)
        setPreferenceForm({ api_key: '', is_default: false })
        setSelectedModel(null)
        await loadUserPreferences()
      } else {
        alert('設定偏好失敗')
      }
    } catch (error) {
      console.error('設定偏好失敗:', error)
      alert('設定偏好失敗')
    }
  }

  // 刪除用戶偏好
  const handleDeletePreference = async (modelId: number) => {
    if (!confirm('確定要移除這個模型偏好嗎？')) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/model-preferences/${modelId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        await loadUserPreferences()
      } else {
        alert('移除偏好失敗')
      }
    } catch (error) {
      console.error('移除偏好失敗:', error)
      alert('移除偏好失敗')
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
    if (token) {
      checkSystemStatus()
      loadAvailableModels()
      loadUserPreferences()
    }
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

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">系統狀態</TabsTrigger>
          <TabsTrigger value="models">AI 模型管理</TabsTrigger>
          <TabsTrigger value="preferences">我的模型偏好</TabsTrigger>
        </TabsList>

        {/* 系統狀態頁籤 */}
        <TabsContent value="status" className="space-y-4">
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
                      <p className="text-sm font-medium">API 連接</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {systemInfo.api_status === 'connected' ? '已連接' : 
                         systemInfo.api_status === 'error' ? '連接錯誤' : '未連接'}
                      </p>
                    </div>
                  </div>

                  {/* 響應時間 */}
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">響應時間</p>
                      <p className="text-xs text-muted-foreground">{systemInfo.response_time}ms</p>
                    </div>
                  </div>

                  {/* 文檔數量 */}
                  <div className="flex items-center space-x-3">
                    <Database className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">文檔數量</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(systemInfo.documents_count)}</p>
                    </div>
                  </div>

                  {/* 索引大小 */}
                  <div className="flex items-center space-x-3">
                    <HardDrive className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">索引大小</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(systemInfo.index_size)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
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
                <Zap className="w-5 h-5 mr-2" />
                AI 模型配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">語言模型</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{systemInfo?.current_model?.name || 'DeepSeek Chat'}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {systemInfo?.current_model?.provider || 'deepseek'} • 
                      {systemInfo?.current_model?.api_key_set ? ' API 已設定' : ' API 未設定'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">嵌入模型</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{systemInfo?.embedding_model?.name || 'BAAI/bge-base-zh'}</Badge>
                    <span className="text-xs text-muted-foreground">{systemInfo?.embedding_model?.description || '向量化文檔'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 性能監控 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                性能監控
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">記憶體使用</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{systemInfo?.memory_usage || 'N/A'}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">CPU 使用率</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{systemInfo?.cpu_usage || 'N/A'}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">運行時間</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{systemInfo?.uptime || 'N/A'}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 連接設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wifi className="w-5 h-5 mr-2" />
                連接設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">前端 URL</Label>
                  <div className="p-2 bg-muted rounded-md">
                    <code className="text-xs">{typeof window !== 'undefined' ? window.location.origin : 'N/A'}</code>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">後端 API URL</Label>
                  <div className="p-2 bg-muted rounded-md">
                    <code className="text-xs">{API_BASE_URL}</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI 模型管理頁籤 */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>可用的 AI 模型</CardTitle>
                <CardDescription>管理系統中可用的 AI 模型</CardDescription>
              </div>
              <Dialog open={isCreateModelOpen} onOpenChange={setIsCreateModelOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    新增模型
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>新增自定義 AI 模型</DialogTitle>
                    <DialogDescription>
                      添加您自己的 AI 模型配置
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        模型名稱
                      </Label>
                      <Input
                        id="name"
                        value={createModelForm.name}
                        onChange={(e) => setCreateModelForm({...createModelForm, name: e.target.value})}
                        className="col-span-3"
                        placeholder="例如: GPT-4"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="provider" className="text-right">
                        提供商
                      </Label>
                      <Input
                        id="provider"
                        value={createModelForm.provider}
                        onChange={(e) => setCreateModelForm({...createModelForm, provider: e.target.value})}
                        className="col-span-3"
                        placeholder="例如: openai"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="model_id" className="text-right">
                        模型 ID
                      </Label>
                      <Input
                        id="model_id"
                        value={createModelForm.model_id}
                        onChange={(e) => setCreateModelForm({...createModelForm, model_id: e.target.value})}
                        className="col-span-3"
                        placeholder="例如: gpt-4"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="api_base_url" className="text-right">
                        API URL
                      </Label>
                      <Input
                        id="api_base_url"
                        value={createModelForm.api_base_url}
                        onChange={(e) => setCreateModelForm({...createModelForm, api_base_url: e.target.value})}
                        className="col-span-3"
                        placeholder="例如: https://api.openai.com/v1"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        描述
                      </Label>
                      <Textarea
                        id="description"
                        value={createModelForm.description}
                        onChange={(e) => setCreateModelForm({...createModelForm, description: e.target.value})}
                        className="col-span-3"
                        placeholder="模型描述..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleCreateModel}>新增模型</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableModels.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{model.name}</h3>
                        {model.is_built_in && <Badge variant="secondary">內建</Badge>}
                        {!model.is_active && <Badge variant="destructive">停用</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {model.provider} • {model.model_id}
                      </p>
                      {model.description && (
                        <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                      )}
                      {model.created_by_username && (
                        <p className="text-xs text-muted-foreground mt-1">
                          由 {model.created_by_username} 創建
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedModel(model)
                          setIsPreferenceDialogOpen(true)
                        }}
                      >
                        設定偏好
                      </Button>
                      {!model.is_built_in && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteModel(model.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 我的模型偏好頁籤 */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>我的模型偏好</CardTitle>
              <CardDescription>管理您配置的 AI 模型和 API 密鑰</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPreferences.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>您尚未配置任何模型偏好</p>
                    <p className="text-sm">請到「AI 模型管理」頁籤新增模型配置</p>
                  </div>
                ) : (
                  userPreferences.map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{pref.model_name}</h3>
                          {pref.is_default && (
                            <Badge variant="default">
                              <Star className="w-3 h-3 mr-1" />
                              預設
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pref.provider} • API 密鑰: {pref.api_key_set ? '已設定' : '未設定'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          配置時間: {new Date(pref.created_at).toLocaleString('zh-TW')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const model = availableModels.find(m => m.id === pref.model_id)
                            if (model) {
                              setSelectedModel(model)
                              setPreferenceForm({
                                api_key: '',
                                is_default: pref.is_default
                              })
                              setIsPreferenceDialogOpen(true)
                            }
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePreference(pref.model_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 設定模型偏好對話框 */}
      <Dialog open={isPreferenceDialogOpen} onOpenChange={setIsPreferenceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>設定模型偏好</DialogTitle>
            <DialogDescription>
              為 {selectedModel?.name} 配置 API 密鑰和偏好設定
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api_key">API 密鑰</Label>
              <div className="relative">
                <Input
                  id="api_key"
                  type={showApiKey ? "text" : "password"}
                  value={preferenceForm.api_key}
                  onChange={(e) => setPreferenceForm({...preferenceForm, api_key: e.target.value})}
                  placeholder="輸入您的 API 密鑰"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={preferenceForm.is_default}
                onCheckedChange={(checked) => setPreferenceForm({...preferenceForm, is_default: checked})}
              />
              <Label htmlFor="is_default">設為預設模型</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSetPreference}>
              儲存設定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 