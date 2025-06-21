# LlamaIndex + FAISS 企業知識庫系統

基於 LlamaIndex、FAISS 和 DeepSeek LLM 的企業級知識庫系統，提供文檔索引、語義搜索和智能問答功能。

## 🆕 新功能：個人會員中心

**重要更新**：系統現在支持用戶認證和個人文檔隔離！

- 🔐 **用戶認證系統**：支持用戶註冊、登入和個人資料管理
- 🛡️ **文檔隔離**：每個用戶只能看到和管理自己的文檔
- 👤 **個人知識庫**：每個用戶擁有獨立的向量索引和文檔存儲
- 🔒 **資安保障**：完全隔離的用戶數據，保障隱私安全

## 系統功能

- 🔍 **文檔索引與檢索**: 使用 FAISS 高效向量索引
- 💡 **語義搜索**: 基於 BGE 中文嵌入模型
- 🤖 **智能問答**: 基於 DeepSeek LLM 生成回答
- 📊 **前端界面**: 現代化 Next.js 界面
- 🛡️ **本地部署**: 保障數據安全與隱私
- 👥 **用戶管理**: 完整的用戶認證和權限管理

## 快速開始

### 系統要求

- Python 3.10+
- Node.js 16+
- 網絡連接（用於下載模型）

### 一鍵啟動（推薦方式）

我們提供了兩種啟動方式：

#### 1. 支持用戶認證的版本（推薦）

**Windows 用戶**
```
# 直接雙擊運行 run_auth.bat
# 或從命令行運行
run_auth.bat
```

**Linux/macOS 用戶**
```bash
# 賦予執行權限
chmod +x run_auth.sh

# 運行腳本
./run_auth.sh
```

#### 2. 原始版本（無認證）

**Windows 用戶**
```
# 直接雙擊運行 run.bat
# 或從命令行運行
run.bat
```

**Linux/macOS 用戶**
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

## 用戶認證功能

### 註冊新用戶

1. 訪問系統首頁
2. 點擊「立即註冊」
3. 填寫用戶名、郵箱、密碼等信息
4. 完成註冊後自動登入

### 登入系統

1. 訪問系統首頁
2. 輸入用戶名和密碼
3. 點擊登入

### 個人知識庫

登入後，您可以：

- **智能問答**：基於您上傳的文檔進行智能問答
- **文檔管理**：上傳、查看、刪除個人文檔
- **個人資料**：查看和修改個人信息

### 文檔隔離

- 每個用戶的文檔完全隔離
- 只能看到和管理自己的文檔
- 獨立的向量索引，確保數據安全

## 手動啟動

如果您需要分別啟動前端和後端服務:

### 啟動支持認證的後端

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

# 啟動支持認證的 API 服務器
python scripts/auth_api_server.py
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
- `DATABASE_URL`: 數據庫連接字符串
- `SECRET_KEY`: JWT 簽名密鑰（請在生產環境中更改）

## 文檔上傳

支持認證的版本中，用戶可以：

1. 登入後在「文檔管理」頁面上傳
2. 支持 TXT、MD、PDF、DOCX 格式
3. 文檔自動建立向量索引
4. 只能看到和管理自己的文檔

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

## 安全特性

### 用戶認證
- JWT Token 認證
- 密碼加密存儲
- 會話管理

### 數據隔離
- 用戶文檔完全隔離
- 獨立的向量索引
- 數據庫級別的權限控制

### 隱私保護
- 本地部署，數據不離開您的服務器
- 用戶只能訪問自己的文檔
- 完整的審計日誌

## 技術架構

### 後端技術棧
- **FastAPI**: Web 框架
- **SQLAlchemy**: ORM 和數據庫管理
- **SQLite**: 用戶數據存儲
- **JWT**: 用戶認證
- **FAISS**: 向量索引
- **LlamaIndex**: 文檔處理
- **DeepSeek**: LLM 服務

### 前端技術棧
- **Next.js 15**: React 框架
- **React 19**: UI 庫
- **Shadcn UI**: 組件庫
- **Tailwind CSS**: 樣式框架
- **TypeScript**: 類型安全

## 版本歷史

### v2.0.0 (最新)
- ✅ 新增用戶認證系統
- ✅ 實現文檔隔離
- ✅ 個人會員中心
- ✅ 完整的權限管理
- ✅ 安全增強

### v1.0.0
- ✅ 基礎知識庫功能
- ✅ FAISS 向量搜索
- ✅ DeepSeek LLM 集成
- ✅ Next.js 前端界面
