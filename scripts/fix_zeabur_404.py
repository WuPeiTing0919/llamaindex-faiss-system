#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Zeabur 404 錯誤快速修復腳本
用於診斷和解決部署中的 404 錯誤
"""

import requests
import sys
import os
from urllib.parse import urljoin, urlparse

def test_endpoint(base_url, endpoint, method="GET", data=None, headers=None):
    """測試 API 端點"""
    url = urljoin(base_url, endpoint)
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        else:
            print(f"❌ 不支持的 HTTP 方法: {method}")
            return False
        
        print(f"✅ {method} {url} - 狀態碼: {response.status_code}")
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"   響應: {result}")
            except:
                print(f"   響應: {response.text[:100]}...")
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        print(f"❌ {method} {url} - 錯誤: {e}")
        return False

def check_environment_variables():
    """檢查環境變數"""
    print("🔍 檢查環境變數...")
    
    api_url = os.getenv('NEXT_PUBLIC_API_URL')
    frontend_url = os.getenv('FRONTEND_URL')
    
    if api_url:
        print(f"✅ NEXT_PUBLIC_API_URL: {api_url}")
    else:
        print("❌ NEXT_PUBLIC_API_URL 未設置")
    
    if frontend_url:
        print(f"✅ FRONTEND_URL: {frontend_url}")
    else:
        print("❌ FRONTEND_URL 未設置")
    
    return api_url, frontend_url

def diagnose_api_service(base_url):
    """診斷 API 服務"""
    print(f"\n🔍 診斷 API 服務: {base_url}")
    
    # 測試基本端點
    endpoints = [
        ("health", "GET"),
        ("status", "GET"),
        ("auth/register", "POST", {"username": "test", "email": "test@example.com", "password": "test123"}),
        ("auth/login", "POST", {"username": "test", "password": "test123"}),
    ]
    
    headers = {"Content-Type": "application/json"}
    
    for endpoint_info in endpoints:
        if len(endpoint_info) == 2:
            endpoint, method = endpoint_info
            test_endpoint(base_url, endpoint, method, headers=headers)
        else:
            endpoint, method, data = endpoint_info
            test_endpoint(base_url, endpoint, method, data, headers)

def check_frontend_config():
    """檢查前端配置"""
    print("\n🔍 檢查前端配置...")
    
    config_file = "app/api/config.ts"
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if "REGISTER" in content and "LOGIN" in content:
            print("✅ API 配置文件包含認證端點")
        else:
            print("❌ API 配置文件缺少認證端點")
        
        if "NEXT_PUBLIC_API_URL" in content:
            print("✅ API 配置文件使用環境變數")
        else:
            print("❌ API 配置文件未使用環境變數")
    else:
        print("❌ API 配置文件不存在")

def provide_solutions(base_url):
    """提供解決方案"""
    print("\n💡 解決方案:")
    
    parsed_url = urlparse(base_url)
    domain = parsed_url.netloc
    
    print("1. 在 Zeabur 控制台中設置環境變數:")
    print(f"   NEXT_PUBLIC_API_URL=https://{domain}/api")
    print(f"   FRONTEND_URL=https://{domain}")
    print("   DEEPSEEK_API_KEY=your_api_key_here")
    
    print("\n2. 確保 zeabur.toml 配置正確:")
    print("   - 包含兩個服務: web (Next.js) 和 api (Python)")
    print("   - API 服務運行在端口 8000")
    print("   - 前端服務運行在端口 3000")
    
    print("\n3. 重新部署應用:")
    print("   - 推送代碼到 GitHub")
    print("   - 在 Zeabur 中重新部署")
    
    print("\n4. 測試部署:")
    print(f"   python scripts/test_zeabur_connection.py {base_url}")

def main():
    """主函數"""
    if len(sys.argv) != 2:
        print("使用方法: python scripts/fix_zeabur_404.py <API_BASE_URL>")
        print("例如: python scripts/fix_zeabur_404.py https://your-app.zeabur.app/api")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    
    print("🔧 Zeabur 404 錯誤診斷工具")
    print("=" * 50)
    
    # 檢查環境變數
    api_url, frontend_url = check_environment_variables()
    
    # 檢查前端配置
    check_frontend_config()
    
    # 診斷 API 服務
    diagnose_api_service(base_url)
    
    # 提供解決方案
    provide_solutions(base_url)
    
    print("\n🎯 快速修復步驟:")
    print("1. 在 Zeabur 控制台中設置正確的環境變數")
    print("2. 重新部署應用")
    print("3. 運行測試腳本驗證修復")

if __name__ == "__main__":
    main() 