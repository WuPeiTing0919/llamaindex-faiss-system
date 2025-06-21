@echo off
setlocal EnableDelayedExpansion

echo ======================================================
echo   LlamaIndex + FAISS 知識庫系統 - 僅前端
echo ======================================================

:: 檢查是否已安裝依賴
if not exist "node_modules" (
    echo [前端] 安裝依賴中...
    call npm install --legacy-peer-deps
)

:: 設定環境變數
set NEXT_PUBLIC_API_URL=http://localhost:8000

:: 啟動前端
echo [前端] 啟動前端服務...
echo [提示] 請確保後端API服務已在 http://localhost:8000 運行
echo.
echo ======================================================

npx next dev 