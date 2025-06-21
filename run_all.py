#!/usr/bin/env python
"""
LlamaIndex-FAISS 知識庫系統啟動腳本
此腳本將同時啟動前端和後端服務
"""

import os
import sys
import time
import threading
import subprocess
import platform
import signal
from pathlib import Path

# 顏色編碼
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# 全局進程
processes = []

def print_banner():
    """打印啟動橫幅"""
    banner = f"""
{Colors.BLUE}{Colors.BOLD}╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  {Colors.GREEN}LlamaIndex + FAISS + DeepSeek LLM 企業知識庫系統{Colors.BLUE}         ║
║                                                          ║
║  {Colors.YELLOW}整合系統啟動器{Colors.BLUE}                                        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝{Colors.ENDC}
"""
    print(banner)

def check_requirements():
    """檢查系統需求"""
    print(f"{Colors.HEADER}[系統] 檢查系統需求...{Colors.ENDC}")
    
    # 檢查 Python 版本
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 10):
        print(f"{Colors.YELLOW}[警告] 推薦使用 Python 3.10 或更高版本，當前版本 {sys.version.split()[0]} 可能需要調整套件兼容性{Colors.ENDC}")
    print(f"{Colors.GREEN}[成功] Python 版本: {sys.version.split()[0]}{Colors.ENDC}")
    
    # 檢查 Node.js
    try:
        node_version = subprocess.check_output(["node", "--version"], text=True).strip()
        print(f"{Colors.GREEN}[成功] Node.js 版本: {node_version}{Colors.ENDC}")
    except (FileNotFoundError, subprocess.SubprocessError):
        print(f"{Colors.RED}[錯誤] 未找到 Node.js。請安裝 Node.js 和 npm{Colors.ENDC}")
        sys.exit(1)
    
    # 檢查必要目錄
    if not Path("documents").exists():
        print(f"{Colors.YELLOW}[警告] 未找到 documents 目錄，正在創建...{Colors.ENDC}")
        Path("documents").mkdir(exist_ok=True)
    
    if not Path("faiss_index").exists():
        print(f"{Colors.YELLOW}[警告] 未找到 faiss_index 目錄，正在創建...{Colors.ENDC}")
        Path("faiss_index").mkdir(exist_ok=True)
    
    # 檢查環境變量文件
    if not Path(".env").exists():
        print(f"{Colors.YELLOW}[警告] 未找到 .env 文件，正在創建默認配置...{Colors.ENDC}")
        with open(".env", "w") as f:
            f.write("""# 環境變數配置
# DeepSeek API 密鑰 (請替換為您的真實密鑰)
DEEPSEEK_API_KEY=sk-your-api-key-here

# 系統配置
MODEL_NAME=deepseek-chat
EMBEDDING_MODEL=BAAI/bge-base-zh
""")
        print(f"{Colors.YELLOW}[警告] 已創建默認 .env 文件，請編輯並設置您的 API 密鑰{Colors.ENDC}")

def setup_backend():
    """設置並準備後端"""
    print(f"{Colors.HEADER}[後端] 設置後端環境...{Colors.ENDC}")
    
    # 檢查虛擬環境
    venv_path = Path("venv")
    activate_script = "activate.bat" if platform.system() == "Windows" else "bin/activate"
    
    if not (venv_path / activate_script).exists():
        print(f"{Colors.YELLOW}[警告] 未找到虛擬環境，正在創建...{Colors.ENDC}")
        try:
            subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        except subprocess.SubprocessError as e:
            print(f"{Colors.RED}[錯誤] 創建虛擬環境失敗: {e}{Colors.ENDC}")
            sys.exit(1)
    
    # 安裝依賴
    if platform.system() == "Windows":
        pip_path = str(venv_path / "Scripts" / "pip")
        python_path = str(venv_path / "Scripts" / "python")
    else:
        pip_path = str(venv_path / "bin" / "pip")
        python_path = str(venv_path / "bin" / "python")
    
    print(f"{Colors.BLUE}[後端] 安裝 Python 依賴...{Colors.ENDC}")
    subprocess.run([pip_path, "install", "--upgrade", "pip"], check=True)
    subprocess.run([pip_path, "install", "-r", "scripts/requirements.txt"], check=True)
    
    print(f"{Colors.GREEN}[後端] 後端環境設置完成{Colors.ENDC}")
    return python_path

