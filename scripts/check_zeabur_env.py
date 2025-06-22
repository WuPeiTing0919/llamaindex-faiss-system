#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Zeabur 環境變數檢查腳本
用於檢查和驗證 Zeabur 部署中的環境變數設置
"""

import os
import requests
import sys
from urllib.parse import urljoin

def check_environment_variables():
    """檢查環境變數設置"""
    print("🔍 檢查環境變數設置...")
    print("=" * 50)
    
    # 檢查本地環境變數
    api_url = os.getenv('NEXT_PUBLIC_API_URL')
    frontend_url = os.getenv('FRONTEND_URL')
    deepseek_key = os.getenv('DEEPSEEK_API_KEY')
    
    print("本地環境變數:")
    if api_url:
        print(f"  ✅ NEXT_PUBLIC_API_URL: {api_url}")
    else:
        print("  ❌ NEXT_PUBLIC_API_URL: 未設置")
    
    if frontend_url:
        print(f"  ✅ FRONTEND_URL: {frontend_url}")
    else:
        print("  ❌ FRONTEND_URL: 未設置")
    
    if deepseek_key:
        print(f"  ✅ DEEPSEEK_API_KEY: {'*' * len(deepseek_key)} (已設置)")
    else:
        print("  ❌ DEEPSEEK_API_KEY: 未設置")
    
    return api_url, frontend_url, deepseek_key

def check_zeabur_deployment(base_url):
    """檢查 Zeabur 部署狀態"""
    print(f"\n🔍 檢查 Zeabur 部署: {base_url}")
    print("=" * 50)
    
    # 測試基本端點
    endpoints = [
        ("health", "GET"),
        ("status", "GET"),
        ("", "GET"),  # 根路徑
    ]
    
    results = {}
    
    for endpoint, method in endpoints:
        url = urljoin(base_url, endpoint)
        try:
            if method == "GET":
                response = requests.get(url, timeout=10)
            else:
                response = requests.post(url, timeout=10)
            
            status = response.status_code
            results[endpoint] = status
            
            if status == 200:
                print(f"  ✅ {method} {url} - 狀態碼: {status}")
            else:
                print(f"  ❌ {method} {url} - 狀態碼: {status}")
                
        except requests.exceptions.RequestException as e:
            print(f"  ❌ {method} {url} - 錯誤: {e}")
            results[endpoint] = "ERROR"
    
    return results

def check_api_endpoints(base_url):
    """檢查 API 端點"""
    print(f"\n🔍 檢查 API 端點: {base_url}")
    print("=" * 50)
    
    # 測試認證端點
    auth_endpoints = [
        ("auth/register", "POST"),
        ("auth/login", "POST"),
        ("auth/me", "GET"),
    ]
    
    headers = {"Content-Type": "application/json"}
    
    for endpoint, method in auth_endpoints:
        url = urljoin(base_url, endpoint)
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            else:
                # 對於 POST 請求，發送測試數據
                test_data = {
                    "username": "test",
                    "email": "test@example.com",
                    "password": "test123"
                }
                response = requests.post(url, json=test_data, headers=headers, timeout=10)
            
            status = response.status_code
            if status == 200:
                print(f"  ✅ {method} {url} - 狀態碼: {status}")
            elif status == 401:
                print(f"  ⚠️  {method} {url} - 狀態碼: {status} (需要認證)")
            elif status == 404:
                print(f"  ❌ {method} {url} - 狀態碼: {status} (端點不存在)")
            else:
                print(f"  ❌ {method} {url} - 狀態碼: {status}")
                
        except requests.exceptions.RequestException as e:
            print(f"  ❌ {method} {url} - 錯誤: {e}")

def provide_recommendations(api_url, frontend_url, results):
    """提供修復建議"""
    print("\n💡 修復建議:")
    print("=" * 50)
    
    # 檢查環境變數
    if not api_url or api_url == "http://localhost:8000":
        print("1. ❌ NEXT_PUBLIC_API_URL 設置錯誤")
        print("   在 Zeabur 控制台中設置:")
        print("   NEXT_PUBLIC_API_URL=https://llamaindex-faiss-system.zeabur.app/api")
    
    if not frontend_url:
        print("2. ❌ FRONTEND_URL 未設置")
        print("   在 Zeabur 控制台中設置:")
        print("   FRONTEND_URL=https://llamaindex-faiss-system.zeabur.app")
    
    # 檢查 API 端點
    if "health" in results and results["health"] == 404:
        print("3. ❌ API 健康檢查端點返回 404")
        print("   可能的原因:")
        print("   - API 服務未正確啟動")
        print("   - 路由配置錯誤")
        print("   - 環境變數未正確設置")
    
    if "status" in results and results["status"] == 200:
        print("4. ✅ API 服務正在運行")
        print("   但認證端點可能有問題")
    
    print("\n🎯 立即行動:")
    print("1. 在 Zeabur 控制台中設置正確的環境變數")
    print("2. 重新部署應用")
    print("3. 等待 2-5 分鐘讓變數生效")
    print("4. 重新運行此檢查腳本")

def main():
    """主函數"""
    if len(sys.argv) != 2:
        print("使用方法: python scripts/check_zeabur_env.py <API_BASE_URL>")
        print("例如: python scripts/check_zeabur_env.py https://llamaindex-faiss-system.zeabur.app/api")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    
    print("🔧 Zeabur 環境變數檢查工具")
    print("=" * 60)
    
    # 檢查環境變數
    api_url, frontend_url, deepseek_key = check_environment_variables()
    
    # 檢查部署狀態
    results = check_zeabur_deployment(base_url)
    
    # 檢查 API 端點
    check_api_endpoints(base_url)
    
    # 提供建議
    provide_recommendations(api_url, frontend_url, results)
    
    print("\n📋 總結:")
    print("=" * 50)
    
    if api_url and api_url != "http://localhost:8000" and frontend_url:
        print("✅ 環境變數設置正確")
    else:
        print("❌ 環境變數需要修復")
    
    if "status" in results and results["status"] == 200:
        print("✅ API 服務正在運行")
    else:
        print("❌ API 服務有問題")
    
    print("\n完成檢查！請按照上述建議修復問題。")

if __name__ == "__main__":
    main() 