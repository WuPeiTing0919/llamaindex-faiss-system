# Zeabur 部署指南

## 概述

本指南將幫助您在 Zeabur 平台上部署支持用戶認證的 LlamaIndex + FAISS 知識庫系統。

## 系統要求

- Python 3.11+
- Node.js 18+
- 至少 1GB RAM
- 至少 2GB 存儲空間

## 部署步驟

### 1. 準備環境變數

在 Zeabur 控制台中設置以下環境變數：

```bash
# DeepSeek API 配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 前端 URL (部署後更新)
NEXT_PUBLIC_API_URL=https://your-app-name.zeabur.app/api
FRONTEND_URL=https://your-app-name.zeabur.app

# 可選：允許所有來源 (開發用)
ALLOW_ALL_ORIGINS=true
```

**重要**: `NEXT_PUBLIC_API_URL` 應該指向 API 服務的 URL，通常是 `https://your-app-name.zeabur.app/api`

### 2. 部署到 Zeabur

1. 將代碼推送到 GitHub 倉庫
2. 在 Zeabur 中連接 GitHub 倉庫
3. 選擇 "Deploy from Git"
4. 等待部署完成

### 3. 配置服務

系統會自動部署兩個服務：

- **Web 服務** (Next.js 前端) - 端口 3000
- **API 服務** (FastAPI 後端) - 端口 8000

### 4. 驗證部署

1. 訪問前端 URL: `https://your-app-name.zeabur.app`
2. 註冊新用戶
3. 上傳測試文檔
4. 測試查詢功能

## 故障排除

### 常見問題

#### 1. Python 版本錯誤
```
ERROR: Ignored the following versions that require a different python version
```

**解決方案：**
- 確保 `zeabur.toml` 中設置了 `pythonVersion = "3.11"`
- 使用 `requirements-zeabur.txt` 而不是 `requirements.txt`

#### 2. sqlite3 模組錯誤
```
ERROR: No matching distribution found for sqlite3
```

**解決方案：**
- `sqlite3` 是 Python 內建模組，已從 requirements 文件中移除
- 確保使用最新的 `requirements-zeabur.txt`

#### 3. 依賴版本衝突
```
ERROR: Could not find a version that satisfies the requirement
```

**解決方案：**
- 使用 `requirements-zeabur.txt` 中的固定版本
- 避免使用 `>=` 版本標記

#### 4. 內存不足
```
MemoryError: Unable to allocate array
```

**解決方案：**
- 升級 Zeabur 計劃以獲得更多 RAM
- 使用較小的嵌入模型

#### 5. API 連接問題 (404 錯誤)
```
POST https://your-app-name.zeabur.app/auth/register 404 (Not Found)
```

**解決方案：**
1. **檢查環境變數**：
   ```bash
   NEXT_PUBLIC_API_URL=https://your-app-name.zeabur.app/api
   FRONTEND_URL=https://your-app-name.zeabur.app
   ```

2. **檢查服務狀態**：
   - 在 Zeabur 控制台中檢查 API 服務是否正常運行
   - 查看服務日誌是否有錯誤

3. **測試 API 端點**：
   ```bash
   curl https://your-app-name.zeabur.app/api/health
   ```

4. **重新部署**：
   - 推送新的代碼到 GitHub
   - 在 Zeabur 中重新部署

#### 6. CORS 錯誤
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**解決方案：**
- 確保 `ALLOW_ALL_ORIGINS=true` 環境變數已設置
- 檢查 `zeabur.toml` 中的 CORS 配置

### 日誌檢查

在 Zeabur 控制台中檢查服務日誌：

1. 進入服務詳情頁面
2. 點擊 "Logs" 標籤
3. 查看錯誤信息

### 服務連接測試

部署完成後，請測試以下端點：

```bash
# 健康檢查
curl https://your-app-name.zeabur.app/api/health

# API 根路徑
curl https://your-app-name.zeabur.app/api/

# 註冊端點 (POST)
curl -X POST https://your-app-name.zeabur.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password"}'
```

### 性能優化

1. **使用較小的模型：**
   ```python
   EMBEDDING_MODEL = "BAAI/bge-small-zh"  # 替代 bge-base-zh
   ```

2. **限制並發請求：**
   ```python
   # 在 auth_api_server.py 中添加
   import asyncio
   semaphore = asyncio.Semaphore(5)  # 限制並發數
   ```

3. **啟用緩存：**
   ```python
   # 使用 Redis 或內存緩存
   from functools import lru_cache
   ```

## 監控和維護

### 健康檢查

系統提供健康檢查端點：
- `GET /api/health` - 基本健康狀態
- `GET /api/status` - 用戶系統狀態

### 數據備份

重要數據存儲在持久化卷中：
- `/app/user_documents` - 用戶文檔
- `/app/user_indexes` - 向量索引
- `/app/logs` - 系統日誌

### 擴展建議

1. **添加 Redis 緩存**
2. **使用 PostgreSQL 替代 SQLite**
3. **實現負載均衡**
4. **添加監控和警報**

## 安全注意事項

1. **API 密鑰安全：**
   - 不要在代碼中硬編碼 API 密鑰
   - 使用環境變數存儲敏感信息

2. **用戶認證：**
   - 所有 API 端點都需要認證
   - 使用 JWT 令牌進行身份驗證

3. **文件上傳：**
   - 限制文件大小和類型
   - 掃描上傳文件的安全性

4. **CORS 配置：**
   - 只允許必要的來源
   - 避免使用 `allow_origins=["*"]`

## 聯繫支持

如果遇到問題：

1. 檢查 Zeabur 文檔
2. 查看 GitHub Issues
3. 聯繫技術支持

## 更新日誌

- **v2.0.0** - 添加用戶認證系統
- **v1.1.0** - 優化 Zeabur 部署配置
- **v1.0.0** - 初始版本 