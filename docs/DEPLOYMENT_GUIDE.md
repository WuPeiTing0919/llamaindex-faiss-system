# 部署指南：Vercel (前端) + Zeabur (後端) - API 代理模式

## 概述

**這是目前最推薦的部署架構。**

本指南說明如何將您的 Next.js 前端部署到 Vercel，FastAPI 後端部署到 Zeabur，並使用 Next.js 的 API Route 作為代理 (Proxy)。這個架構可以徹底解決跨域 (CORS) 問題，並提高應用程式的安全性與穩定性。

## 架構原理

1.  **使用者** -> **Vercel 前端**: 使用者在瀏覽器中與 Vercel 上的 Next.js 應用互動。
2.  **Vercel 前端** -> **Vercel API 代理**: 當需要呼叫 API 時，前端會向自己的相對路徑 (例如 `/api/auth/login`) 發送請求。
3.  **Vercel API 代理** -> **Zeabur 後端**: Vercel 伺服器收到請求後，會將其安全地轉發到您部署在 Zeabur 上的真實後端服務。
4.  **Zeabur 後端** -> **Vercel API 代理**: Zeabur 處理請求後，將結果返回給 Vercel。
5.  **Vercel API 代理** -> **Vercel 前端**: Vercel 將最終結果傳回給使用者的瀏覽器。

![API Proxy Architecture Diagram](https://i.imgur.com/uR3eG0M.png)

---

## 部署與設定步驟

### 步驟 1: 部署後端到 Zeabur

您的 Zeabur 部署現在變得更簡單了。

1.  **登入 Zeabur**:
    -   確保您的代碼已推送到 GitHub。
    -   在 Zeabur 上連接您的專案。

2.  **設定環境變數**:
    在 Zeabur `api` 服務的 `Variables` 頁面，您**只需要**設定：

    -   `DEEPSEEK_API_KEY`: 您的 DeepSeek API 金鑰。

    > 注意：`FRONTEND_URL` 和 `ALLOW_ALL_ORIGINS` 變數在這個架構下已不再需要，因為 CORS 問題已從根本上解決。

3.  **部署與取得 URL**:
    -   重新部署 `api` 服務。
    -   部署成功後，複製您的 Zeabur 服務 URL。這將是您的 **後端 API URL**，例如：`https://llamaindex-faiss-system.zeabur.app`

### 步驟 2: 部署前端到 Vercel

1.  **登入 Vercel**:
    -   匯入您的 GitHub 專案。

2.  **設定環境變數**:
    在 Vercel 專案的 `Settings` -> `Environment Variables` 頁面，設定以下**唯一且重要**的變數：

    -   **變數名稱**: `BACKEND_API_URL`
    -   **變數值**: 貼上您在上一步從 Zeabur 複製的 **後端 API URL**。
      (例如: `https://llamaindex-faiss-system.zeabur.app`)

    > **重要**:
    > - 這個變數**沒有** `NEXT_PUBLIC_` 前綴。這意味著它是一個伺服器端變數，不會洩漏到瀏覽器，非常安全。
    > - 我們程式碼中的 API 代理 (`app/api/[...path]/route.ts`) 會讀取這個變數來知道要將請求轉發到哪裡。

3.  **部署**:
    -   設定完環境變數後，觸發一次新的部署 (Redeploy)。
    -   等待部署完成。

---

## 驗證與測試

部署完成後，您的應用程式應該就能正常運作了。

1.  打開您 Vercel 的前端網址。
2.  嘗試註冊一個新帳號。
3.  嘗試登入、上傳文件、進行查詢。

所有功能現在都應該可以順利執行，並且再也不會遇到 404 或 CORS 錯誤。

## 故障排除

如果仍然遇到問題，請檢查以下幾點：

1.  **Vercel 環境變數**:
    -   變數名稱是否**完全**是 `BACKEND_API_URL`？
    -   變數的值是否是**正確**的 Zeabur URL，並且**不包含**任何結尾的斜線 (`/`)？

2.  **Zeabur 服務日誌**:
    -   登入 Zeabur，查看 `api` 服務的即時日誌 (Runtime Logs)。
    -   當您在前端操作時，觀察日誌中是否有傳入請求的紀錄。如果沒有，表示 Vercel 的請求沒有成功到達 Zeabur。

3.  **Vercel 服務日誌**:
    -   在 Vercel 儀表板中，查看專案的 "Functions" 日誌。
    -   如果在 API 代理中有任何錯誤（例如 `BACKEND_API_URL` 沒讀到），這裡會顯示錯誤訊息。

這個「API 代理」架構是解決您問題的最可靠方法，也是現代網頁應用程式的標準實踐。 