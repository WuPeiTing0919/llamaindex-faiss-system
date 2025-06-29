# 🚨 混合內容錯誤快速修復

如果你看到這個錯誤：

```
Mixed Content: The page at 'https://llamaindex-faiss-system.vercel.app/' was loaded over HTTPS, 
but requested an insecure resource 'http://llamaindex-faiss-system.vercel.app:8000/auth/register'
```

## ⚡ 快速解決方案

### 步驟 1: 檢查後端部署
確保你的後端已成功部署到 Zeabur：
1. 登入 [Zeabur](https://zeabur.com)
2. 檢查你的 Python 服務是否在運行
3. 複製後端的 URL（例如：`https://your-api-id.zeabur.app`）

### 步驟 2: 配置 Vercel 環境變數
1. 登入 [Vercel](https://vercel.com)
2. 進入你的項目儀表板
3. 點擊 **Settings** → **Environment Variables**
4. 添加新的環境變數：
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-api-id.zeabur.app` (你的實際 Zeabur URL)
   - **Environment**: 選擇 Production, Preview, Development

### 步驟 3: 重新部署
1. 在 Vercel 儀表板中點擊 **Deployments**
2. 點擊最新部署旁的三個點 `...`
3. 選擇 **Redeploy**
4. 等待部署完成

### 步驟 4: 清除緩存
1. 打開瀏覽器開發者工具 (F12)
2. 右鍵點擊刷新按鈕
3. 選擇「清空緩存並強制重新載入」

## 🔍 驗證修復

1. 打開瀏覽器開發者工具
2. 前往 Console 標籤
3. 刷新頁面
4. 確認沒有混合內容錯誤
5. 嘗試註冊/登入功能

## 📋 檢查清單

- [ ] 後端已部署到 Zeabur
- [ ] 獲得後端 URL (https://...)
- [ ] 在 Vercel 中設置 NEXT_PUBLIC_API_URL
- [ ] 重新部署前端
- [ ] 清除瀏覽器緩存
- [ ] 測試功能正常

## 🆘 仍有問題？

如果問題持續：

1. **檢查環境變數拼寫**：
   - 確保是 `NEXT_PUBLIC_API_URL`（不是 `NEXT_PUBLIC_API_BASE_URL`）
   - 區分大小寫很重要

2. **檢查 URL 格式**：
   - 必須以 `https://` 開頭
   - 不要在結尾加 `/`
   - 例如：`https://api-abc123.zeabur.app`

3. **檢查後端狀態**：
   ```bash
   curl https://your-api-url.zeabur.app/health
   ```
   應該返回：`{"status": "healthy", "timestamp": "..."}`

4. **查看 Vercel 日誌**：
   - 在 Vercel 儀表板的 Functions 標籤查看構建日誌
   - 確認環境變數已正確設置

## 💡 提示

- 環境變數更改後一定要重新部署
- 瀏覽器緩存可能導致舊的配置仍然生效
- 使用無痕模式測試可以避免緩存問題

成功修復後，你的應用應該能正常連接到後端 API！🎉 