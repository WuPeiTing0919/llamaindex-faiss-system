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

# 確保工作目錄正確
os.chdir(current_dir)
print(f"📍 當前工作目錄: {os.getcwd()}")

# 檢查必要文件
auth_server_path = current_dir / 'auth_api_server.py'
if not auth_server_path.exists():
    print(f"❌ auth_api_server.py 文件不存在: {auth_server_path}")
    sys.exit(1)

print(f"✓ 找到 auth_api_server.py: {auth_server_path}")

# 確保舊的 api_server.py 不存在
old_server_path = current_dir / 'api_server.py'
if old_server_path.exists():
    print(f"⚠️ 檢測到舊的 api_server.py 文件，請將其重命名或刪除")

# 啟動應用
print("🚀 啟動 FastAPI 應用 (支持用戶認證版本)...")

try:
    # 明確導入認證版 API 服務器
    from auth_api_server import app
    import uvicorn
    
    # 驗證導入的應用版本
    print(f"✓ 成功導入應用: {app.title}")
    print(f"✓ 應用版本: {app.version}")
    
    # 獲取端口
    port = int(os.getenv('PORT', 8000))
    print(f"✓ 監聽端口: {port}")
    
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
    
except ImportError as e:
    print(f"❌ 導入 auth_api_server 失敗: {e}")
    print("檢查文件是否存在以及依賴是否安裝")
    import traceback
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ 啟動失敗: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1) 