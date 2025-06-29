"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Loader2, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Settings, 
  Brain, 
  User, 
  Check, 
  AlertCircle, 
  Zap, 
  Activity, 
  Server,
  Database,
  Clock,
  Wifi,
  HardDrive,
  BarChart3
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

// API 基礎 URL 設置
const getApiBaseUrl = () => {
  // 優先使用環境變數
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  }
  
  // 生產環境檢查
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    console.error('⚠️ NEXT_PUBLIC_API_URL 環境變數未設置！請在 Vercel 中配置正確的後端 API URL')
    // 在生產環境中，如果沒有設置環境變數，應該顯示錯誤而不是猜測
    return ''
  }
  
  // 僅在本地開發環境使用默認值
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:8000`
    }
  }
  
  return 'http://localhost:8000'
}

const API_BASE_URL = getApiBaseUrl()

interface SystemInfo {
  status: string
  documents_count: number
  api_response_time?: number
  memory_usage?: string
  cpu_usage?: string
  current_model?: {
    name: string
    provider: string
    model_id: string
    api_key_set: boolean
  }
  // 保持與後端兼容的別名
  user_ai_model?: {
    name: string
    provider: string
    has_api_key: boolean
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
  api_key_set: boolean
  is_default: boolean
  created_at: string
  model: AIModel
}

export const SystemSettings: React.FC = () => {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState("status")
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [models, setModels] = useState<AIModel[]>([])
  const [userPreferences, setUserPreferences] = useState<UserModelPreference[]>([])
  const [isAddModelOpen, setIsAddModelOpen] = useState(false)
  const [isEditPreferenceOpen, setIsEditPreferenceOpen] = useState(false)
  const [selectedPreference, setSelectedPreference] = useState<UserModelPreference | null>(null)
  const [newModel, setNewModel] = useState({
    name: "",
    provider: "",
    api_url: "",
    description: ""
  })
  const [editingPreference, setEditingPreference] = useState({
    model_id: 0,
    api_key: "",
    is_default: false
  })

  useEffect(() => {
    fetchSystemInfo()
    fetchModels()
    fetchUserPreferences()
  }, [])

  const fetchSystemInfo = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_BASE_URL}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSystemInfo(data)
      }
    } catch (error) {
      console.error("Failed to fetch system info:", error)
    }
  }

  const fetchModels = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_BASE_URL}/ai-models`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setModels(data)
      }
    } catch (error) {
      console.error("Failed to fetch models:", error)
    }
  }

  const fetchUserPreferences = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_BASE_URL}/user/model-preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUserPreferences(data)
      }
    } catch (error) {
      console.error("Failed to fetch user preferences:", error)
    }
  }

  const handleAddModel = async () => {
    if (!token || !newModel.name || !newModel.provider || !newModel.api_url) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai-models/custom`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newModel)
      })
      
      if (response.ok) {
        setIsAddModelOpen(false)
        setNewModel({ name: "", provider: "", api_url: "", description: "" })
        fetchModels()
      }
    } catch (error) {
      console.error("Failed to add model:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteModel = async (modelId: number) => {
    if (!token || !confirm('確定要刪除這個模型嗎？')) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai-models/custom/${modelId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchModels()
        fetchUserPreferences()
      }
    } catch (error) {
      console.error("Failed to delete model:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPreference = async (modelId: number) => {
    setEditingPreference({ model_id: modelId, api_key: "", is_default: false })
    setSelectedPreference(null)
    setIsEditPreferenceOpen(true)
  }

  const handleEditPreference = (preference: UserModelPreference) => {
    setEditingPreference({
      model_id: preference.model_id,
      api_key: "", // api_key不在返回數據中，重置為空
      is_default: preference.is_default
    })
    setSelectedPreference(preference)
    setIsEditPreferenceOpen(true)
  }

  const handleSavePreference = async () => {
    if (!token || !editingPreference.model_id) return
    
    setIsLoading(true)
    try {
      const method = selectedPreference ? 'PUT' : 'POST'
      const url = selectedPreference 
        ? `${API_BASE_URL}/user/model-preferences/${selectedPreference.id}`
        : `${API_BASE_URL}/user/model-preferences`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingPreference)
      })
      
      if (response.ok) {
        setIsEditPreferenceOpen(false)
        fetchUserPreferences()
        fetchSystemInfo()
      }
    } catch (error) {
      console.error("Failed to save preference:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePreference = async (preferenceId: number) => {
    if (!token || !confirm('確定要刪除這個偏好設定嗎？')) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/user/model-preferences/${preferenceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchUserPreferences()
        fetchSystemInfo()
      }
    } catch (error) {
      console.error("Failed to delete preference:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchSystemInfo()
    fetchModels()
    fetchUserPreferences()
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid grid-cols-3 clay-nav p-2 rounded-2xl">
            <TabsTrigger 
              value="status"
              className={`transition-all duration-300 rounded-xl ${
                activeTab === "status" ? "clay-tab-active" : "clay-tab"
              }`}
            >
              <Activity className="w-4 h-4 mr-2" />
              系統狀態
            </TabsTrigger>
            <TabsTrigger 
              value="models"
              className={`transition-all duration-300 rounded-xl ${
                activeTab === "models" ? "clay-tab-active" : "clay-tab"
              }`}
            >
              <Brain className="w-4 h-4 mr-2" />
              AI 模型管理
            </TabsTrigger>
            <TabsTrigger 
              value="preferences"
              className={`transition-all duration-300 rounded-xl ${
                activeTab === "preferences" ? "clay-tab-active" : "clay-tab"
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              我的模型偏好
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 系統狀態 */}
        <TabsContent value="status" className="space-y-6">
          <div className="clay-card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Activity className="w-6 h-6 mr-3 text-orange-500" />
                  <h2 className="text-2xl font-semibold">系統狀態監控</h2>
                </div>
                <Button onClick={handleRefresh} className="clay-button" data-clay="true">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新
                </Button>
              </div>
              
              {systemInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* API 狀態 */}
                  <div className="clay-card p-6 clay-animate-float">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Server className="w-5 h-5 mr-2 text-green-500" />
                        <span className="font-semibold">API 連接</span>
                      </div>
                      <div className="clay-badge">
                        <Check className="w-3 h-3 mr-1" />
                        正常
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-500 mb-1">
                      {systemInfo.api_response_time || '<100'}ms
                    </div>
                    <div className="text-sm text-muted-foreground">響應時間</div>
                  </div>

                  {/* 文檔數量 */}
                  <div className="clay-card p-6 clay-animate-float" style={{animationDelay: '0.1s'}}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-blue-500" />
                        <span className="font-semibold">知識庫</span>
                      </div>
                      <div className="clay-badge">
                        活躍
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-500 mb-1">
                      {systemInfo.documents_count}
                    </div>
                    <div className="text-sm text-muted-foreground">個文檔</div>
                  </div>

                  {/* AI 模型狀態 */}
                  <div className="clay-card p-6 clay-animate-float" style={{animationDelay: '0.2s'}}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Brain className="w-5 h-5 mr-2 text-purple-500" />
                        <span className="font-semibold">AI 模型</span>
                      </div>
                      <div className={`clay-badge ${
                        (systemInfo.current_model?.api_key_set || systemInfo.user_ai_model?.has_api_key) 
                          ? '' : 'bg-yellow-500'
                      }`}>
                        {(systemInfo.current_model?.api_key_set || systemInfo.user_ai_model?.has_api_key) 
                          ? '已配置' : '需配置'}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-purple-500 mb-1">
                      {systemInfo.current_model?.name || systemInfo.user_ai_model?.name || '未設定'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {systemInfo.current_model?.provider || systemInfo.user_ai_model?.provider || '無提供商'}
                    </div>
                  </div>
                </div>
              )}

              {/* 系統信息 */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="clay-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-orange-500" />
                    連接設定
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">後端 API:</span>
                      <span className="font-mono text-sm clay-secondary-badge">{API_BASE_URL}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">前端 URL:</span>
                      <span className="font-mono text-sm clay-secondary-badge">
                        {typeof window !== 'undefined' ? window.location.origin : 'localhost:3001'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="clay-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-500" />
                    性能指標
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">記憶體使用:</span>
                      <span className="clay-secondary-badge">
                        {systemInfo?.memory_usage || 'N/A'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">CPU 使用:</span>
                      <span className="clay-secondary-badge">
                        {systemInfo?.cpu_usage || 'N/A'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* AI 模型管理 */}
        <TabsContent value="models" className="space-y-6">
          <div className="clay-card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Brain className="w-6 h-6 mr-3 text-orange-500" />
                  <h2 className="text-2xl font-semibold">AI 模型管理</h2>
                </div>
                <Dialog open={isAddModelOpen} onOpenChange={setIsAddModelOpen}>
                  <DialogTrigger asChild>
                    <Button className="clay-button" data-clay="true">
                      <Plus className="w-4 h-4 mr-2" />
                      新增自定義模型
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="clay-dialog-content">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-gray-800">新增自定義 AI 模型</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        添加您自己的 AI 模型配置
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 p-1">
                      <div>
                        <Label htmlFor="model-name" className="text-sm font-medium">模型名稱</Label>
                        <Input
                          id="model-name"
                          value={newModel.name}
                          onChange={(e) => setNewModel(prev => ({...prev, name: e.target.value}))}
                          placeholder="例如: GPT-4o"
                          className="clay-input mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="model-provider" className="text-sm font-medium">提供商</Label>
                        <Input
                          id="model-provider"
                          value={newModel.provider}
                          onChange={(e) => setNewModel(prev => ({...prev, provider: e.target.value}))}
                          placeholder="例如: OpenAI"
                          className="clay-input mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="model-url" className="text-sm font-medium">API URL</Label>
                        <Input
                          id="model-url"
                          value={newModel.api_url}
                          onChange={(e) => setNewModel(prev => ({...prev, api_url: e.target.value}))}
                          placeholder="例如: https://api.openai.com/v1/chat/completions"
                          className="clay-input mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="model-description" className="text-sm font-medium">描述</Label>
                        <Textarea
                          id="model-description"
                          value={newModel.description}
                          onChange={(e) => setNewModel(prev => ({...prev, description: e.target.value}))}
                          placeholder="模型描述..."
                          className="clay-input mt-1"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex space-x-2 pt-4">
                      <Button 
                        onClick={() => setIsAddModelOpen(false)} 
                        variant="outline"
                        className="clay-button bg-gray-200 hover:bg-gray-300 text-gray-700"
                      >
                        取消
                      </Button>
                      <Button 
                        onClick={handleAddModel} 
                        disabled={isLoading} 
                        className="clay-button" 
                        data-clay="true"
                      >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        新增
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {models.map((model) => (
                  <div key={model.id} className="clay-card p-5 transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{model.name}</h3>
                        <p className="text-sm text-muted-foreground">{model.provider}</p>
                      </div>
                      {model.is_built_in ? (
                        <div className="clay-badge">內建</div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteModel(model.id)}
                          className="clay-button bg-red-500 hover:bg-red-600"
                          data-clay="true"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{model.description}</p>
                    <Button
                      size="sm"
                      onClick={() => handleAddPreference(model.id)}
                      className="w-full clay-button"
                      data-clay="true"
                    >
                      設定偏好
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 我的模型偏好 */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="clay-card">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <User className="w-6 h-6 mr-3 text-orange-500" />
                <h2 className="text-2xl font-semibold">我的模型偏好</h2>
              </div>

              {userPreferences.length > 0 ? (
                <div className="space-y-4">
                  {userPreferences.map((preference) => {
                    // 安全檢查：確保 model 存在
                    if (!preference.model) {
                      return (
                        <div key={preference.id} className="clay-card p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 rounded-xl bg-gradient-to-r from-red-100 to-red-200">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-red-600">模型數據錯誤</h3>
                                <p className="text-sm text-muted-foreground">無法載入模型信息</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePreference(preference.id)}
                              className="clay-button bg-red-500 hover:bg-red-600"
                              data-clay="true"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    }
                    
                    return (
                      <div key={preference.id} className="clay-card p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-100 to-orange-200">
                              <Brain className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{preference.model.name || '未知模型'}</h3>
                              <p className="text-sm text-muted-foreground">{preference.model.provider || '未知提供商'}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                {preference.is_default && (
                                  <div className="clay-badge">
                                    <Check className="w-3 h-3 mr-1" />
                                    默認
                                  </div>
                                )}
                                <div className={`clay-secondary-badge ${preference.api_key_set ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {preference.api_key_set ? 'API 已配置' : 'API 待配置'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditPreference(preference)}
                              className="clay-button"
                              data-clay="true"
                            >
                              編輯
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePreference(preference.id)}
                              className="clay-button bg-red-500 hover:bg-red-600"
                              data-clay="true"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 clay-card">
                  <div className="p-4 rounded-full bg-gradient-to-r from-orange-100 to-orange-200 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Brain className="w-10 h-10 text-orange-500" />
                  </div>
                  <p className="text-lg font-medium text-gray-700 mb-2">還沒有配置任何模型偏好</p>
                  <p className="text-muted-foreground">到「AI 模型管理」頁面設定您喜愛的模型</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 編輯偏好對話框 */}
      <Dialog open={isEditPreferenceOpen} onOpenChange={setIsEditPreferenceOpen}>
        <DialogContent className="clay-dialog-content">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {selectedPreference ? '編輯模型偏好' : '新增模型偏好'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              配置您的 AI 模型 API 密鑰和偏好設定
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-1">
            <div>
              <Label htmlFor="api-key" className="text-sm font-medium">API 密鑰</Label>
              <Input
                id="api-key"
                type="password"
                value={editingPreference.api_key}
                onChange={(e) => setEditingPreference(prev => ({...prev, api_key: e.target.value}))}
                placeholder="輸入您的 API 密鑰..."
                className="clay-input mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="is-default"
                type="checkbox"
                checked={editingPreference.is_default}
                onChange={(e) => setEditingPreference(prev => ({...prev, is_default: e.target.checked}))}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
              />
              <Label htmlFor="is-default" className="text-sm font-medium">設為默認模型</Label>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 pt-4">
            <Button 
              onClick={() => setIsEditPreferenceOpen(false)} 
              variant="outline"
              className="clay-button bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              取消
            </Button>
            <Button 
              onClick={handleSavePreference} 
              disabled={isLoading} 
              className="clay-button" 
              data-clay="true"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 