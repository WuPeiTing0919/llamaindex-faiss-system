# Vercel (前端) + Zeabur (後端) 部署指南

## 概述

本指南說明如何將您的 Next.js 前端部署到 Vercel，並將 FastAPI 後端部署到 Zeabur。這是一個高效且常見的部署策略。

## 架構

-   **前端 (Frontend)**: Next.js 應用，託管於 Vercel。
-   **後端 (Backend)**: FastAPI 應用，託管於 Zeabur。

## 核心問題：跨域通信 (CORS)

要讓這個架構成功運作，最關鍵的是解決瀏覽器的**同源策略 (Same-Origin Policy)** 限制。前端的 Vercel URL 和後端的 Zeabur URL 不同，因此瀏覽器會阻止前端直接發送 API 請求到後端，除非後端明確許可。

這需要雙向配置：
1.  **前端**需要知道後端的地址。
2.  **後端**需要將前端的地址加入允許列表 (CORS)。

---

## 部署與設定步驟

### 步驟 1: 部署後端到 Zeabur

1.  **登入 Zeabur**:
    -   確保您的 `zeabur.toml` 包含 `[services.api]` 的配置。
    -   將代碼推送到 GitHub。

2.  **設定環境變數**:
    在 Zeabur 專案的 `Variables` 頁面，為 `api` 服務設定以下變數：

    -   `DEEPSEEK_API_KEY`: 您的 DeepSeek API 金鑰。
    -   `FRONTEND_URL`: **[重要]** 您的 Vercel 前端 URL。例如: `https://your-app-name.vercel.app`。
    -   `ALLOW_ALL_ORIGINS`: 為了安全，建議設為 `false`，但測試時可設為 `true`。
    -   `EMBEDDING_MODEL`: `BAAI/bge-base-zh`
    -   `MODEL_NAME`: `deepseek-chat`

3.  **重新部署**:
    -   設定完畢後，重新部署 `api` 服務。
    -   部署完成後，您的 API 應該可以透過 `https://llamaindex-faiss-system.zeabur.app` 訪問。

### 步驟 2: 部署前端到 Vercel

1.  **登入 Vercel**:
    -   使用您的 GitHub 帳號登入。
    -   選擇 "Add New..." -> "Project"。
    -   選擇您的專案倉庫並匯入。

2.  **設定環境變數**:
    在 Vercel 專案的 `Settings` -> `Environment Variables` 頁面，設定以下變數：

    -   `NEXT_PUBLIC_API_URL`: **[重要]** 您的 Zeabur 後端 URL。值為: `https://llamaindex-faiss-system.zeabur.app`

    > **注意**: `NEXT_PUBLIC_` 前綴是 Next.js 的要求，這樣這個環境變數才能在瀏覽器端的程式碼中被讀取。

3.  **部署**:
    -   點擊 "Deploy"。Vercel 會自動開始構建和部署您的 Next.js 應用。
    -   部署完成後，您會獲得一個 Vercel URL (例如 `https://your-app-name.vercel.app`)。**請確保這個 URL 與您在 Zeabur 中設定的 `FRONTEND_URL` 完全一致！**

---

## 故障排除

### 問題: 註冊或登入時出現 404 Not Found 或 CORS 錯誤

這是最常見的問題，通常由以下原因造成：

1.  **Zeabur 端的 `FRONTEND_URL` 錯誤**:
    -   **檢查拼寫**: 確保是 `FRONTEND_URL`。
    -   **檢查 URL**: 確保值是您 Vercel 的**完整且正確**的 URL，包含 `https://`。
    -   **重新部署**: 修改後一定要重新部署 Zeabur 的 `api` 服務。

2.  **Vercel 端的 `NEXT_PUBLIC_API_URL` 錯誤**:
    -   **檢查 URL**: 確保值是您 Zeabur 的 URL，**不**包含任何 `/api` 或其他路徑。
    -   **檢查前綴**: 確保變數名稱是 `NEXT_PUBLIC_API_URL`。
    -   **重新部署**: 修改後一定要重新部署 Vercel 的應用。

3.  **部署未生效**:
    -   有時候環境變數的更新需要一點時間。請在兩邊都重新部署後，等待 5-10 分鐘，並清除瀏覽器快取後再試一次。

### 驗證工具

您可以使用 `curl` 或 Postman 等工具直接測試後端 API 是否正常運作：
```bash
# 測試健康檢查
curl https://llamaindex-faiss-system.zeabur.app/health

# 測試註冊 (預期會收到一個錯誤，因為 email 已存在或請求格式不對，但不是 404)
curl -X POST https://llamaindex-faiss-system.zeabur.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password"}'
```
如果 `curl` 可以正常返回，但瀏覽器不行，那幾乎可以肯定是 CORS 問題（即 `FRONTEND_URL` 設置錯誤）。 