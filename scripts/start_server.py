#!/usr/bin/env python3
"""
容器環境專用啟動腳本
優化啟動時間和錯誤處理
"""

import os
import sys
import time
from pathlib import Path

# 設置基本環境
os.environ.setdefault('PYTHONPATH', '/app')
os.environ.setdefault('PYTHONUNBUFFERED', '1')

def log(message):
    """統一日誌輸出"""
    print(f"[{time.strftime('%H:%M:%S')}] {message}", flush=True)

def main():
    log("🚀 啟動企業知識庫系統（容器模式）")
    
    # 設置工作目錄
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # 添加路徑
    sys.path.insert(0, str(script_dir))
    sys.path.insert(0, str(script_dir.parent))
    
    log(f"📂 工作目錄: {os.getcwd()}")
    log(f"🐍 Python: {sys.version.split()[0]}")
    
    # 創建必要目錄
    for dir_name in ['user_documents', 'user_indexes', 'logs', 'faiss_index']:
        dir_path = Path(dir_name)
        dir_path.mkdir(exist_ok=True)
    
    # 檢查關鍵文件
    if not Path('auth_api_server.py').exists():
        log("❌ auth_api_server.py 不存在")
        return 1
    
    # 獲取配置
    port = int(os.getenv('PORT', 8000))
    host = "0.0.0.0"
    
    log(f"🌐 服務器: {host}:{port}")
    
    try:
        # 導入應用
        log("📦 導入 FastAPI 應用...")
        from auth_api_server import app
        
        log(f"✅ 應用載入成功: {app.title}")
        
        # 啟動服務器
        log("🎯 啟動 Uvicorn 服務器...")
        import uvicorn
        
        # 簡化的 uvicorn 配置，適合容器環境
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
            access_log=True,
            timeout_keep_alive=120,
            timeout_graceful_shutdown=30,
            # 移除可能導致問題的限制設置
        )
        
    except ImportError as e:
        log(f"❌ 導入錯誤: {e}")
        log("💡 可能原因：依賴包未正確安裝")
        return 1
        
    except Exception as e:
        log(f"❌ 啟動錯誤: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 