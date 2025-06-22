# Zeabur 部署步驟指南

## 問題背景

您遇到的 404 錯誤是因為 Zeabur 部署配置不正確導致的。本指南將幫助您逐步解決這個問題。

## 步驟 1: 檢查當前狀態

首先，讓我們確認問題：

```bash
python scripts/fix_zeabur_404.py https://llamaindex-faiss-system.zeabur.app/api
```

如果顯示環境變數仍然是 `http://localhost:8000`，則需要修復。

## 步驟 2: 在 Zeabur 控制台中設置環境變數

### 2.1 登錄 Zeabur
1. 訪問 [Zeabur](https://zeabur.com)
2. 登錄您的帳戶
3. 找到您的項目 `llamaindex-faiss-system`

### 2.2 設置環境變數
在項目設置中找到 "Environment Variables" 部分，添加以下變數：

```bash
# 必需環境變數
NEXT_PUBLIC_API_URL=https://llamaindex-faiss-system.zeabur.app/api
FRONTEND_URL=https://llamaindex-faiss-system.zeabur.app
DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here
```

**重要注意事項：**
- 確保 `NEXT_PUBLIC_API_URL` 包含 `/api` 路徑
- 確保沒有多餘的空格或特殊字符
- 確保 `DEEPSEEK_API_KEY` 是您的真實 API 密鑰

## 步驟 3: 推送更新的代碼

確保您的 GitHub 倉庫包含最新的配置：

```bash
# 提交更改
git add .
git commit -m "Fix Zeabur configuration"
git push origin main
```

## 步驟 4: 重新部署

### 4.1 在 Zeabur 中重新部署
1. 在 Zeabur 控制台中點擊 "Redeploy" 按鈕
2. 等待部署完成（通常需要 2-5 分鐘）

### 4.2 檢查部署狀態
在 Zeabur 控制台中：
1. 檢查兩個服務是否都在運行
2. 查看服務日誌是否有錯誤
3. 確認環境變數已正確設置

## 步驟 5: 驗證修復

部署完成後，運行以下測試：

```bash
# 測試 API 連接
python scripts/test_zeabur_connection.py https://llamaindex-faiss-system.zeabur.app/api

# 診斷腳本
python scripts/fix_zeabur_404.py https://llamaindex-faiss-system.zeabur.app/api
```

## 步驟 6: 手動測試

### 6.1 測試 API 端點
在瀏覽器中訪問：
- `https://llamaindex-faiss-system.zeabur.app/api/health`
- `https://llamaindex-faiss-system.zeabur.app/api/status`

### 6.2 測試前端
訪問：
- `https://llamaindex-faiss-system.zeabur.app`

## 常見問題和解決方案

### 問題 1: 環境變數沒有生效
**症狀**: 診斷腳本顯示環境變數仍然是舊值

**解決方案**:
1. 確保在 Zeabur 控制台中正確設置了環境變數
2. 重新部署應用
3. 等待幾分鐘讓變數生效

### 問題 2: API 服務無法啟動
**症狀**: Zeabur 控制台顯示 API 服務錯誤

**解決方案**:
1. 檢查 `DEEPSEEK_API_KEY` 是否正確設置
2. 查看服務日誌中的具體錯誤信息
3. 確保 `scripts/requirements-zeabur.txt` 文件存在

### 問題 3: 前端無法連接到 API
**症狀**: 前端顯示連接錯誤

**解決方案**:
1. 確保 `NEXT_PUBLIC_API_URL` 設置正確
2. 檢查 CORS 配置
3. 確保兩個服務都在運行

## 預期結果

修復成功後，您應該看到：

1. **診斷腳本結果**:
   ```
   ✅ NEXT_PUBLIC_API_URL: https://llamaindex-faiss-system.zeabur.app/api
   ✅ FRONTEND_URL: https://llamaindex-faiss-system.zeabur.app
   ✅ GET /api/health - 狀態碼: 200
   ✅ POST /api/auth/register - 狀態碼: 200
   ✅ POST /api/auth/login - 狀態碼: 200
   ```

2. **前端功能**:
   - 可以正常訪問註冊頁面
   - 可以成功註冊新用戶
   - 可以成功登錄
   - 可以上傳文檔和查詢

## 如果仍然有問題

如果按照上述步驟仍然無法解決問題：

1. **檢查 Zeabur 文檔**: 查看 [Zeabur 官方文檔](https://docs.zeabur.com)
2. **查看服務日誌**: 在 Zeabur 控制台中查看詳細錯誤信息
3. **重新創建項目**: 如果問題持續，考慮重新創建 Zeabur 項目

## 聯繫支持

如果問題仍然存在，請提供：
1. Zeabur 控制台中的錯誤日誌
2. 診斷腳本的完整輸出
3. 環境變數的設置截圖

這樣我可以提供更具體的幫助。 