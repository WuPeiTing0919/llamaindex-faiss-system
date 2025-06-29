# 企業知識庫系統 Docker 配置 - 修復版本
FROM python:3.11-slim

WORKDIR /app

# 安裝系統依賴和構建工具
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# 升級 pip 和安裝構建工具
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# 設置環境變數
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV TORCH_HOME=/app/.cache/torch
ENV HF_HOME=/app/.cache/huggingface

# 首先安裝 PyTorch 2.1+ (CPU 版本，適合雲端部署)
RUN pip install --no-cache-dir torch==2.1.0+cpu torchvision==0.16.0+cpu torchaudio==2.1.0+cpu --index-url https://download.pytorch.org/whl/cpu

# 複製依賴文件
COPY scripts/requirements-docker-minimal.txt ./requirements.txt

# 安裝其他依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用代碼
COPY scripts/ ./scripts/
COPY documents/ ./documents/

# 創建預設的 .env 文件
RUN echo "# 默認環境配置\n\
EMBEDDING_MODEL=BAAI/bge-base-zh\n\
MODEL_NAME=deepseek-chat\n\
PYTHONPATH=/app\n\
PYTHONUNBUFFERED=1" > .env

# 創建必要目錄
RUN mkdir -p user_documents user_indexes logs faiss_index .cache/torch .cache/huggingface

# 設置權限
RUN chmod -R 755 /app

# 暴露端口 - 使用環境變數
EXPOSE 8080

# 健康檢查 - 給更多時間讓 AI 模型載入，使用動態端口
HEALTHCHECK --interval=45s --timeout=15s --start-period=180s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8080}/health || curl -f http://localhost:${PORT:-8080}/ || exit 1

# 運行容器優化版啟動腳本
CMD ["python", "scripts/start_server.py"] 