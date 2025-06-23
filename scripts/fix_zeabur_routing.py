#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Zeabur 路由問題診斷和修復腳本
專門解決 Zeabur 部署中的 404 錯誤問題
"""

import requests
import sys
import os
from urllib.parse import urljoin, urlparse

def test_direct_api_endpoints(base_url):
    """測試直接訪問 API 端點（不通過 /api 前綴）"""
    print(f"🔍 測試直接 API 端點: {base_url}")
    print("=" * 60)
    
    # 測試直接端點（不通過 /api 前綴）
    direct_endpoints = [
        ("health", "GET"),
        ("status", "GET"),
        ("auth/register", "POST"),
        ("auth/login", "POST"),
    ]
    
    headers = {"Content-Type": "application/json"}
    results = {}
    
    for endpoint, method in direct_endpoints:
        url = urljoin(base_url, endpoint)
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            else:
                test_data = {
                    "username": "test",
                    "email": "test@example.com",
                    "password": "test123"
                }
                response = requests.post(url, json=test_data, headers=headers, timeout=10)
            
            status = response.status_code
            results[endpoint] = status
            
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
            results[endpoint] = "ERROR"
    
    return results

def test_api_prefixed_endpoints(base_url):
    """測試帶 /api 前綴的端點"""
    print(f"\n🔍 測試 /api 前綴端點: {base_url}")
    print("=" * 60)
    
    # 測試帶 /api 前綴的端點
    api_endpoints = [
        ("api/health", "GET"),
        ("api/status", "GET"),
        ("api/auth/register", "POST"),
        ("api/auth/login", "POST"),
    ]
    
    headers = {"Content-Type": "application/json"}
    results = {}
    
    for endpoint, method in api_endpoints:
        url = urljoin(base_url, endpoint)
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            else:
                test_data = {
                    "username": "test",
                    "email": "test@example.com",
                    "password": "test123"
                }
                response = requests.post(url, json=test_data, headers=headers, timeout=10)
            
            status = response.status_code
            results[endpoint] = status
            
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
            results[endpoint] = "ERROR"
    
    return results

def analyze_routing_issue(direct_results, api_results):
    """分析路由問題"""
    print("\n🔍 路由問題分析")
    print("=" * 60)
    
    # 檢查直接端點
    direct_working = sum(1 for status in direct_results.values() if status == 200)
    direct_total = len(direct_results)
    
    # 檢查 API 前綴端點
    api_working = sum(1 for status in api_results.values() if status == 200)
    api_total = len(api_results)
    
    print(f"直接端點工作狀態: {direct_working}/{direct_total}")
    print(f"API 前綴端點工作狀態: {api_working}/{api_total}")
    
    if direct_working > api_working:
        print("✅ 直接端點工作正常，問題在於 /api 前綴路由")
        return "direct_works"
    elif api_working > direct_working:
        print("✅ API 前綴端點工作正常，問題在於直接路由")
        return "api_works"
    elif direct_working == 0 and api_working == 0:
        print("❌ 所有端點都不工作，可能是服務未啟動")
        return "none_work"
    else:
        print("⚠️  部分端點工作，需要進一步診斷")
        return "partial"

def provide_zeabur_solutions(issue_type, base_url):
    """提供 Zeabur 解決方案"""
    print("\n💡 Zeabur 解決方案")
    print("=" * 60)
    
    parsed_url = urlparse(base_url)
    domain = parsed_url.netloc
    
    if issue_type == "direct_works":
        print("🎯 解決方案：使用直接端點")
        print("1. 更新前端配置，移除 /api 前綴")
        print("2. 在 Zeabur 控制台中設置環境變數:")
        print(f"   NEXT_PUBLIC_API_URL=https://{domain}")
        print("3. 重新部署應用")
        
    elif issue_type == "api_works":
        print("🎯 解決方案：使用 API 前綴端點")
        print("1. 確保前端配置使用 /api 前綴")
        print("2. 在 Zeabur 控制台中設置環境變數:")
        print(f"   NEXT_PUBLIC_API_URL=https://{domain}/api")
        print("3. 重新部署應用")
        
    elif issue_type == "none_work":
        print("🎯 解決方案：檢查服務狀態")
        print("1. 在 Zeabur 控制台中檢查 API 服務是否運行")
        print("2. 查看服務日誌是否有錯誤")
        print("3. 確保環境變數正確設置:")
        print("   DEEPSEEK_API_KEY=your_api_key")
        print("   FRONTEND_URL=https://{domain}")
        print("4. 重新部署應用")
        
    else:
        print("🎯 解決方案：優化路由配置")
        print("1. 檢查 zeabur.toml 中的路由配置")
        print("2. 確保所有 API 端點都正確路由到 api 服務")
        print("3. 重新部署應用")

def check_zeabur_config():
    """檢查 Zeabur 配置文件"""
    print("\n🔍 檢查 Zeabur 配置")
    print("=" * 60)
    
    config_file = "zeabur.toml"
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 檢查路由配置
        if "[[routes]]" in content:
            print("✅ 路由配置存在")
        else:
            print("❌ 缺少路由配置")
        
        # 檢查服務配置
        if "[services.api]" in content:
            print("✅ API 服務配置存在")
        else:
            print("❌ 缺少 API 服務配置")
        
        # 檢查環境變數
        if "NEXT_PUBLIC_API_URL" in content:
            print("✅ 環境變數配置存在")
        else:
            print("❌ 缺少環境變數配置")
    else:
        print("❌ zeabur.toml 文件不存在")

def main():
    """主函數"""
    if len(sys.argv) != 2:
        print("使用方法: python scripts/fix_zeabur_routing.py <BASE_URL>")
        print("例如: python scripts/fix_zeabur_routing.py https://llamaindex-faiss-system.zeabur.app")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    
    print("🔧 Zeabur 路由問題診斷工具")
    print("=" * 80)
    
    # 檢查配置
    check_zeabur_config()
    
    # 測試直接端點
    direct_results = test_direct_api_endpoints(base_url)
    
    # 測試 API 前綴端點
    api_results = test_api_prefixed_endpoints(base_url)
    
    # 分析問題
    issue_type = analyze_routing_issue(direct_results, api_results)
    
    # 提供解決方案
    provide_zeabur_solutions(issue_type, base_url)
    
    print("\n🎯 立即行動:")
    print("1. 根據上述分析選擇正確的 API URL 格式")
    print("2. 在 Zeabur 控制台中設置正確的環境變數")
    print("3. 重新部署應用")
    print("4. 運行此腳本驗證修復")

if __name__ == "__main__":
    main() 