# Zeabur 部署簡單解決方案

## 問題分析

您遇到的 404 錯誤是因為 Zeabur 的多服務配置有問題。本地開發環境正常，但 Zeabur 部署中 API 路由無法正確工作。

## 解決方案：使用外部 API 服務

### 方案 1: 使用 Railway 部署 API 服務

1. **在 Railway 上部署 API 服務**：
   - 訪問 [Railway](https://railway.app)
   - 創建新項目，選擇 Python
   - 上傳您的 `scripts/auth_api_server.py` 和相關文件
   - 設置環境變數：
     ```bash
     DEEPSEEK_API_KEY=your_api_key
     FRONTEND_URL=https://llamaindex-faiss-system.zeabur.app
     ALLOW_ALL_ORIGINS=true
     ```

2. **在 Zeabur 中設置環境變數**：
   ```bash
   NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
   ```

### 方案 2: 使用 Render 部署 API 服務

1. **在 Render 上部署 API 服務**：
   - 訪問 [Render](https://render.com)
   - 創建新的 Web Service
   - 選擇 Python 環境
   - 設置構建命令：`pip install -r scripts/requirements-zeabur.txt`
   - 設置啟動命令：`python scripts/auth_api_server.py`
   - 設置環境變數

2. **在 Zeabur 中設置環境變數**：
   ```bash
   NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
   ```

### 方案 3: 使用 Vercel 部署 API 服務

1. **在 Vercel 上部署 API 服務**：
   - 創建 `api/` 目錄
   - 將 FastAPI 應用轉換為 Vercel 函數
   - 部署到 Vercel

2. **在 Zeabur 中設置環境變數**：
   ```bash
   NEXT_PUBLIC_API_URL=https://your-vercel-app.vercel.app/api
   ```

## 推薦方案：Railway

Railway 是最簡單的選擇，因為它專門支持 Python 應用。

### 步驟 1: 準備 API 部署文件

創建 `railway.json` 文件：

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python scripts/auth_api_server.py",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### 步驟 2: 部署到 Railway

1. 將代碼推送到 GitHub
2. 在 Railway 中連接 GitHub 倉庫
3. 設置環境變數
4. 部署

### 步驟 3: 更新 Zeabur 配置

在 Zeabur 中設置環境變數：
```bash
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
```

## 驗證部署

部署完成後，運行測試：

```bash
# 測試 API 連接
curl https://your-railway-app.railway.app/health

# 測試認證端點
curl -X POST https://your-railway-app.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123"}'
```

## 優點

1. **避免 Zeabur 路由問題**：使用專門的 API 服務
2. **更好的性能**：API 服務獨立運行
3. **更容易調試**：可以單獨檢查 API 服務
4. **更靈活**：可以選擇最適合的平台

## 缺點

1. **需要管理兩個服務**：前端和 API 分別部署
2. **額外成本**：可能需要付費計劃
3. **配置複雜度**：需要設置跨域配置

## 立即行動

1. 選擇一個平台（推薦 Railway）
2. 部署 API 服務
3. 更新 Zeabur 環境變數
4. 測試功能

這樣可以完全避免 Zeabur 的路由問題，讓您的應用正常工作！ 