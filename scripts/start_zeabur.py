#!/usr/bin/env python3
"""
Zeabur 專用啟動腳本
確保應用在雲端環境中正確運行
"""

import os
import sys
from pathlib import Path

# 設置環境變數
os.environ.setdefault('PYTHONPATH', '/app')
os.environ.setdefault('PYTHONUNBUFFERED', '1')

# 添加項目根目錄到 Python 路徑
current_dir = Path(__file__).parent
root_dir = current_dir.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(current_dir))

# 創建必要的目錄
required_dirs = [
    root_dir / 'user_documents',
    root_dir / 'user_indexes', 
    root_dir / 'logs'
]

for dir_path in required_dirs:
    dir_path.mkdir(exist_ok=True)
    print(f"✓ 創建目錄: {dir_path}")

# 設置環境變數
if not os.getenv('DEEPSEEK_API_KEY'):
    print("⚠️  警告: DEEPSEEK_API_KEY 環境變數未設置")

if not os.getenv('FRONTEND_URL'):
    print("⚠️  警告: FRONTEND_URL 環境變數未設置")

# 啟動應用
print("🚀 啟動 FastAPI 應用...")

try:
    from auth_api_server import app
    import uvicorn
    
    # 獲取端口
    port = int(os.getenv('PORT', 8000))
    
    # 配置 uvicorn 
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        timeout_keep_alive=300,
        timeout_graceful_shutdown=300,
        limit_max_requests=1000,
        limit_concurrency=100,
        access_log=True,
        log_level="info"
    )
    
except Exception as e:
    print(f"❌ 啟動失敗: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1) 