"""
FastAPI 服務器 - 提供 REST API 接口
"""

import time
import base64
import os
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from setup_knowledge_base import KnowledgeBaseSystem

# 載入環境變數
load_dotenv()

app = FastAPI(title="企業知識庫 API", version="1.0.0")

# 設置允許的來源
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://llamaindex-faiss-system.vercel.app",
    "https://llamaindex-faiss-system-*.vercel.app",  # Vercel 預覽部署
    "https://llamaindex-faiss-system.zeabur.app",
]

# 如果有環境變數指定的前端URL，也加入允許列表
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))

# 在開發環境或如果設置了允許所有來源的環境變數，則允許所有來源
if os.getenv("ALLOW_ALL_ORIGINS", "false").lower() == "true":
    allowed_origins = ["*"]

# 添加 CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# 請求/響應模型
class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5


class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[dict]
    processing_time: float


class SystemStatus(BaseModel):
    status: str
    documents_count: int
    index_size: int
    model_status: str


# 文件上傳請求模型
class FileUploadRequest(BaseModel):
    filename: str
    content_base64: str
    content_type: Optional[str] = None


# 全局知識庫實例
kb_system = KnowledgeBaseSystem()


@app.on_event("startup")
async def startup_event():
    """應用啟動時初始化"""
    print("正在初始化知識庫系統...")
    kb_system.load_documents()
    if not kb_system.load_index():
        kb_system.build_index()
    print("知識庫系統初始化完成")


@app.get("/")
async def root():
    return {"message": "企業知識庫 API 服務運行中"}


@app.post("/upload", response_model=dict)
async def upload_document(file_data: FileUploadRequest):
    """上傳文檔 (Base64編碼)"""
    try:
        # 保存上傳的文件
        upload_dir = Path("documents")
        upload_dir.mkdir(exist_ok=True)
        
        file_path = upload_dir / file_data.filename
        
        # 解碼Base64内容
        file_content = base64.b64decode(file_data.content_base64)
        
        # 保存文件
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # 重新建立索引
        kb_system.load_documents()
        kb_system.build_index()
        
        return {
            "message": f"文檔 {file_data.filename} 上傳成功",
            "filename": file_data.filename,
            "size": file_path.stat().st_size
        }
    except Exception as e:
        detail = f"上傳失敗: {str(e)}"
        raise HTTPException(status_code=500, detail=detail)


@app.post("/query", response_model=dict)
async def query_knowledge_base(request: QueryRequest):
    """查詢知識庫"""
    try:
        start_time = time.time()
        
        # 執行實際查詢
        search_results = kb_system.search(request.query, request.top_k)
        
        # 提取最相關的上下文文檔
        context_docs = [result['content'] for result in search_results[:2]]
        
        # 使用 LLM 生成回答
        answer = kb_system.query_with_llm(request.query, context_docs)
        
        processing_time = time.time() - start_time
        
        return {
            "query": request.query,
            "answer": answer,
            "sources": search_results,
            "processing_time": processing_time
        }
    except Exception as e:
        detail = f"查詢失敗: {str(e)}"
        raise HTTPException(status_code=500, detail=detail)


@app.get("/status", response_model=dict)
async def get_system_status():
    """獲取系統狀態"""
    return {
        "status": "running",
        "documents_count": len(kb_system.documents),
        "index_size": kb_system.faiss_index.ntotal if kb_system.faiss_index else 0,
        "model_status": "ready",
        "memory_usage": "2.1GB",  # 這個可以改為實際測量
        "cpu_usage": "45%"        # 這個可以改為實際測量
    }


@app.get("/documents", response_model=List[dict])
async def list_documents():
    """列出所有文檔"""
    docs_dir = Path("documents")
    if not docs_dir.exists():
        return []
    
    documents = []
    for file_path in docs_dir.glob("*"):
        if file_path.is_file():
            documents.append({
                "filename": file_path.name,
                "size": file_path.stat().st_size,
                "modified": file_path.stat().st_mtime
            })
    
    return documents


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
