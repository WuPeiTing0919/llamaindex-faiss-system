@echo off
setlocal enabledelayedexpansion

echo === LlamaIndex-FAISS 知識庫系統 (支持用戶認證) ===
echo 正在啟動整合系統...

:: 檢查 Python
python --version > nul 2>&1
if %errorlevel% neq 0 (
  echo 錯誤: 未找到 Python。請安裝 Python 3.10 或更高版本。
  pause
  exit /b 1
)

:: 執行主腳本
python run_auth_all.py

:: 如果腳本退出，保持窗口開啟
echo.
echo 按任意鍵退出...
pause > nul 