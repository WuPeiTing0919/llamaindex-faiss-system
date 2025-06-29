"""
支持用戶認證的 FastAPI 服務器
提供用戶註冊、登入和個人文檔管理功能
"""

import time
import base64
import os
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Annotated

# 添加項目根目錄到 Python 路徑（用於雲端部署）
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session

# 導入自定義模塊
try:
    from scripts.database import (
        create_tables, get_db, User, Document, AIModel, UserAIModelPreference,
        create_user, authenticate_user, get_user_by_username, get_user_by_email,
        create_access_token, verify_token, create_document, get_user_documents, delete_document,
        create_builtin_models, get_available_models, create_custom_model, delete_custom_model,
        set_user_model_preference, get_user_model_preferences, get_user_default_model, 
        delete_user_model_preference, delete_user_model_preference_by_id
    )
    from scripts.user_knowledge_base import UserKnowledgeBaseSystem
except ImportError:
    # 本地開發環境的導入方式
    from database import (
        create_tables, get_db, User, Document, AIModel, UserAIModelPreference,
        create_user, authenticate_user, get_user_by_username, get_user_by_email,
        create_access_token, verify_token, create_document, get_user_documents, delete_document,
        create_builtin_models, get_available_models, create_custom_model, delete_custom_model,
        set_user_model_preference, get_user_model_preferences, get_user_default_model, 
        delete_user_model_preference, delete_user_model_preference_by_id
    )
    from user_knowledge_base import UserKnowledgeBaseSystem

# 載入環境變數
load_dotenv()
load_dotenv(dotenv_path=parent_dir / '.env')  # 嘗試從項目根目錄加載

# 創建數據庫表
create_tables()

# 初始化內建模型
try:
    from sqlalchemy.orm import sessionmaker
    try:
        from scripts.database import engine
    except ImportError:
        from database import engine
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        create_builtin_models(db)
    finally:
        db.close()
except Exception as e:
    print(f"數據庫初始化警告: {e}")
    # 繼續運行，可能在後續請求中重新初始化

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

# 全局知識庫實例 - 帶錯誤處理
user_kb_system = None
kb_system_error = None

def initialize_kb_system():
    """初始化知識庫系統，帶錯誤處理"""
    global user_kb_system, kb_system_error
    
    try:
        print("🔄 正在初始化 AI 知識庫系統...")
        user_kb_system = UserKnowledgeBaseSystem()
        print("✅ AI 知識庫系統初始化成功")
        kb_system_error = None
        return True
    except Exception as e:
        print(f"⚠️ AI 知識庫系統初始化失敗: {e}")
        print("💡 系統將以基礎模式運行（不含 AI 功能）")
        user_kb_system = None
        kb_system_error = str(e)
        return False

# 嘗試初始化知識庫系統
initialize_kb_system()

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

# AI模型相關模型
class AIModelInfo(BaseModel):
    id: int
    name: str
    provider: str
    model_id: str
    api_base_url: Optional[str]
    description: Optional[str]
    is_built_in: bool
    is_active: bool
    created_at: datetime
    created_by_username: Optional[str] = None

class CreateCustomModel(BaseModel):
    name: str
    provider: str
    model_id: str
    api_base_url: str
    description: Optional[str] = ""

class UserModelPreferenceInfo(BaseModel):
    id: int
    model_id: int
    api_key_set: bool
    is_default: bool
    created_at: datetime
    model: AIModelInfo  # 包含完整的模型信息

