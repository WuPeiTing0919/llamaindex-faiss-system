# Zeabur 404 錯誤修復指南

## 問題診斷結果

根據診斷腳本的結果，問題已經明確：

- ✅ **直接端點部分工作**：`/status` 返回 200
- ❌ **API 前綴端點不工作**：所有 `/api/*` 端點返回 404
- 🎯 **根本原因**：Zeabur 的路由配置問題，`/api` 前綴沒有正確路由到 API 服務

## 解決方案

### 步驟 1: 更新 Zeabur 環境變數

在 Zeabur 控制台中，設置以下環境變數：

```bash
# 使用直接端點，不包含 /api 前綴
NEXT_PUBLIC_API_URL=https://llamaindex-faiss-system.zeabur.app

# 其他必需環境變數
FRONTEND_URL=https://llamaindex-faiss-system.zeabur.app
DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here
```

**重要**：確保 `NEXT_PUBLIC_API_URL` 不包含 `/api` 前綴！

### 步驟 2: 推送更新的代碼

確保您的代碼包含最新的配置：

```bash
git add .
git commit -m "Fix Zeabur routing: use direct endpoints"
git push origin main
```

### 步驟 3: 重新部署

在 Zeabur 控制台中：
1. 點擊 "Redeploy" 按鈕
2. 等待部署完成（2-5 分鐘）

### 步驟 4: 驗證修復

部署完成後，運行診斷腳本驗證：

```bash
python scripts/fix_zeabur_routing.py https://llamaindex-faiss-system.zeabur.app
```

## 預期結果

修復成功後，您應該看到：

```
🔍 測試直接 API 端點: https://llamaindex-faiss-system.zeabur.app
  ✅ GET https://llamaindex-faiss-system.zeabur.app/health - 狀態碼: 200
  ✅ GET https://llamaindex-faiss-system.zeabur.app/status - 狀態碼: 200
  ✅ POST https://llamaindex-faiss-system.zeabur.app/auth/register - 狀態碼: 200
  ✅ POST https://llamaindex-faiss-system.zeabur.app/auth/login - 狀態碼: 200
```

## 前端功能測試

修復完成後，請測試以下功能：

1. **訪問前端**：`https://llamaindex-faiss-system.zeabur.app`
2. **註冊用戶**：使用註冊表單創建新用戶
3. **登錄系統**：使用註冊的憑據登錄
4. **上傳文檔**：測試文檔上傳功能
5. **查詢知識庫**：測試查詢功能

## 技術說明

### 為什麼會出現這個問題？

Zeabur 的多服務配置中，路由規則可能沒有正確處理 `/api` 前綴。雖然我們在 `zeabur.toml` 中配置了路由規則，但實際部署中可能沒有生效。

### 為什麼直接端點有效？

直接端點（如 `/auth/register`）可以通過 Zeabur 的默認路由機制訪問到 API 服務，而 `/api/auth/register` 則無法正確路由。

### 配置變更說明

我們將前端配置從：
```typescript
// 之前（有問題）
REGISTER: `${API_BASE_URL}/api/auth/register`

// 現在（修復後）
REGISTER: `${API_BASE_URL}/auth/register`
```

## 故障排除

### 如果仍然出現 404 錯誤

1. **檢查環境變數**：
   - 確保 `NEXT_PUBLIC_API_URL` 不包含 `/api`
   - 確保沒有多餘的空格或特殊字符

2. **檢查服務狀態**：
   - 在 Zeabur 控制台中查看兩個服務是否都在運行
   - 檢查服務日誌是否有錯誤

3. **重新部署**：
   - 推送代碼到 GitHub
   - 在 Zeabur 中重新部署

### 如果出現 CORS 錯誤

確保以下環境變數已設置：
```bash
FRONTEND_URL=https://llamaindex-faiss-system.zeabur.app
ALLOW_ALL_ORIGINS=true
```

## 監控和維護

修復完成後，建議：

1. **定期檢查**：使用診斷腳本定期檢查服務狀態
2. **監控日誌**：在 Zeabur 控制台中查看服務日誌
3. **備份配置**：保存正確的環境變數配置

## 聯繫支持

如果按照上述步驟仍然無法解決問題，請提供：

1. 診斷腳本的完整輸出
2. Zeabur 控制台中的錯誤日誌
3. 環境變數的設置截圖

這樣我可以提供更具體的幫助。 