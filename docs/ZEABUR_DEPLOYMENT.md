# Zeabur 部署指南

## 概述

本指南將幫助您將 LlamaIndex + FAISS 企業知識庫系統部署到 Zeabur 平台。

## 系統架構

部署後，系統將包含兩個服務：
- **前端服務 (web)**: Next.js 應用，運行在端口 3000
- **後端服務 (api)**: FastAPI 應用，運行在端口 8000

## 部署步驟

### 1. 準備代碼

確保您的代碼已經推送到 GitHub 倉庫。

### 2. 在 Zeabur 中創建項目

1. 登錄 [Zeabur](https://zeabur.com)
2. 點擊 "New Project"
3. 選擇 "GitHub" 並連接您的倉庫
4. 選擇您的倉庫並點擊 "Deploy"

### 3. 設置環境變數

在 Zeabur 項目設置中，添加以下環境變數：

#### 必需環境變數

```bash
# DeepSeek API 密鑰
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 前端 URL (您的 Zeabur 應用 URL)
FRONTEND_URL=https://your-app-name.zeabur.app

# API 服務 URL (指向 API 服務的內部 URL)
NEXT_PUBLIC_API_URL=https://your-app-name.zeabur.app/api
```

#### 重要說明

- `FRONTEND_URL`: 這是您的前端服務 URL，通常是 `https://your-app-name.zeabur.app`
- `NEXT_PUBLIC_API_URL`: 這是前端用來訪問 API 的 URL，在 Zeabur 中應該是 `https://your-app-name.zeabur.app/api`

### 4. 部署配置

系統使用 `zeabur.toml` 配置文件，包含：

- **前端服務**: Next.js 應用，端口 3000
- **後端服務**: Python FastAPI 應用，端口 8000
- **持久化存儲**: 用戶文檔和索引存儲

### 5. 驗證部署

部署完成後，運行連接測試：

```bash
python scripts/test_zeabur_connection.py https://your-app-name.zeabur.app/api
```

## 故障排除

### 常見問題

#### 1. 404 錯誤 - 認證端點不存在

**症狀**: 前端顯示 404 錯誤，無法訪問 `/auth/register` 或 `/auth/login`

**原因**: 環境變數配置錯誤或 API 服務未正確啟動

**解決方案**:
1. 檢查 `NEXT_PUBLIC_API_URL` 環境變數是否正確設置
2. 確保值為 `https://your-app-name.zeabur.app/api`
3. 重新部署應用

#### 2. CORS 錯誤

**症狀**: 瀏覽器控制台顯示 CORS 錯誤

**原因**: 前端和後端服務之間的跨域配置問題

**解決方案**:
1. 確保 `FRONTEND_URL` 環境變數正確設置
2. 確保 `ALLOW_ALL_ORIGINS=true` 在 API 服務環境中
3. 重新部署應用

#### 3. API 服務無法啟動

**症狀**: 後端服務啟動失敗

**原因**: Python 依賴或環境配置問題

**解決方案**:
1. 檢查 `scripts/requirements-zeabur.txt` 文件是否存在
2. 確保 `DEEPSEEK_API_KEY` 環境變數已設置
3. 查看 Zeabur 日誌以獲取詳細錯誤信息

#### 4. 前端無法連接到 API

**症狀**: 前端顯示連接錯誤

**原因**: API URL 配置錯誤

**解決方案**:
1. 檢查 `NEXT_PUBLIC_API_URL` 是否指向正確的 API 服務
2. 確保 URL 格式為 `https://your-app-name.zeabur.app/api`
3. 測試 API 端點是否可訪問

### 調試步驟

1. **檢查環境變數**:
   ```bash
   python scripts/deploy_zeabur.py
   ```

2. **測試 API 連接**:
   ```bash
   python scripts/test_zeabur_connection.py https://your-app-name.zeabur.app/api
   ```

3. **檢查服務狀態**:
   - 在 Zeabur 控制台中查看服務日誌
   - 檢查前端和後端服務是否都在運行

4. **驗證端點**:
   - 訪問 `https://your-app-name.zeabur.app/api/health`
   - 應該返回健康狀態

## 使用指南

部署成功後：

1. **註冊用戶**: 訪問前端 URL 並註冊新用戶
2. **上傳文檔**: 登錄後上傳 PDF 或 DOCX 文檔
3. **查詢知識庫**: 使用自然語言查詢您的文檔

## 監控和維護

- 定期檢查 Zeabur 控制台中的服務狀態
- 監控存儲使用情況
- 查看應用日誌以識別問題

## 支持

如果遇到問題：
1. 查看 Zeabur 控制台中的錯誤日誌
2. 運行診斷腳本
3. 檢查環境變數配置
4. 重新部署應用 