class SetModelPreference(BaseModel):
    model_id: int
    api_key: Optional[str] = None
    is_default: bool = False

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
        # 檢查文件大小限制 (500MB)
        max_size = 500 * 1024 * 1024  # 500MB
        file_size = 0
        
        # 讀取文件內容並檢查大小
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"文件大小 {file_size / (1024*1024):.2f}MB 超過 500MB 限制"
            )
        
        # 檢查 AI 系統是否可用
        if user_kb_system is None:
            # AI 系統不可用，只做基本文件存儲
            user_docs_folder = Path("user_documents") / f"user_{current_user.id}"
            user_docs_folder.mkdir(parents=True, exist_ok=True)
            
            # 生成唯一文件名
            import uuid
            unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
            file_path = user_docs_folder / unique_filename
            
            # 保存文件
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            file_path_str = str(file_path)
        else:
            # AI 系統可用，使用完整功能
            file_path_str = user_kb_system.save_user_document(
                user_id=current_user.id,
                filename=file.filename,
                content=file_content
            )
        
        # 在數據庫中記錄文檔信息
        db_document = create_document(
            db=db,
            filename=Path(file_path_str).name,
            original_filename=file.filename,
            file_path=file_path_str,
            file_size=file_size,
            content_type=file.content_type or "application/octet-stream",
            owner_id=current_user.id
        )
        
        # 嘗試重建用戶索引
        index_status = "基礎存儲模式"
        if user_kb_system is not None:
            try:
                user_kb_system.build_user_index(current_user.id)
                index_status = "AI 索引已更新"
            except Exception as e:
                print(f"索引建立失敗: {e}")
                index_status = f"索引建立失敗: {str(e)}"
        
        return {
            "message": f"文檔 {file.filename} 上傳成功",
            "document_id": db_document.id,
            "filename": file.filename,
            "size": file_size,
            "index_status": index_status,
            "ai_enabled": user_kb_system is not None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上傳失敗: {str(e)}")

@app.post("/query")
async def query_knowledge_base(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """查詢個人知識庫 (需要認證)"""
    start_time = time.time()
    
    # 檢查 AI 系統是否可用
    if user_kb_system is None:
        return {
            "query": request.query,
            "answer": f"AI 查詢功能暫時不可用。錯誤信息：{kb_system_error or '未知錯誤'}。\n\n您的文檔已安全存儲，一旦 AI 系統恢復，即可進行智能查詢。",
            "sources": [],
            "processing_time": time.time() - start_time,
            "ai_enabled": False,
            "error": "AI system unavailable"
        }
    
    try:
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
                "processing_time": time.time() - start_time,
                "ai_enabled": True
            }
        
        # 提取最相關的上下文文檔
        context_docs = [result['content'] for result in search_results[:2]]
        
        # 使用 LLM 生成回答
        answer = user_kb_system.query_user_with_llm(
            user_id=current_user.id,
            query=request.query,
            context_docs=context_docs,
            db_session=db
        )
        
        processing_time = time.time() - start_time
        
        return {
            "query": request.query,
            "answer": answer,
            "sources": search_results,
            "processing_time": processing_time,
            "ai_enabled": True
        }
    except Exception as e:
        return {
            "query": request.query,
            "answer": f"查詢過程中遇到錯誤：{str(e)}。請稍後重試或聯繫管理員。",
            "sources": [],
            "processing_time": time.time() - start_time,
            "ai_enabled": True,
            "error": str(e)
        }

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
    
    # 嘗試重新建立用戶索引
    index_status = "文檔已刪除"
    if user_kb_system is not None:
        try:
            user_kb_system.build_user_index(current_user.id)
            index_status = "文檔已刪除，AI 索引已更新"
        except Exception as e:
            print(f"索引更新失敗: {e}")
            index_status = "文檔已刪除，但索引更新失敗"
    
    return {
        "message": "文檔刪除成功",
        "index_status": index_status,
        "ai_enabled": user_kb_system is not None
    }

@app.get("/status")
async def get_user_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """獲取用戶系統狀態 (需要認證)"""
    # 從數據庫獲取用戶的真實文檔數量
    user_documents = get_user_documents(db, current_user.id)
    
    # 檢查 AI 系統狀態
    ai_status = "ready" if user_kb_system is not None else "unavailable"
    
    # 獲取用戶的默認模型
    default_model_pref = get_user_default_model(db, current_user.id)
    current_model = {
        "name": "DeepSeek Chat",
        "provider": "deepseek",
        "model_id": "deepseek-chat",
        "api_key_set": bool(os.getenv("DEEPSEEK_API_KEY"))
    }
    
    if default_model_pref and default_model_pref.model:
        current_model = {
            "name": default_model_pref.model.name,
            "provider": default_model_pref.model.provider,
            "model_id": default_model_pref.model.model_id,
            "api_key_set": bool(default_model_pref.api_key)
        }
    
    # 為前端兼容性，創建 user_ai_model 格式
    user_ai_model = {
        "name": current_model["name"],
        "provider": current_model["provider"],
        "has_api_key": current_model["api_key_set"]
    }
    
    status_response = {
        "status": "running",
        "user_id": current_user.id,
        "username": current_user.username,
        "documents_count": len(user_documents),
        "index_size": len(user_documents),  # 簡化為文檔數量
        "model_status": ai_status,
        "memory_usage": "1.2GB",
        "cpu_usage": "25%",
        "current_model": current_model,  # 新格式
        "user_ai_model": user_ai_model,  # 兼容舊格式
        "ai_enabled": user_kb_system is not None,
        "embedding_model": {
            "name": "BAAI/bge-base-zh", 
            "provider": "huggingface",
            "description": "向量化文檔" if user_kb_system is not None else "AI系統暫時不可用"
        }
    }
    
    # 如果 AI 系統不可用，添加錯誤信息
    if user_kb_system is None:
        status_response["ai_error"] = kb_system_error
        status_response["message"] = "系統運行中，但 AI 功能暫時不可用"
    
    return status_response

@app.get("/health")
async def health_check():
    """健康檢查 (無需認證)"""
    return {
        "status": "healthy", 
        "timestamp": datetime.utcnow(),
        "ai_system": "ready" if user_kb_system is not None else "initializing",
        "version": "2.0.0"
    }

# AI模型管理端點
@app.get("/ai-models", response_model=List[AIModelInfo])
async def list_available_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """列出所有可用的AI模型"""
    models = get_available_models(db)
    
    result = []
    for model in models:
        created_by_username = None
        if model.created_by_user_id:
            # 直接通過關聯關係獲取用戶名
            if model.created_by:
                created_by_username = model.created_by.username
        
        result.append(AIModelInfo(
            id=model.id,
            name=model.name,
            provider=model.provider,
            model_id=model.model_id,
            api_base_url=model.api_base_url,
            description=model.description,
            is_built_in=model.is_built_in,
            is_active=model.is_active,
            created_at=model.created_at,
            created_by_username=created_by_username
        ))
    
    return result

@app.post("/ai-models/custom", response_model=AIModelInfo)
async def create_custom_ai_model(
    model_data: CreateCustomModel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """創建自定義AI模型"""
    try:
        db_model = create_custom_model(
            db=db,
            name=model_data.name,
            provider=model_data.provider,
            model_id=model_data.model_id,
            api_base_url=model_data.api_base_url,
            description=model_data.description,
            user_id=current_user.id
        )
        
        return AIModelInfo(
            id=db_model.id,
            name=db_model.name,
            provider=db_model.provider,
            model_id=db_model.model_id,
            api_base_url=db_model.api_base_url,
            description=db_model.description,
            is_built_in=db_model.is_built_in,
            is_active=db_model.is_active,
            created_at=db_model.created_at,
            created_by_username=current_user.username
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"創建模型失敗: {str(e)}")

@app.delete("/ai-models/custom/{model_id}")
async def delete_custom_ai_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """刪除自定義AI模型（只能刪除自己創建的）"""
    success = delete_custom_model(db, model_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="模型不存在或無權限刪除")
    
    return {"message": "模型刪除成功"}

@app.get("/user/model-preferences", response_model=List[UserModelPreferenceInfo])
async def get_user_model_preferences_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """獲取用戶的模型偏好設定"""
    preferences = get_user_model_preferences(db, current_user.id)
    
    result = []
    for pref in preferences:
        # 獲取模型的創建者用戶名
        created_by_username = None
        if pref.model.created_by_user_id:
            if pref.model.created_by:
                created_by_username = pref.model.created_by.username
        
        model_info = AIModelInfo(
            id=pref.model.id,
            name=pref.model.name,
            provider=pref.model.provider,
            model_id=pref.model.model_id,
            api_base_url=pref.model.api_base_url,
            description=pref.model.description,
            is_built_in=pref.model.is_built_in,
            is_active=pref.model.is_active,
            created_at=pref.model.created_at,
            created_by_username=created_by_username
        )
        
        result.append(UserModelPreferenceInfo(
            id=pref.id,
            model_id=pref.model_id,
            api_key_set=bool(pref.api_key),
            is_default=pref.is_default,
            created_at=pref.created_at,
            model=model_info
        ))
    
    return result

@app.post("/user/model-preferences", response_model=UserModelPreferenceInfo)
async def set_user_model_preference_endpoint(
    preference_data: SetModelPreference,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """設定用戶的模型偏好"""
    try:
        # 檢查模型是否存在
        model = db.query(AIModel).filter(
            AIModel.id == preference_data.model_id,
            AIModel.is_active == True
        ).first()
        
        if not model:
            raise HTTPException(status_code=404, detail="模型不存在")
        
        pref = set_user_model_preference(
            db=db,
            user_id=current_user.id,
            model_id=preference_data.model_id,
            api_key=preference_data.api_key,
            is_default=preference_data.is_default
        )
        
        # 獲取模型的創建者用戶名
        created_by_username = None
        if model.created_by_user_id:
            if model.created_by:
                created_by_username = model.created_by.username
        
        model_info = AIModelInfo(
            id=model.id,
            name=model.name,
            provider=model.provider,
            model_id=model.model_id,
            api_base_url=model.api_base_url,
            description=model.description,
            is_built_in=model.is_built_in,
            is_active=model.is_active,
            created_at=model.created_at,
            created_by_username=created_by_username
        )
        
        return UserModelPreferenceInfo(
            id=pref.id,
            model_id=pref.model_id,
            api_key_set=bool(pref.api_key),
            is_default=pref.is_default,
            created_at=pref.created_at,
            model=model_info
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"設定偏好失敗: {str(e)}")

@app.delete("/user/model-preferences/{preference_id}")
async def delete_user_model_preference_endpoint(
    preference_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """刪除用戶的模型偏好設定"""
    success = delete_user_model_preference_by_id(db, current_user.id, preference_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="偏好設定不存在")
    
    return {"message": "偏好設定刪除成功"}

@app.get("/user/default-model")
async def get_user_default_model_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """獲取用戶的默認模型"""
    default_pref = get_user_default_model(db, current_user.id)
    
    if not default_pref:
        return {"message": "尚未設定默認模型"}
    
    return {
        "model_id": default_pref.model_id,
        "model_name": default_pref.model.name,
        "provider": default_pref.model.provider,
        "api_key_set": bool(default_pref.api_key)
    }

if __name__ == "__main__":
    import uvicorn
    # 配置支持大文件上傳 (500MB)
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        timeout_keep_alive=300,  # 保持連接5分鐘
        timeout_graceful_shutdown=300,  # 優雅關閉超時
        limit_max_requests=1000,
        limit_concurrency=100
    ) 