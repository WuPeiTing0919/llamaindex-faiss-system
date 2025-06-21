#!/bin/bash

# 顏色設定
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================"
echo -e "  LlamaIndex + FAISS 知識庫系統 - 僅前端"
echo -e "======================================================${NC}"

# 檢查是否已安裝依賴
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[前端] 安裝依賴中...${NC}"
    npm install --legacy-peer-deps
fi

# 設定環境變數，可由外部覆蓋
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8000}"

# 啟動前端
echo -e "${GREEN}[前端] 啟動前端服務...${NC}"
echo -e "${YELLOW}[提示] 請確保後端API服務已在 http://localhost:8000 運行${NC}"
echo ""
echo -e "${BLUE}======================================================${NC}"

npx next dev 