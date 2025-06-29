# 雲端部署指南

本指南將幫助您將應用部署到 Vercel (前端) 和 Zeabur (後端)。

## 📋 部署前準備

1. **獲取 API 密鑰**
   - DeepSeek API Key (必需)
   - OpenAI API Key (可選)
   - Anthropic API Key (可選)

2. **準備 Git 倉庫**
   - 確保代碼已推送到 GitHub/GitLab
   - 確保 `.env` 文件不在版本控制中

## 🚀 Zeabur 後端部署

### 步驟 1: 創建 Zeabur 項目
1. 訪問 [Zeabur](https://zeabur.com)
2. 登入並創建新項目
3. 連結您的 Git 倉庫

### 步驟 2: 配置環境變數
在 Zeabur 項目設置中添加以下環境變數：

```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
EMBEDDING_MODEL=BAAI/bge-base-zh
MODEL_NAME=deepseek-chat
FRONTEND_URL=https://your-vercel-app.vercel.app
ALLOW_ALL_ORIGINS=true
```

### 步驟 3: 部署設置
- Zeabur 會自動檢測 `zeabur.toml` 配置
- 確保服務類型為 Python
- 啟動命令：`python scripts/start_zeabur.py`

### 步驟 4: 獲取後端 URL
部署成功後，記下後端 API URL（類似 `https://your-app-id.zeabur.app`）

## 🌐 Vercel 前端部署

### 步驟 1: 創建 Vercel 項目
1. 訪問 [Vercel](https://vercel.com)
2. 從 Git 導入項目
3. 選擇 Next.js 框架

### 步驟 2: 配置環境變數
**重要：** 在 Vercel 項目設置中添加環境變數：

1. 進入 Vercel 項目儀表板
2. 點擊 "Settings" 選項卡
3. 選擇 "Environment Variables"
4. 添加以下變數：

```
Name: NEXT_PUBLIC_API_URL
Value: https://your-zeabur-api.zeabur.app
Environment: Production, Preview, Development
```

```
Name: NODE_ENV
Value: production
Environment: Production
```

**⚠️ 注意事項：**
- 將 `your-zeabur-api.zeabur.app` 替換為你實際的 Zeabur 後端域名
- 確保 URL 不包含尾隨斜槓 `/`
- 環境變數名稱必須完全一致（區分大小寫）

### 步驟 3: 構建設置
- Framework Preset: Next.js
- Build Command: `npm run build`
- Install Command: `npm install --legacy-peer-deps`

### 步驟 4: 部署
- 點擊 Deploy 按鈕
- 等待構建完成

## 🔗 連接前後端

### 更新後端 CORS 設置
回到 Zeabur，更新環境變數：

```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### 測試連接
1. 打開前端 URL
2. 嘗試註冊/登入
3. 上傳文檔並查詢

## 🛠️ 故障排除

### 常見問題

1. **混合內容錯誤 (Mixed Content Error)**
   ```
   Mixed Content: The page at 'https://your-app.vercel.app/' was loaded over HTTPS, 
   but requested an insecure resource 'http://...:8000/...'
   ```
   **原因：** `NEXT_PUBLIC_API_URL` 環境變數未正確設置
   
   **解決方案：**
   - 在 Vercel 設置中添加 `NEXT_PUBLIC_API_URL=https://your-zeabur-api.zeabur.app`
   - 確保使用 HTTPS 協議
   - 重新部署應用
   - 清除瀏覽器緩存

2. **CORS 錯誤**
   - 檢查 `FRONTEND_URL` 環境變數
   - 確保 URL 沒有尾隨斜槓

3. **API 連接失敗**
   - 檢查 `NEXT_PUBLIC_API_URL` 環境變數
   - 確保後端服務正在運行
   - 測試後端健康檢查：`curl https://your-api.zeabur.app/health`

4. **模型 API 錯誤**
   - 檢查 API 密鑰是否正確
   - 檢查 API 配額是否充足

5. **文件上傳失敗**
   - 檢查文件大小是否超過 500MB
   - 檢查後端存儲空間

### 調試步驟

1. **檢查後端日誌**
   ```bash
   # 在 Zeabur 控制面板查看服務日誌
   ```

2. **檢查前端控制台**
   ```javascript
   // 打開瀏覽器開發者工具
   // 查看 Network 和 Console 標籤
   ```

3. **測試 API 端點**
   ```bash
   curl https://your-zeabur-api.zeabur.app/health
   ```

## 📚 環境變數參考

### 後端 (Zeabur)
| 變數名 | 必需 | 說明 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API 密鑰 |
| `OPENAI_API_KEY` | ❌ | OpenAI API 密鑰 |
| `ANTHROPIC_API_KEY` | ❌ | Anthropic API 密鑰 |
| `FRONTEND_URL` | ✅ | 前端域名 |
| `EMBEDDING_MODEL` | ❌ | 嵌入模型名稱 |
| `ALLOW_ALL_ORIGINS` | ❌ | 允許所有來源 |

### 前端 (Vercel)
| 變數名 | 必需 | 說明 |
|--------|------|------|
| `NEXT_PUBLIC_API_URL` | ✅ | 後端 API URL |
| `NODE_ENV` | ❌ | 環境模式 |

## 🎯 部署清單

- [ ] 後端部署到 Zeabur
- [ ] 配置後端環境變數
- [ ] 獲取後端 URL
- [ ] 前端部署到 Vercel
- [ ] 配置前端環境變數
- [ ] 更新後端 CORS 設置
- [ ] 測試完整功能
- [ ] 配置自定義域名（可選）

## 📞 支援

如果遇到問題，請檢查：
1. 環境變數配置
2. 服務日誌
3. API 密鑰有效性
4. 網絡連接

成功部署後，您的知識庫系統就可以在雲端運行了！🎉 