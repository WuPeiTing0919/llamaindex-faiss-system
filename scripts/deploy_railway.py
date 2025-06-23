#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Railway 部署檢查腳本
用於驗證 Railway 部署配置
"""

import os
import sys
from pathlib import Path

def check_railway_config():
    """檢查 Railway 配置文件"""
    railway_json = Path("railway.json")
    if not railway_json.exists():
        print("❌ 缺少 railway.json 配置文件")
        return False
    
    print("✅ railway.json 配置文件存在")
    return True

def check_api_server():
    """檢查 API 服務器文件"""
    api_server = Path("scripts/auth_api_server.py")
    if not api_server.exists():
        print("❌ 缺少 auth_api_server.py 文件")
        return False
    print("✅ auth_api_server.py 文件存在")
    return True

def check_requirements():
    """檢查 requirements 文件"""
    requirements = Path("scripts/requirements-zeabur.txt")
    if not requirements.exists():
        print("❌ 缺少 requirements-zeabur.txt 文件")
        return False
    print("✅ requirements-zeabur.txt 文件存在")
    return True

def check_environment_variables():
    """檢查環境變數"""
    print("🔍 檢查環境變數...")
    
    deepseek_key = os.getenv('DEEPSEEK_API_KEY')
    if deepseek_key:
        print("✅ DEEPSEEK_API_KEY 已設置")
    else:
        print("❌ DEEPSEEK_API_KEY 未設置")
    
    return deepseek_key is not None

def provide_deployment_steps():
    """提供部署步驟"""
    print("\n🚀 Railway 部署步驟:")
    print("=" * 50)
    
    print("1. 訪問 Railway:")
    print("   https://railway.app")
    
    print("\n2. 創建新項目:")
    print("   - 點擊 'New Project'")
    print("   - 選擇 'Deploy from GitHub repo'")
    print("   - 選擇您的倉庫")
    
    print("\n3. 設置環境變數:")
    print("   - 在項目設置中找到 'Variables'")
    print("   - 添加以下變數:")
    print("     DEEPSEEK_API_KEY=your_api_key_here")
    print("     FRONTEND_URL=https://llamaindex-faiss-system.zeabur.app")
    print("     ALLOW_ALL_ORIGINS=true")
    
    print("\n4. 部署:")
    print("   - Railway 會自動檢測 Python 項目")
    print("   - 使用 railway.json 中的配置")
    print("   - 等待部署完成")
    
    print("\n5. 獲取 API URL:")
    print("   - 部署完成後，複製生成的 URL")
    print("   - 例如: https://your-app.railway.app")
    
    print("\n6. 更新 Zeabur 環境變數:")
    print("   - 在 Zeabur 控制台中設置:")
    print("     NEXT_PUBLIC_API_URL=https://your-app.railway.app")
    
    print("\n7. 重新部署 Zeabur:")
    print("   - 在 Zeabur 中重新部署前端")
    print("   - 測試功能")

def main():
    """主函數"""
    print("🔧 Railway 部署檢查工具")
    print("=" * 50)
    
    checks = [
        ("Railway 配置", check_railway_config),
        ("API 服務器", check_api_server),
        ("Requirements 文件", check_requirements),
        ("環境變數", check_environment_variables),
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
        print("🎉 所有檢查通過！可以部署到 Railway")
        provide_deployment_steps()
    else:
        print("❌ 請修復上述問題後再部署")
        sys.exit(1)

if __name__ == "__main__":
    main() 