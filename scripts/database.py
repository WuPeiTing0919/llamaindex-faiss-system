"""
數據庫模型和連接管理
用於用戶認證和文件管理
"""

import os
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
from jose import JWTError, jwt

# 數據庫配置
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./knowledge_base.db")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 創建數據庫引擎
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 密碼加密
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    """用戶模型"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 關聯關係
    documents = relationship("Document", back_populates="owner")

class Document(Base):
    """文檔模型"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    content_type = Column(String(100))
    upload_time = Column(DateTime, default=datetime.utcnow)
    is_indexed = Column(Boolean, default=False)
    
    # 外鍵
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 關聯關係
    owner = relationship("User", back_populates="documents")

class UserSession(Base):
    """用戶會話模型"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(500), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class AIModel(Base):
    """AI模型配置"""
    __tablename__ = "ai_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False)  # deepseek, openai, claude, etc.
    model_id = Column(String(100), nullable=False)  # 實際的模型ID
    api_base_url = Column(String(200))  # API 基礎URL
    api_key_required = Column(Boolean, default=True)  # 是否需要API key
    description = Column(Text)  # 模型描述
    is_built_in = Column(Boolean, default=False)  # 是否為內建模型
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by_user_id = Column(Integer, ForeignKey("users.id"))  # 創建者，內建模型為空
    
    # 關聯關係
    created_by = relationship("User", foreign_keys=[created_by_user_id])

class UserAIModelPreference(Base):
    """用戶AI模型偏好設定"""
    __tablename__ = "user_ai_model_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_id = Column(Integer, ForeignKey("ai_models.id"), nullable=False)
    api_key = Column(String(500))  # 用戶的API key（加密存儲）
    is_default = Column(Boolean, default=False)  # 是否為默認模型
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 關聯關係
    user = relationship("User")
    model = relationship("AIModel")

# 創建所有表
def create_tables():
    Base.metadata.create_all(bind=engine)

# 獲取數據庫會話
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 密碼相關函數
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """驗證密碼"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """生成密碼哈希"""
    return pwd_context.hash(password)

# JWT Token 相關函數
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """創建訪問令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """驗證令牌並返回用戶名"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None

# 用戶相關函數
def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """根據用戶名獲取用戶"""
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """根據郵箱獲取用戶"""
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, username: str, email: str, password: str, full_name: str = None) -> User:
    """創建新用戶"""
    hashed_password = get_password_hash(password)
    db_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        full_name=full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """驗證用戶"""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

# 文檔相關函數
def create_document(db: Session, filename: str, original_filename: str, file_path: str, 
                   file_size: int, content_type: str, owner_id: int) -> Document:
    """創建文檔記錄"""
    db_document = Document(
        filename=filename,
        original_filename=original_filename,
        file_path=file_path,
        file_size=file_size,
        content_type=content_type,
        owner_id=owner_id
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

def get_user_documents(db: Session, user_id: int) -> List[Document]:
    """獲取用戶的所有文檔"""
    return db.query(Document).filter(Document.owner_id == user_id).all()

def delete_document(db: Session, document_id: int, user_id: int) -> bool:
    """刪除用戶的文檔"""
    document = db.query(Document).filter(
        Document.id == document_id, 
        Document.owner_id == user_id
    ).first()
    if document:
        db.delete(document)
        db.commit()
        return True
    return False

# AI模型相關函數
def create_builtin_models(db: Session):
    """創建內建模型"""
    builtin_models = [
        {
            "name": "DeepSeek Chat",
            "provider": "deepseek",
            "model_id": "deepseek-chat",
            "api_base_url": "https://api.deepseek.com",
            "description": "DeepSeek 聊天模型，適合對話和推理任務",
            "is_built_in": True
        },
        {
            "name": "OpenAI GPT-4",
            "provider": "openai",
            "model_id": "gpt-4",
            "api_base_url": "https://api.openai.com/v1",
            "description": "OpenAI GPT-4 模型，功能強大的語言模型",
            "is_built_in": True
        },
        {
            "name": "OpenAI GPT-3.5 Turbo",
            "provider": "openai",
            "model_id": "gpt-3.5-turbo",
            "api_base_url": "https://api.openai.com/v1",
            "description": "OpenAI GPT-3.5 Turbo，快速且成本效益高",
            "is_built_in": True
        },
        {
            "name": "Claude 3 Sonnet",
            "provider": "anthropic",
            "model_id": "claude-3-sonnet-20240229",
            "api_base_url": "https://api.anthropic.com",
            "description": "Anthropic Claude 3 Sonnet，平衡性能和速度",
            "is_built_in": True
        }
    ]
    
    for model_data in builtin_models:
        existing_model = db.query(AIModel).filter(
            AIModel.model_id == model_data["model_id"],
            AIModel.is_built_in == True
        ).first()
        
        if not existing_model:
            db_model = AIModel(**model_data)
            db.add(db_model)
    
    db.commit()

def get_available_models(db: Session) -> List[AIModel]:
    """獲取所有可用的AI模型"""
    return db.query(AIModel).filter(AIModel.is_active == True).all()

def create_custom_model(db: Session, name: str, provider: str, model_id: str, 
                       api_base_url: str, description: str, user_id: int) -> AIModel:
    """創建自定義模型"""
    db_model = AIModel(
        name=name,
        provider=provider,
        model_id=model_id,
        api_base_url=api_base_url,
        description=description,
        is_built_in=False,
        created_by_user_id=user_id
    )
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return db_model

def delete_custom_model(db: Session, model_id: int, user_id: int) -> bool:
    """刪除自定義模型（只能刪除自己創建的）"""
    model = db.query(AIModel).filter(
        AIModel.id == model_id,
        AIModel.created_by_user_id == user_id,
        AIModel.is_built_in == False
    ).first()
    
    if model:
        # 先刪除相關的用戶偏好設定
        db.query(UserAIModelPreference).filter(
            UserAIModelPreference.model_id == model_id
        ).delete()
        
        db.delete(model)
        db.commit()
        return True
    return False

def set_user_model_preference(db: Session, user_id: int, model_id: int, 
                             api_key: str = None, is_default: bool = False) -> UserAIModelPreference:
    """設定用戶的模型偏好"""
    # 如果設為默認，先清除其他默認設定
    if is_default:
        db.query(UserAIModelPreference).filter(
            UserAIModelPreference.user_id == user_id,
            UserAIModelPreference.is_default == True
        ).update({"is_default": False})
    
    # 檢查是否已存在該模型的偏好設定
    existing_pref = db.query(UserAIModelPreference).filter(
        UserAIModelPreference.user_id == user_id,
        UserAIModelPreference.model_id == model_id
    ).first()
    
    if existing_pref:
        # 更新現有設定
        existing_pref.api_key = api_key
        existing_pref.is_default = is_default
        existing_pref.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_pref)
        return existing_pref
    else:
        # 創建新設定
        db_pref = UserAIModelPreference(
            user_id=user_id,
            model_id=model_id,
            api_key=api_key,
            is_default=is_default
        )
        db.add(db_pref)
        db.commit()
        db.refresh(db_pref)
        return db_pref

def get_user_model_preferences(db: Session, user_id: int) -> List[UserAIModelPreference]:
    """獲取用戶的模型偏好設定"""
    return db.query(UserAIModelPreference).filter(
        UserAIModelPreference.user_id == user_id
    ).join(AIModel).filter(AIModel.is_active == True).all()

def get_user_default_model(db: Session, user_id: int) -> Optional[UserAIModelPreference]:
    """獲取用戶的默認模型"""
    return db.query(UserAIModelPreference).filter(
        UserAIModelPreference.user_id == user_id,
        UserAIModelPreference.is_default == True
    ).join(AIModel).filter(AIModel.is_active == True).first()

def delete_user_model_preference(db: Session, user_id: int, model_id: int) -> bool:
    """刪除用戶的模型偏好設定"""
    pref = db.query(UserAIModelPreference).filter(
        UserAIModelPreference.user_id == user_id,
        UserAIModelPreference.model_id == model_id
    ).first()
    
    if pref:
        db.delete(pref)
        db.commit()
        return True
    return False