# 🔗 前後端連接配置指南

## 🚨 重要：端口變更影響

後端端口已從 **8000** 改為 **8080**，前端需要相應配置。

## 📋 前端工作原理

前端使用 **Next.js API 代理**：
```
用戶請求 → 前端 /api/xxx → 代理到後端 API
```

代理配置位於：`app/api/[...path]/route.ts`

## 🔧 需要設置的環境變數

### Vercel（前端）環境變數

在 Vercel 控制台中設置：

| 變數名 | 值 | 說明 |
|--------|----|----|
| `BACKEND_API_URL` | `https://your-zeabur-domain.zeabur.app` | **主要變數** - 後端 API 地址 |
| `NEXT_PUBLIC_API_URL` | `https://your-zeabur-domain.zeabur.app` | 備用變數 |
| `API_URL` | `https://your-zeabur-domain.zeabur.app` | 第二備用變數 |

**重要**：
- ✅ **不需要指定端口**：Zeabur 會自動處理端口映射
- ✅ 使用 HTTPS：`https://your-domain.zeabur.app`
- ❌ 不要使用：`https://your-domain.zeabur.app:8080`

### Zeabur（後端）環境變數

確保設置了：
```bash
PORT=8080  # 或讓 Zeabur 自動分配
SECRET_KEY=your-secret-jwt-key-here
DEEPSEEK_API_KEY=sk-your-api-key
```

## 🔍 測試連接

### 1. 檢查後端健康狀態
```bash
curl https://your-zeabur-domain.zeabur.app/health
```

應該返回：
```json
{
  "status": "healthy",
  "ai_system": "ready",
  "version": "2.0.0"
}
```

### 2. 測試前端代理
訪問前端，打開瀏覽器開發者工具，檢查網絡請求：
```
前端請求：POST /api/auth/login
實際代理到：POST https://your-zeabur-domain.zeabur.app/auth/login
```

### 3. 檢查錯誤信息
如果代理失敗，前端會顯示詳細錯誤：
```json
{
  "error": "後端 API URL 未配置...",
  "suggestion": "請在 Vercel 控制台設置..."
}
```

## 🛠️ 故障排除

### 錯誤：「後端服務未配置」
**原因**：Vercel 缺少 `BACKEND_API_URL` 環境變數  
**解決**：在 Vercel 控制台添加環境變數並重新部署

### 錯誤：「connection refused」
**原因**：後端地址錯誤或後端未啟動  
**解決**：
1. 檢查 Zeabur 部署狀態
2. 驗證後端地址是否正確
3. 測試後端健康檢查端點

### 錯誤：CORS 問題
**原因**：後端 CORS 配置  
**解決**：後端已配置允許所有來源，無需額外設置

## 📊 配置檢查清單

### ✅ 後端（Zeabur）
- [ ] 應用成功部署
- [ ] 健康檢查通過：`/health`
- [ ] 端口配置：8080（或自動分配）
- [ ] 環境變數：`SECRET_KEY`, `DEEPSEEK_API_KEY`

### ✅ 前端（Vercel）
- [ ] 設置 `BACKEND_API_URL`
- [ ] 重新部署前端
- [ ] 測試 API 代理
- [ ] 檢查瀏覽器網絡請求

## 🔄 部署順序

1. **後端先部署**：確保 Zeabur 後端正常運行
2. **獲取後端地址**：`https://your-domain.zeabur.app`
3. **配置前端**：在 Vercel 設置 `BACKEND_API_URL`
4. **重新部署前端**：觸發 Vercel 重新構建
5. **測試完整流程**：註冊 → 登入 → 上傳文檔 → AI 查詢

## 💡 最佳實踐

1. **環境分離**：開發、測試、生產使用不同的後端地址
2. **健康檢查**：部署後先測試 `/health` 端點
3. **錯誤監控**：關注 Vercel 和 Zeabur 的日誌
4. **安全性**：敏感環境變數設為 Private

## 🌐 完整的 URL 映射

```
用戶訪問：https://your-frontend.vercel.app/
API 請求：https://your-frontend.vercel.app/api/auth/login
代理到：  https://your-backend.zeabur.app/auth/login
```

現在前端和後端的連接已優化，支持多種環境變數配置方式！ 