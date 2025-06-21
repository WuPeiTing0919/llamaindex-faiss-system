#!/usr/bin/env python3
"""
Zeabur 服務連接測試腳本
用於測試前端和後端服務之間的連接
"""

import requests
import json
import sys
from urllib.parse import urljoin

def test_api_connection(base_url):
    """測試 API 連接"""
    print(f"🔍 測試 API 連接: {base_url}")
    
    # 測試健康檢查端點
    health_url = urljoin(base_url, "health")
    try:
        response = requests.get(health_url, timeout=10)
        if response.status_code == 200:
            print(f"✅ 健康檢查成功: {health_url}")
            print(f"   響應: {response.json()}")
        else:
            print(f"❌ 健康檢查失敗: {health_url}")
            print(f"   狀態碼: {response.status_code}")
            print(f"   響應: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 健康檢查錯誤: {e}")
        return False
    
    # 測試 API 根路徑
    root_url = urljoin(base_url, "")
    try:
        response = requests.get(root_url, timeout=10)
        if response.status_code == 200:
            print(f"✅ API 根路徑成功: {root_url}")
            print(f"   響應: {response.json()}")
        else:
            print(f"❌ API 根路徑失敗: {root_url}")
            print(f"   狀態碼: {response.status_code}")
            print(f"   響應: {response.text}")
            return False
    except Exception as e:
        print(f"❌ API 根路徑錯誤: {e}")
        return False
    
    return True

def test_auth_endpoints(base_url):
    """測試認證端點"""
    print(f"\n🔍 測試認證端點: {base_url}")
    
    # 測試註冊端點
    register_url = urljoin(base_url, "auth/register")
    test_data = {
        "username": "test_user",
        "email": "test@example.com",
        "password": "test_password",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(
            register_url,
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code in [200, 400]:  # 400 表示用戶已存在，這也是正常的
            print(f"✅ 註冊端點響應正常: {register_url}")
            print(f"   狀態碼: {response.status_code}")
            if response.status_code == 200:
                print(f"   響應: {response.json()}")
            else:
                print(f"   響應: {response.json()}")
        else:
            print(f"❌ 註冊端點失敗: {register_url}")
            print(f"   狀態碼: {response.status_code}")
            print(f"   響應: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 註冊端點錯誤: {e}")
        return False
    
    return True

def test_cors(base_url, frontend_url):
    """測試 CORS 配置"""
    print(f"\n🔍 測試 CORS 配置")
    
    headers = {
        "Origin": frontend_url,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type"
    }
    
    try:
        response = requests.options(
            urljoin(base_url, "auth/register"),
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ CORS 預檢請求成功")
            print(f"   Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'Not set')}")
            print(f"   Access-Control-Allow-Methods: {response.headers.get('Access-Control-Allow-Methods', 'Not set')}")
        else:
            print(f"❌ CORS 預檢請求失敗")
            print(f"   狀態碼: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ CORS 測試錯誤: {e}")
        return False
    
    return True

def main():
    """主測試函數"""
    if len(sys.argv) < 2:
        print("使用方法: python test_zeabur_connection.py <API_BASE_URL> [FRONTEND_URL]")
        print("例如: python test_zeabur_connection.py https://your-app-name.zeabur.app/api https://your-app-name.zeabur.app")
        sys.exit(1)
    
    api_base_url = sys.argv[1]
    frontend_url = sys.argv[2] if len(sys.argv) > 2 else "https://your-app-name.zeabur.app"
    
    print("🚀 Zeabur 服務連接測試開始...\n")
    
    # 確保 URL 以 / 結尾
    if not api_base_url.endswith('/'):
        api_base_url += '/'
    
    tests = [
        ("API 連接", lambda: test_api_connection(api_base_url)),
        ("認證端點", lambda: test_auth_endpoints(api_base_url)),
        ("CORS 配置", lambda: test_cors(api_base_url, frontend_url)),
    ]
    
    passed = 0
    total = len(tests)
    
    for name, test_func in tests:
        print(f"測試 {name}...")
        if test_func():
            passed += 1
        print()
    
    print("=" * 60)
    print(f"測試完成: {passed}/{total} 項通過")
    
    if passed == total:
        print("🎉 所有測試通過！服務連接正常")
        print("\n下一步:")
        print("1. 訪問前端 URL 進行用戶註冊")
        print("2. 測試文檔上傳功能")
        print("3. 測試查詢功能")
    else:
        print("❌ 部分測試失敗，請檢查以下問題:")
        print("1. 環境變數配置是否正確")
        print("2. API 服務是否正常運行")
        print("3. CORS 配置是否正確")
        print("4. 網絡連接是否正常")
        sys.exit(1)

if __name__ == "__main__":
    main() 