"use client"

import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export const ApiConfigError: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
          <AlertTitle className="text-orange-800 text-lg">
            API 配置錯誤
          </AlertTitle>
          <AlertDescription className="text-orange-700 mt-2">
            <p className="mb-3">
              系統無法連接到後端 API。這通常是因為 <code className="bg-orange-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> 環境變數未正確設置。
            </p>
            
            <div className="space-y-2 text-sm">
              <p><strong>解決方案：</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>確保後端已部署到 Zeabur</li>
                <li>在 Vercel 項目設置中添加環境變數：</li>
                <li className="ml-4">
                  <code className="bg-orange-100 px-1 rounded text-xs">
                    NEXT_PUBLIC_API_URL=https://your-zeabur-api.zeabur.app
                  </code>
                </li>
                <li>重新部署前端應用</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col space-y-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            重新加載頁面
          </Button>
          
          <Button 
            variant="outline" 
            asChild
            className="w-full"
          >
            <a 
              href="https://github.com/your-repo/blob/main/DEPLOYMENT_GUIDE_CLOUD.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              查看部署指南
            </a>
          </Button>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>如果問題持續存在，請檢查:</p>
          <ul className="list-disc list-inside text-left mt-2 space-y-1">
            <li>後端服務是否正在運行</li>
            <li>網絡連接是否正常</li>
            <li>環境變數配置是否正確</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 