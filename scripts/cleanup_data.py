#!/usr/bin/env python3
"""
數據清理腳本
用於清理數據庫中可能的重複或無效文檔記錄
"""

import os
from pathlib import Path
from sqlalchemy.orm import Session
from database import get_db, User, Document

def cleanup_orphaned_documents():
    """清理沒有對應文件的數據庫記錄"""
    db = next(get_db())
    
    print("開始清理無效的文檔記錄...")
    
    # 獲取所有文檔記錄
    all_documents = db.query(Document).all()
    removed_count = 0
    
    for doc in all_documents:
        # 檢查文件是否實際存在
        if not os.path.exists(doc.file_path):
            print(f"發現無效記錄：{doc.original_filename} (文件不存在: {doc.file_path})")
            db.delete(doc)
            removed_count += 1
    
    # 提交更改
    db.commit()
    print(f"清理完成！移除了 {removed_count} 個無效記錄")
    
    # 顯示清理後的統計
    remaining_documents = db.query(Document).all()
    print(f"數據庫中剩餘文檔記錄：{len(remaining_documents)} 個")
    
    db.close()

def show_user_document_stats():
    """顯示每個用戶的文檔統計"""
    db = next(get_db())
    
    print("\n=== 用戶文檔統計 ===")
    
    # 獲取所有用戶
    users = db.query(User).all()
    
    for user in users:
        # 獲取用戶的文檔
        user_docs = db.query(Document).filter(Document.owner_id == user.id).all()
        
        print(f"\n用戶：{user.username} (ID: {user.id})")
        print(f"  郵箱：{user.email}")
        print(f"  文檔數量：{len(user_docs)}")
        
        for doc in user_docs:
            file_exists = "✓" if os.path.exists(doc.file_path) else "✗"
            print(f"    [{file_exists}] {doc.original_filename} ({doc.file_size} bytes)")
    
    db.close()

def remove_duplicate_documents():
    """移除重複的文檔記錄"""
    db = next(get_db())
    
    print("\n開始檢查重複文檔...")
    
    # 按用戶和原始文件名分組查找重複項
    users = db.query(User).all()
    removed_count = 0
    
    for user in users:
        user_docs = db.query(Document).filter(Document.owner_id == user.id).all()
        
        # 按文件名分組
        filename_groups = {}
        for doc in user_docs:
            filename = doc.original_filename
            if filename not in filename_groups:
                filename_groups[filename] = []
            filename_groups[filename].append(doc)
        
        # 檢查每組是否有重複
        for filename, docs in filename_groups.items():
            if len(docs) > 1:
                print(f"發現重複文檔：{filename} (用戶: {user.username})")
                # 保留最新的，刪除舊的
                docs_sorted = sorted(docs, key=lambda x: x.upload_time, reverse=True)
                for old_doc in docs_sorted[1:]:
                    print(f"  移除舊記錄：{old_doc.upload_time}")
                    db.delete(old_doc)
                    removed_count += 1
    
    db.commit()
    print(f"移除了 {removed_count} 個重複記錄")
    db.close()

if __name__ == "__main__":
    print("=== 數據清理工具 ===")
    print("1. 顯示用戶文檔統計")
    print("2. 清理無效記錄")
    print("3. 移除重複記錄")
    print("4. 執行完整清理")
    
    choice = input("\n請選擇操作 (1-4): ").strip()
    
    if choice == "1":
        show_user_document_stats()
    elif choice == "2":
        cleanup_orphaned_documents()
    elif choice == "3":
        remove_duplicate_documents()
    elif choice == "4":
        print("執行完整清理...")
        show_user_document_stats()
        cleanup_orphaned_documents()
        remove_duplicate_documents()
        print("\n清理後的統計：")
        show_user_document_stats()
    else:
        print("無效選擇") 