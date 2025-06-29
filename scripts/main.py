#!/usr/bin/env python3
"""
主程序入口 - Zeabur 部署專用
明確啟動支持用戶認證的 FastAPI 應用
"""

import os
import sys
from pathlib import Path

# 設置環境變數
os.environ.setdefault('PYTHONPATH', '/app')
os.environ.setdefault('PYTHONUNBUFFERED', '1')

# 添加項目路徑
current_dir = Path(__file__).parent
root_dir = current_dir.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(current_dir))

# 確保工作目錄正確
os.chdir(current_dir)

print("=" * 60)
print("🚀 LlamaIndex FAISS 知識庫系統 - Zeabur 部署")
print("=" * 60)
print(f"📍 工作目錄: {os.getcwd()}")
print(f"🐍 Python 版本: {sys.version}")
print(f"📂 項目根目錄: {root_dir}")

# 檢查文件是否存在
auth_server_file = current_dir / 'auth_api_server.py'
old_server_file = current_dir / 'api_server.py'

if old_server_file.exists():
    print(f"⚠️  發現舊版 API 服務器文件: {old_server_file}")
    backup_name = 'api_server_old.py.bak'
    old_server_file.rename(current_dir / backup_name)
    print(f"✓ 已重命名為: {backup_name}")

if not auth_server_file.exists():
    print(f"❌ auth_api_server.py 不存在: {auth_server_file}")
    sys.exit(1)

print(f"✓ 使用認證版 API 服務器: {auth_server_file}")

# 創建必要目錄
required_dirs = [
    root_dir / 'user_documents',
    root_dir / 'user_indexes',
    root_dir / 'logs'
]

for dir_path in required_dirs:
    dir_path.mkdir(exist_ok=True)
    print(f"✓ 目錄已準備: {dir_path}")

# 檢查環境變數
required_env_vars = ['DEEPSEEK_API_KEY', 'FRONTEND_URL']
for var in required_env_vars:
    if os.getenv(var):
        print(f"✓ 環境變數 {var}: 已設置")
    else:
        print(f"⚠️  環境變數 {var}: 未設置")

print("-" * 60)

try:
    # 導入認證版 API 應用
    from auth_api_server import app
    import uvicorn
    
    print(f"✓ 成功導入應用: {app.title}")
    print(f"✓ 應用版本: {app.version}")
    
    # 驗證這是正確的應用版本
    if "支持用戶認證" not in app.title:
        print("❌ 錯誤：導入的不是認證版應用！")
        sys.exit(1)
    
    # 獲取配置
    port = int(os.getenv('PORT', 8000))
    host = "0.0.0.0"
    
    print(f"✓ 服務器地址: {host}:{port}")
    print("=" * 60)
    print("🎯 啟動 FastAPI 服務器...")
    
    # 啟動服務器
    uvicorn.run(
        app,
        host=host,
        port=port,
        timeout_keep_alive=300,
        timeout_graceful_shutdown=300,
        limit_max_requests=1000,
        limit_concurrency=100,
        access_log=True,
        log_level="info"
    )
    
except ImportError as e:
    print(f"❌ 導入失敗: {e}")
    print("\n可能的原因:")
    print("1. auth_api_server.py 文件不存在")
    print("2. Python 依賴未正確安裝")
    print("3. 模塊導入路徑問題")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ 啟動失敗: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1) 