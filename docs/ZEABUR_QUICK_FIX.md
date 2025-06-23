# Zeabur 404 錯誤快速修復指南

## 問題描述

您遇到的錯誤：
```
POST https://llamaindex-faiss-system.zeabur.app/auth/register 404 (Not Found)
POST https://llamaindex-faiss-system.zeabur.app/auth/login 404 (Not Found)
```

## 根本原因

1. **環境變數配置錯誤**：`NEXT_PUBLIC_API_URL` 設置為本地開發環境
2. **Zeabur 路由配置問題**：API 服務沒有正確路由到 `/api` 路徑

## 立即修復步驟

### 步驟 1: 設置正確的環境變數

在 Zeabur 控制台中，找到您的項目設置，添加以下環境變數：

```bash
# 關鍵修復：使用直接端點，不包含 /api 前綴
NEXT_PUBLIC_API_URL=https://llamaindex-faiss-system.zeabur.app

# 其他必需環境變數
FRONTEND_URL=https://llamaindex-faiss-system.zeabur.app
DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here
```

**重要**：確保 `NEXT_PUBLIC_API_URL` 指向正確的 API 路徑（包含 `/api`）

### 步驟 2: 推送更新的配置

確保您的代碼包含最新的 `zeabur.toml` 配置文件，其中包含正確的路由配置：

```toml
# 路由配置
[[routes]]
  source = "/api"
  destination = "api"

[[routes]]
  source = "/"
  destination = "web"
```

### 步驟 3: 重新部署

1. 將更新的代碼推送到 GitHub
2. 在 Zeabur 控制台中點擊 "Redeploy"
3. 等待部署完成

### 步驟 4: 驗證修復

部署完成後，運行以下命令驗證：

```bash
# 測試 API 連接
python scripts/test_zeabur_connection.py https://llamaindex-faiss-system.zeabur.app/api

# 或者運行診斷腳本
python scripts/fix_zeabur_routing.py https://llamaindex-faiss-system.zeabur.app
```

## 預期結果

修復成功後，您應該看到：

1. **API 健康檢查**：`GET /api/health` 返回 200
2. **認證端點**：`POST /api/auth/register` 和 `POST /api/auth/login` 返回 200
3. **前端功能**：可以正常註冊和登錄用戶

## 故障排除

### 如果仍然出現 404 錯誤

1. **檢查服務狀態**：
   - 在 Zeabur 控制台中查看兩個服務是否都在運行
   - 檢查服務日誌是否有錯誤

2. **驗證環境變數**：
   - 確保所有環境變數都已正確設置
   - 確保沒有多餘的空格或特殊字符

3. **檢查路由配置**：
   - 確保 `zeabur.toml` 包含正確的路由配置
   - 確保服務名稱與路由配置匹配

### 如果出現 CORS 錯誤

1. 確保 `ALLOW_ALL_ORIGINS=true` 環境變數已設置
2. 確保 `FRONTEND_URL` 環境變數正確設置

## 測試步驟

修復完成後，請按以下順序測試：

1. **訪問前端**：`https://llamaindex-faiss-system.zeabur.app`
2. **註冊用戶**：使用註冊表單創建新用戶
3. **登錄系統**：使用註冊的憑據登錄
4. **上傳文檔**：測試文檔上傳功能
5. **查詢知識庫**：測試查詢功能

## 聯繫支持

如果按照上述步驟仍然無法解決問題，請：

1. 檢查 Zeabur 控制台中的詳細錯誤日誌
2. 運行診斷腳本並提供輸出結果
3. 確認所有環境變數都已正確設置

## 常見問題

**Q: 為什麼需要設置 `NEXT_PUBLIC_API_URL`？**
A: 這個環境變數告訴前端應用去哪裡找 API 服務。在 Zeabur 中，API 服務運行在 `/api` 路徑下。

**Q: 為什麼需要路由配置？**
A: Zeabur 需要知道如何將不同的 URL 路徑路由到正確的服務。`/api` 路徑應該路由到 Python API 服務，其他路徑路由到 Next.js 前端服務。

**Q: 部署後多久能看到效果？**
A: 通常需要 2-5 分鐘完成部署。您可以在 Zeabur 控制台中查看部署進度。 