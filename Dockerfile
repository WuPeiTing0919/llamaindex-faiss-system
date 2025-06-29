# 企業知識庫系統 Docker 配置 - 支持用戶認證
FROM python:3.11-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 升級 pip 和安裝構建工具
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# 複製依賴文件
COPY scripts/requirements-zeabur.txt ./requirements-zeabur.txt
COPY scripts/requirements-minimal.txt ./requirements-minimal.txt

# 安裝 Python 依賴（帶後備方案）
RUN pip install --no-cache-dir -r requirements-zeabur.txt || \
    (echo "主要依賴安裝失敗，嘗試最小化依賴..." && \
     pip install --no-cache-dir -r requirements-minimal.txt)

# 複製應用代碼
COPY scripts/ ./scripts/
COPY documents/ ./documents/

# 移除舊版 API 服務器（如果存在）
RUN rm -f scripts/api_server.py || true

# 創建預設的 .env 文件
RUN echo "# 默認環境配置\n\
# 實際部署時將被環境變量覆蓋\n\
EMBEDDING_MODEL=BAAI/bge-base-zh\n\
MODEL_NAME=deepseek-chat\n\
PYTHONPATH=/app\n\
PYTHONUNBUFFERED=1" > .env

# 創建必要目錄
RUN mkdir -p user_documents user_indexes logs faiss_index

# 設置環境變數
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 8000

# 運行認證版 API 服務器
CMD ["python", "scripts/main.py"]
