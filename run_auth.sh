#!/bin/bash

echo "=== LlamaIndex-FAISS 知識庫系統 (支持用戶認證) ==="
echo "正在啟動整合系統..."

# 檢查 Python
if ! command -v python3 &> /dev/null; then
    echo "錯誤: 未找到 Python3。請安裝 Python 3.10 或更高版本。"
    exit 1
fi

# 執行主腳本
python3 run_auth_all.py 