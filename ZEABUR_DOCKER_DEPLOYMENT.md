# 🐳 Zeabur Docker 部署指南

Zeabur 檢測到你的項目有 `Dockerfile`，所以會使用 Docker 方式部署。這是**推薦的部署方式**。

## ✅ 已修復的問題

我已經修正了 `Dockerfile`，現在它會：

1. ✅ 使用 Python 3.11
2. ✅ 安裝正確的依賴 (`requirements-zeabur.txt`)
3. ✅ 啟動認證版 API (`scripts/main.py`)
4. ✅ 移除舊版 API 服務器
5. ✅ 創建必要的目錄結構
6. ✅ 設置正確的環境變數

## 🚀 部署步驟

### 1. 推送代碼到 Git
```bash
git add .
git commit -m "修復 Dockerfile 使用認證版 API"
git push
```

### 2. Zeabur 會自動重新部署
- Zeabur 檢測到代碼變更後會自動觸發重新部署
- 這次會使用修正後的 Dockerfile

### 3. 檢查部署日誌
在 Zeabur 控制面板中查看部署日誌，你應該會看到：
```
🚀 LlamaIndex FAISS 知識庫系統 - Zeabur 部署
✓ 使用認證版 API 服務器: auth_api_server.py
✓ 成功導入應用: 企業知識庫 API 服務運行中 (支持用戶認證)
✓ 應用版本: 2.0.0
```

### 4. 測試 API 端點
部署完成後測試：
```bash
curl https://your-zeabur-app.zeabur.app/health
```

應該返回：
```json
{
  "status": "healthy",
  "timestamp": "2024-..."
}
```

測試根端點：
```bash
curl https://your-zeabur-app.zeabur.app/
```

應該返回：
```json
{
  "message": "企業知識庫 API 服務運行中 (支持用戶認證)",
  "version": "2.0.0"
}
```

## 🔧 環境變數配置

你的 Zeabur 環境變數設置是正確的：

```
ALLOW_ALL_ORIGINS = true
DEEPSEEK_API_KEY = sk-888548c4041b4699b8bcf331f391b73a
EMBEDDING_MODEL = BAAI/bge-base-zh
FRONTEND_URL = https://llamaindex-faiss-system.vercel.app
MODEL_NAME = deepseek-chat
```

**注意：移除 `NEXT_PUBLIC_API_URL`**，這個應該在 Vercel 前端設置。

## 🆚 Docker vs zeabur.toml

| 特性 | Docker 部署 | zeabur.toml 部署 |
|------|-------------|------------------|
| **推薦程度** | ⭐⭐⭐⭐⭐ 推薦 | ⭐⭐⭐ 可用 |
| **構建速度** | 較慢（需要構建映像） | 較快 |
| **可重現性** | 非常好 | 好 |
| **依賴控制** | 完全控制 | 依賴 Zeabur 環境 |
| **調試友好** | 更容易調試 | 較難調試 |
| **部署穩定性** | 更穩定 | 可能有環境差異 |

## 🔄 如果想切換到 zeabur.toml 部署

如果你想使用 `zeabur.toml` 而不是 Docker：

1. 創建 `.zeaburignore` 文件（已包含在項目中）
2. 重新部署

但我**建議繼續使用 Docker 部署**，因為：
- 更穩定可靠
- 環境完全受控
- 依賴版本鎖定
- 更容易排查問題

## 🎯 驗證部署成功

部署成功的標誌：

1. ✅ Zeabur 部署日誌顯示成功
2. ✅ `/health` 端點返回正確響應
3. ✅ `/` 端點顯示認證版本信息
4. ✅ 前端可以正常連接後端
5. ✅ 用戶註冊/登入功能正常

## 🆘 如果還有問題

如果部署後仍然顯示舊版 API 響應：

1. 檢查 Zeabur 部署日誌
2. 確認使用的是新的 Dockerfile
3. 嘗試手動觸發重新部署
4. 檢查環境變數設置

預期的成功響應：
```json
{
  "message": "企業知識庫 API 服務運行中 (支持用戶認證)",
  "version": "2.0.0"
}
``` 