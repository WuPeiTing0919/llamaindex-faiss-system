"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Upload, Search, FileText, Database, Cpu, MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResponsiveContainer } from "@/components/ui/responsive-container"

// API 基礎 URL 設置
const getApiBaseUrl = () => {
  // 首先檢查環境變量
  if (process.env.NEXT_PUBLIC_API_URL) {
    // 確保URL末尾沒有斜線
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  
  // 然後嘗試使用當前主機的端口 8000
  const hostname = window.location.hostname;
  return `http://${hostname}:8000`;
};

// 初始化 API 基礎 URL
const API_BASE_URL = getApiBaseUrl();

interface Voice {
  name: string;
  display_name: string;
  locale: string;
  gender: string;
}

// 默認語音選項，以防API無法獲取
const DEFAULT_VOICES: Voice[] = [
  {
    name: "zh-TW-HsiaoChenNeural",
    display_name: "曉臻 (女聲)",
    locale: "zh-TW",
    gender: "Female"
  },
  {
    name: "zh-TW-YunJheNeural",
    display_name: "雲哲 (男聲)",
    locale: "zh-TW",
    gender: "Male"
  },
  {
    name: "zh-CN-XiaoxiaoNeural",
    display_name: "曉曉 (女聲)",
    locale: "zh-CN",
    gender: "Female"
  }
];

export default function KnowledgeBaseSystem() {
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [indexStatus, setIndexStatus] = useState("ready")
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [loadingDots, setLoadingDots] = useState("")
  const [apiConnected, setApiConnected] = useState<boolean | null>(null) // null表示未知，true表示連接，false表示斷開

  // 載入文件列表和系統狀態
  useEffect(() => {
    // 首先檢查API連接
    checkApiConnection().then((isConnected) => {
      if (isConnected) {
        // 如果API連接成功，載入數據
        fetchDocuments();
        fetchSystemStatus();
      } else {
        console.log("API服務器未連接，進入離線模式");
        // 使用空數據或默認數據
        setUploadedFiles([]);
        setSystemStatus({
          status: "unknown",
          documents_count: 0,
          index_size: 0,
          model_status: "unknown"
        });
      }
    });
  }, []);

  // 檢查API連接狀態
  const checkApiConnection = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超時
      
      // 使用更可靠的錯誤處理
      try {
        const response = await fetch(`${API_BASE_URL}/`, {
          signal: controller.signal,
          method: 'GET',
          // 添加 no-cache 避免緩存問題
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        const isConnected = response.ok;
        setApiConnected(isConnected);
        return isConnected;
      } catch (fetchError) {
        // 特別處理 fetch 錯誤
        console.warn("API連接檢查失敗 - 網絡錯誤:", fetchError);
        clearTimeout(timeoutId);
        setApiConnected(false);
        return false;
      }
    } catch (error) {
      console.error("API連接檢查失敗 - 未知錯誤", error);
      setApiConnected(false);
      return false;
    }
  };

  // 嘗試重新連接API
  const reconnectApi = () => {
    setApiConnected(null); // 設置為檢查中狀態
    
    // 延遲執行，避免狀態更新衝突
    setTimeout(async () => {
      const isConnected = await checkApiConnection();
      
      if (isConnected) {
        // 如果連接成功，重新獲取數據
        fetchDocuments();
        fetchSystemStatus();
      }
    }, 100);
  };

  // 動畫效果 - 載入中的動畫點
  useEffect(() => {
    if (isLoading || apiConnected === null) {
      const interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev.length >= 3) return "";
          return prev + ".";
        });
      }, 400);
      return () => clearInterval(interval);
    }
    return () => {};
  }, [isLoading, apiConnected]);

  // 定期檢查API連接狀態
  useEffect(() => {
    // 每30秒檢查一次API連接狀態
    const checkInterval = setInterval(() => {
      if (apiConnected === false) {
        console.log("嘗試重新連接API...");
        checkApiConnection();
      }
    }, 30000);
    
    return () => clearInterval(checkInterval);
  }, [apiConnected]);

  // 獲取文件列表
  const fetchDocuments = async (retryCount = 0) => {
    // 如果API未連接，不嘗試獲取
    if (apiConnected === false) {
      console.log("API未連接，跳過文件列表獲取");
      setUploadedFiles([]);
      return;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超時
      
      const response = await fetch(`${API_BASE_URL}/documents`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API返回錯誤: ${response.status}`);
      }
      
      const data = await response.json();
      setUploadedFiles(data.map((doc: any) => doc.filename));
    } catch (error: any) {
      console.error("獲取文件列表失敗", error);
      
      // 如果是網絡錯誤或超時，嘗試重試
      if (retryCount < 3 && (error instanceof TypeError || (error.name && error.name === 'AbortError'))) {
        console.log(`嘗試重新獲取文件列表，第 ${retryCount + 1} 次...`);
        setTimeout(() => fetchDocuments(retryCount + 1), 2000); // 2秒後重試
      } else {
        // 設置空列表，避免界面出錯
        setUploadedFiles([]);
        
        // 如果多次獲取失敗，可能API已斷開
        if (retryCount >= 2) {
          setApiConnected(false);
        }
      }
    }
  };

  // 獲取系統狀態
  const fetchSystemStatus = async (retryCount = 0) => {
    // 如果API未連接，不嘗試獲取
    if (apiConnected === false) {
      console.log("API未連接，跳過系統狀態獲取");
      setSystemStatus({
        status: "offline",
        documents_count: 0,
        index_size: 0,
        model_status: "offline"
      });
      return;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超時
      
      const response = await fetch(`${API_BASE_URL}/status`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API返回錯誤: ${response.status}`);
      }
      
      const data = await response.json();
      setSystemStatus(data);
      setIndexStatus(data.status === "running" ? "ready" : "building");
    } catch (error: any) {
      console.error("獲取系統狀態失敗", error);
      
      // 如果是網絡錯誤或超時，嘗試重試
      if (retryCount < 3 && (error instanceof TypeError || (error.name && error.name === 'AbortError'))) {
        console.log(`嘗試重新獲取系統狀態，第 ${retryCount + 1} 次...`);
        setTimeout(() => fetchSystemStatus(retryCount + 1), 2000); // 2秒後重試
      } else {
        // 設置默認狀態，避免界面出錯
        setSystemStatus({
          status: "offline",
          documents_count: 0,
          index_size: 0,
          model_status: "offline"
        });
        setIndexStatus("ready");
        
        // 如果多次獲取失敗，可能API已斷開
        if (retryCount >= 2) {
          setApiConnected(false);
        }
      }
    }
  };

  // 文件上傳處理
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIndexStatus("building");
    
    // 為每個文件轉換為Base64並上傳
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // 讀取文件並轉換為Base64
        const fileContent = await readFileAsBase64(file);
        
        // 發送Base64編碼的文件內容
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            content_base64: fileContent,
            content_type: file.type
          }),
        });
        
        if (response.ok) {
          console.log(`文件 ${file.name} 上傳成功`);
        }
      } catch (error) {
        console.error(`上傳文件 ${file.name} 失敗`, error);
      }
    }
    
    // 重新獲取更新後的文件列表和系統狀態
    fetchDocuments();
    fetchSystemStatus();
    setIndexStatus("ready");
  };

  // 輔助函數：讀取文件為Base64格式
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // 去除Base64編碼的前綴 (例如 "data:application/pdf;base64,")
          const base64Content = reader.result.split(',')[1];
          resolve(base64Content);
        } else {
          reject(new Error('無法讀取文件內容'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(""); // 清空舊回應
    
    try {
      // 檢查API是否可用
      let apiAvailable = true;
      try {
        const testResponse = await fetch(`${API_BASE_URL}/status`, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000) // 3秒超時
        });
        apiAvailable = testResponse.ok;
      } catch (error) {
        console.warn("API服務器不可用，將使用離線模式", error);
        apiAvailable = false;
      }
      
      if (!apiAvailable) {
        // 離線模式：提供一個基本回應
        setTimeout(() => {
          setResponse("很抱歉，目前無法連接到知識庫服務器。請檢查API服務是否正在運行，或稍後再試。" + 
                     "\n\n您可以嘗試以下操作：\n1. 確認API服務器是否已啟動\n2. 檢查網絡連接\n3. 確認API端口設置是否正確");
          setIsLoading(false);
        }, 1000);
        return;
      }
      
      // 正常模式：連接API
      const endpoint = `${API_BASE_URL}/query`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          top_k: 5
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResponse(data.answer);
      } else {
        setResponse(`查詢失敗，伺服器返回錯誤: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("查詢失敗", error);
      setResponse(`網絡錯誤，無法連接到知識庫服務: ${error.message || "未知錯誤"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-4 relative">
      <ResponsiveContainer maxWidth="2xl" padding centered>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">企業知識庫系統</h1>
          <p className="text-base md:text-xl text-slate-800 mb-6">企業知識管理解決方案 - 智能檢索、分析與應用</p>
          <p className="text-sm md:text-base text-slate-700 mb-6 max-w-3xl mx-auto">
            企業知識管理是組織獲取、整理、共享和應用集體智慧的系統性方法。通過整合先進的人工智能技術，
            我們的系統能夠自動化知識提取、智能檢索和深度分析，幫助企業提升決策效率、促進創新和保存寶貴的組織經驗。
          </p>
          
          {/* API連接狀態 */}
          <div className="flex justify-center items-center gap-2 mb-6">
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                apiConnected === null ? 'bg-yellow-500' : 
                apiConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-slate-700">
                {apiConnected === null ? '檢查API連接中' + loadingDots : 
                 apiConnected ? 'API服務已連接' : 'API服務未連接'}
              </span>
              {apiConnected === false && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={reconnectApi} 
                  className="ml-2 h-7 px-2 py-1 text-xs"
                >
                  重新連接
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mb-8">
            
          </div>
        </div>

        <Tabs defaultValue="query" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200 p-1 rounded-lg">
            <TabsTrigger value="query" className="text-slate-800 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white">智能查詢</TabsTrigger>
            <TabsTrigger value="upload" className="text-slate-800 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white">文檔管理</TabsTrigger>
            <TabsTrigger value="system" className="text-slate-800 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white">系統狀態</TabsTrigger>
          </TabsList>

          {/* 查詢界面 */}
          <TabsContent value="query">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Search className="w-5 h-5" />
                    知識查詢
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    輸入您的問題，系統將從企業知識庫中檢索相關信息並生成回答。
                    您可以詢問關於企業政策、流程、最佳實踐或專業知識的問題。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 bg-white">
                  <Textarea
                    placeholder="請輸入您的問題，例如：我們公司的員工培訓政策是什麼？如何處理客戶投訴？"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[100px] border-slate-300 focus:border-blue-500 bg-white text-slate-800"
                    disabled={isLoading}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleQuery()} 
                      disabled={isLoading || !query.trim()} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          查詢中{loadingDots}
                        </>
                      ) : (
                        "開始查詢"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <MessageSquare className="w-5 h-5" />
                    AI 回答
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 bg-white">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-700">
                      <Loader2 className="h-10 w-10 animate-spin mb-4" />
                      <p className="text-center">正在思考中{loadingDots}</p>
                      <p className="text-sm text-slate-600 mt-2">從知識庫檢索資料並生成回答...</p>
                    </div>
                  ) : response ? (
                    <div className="space-y-4">
                      <div className="relative prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-slate-800">{response}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                      <MessageSquare className="h-12 w-12 mb-4 opacity-30" />
                      <p>輸入問題後點擊「開始查詢」獲取回答</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 文檔上傳界面 */}
          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Upload className="w-5 h-5" />
                    文檔上傳
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    上傳企業文檔到知識庫，支持 PDF、TXT、DOCX 等格式。
                    透過集中管理企業知識資產，提高知識共享效率並防止知識流失。
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-white pt-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
                    <Upload className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                    <p className="text-slate-700 mb-4">拖拽文件到此處或點擊上傳</p>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.txt,.docx,.md"
                      onChange={handleFileUpload}
                      className="max-w-xs mx-auto bg-white text-slate-800"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-slate-800">已上傳文檔</CardTitle>
                  <CardDescription className="text-slate-600">當前知識庫中的文檔列表</CardDescription>
                </CardHeader>
                <CardContent className="bg-white pt-4">
                  {uploadedFiles.length > 0 ? (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200">
                          <FileText className="w-4 h-4 text-slate-700" />
                          <span className="text-sm text-slate-800">{file}</span>
                          <Badge variant="outline" className="ml-auto text-slate-700 border-slate-300">
                            已索引
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-700 text-center py-8">尚未上傳任何文檔</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 系統狀態界面 */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* API連接狀態卡片 */}
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-lg text-slate-800">API服務狀態</CardTitle>
                  <CardDescription className="text-slate-600">
                    後端API服務連接狀態和診斷信息
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 bg-white">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-700">連接狀態</span>
                      <Badge 
                        variant={apiConnected === null ? "secondary" : apiConnected ? "default" : "destructive"}
                        className={`${apiConnected ? "bg-green-600" : apiConnected === false ? "bg-red-600" : "bg-yellow-600"} text-white`}
                      >
                        {apiConnected === null ? '檢查中' : apiConnected ? '已連接' : '未連接'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">API端點</span>
                      <span className="text-slate-800">{API_BASE_URL}</span>
                    </div>
                    {!apiConnected && apiConnected !== null && (
                      <div className="mt-4">
                        <Button 
                          onClick={reconnectApi} 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          重新連接API服務
                        </Button>
                        <div className="mt-2 text-xs text-slate-600">
                          <p>可能的問題：</p>
                          <ul className="list-disc pl-4 mt-1 space-y-1">
                            <li>API服務器未啟動</li>
                            <li>網絡連接問題</li>
                            <li>端口配置不正確</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-lg text-slate-800">知識庫索引狀態</CardTitle>
                  <CardDescription className="text-slate-600">
                    企業知識庫的核心索引系統，支持高效檢索和語義理解
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 bg-white">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">FAISS 索引</span>
                      <Badge variant={indexStatus === "ready" ? "default" : "secondary"} className="bg-blue-600 text-white">
                        {indexStatus === "ready" ? "就緒" : "建立中"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">文檔數量</span>
                      <span className="text-slate-800">{uploadedFiles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">向量維度</span>
                      <span className="text-slate-800">768</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-lg text-slate-800">AI 模型狀態</CardTitle>
                  <CardDescription className="text-slate-600">
                    智能分析引擎，為企業知識提供深度理解和洞察
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 bg-white">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">模型狀態</span>
                      <Badge variant="default" className="bg-green-600 text-white">運行中</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">模型名稱</span>
                      <span className="text-slate-800">Mistral-7B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">響應時間</span>
                      <span className="text-slate-800">~2.3s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-lg text-slate-800">系統資源</CardTitle>
                  <CardDescription className="text-slate-600">
                    企業知識管理平台的運行環境監控
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 bg-white">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">CPU 使用率</span>
                      <span className="text-slate-800">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">內存使用</span>
                      <span className="text-slate-800">2.1GB / 8GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">存儲空間</span>
                      <span className="text-slate-800">1.2GB / 100GB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert className={`mt-6 ${apiConnected ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-yellow-50 text-yellow-800 border-yellow-200"}`}>
              <AlertDescription className="font-medium">
                {apiConnected ? (
                  "系統運行正常。企業知識管理是持續進行的過程，建議定期更新知識庫內容並優化索引結構，以確保信息的時效性和準確性。"
                ) : (
                  "API服務未連接。請確認後端服務是否正常運行，並檢查網絡連接和端口設置。前端界面仍可瀏覽，但無法執行查詢和上傳操作。"
                )}
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </ResponsiveContainer>
      
      {/* 作者宣告 */}
      <div className="fixed bottom-3 right-3 md:bottom-5 md:right-5 z-10">
        <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-md border border-slate-200 text-sm text-slate-700">
          Created by <span className="font-medium text-blue-700">aken</span>
        </div>
      </div>
    </div>
  )
}
