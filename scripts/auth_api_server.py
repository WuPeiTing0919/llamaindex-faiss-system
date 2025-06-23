"""
支持用戶認證的 FastAPI 服務器
提供用戶註冊、登入和個人文檔管理功能
"""

import time
import base64
import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Annotated

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session

# 導入自定義模塊
from database import (
    create_tables, get_db, User, Document,
    create_user, authenticate_user, get_user_by_username, get_user_by_email,
    create_access_token, verify_token, create_document, get_user_documents, delete_document
)
from user_knowledge_base import UserKnowledgeBaseSystem

# 載入環境變數
load_dotenv()

# 創建數據庫表
create_tables()

app = FastAPI(title="企業知識庫 API (支持用戶認證)", version="2.0.0")

# 添加 CORS 中間件
# 在 API 代理架構下，CORS 限制可以放寬，因為請求是從 Vercel 伺服器發出的
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允許所有來源
    allow_credentials=True,
    allow_methods=["*"],  # 允許所有方法
    allow_headers=["*"],  # 允許所有標頭
)

# 安全設置
security = HTTPBearer()

# 全局知識庫實例
user_kb_system = UserKnowledgeBaseSystem()

# Pydantic 模型
class UserRegister(BaseModel):
    username: str
    email: str  # 使用 str 替代 EmailStr 以兼容較舊版本
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_info: dict

class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    created_at: datetime

class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5

class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[dict]
    processing_time: float

class DocumentInfo(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_size: int
    upload_time: datetime

# 依賴函數
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """獲取當前用戶"""
    token = credentials.credentials
    username = verify_token(token)
    
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的認證令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_username(db, username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用戶不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

# API 端點
@app.get("/")
async def root():
    return {"message": "企業知識庫 API 服務運行中 (支持用戶認證)", "version": "2.0.0"}

@app.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """用戶註冊"""
    # 檢查用戶名是否已存在
    if get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用戶名已存在"
        )
    
    # 檢查郵箱是否已存在
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="郵箱已被註冊"
        )
    
    # 創建用戶
    user = create_user(
        db=db,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name
    )
    
    # 創建訪問令牌
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """用戶登入"""
    user = authenticate_user(db, user_data.username, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用戶名或密碼錯誤",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 創建訪問令牌
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@app.get("/auth/me", response_model=UserInfo)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """獲取當前用戶信息"""
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        created_at=current_user.created_at
    )

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """上傳文檔 (需要認證)"""
    try:
        # 讀取文件內容
        file_content = await file.read()
        
        # 保存文件到用戶專屬目錄
        file_path = user_kb_system.save_user_document(
            user_id=current_user.id,
            filename=file.filename,
            content=file_content
        )
        
        # 在數據庫中記錄文檔信息
        db_document = create_document(
            db=db,
            filename=Path(file_path).name,
            original_filename=file.filename,
            file_path=file_path,
            file_size=len(file_content),
            content_type=file.content_type or "application/octet-stream",
            owner_id=current_user.id
        )
        
        # 重新建立用戶索引
        user_kb_system.build_user_index(current_user.id)
        
        return {
            "message": f"文檔 {file.filename} 上傳成功",
            "document_id": db_document.id,
            "filename": file.filename,
            "size": len(file_content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上傳失敗: {str(e)}")

@app.post("/query")
async def query_knowledge_base(
    request: QueryRequest,
    current_user: User = Depends(get_current_user)
):
    """查詢個人知識庫 (需要認證)"""
    try:
        start_time = time.time()
        
        # 搜索用戶的文檔
        search_results = user_kb_system.search_user_documents(
            user_id=current_user.id,
            query=request.query,
            top_k=request.top_k
        )
        
        if not search_results:
            return {
                "query": request.query,
                "answer": "抱歉，在您的文檔中沒有找到相關信息。請先上傳一些文檔。",
                "sources": [],
                "processing_time": time.time() - start_time
            }
        
        # 提取最相關的上下文文檔
        context_docs = [result['content'] for result in search_results[:2]]
        
        # 使用 LLM 生成回答
        answer = user_kb_system.query_user_with_llm(
            user_id=current_user.id,
            query=request.query,
            context_docs=context_docs
        )
        
        processing_time = time.time() - start_time
        
        return {
            "query": request.query,
            "answer": answer,
            "sources": search_results,
            "processing_time": processing_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查詢失敗: {str(e)}")

@app.get("/documents", response_model=List[DocumentInfo])
async def list_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """列出用戶的所有文檔 (需要認證)"""
    documents = get_user_documents(db, current_user.id)
    
    return [
        DocumentInfo(
            id=doc.id,
            filename=doc.original_filename,
            original_filename=doc.original_filename,
            file_size=doc.file_size,
            upload_time=doc.upload_time
        )
        for doc in documents
    ]

@app.delete("/documents/{document_id}")
async def delete_user_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """刪除用戶文檔 (需要認證)"""
    success = delete_document(db, document_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="文檔不存在或無權限刪除")
    
    # 重新建立用戶索引
    user_kb_system.build_user_index(current_user.id)
    
    return {"message": "文檔刪除成功"}

@app.get("/status")
async def get_user_status(current_user: User = Depends(get_current_user)):
    """獲取用戶系統狀態 (需要認證)"""
    user_documents = user_kb_system.get_user_document_list(current_user.id)
    
    return {
        "status": "running",
        "user_id": current_user.id,
        "username": current_user.username,
        "documents_count": len(user_documents),
        "model_status": "ready"
    }

@app.get("/health")
async def health_check():
    """健康檢查 (無需認證)"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 