def setup_frontend():
    """設置並準備前端"""
    print(f"{Colors.HEADER}[前端] 設置前端環境...{Colors.ENDC}")
    
    # 檢查 node_modules
    if not Path("node_modules").exists():
        print(f"{Colors.BLUE}[前端] 安裝 Node.js 依賴...{Colors.ENDC}")
        subprocess.run(["npm", "install"], check=True)
    
    print(f"{Colors.GREEN}[前端] 前端環境設置完成{Colors.ENDC}")

def run_backend(python_path):
    """運行後端 API 服務器"""
    print(f"{Colors.BLUE}[後端] 啟動 API 服務器...{Colors.ENDC}")
    
    # 首先嘗試創建知識庫
    setup_process = subprocess.Popen(
        [python_path, "scripts/setup_knowledge_base.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )
    processes.append(setup_process)
    
    # 打印輸出
    for line in setup_process.stdout:
        print(f"{Colors.YELLOW}[知識庫] {line.strip()}{Colors.ENDC}")
    
    # 等待設置完成
    setup_process.wait()
    processes.remove(setup_process)
    
    # 啟動 API 服務器
    api_process = subprocess.Popen(
        [python_path, "scripts/api_server.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )
    processes.append(api_process)
    
    # 打印輸出的線程
    def print_output():
        for line in api_process.stdout:
            print(f"{Colors.GREEN}[API] {line.strip()}{Colors.ENDC}")
    
    output_thread = threading.Thread(target=print_output, daemon=True)
    output_thread.start()
    
    # 等待後端啟動
    print(f"{Colors.BLUE}[後端] 等待 API 服務器啟動...{Colors.ENDC}")
    time.sleep(3)
    
    return api_process

def run_frontend():
    """運行前端 Next.js 應用"""
    print(f"{Colors.BLUE}[前端] 啟動 Next.js 應用...{Colors.ENDC}")
    
    env = os.environ.copy()
    env["NEXT_PUBLIC_API_URL"] = "http://localhost:8000"
    
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )
    processes.append(frontend_process)
    
    # 打印輸出的線程
    def print_output():
        for line in frontend_process.stdout:
            print(f"{Colors.BLUE}[Next.js] {line.strip()}{Colors.ENDC}")
    
    output_thread = threading.Thread(target=print_output, daemon=True)
    output_thread.start()
    
    return frontend_process

def cleanup(signum, frame):
    """清理進程"""
    print(f"\n{Colors.YELLOW}[系統] 接收到信號 {signum}，正在關閉服務...{Colors.ENDC}")
    
    for process in processes:
        try:
            if platform.system() == "Windows":
                process.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                process.terminate()
        except:
            pass
    
    print(f"{Colors.GREEN}[系統] 所有服務已關閉{Colors.ENDC}")
    sys.exit(0)

def main():
    """主函數"""
    print_banner()
    
    # 設置信號處理
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    try:
        # 檢查系統需求
        check_requirements()
        
        # 設置前後端環境
        python_path = setup_backend()
        setup_frontend()
        
        # 啟動後端
        api_process = run_backend(python_path)
        
        # 啟動前端
        frontend_process = run_frontend()
        
        # 顯示訪問信息
        print(f"\n{Colors.GREEN}{Colors.BOLD}══════════════════════════════════════════════════════════{Colors.ENDC}")
        print(f"{Colors.GREEN}{Colors.BOLD}系統已成功啟動！{Colors.ENDC}")
        print(f"{Colors.GREEN}前端訪問地址: {Colors.BOLD}http://localhost:3000{Colors.ENDC}")
        print(f"{Colors.GREEN}API 服務地址: {Colors.BOLD}http://localhost:8000{Colors.ENDC}")
        print(f"{Colors.GREEN}API 文檔地址: {Colors.BOLD}http://localhost:8000/docs{Colors.ENDC}")
        print(f"{Colors.GREEN}{Colors.BOLD}══════════════════════════════════════════════════════════{Colors.ENDC}")
        print(f"{Colors.YELLOW}按 Ctrl+C 可以關閉所有服務{Colors.ENDC}\n")
        
        # 等待進程結束
        api_process.wait()
        frontend_process.wait()
        
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}[系統] 用戶中斷運行{Colors.ENDC}")
        cleanup(signal.SIGINT, None)
    except Exception as e:
        print(f"{Colors.RED}[錯誤] {e}{Colors.ENDC}")
        cleanup(signal.SIGTERM, None)
        sys.exit(1)

if __name__ == "__main__":
    main() 