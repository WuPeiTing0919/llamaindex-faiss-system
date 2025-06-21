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