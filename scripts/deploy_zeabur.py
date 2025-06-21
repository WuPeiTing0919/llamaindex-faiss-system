#!/usr/bin/env python3
"""
Zeabur 部署檢查腳本
用於驗證部署配置和環境變數
"""

import os
import sys
from pathlib import Path

def check_python_version():
    """檢查 Python 版本"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 版本過低，需要 Python 3.8+")
        print(f"   當前版本: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"✅ Python 版本: {version.major}.{version.minor}.{version.micro}")
    return True

def check_requirements_file():
    """檢查 requirements 文件"""
    zeabur_req = Path("scripts/requirements-zeabur.txt")
    if not zeabur_req.exists():
        print("❌ 缺少 requirements-zeabur.txt 文件")
        return False
    print("✅ requirements-zeabur.txt 文件存在")
    return True

def check_zeabur_config():
    """檢查 Zeabur 配置文件"""
    zeabur_toml = Path("zeabur.toml")
    if not zeabur_toml.exists():
        print("❌ 缺少 zeabur.toml 配置文件")
        return False
    
    content = zeabur_toml.read_text()
    if "auth_api_server.py" not in content:
        print("❌ zeabur.toml 中未配置正確的 API 服務器")
        return False
    
    if "requirements-zeabur.txt" not in content:
        print("❌ zeabur.toml 中未配置正確的 requirements 文件")
        return False
    
    print("✅ zeabur.toml 配置正確")
    return True

def check_api_server():
    """檢查 API 服務器文件"""
    api_server = Path("scripts/auth_api_server.py")
    if not api_server.exists():
        print("❌ 缺少 auth_api_server.py 文件")
        return False
    print("✅ auth_api_server.py 文件存在")
    return True

def check_environment_variables():
    """檢查環境變數"""
    required_vars = [
        "DEEPSEEK_API_KEY",
        "NEXT_PUBLIC_API_URL"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ 缺少環境變數: {', '.join(missing_vars)}")
        print("   請在 Zeabur 控制台中設置這些環境變數")
        return False
    
    print("✅ 環境變數配置正確")
    return True

def check_directories():
    """檢查必要的目錄"""
    required_dirs = [
        "user_documents",
        "user_indexes"
    ]
    
    for dir_name in required_dirs:
        dir_path = Path(dir_name)
        if not dir_path.exists():
            dir_path.mkdir(exist_ok=True)
            print(f"✅ 創建目錄: {dir_name}")
        else:
            print(f"✅ 目錄存在: {dir_name}")
    
    return True

def main():
    """主檢查函數"""
    print("🔍 Zeabur 部署檢查開始...\n")
    
    checks = [
        ("Python 版本", check_python_version),
        ("Requirements 文件", check_requirements_file),
        ("Zeabur 配置", check_zeabur_config),
        ("API 服務器", check_api_server),
        ("環境變數", check_environment_variables),
        ("目錄結構", check_directories),
    ]
    
    passed = 0
    total = len(checks)
    
    for name, check_func in checks:
        print(f"檢查 {name}...")
        if check_func():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"檢查完成: {passed}/{total} 項通過")
    
    if passed == total:
        print("🎉 所有檢查通過！可以部署到 Zeabur")
        print("\n部署步驟:")
        print("1. 將代碼推送到 GitHub")
        print("2. 在 Zeabur 中連接 GitHub 倉庫")
        print("3. 設置環境變數")
        print("4. 部署應用")
    else:
        print("❌ 請修復上述問題後再部署")
        sys.exit(1)

if __name__ == "__main__":
    main() 