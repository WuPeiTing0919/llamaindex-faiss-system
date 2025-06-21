# LlamaIndex + FAISS 企業知識庫系統

基於 LlamaIndex、FAISS 和 DeepSeek LLM 的企業級知識庫系統，提供文檔索引、語義搜索和智能問答功能。

## 系統功能

- 🔍 **文檔索引與檢索**: 使用 FAISS 高效向量索引
- 💡 **語義搜索**: 基於 BGE 中文嵌入模型
- 🤖 **智能問答**: 基於 DeepSeek LLM 生成回答
- 📊 **前端界面**: 現代化 Next.js 界面
- 🛡️ **本地部署**: 保障數據安全與隱私

## 快速開始

### 系統要求

- Python 3.10+
- Node.js 16+
- 網絡連接（用於下載模型）

### 一鍵啟動（推薦方式）

我們提供了方便的啟動腳本，可以一鍵啟動整個系統:

#### Windows 用戶

```
# 直接雙擊運行 run.bat
# 或從命令行運行
run.bat
```

#### Linux/macOS 用戶

```bash
# 賦予執行權限
chmod +x run.sh

# 運行腳本
./run.sh
```

### 訪問系統

啟動成功後，可以通過以下地址訪問:

- 前端界面: http://localhost:3000
- API 服務: http://localhost:8000
- API 文檔: http://localhost:8000/docs

## 手動啟動

如果您需要分別啟動前端和後端服務:

### 啟動後端

```bash
# 創建虛擬環境
python -m venv venv

# 啟動虛擬環境
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

# 安裝依賴
pip install -r scripts/requirements.txt

# 初始化知識庫
python scripts/setup_knowledge_base.py

# 啟動 API 服務器
python scripts/api_server.py
```

### 啟動前端

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

## 配置

系統配置在 `.env` 文件中，主要配置項:

- `DEEPSEEK_API_KEY`: DeepSeek API 密鑰
- `MODEL_NAME`: LLM 模型名稱
- `EMBEDDING_MODEL`: 嵌入模型名稱
- `NEXT_PUBLIC_API_URL`: 前端連接的 API 位址，預設為 `http://localhost:8000`

## 文檔上傳

可以通過以下方式上傳文檔:

1. 通過 Web 界面上傳
2. 直接將文件放入 `documents` 目錄

支持的文檔格式: PDF、TXT、DOCX、MD

## 部署

系統可以通過 Docker 部署:

```bash
# 創建 Docker 鏡像
docker-compose build

# 啟動服務
docker-compose up -d
```

更多部署選項，請參考 `docs/` 目錄下的文檔:

- [Vercel 部署指南](docs/VERCEL_DEPLOYMENT.md)
- [Zeabur 部署指南](docs/ZEABUR_DEPLOYMENT.md)
