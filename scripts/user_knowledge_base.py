"""
支持用戶隔離的知識庫系統
每個用戶擁有獨立的文檔和索引
"""

import os
import logging
import uuid
from pathlib import Path
from typing import List, Optional, Dict
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import pickle

# 載入環境變數
load_dotenv()

# 配置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserKnowledgeBaseSystem:
    """支持用戶隔離的企業知識庫系統"""
    
    def __init__(self, 
                 base_docs_folder: str = "user_documents",
                 base_index_path: str = "user_indexes",
                 embed_model_name: str = os.getenv("EMBEDDING_MODEL", "BAAI/bge-base-zh")):
        """
        初始化用戶知識庫系統
        
        Args:
            base_docs_folder: 用戶文檔基礎目錄
            base_index_path: 用戶索引基礎目錄
            embed_model_name: 嵌入模型名稱
        """
        self.base_docs_folder = Path(base_docs_folder)
        self.base_index_path = Path(base_index_path)
        self.embed_model_name = embed_model_name
        
        # 創建基礎目錄
        self.base_docs_folder.mkdir(exist_ok=True)
        self.base_index_path.mkdir(exist_ok=True)
        
        # 初始化嵌入模型
        logger.info(f"載入嵌入模型: {embed_model_name}")
        self.embed_model = SentenceTransformer(embed_model_name)
        
        # 模型維度
        self.dimension = 768  # BGE 模型維度
        
        # 用戶會話緩存
        self.user_sessions = {}
        
    def get_user_docs_folder(self, user_id: int) -> Path:
        """獲取用戶文檔目錄"""
        user_folder = self.base_docs_folder / f"user_{user_id}"
        user_folder.mkdir(exist_ok=True)
        return user_folder
    
    def get_user_index_path(self, user_id: int) -> Path:
        """獲取用戶索引目錄"""
        index_folder = self.base_index_path / f"user_{user_id}"
        index_folder.mkdir(exist_ok=True)
        return index_folder
    
    def save_user_document(self, user_id: int, filename: str, content: bytes) -> str:
        """保存用戶文檔"""
        user_docs_folder = self.get_user_docs_folder(user_id)
        
        # 生成唯一文件名避免衝突
        file_extension = Path(filename).suffix
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = user_docs_folder / unique_filename
        
        with open(file_path, 'wb') as f:
            f.write(content)
        
        logger.info(f"用戶 {user_id} 保存文檔: {filename} -> {unique_filename}")
        return str(file_path)
    
    def extract_text_from_file(self, file_path: Path) -> str:
        """從不同格式的文件中提取文本"""
        try:
            suffix = file_path.suffix.lower()
            
            if suffix in ['.txt', '.md']:
                # 純文本文件
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            
            elif suffix == '.pdf':
                # PDF 文件
                try:
                    import pypdf
                    with open(file_path, 'rb') as f:
                        pdf_reader = pypdf.PdfReader(f)
                        text = ""
                        for page in pdf_reader.pages:
                            text += page.extract_text() + "\n"
                        return text
                except ImportError:
                    logger.error("pypdf 未安裝，無法處理 PDF 文件")
                    return ""
                except Exception as e:
                    logger.error(f"PDF 文本提取失敗: {e}")
                    return ""
            
            elif suffix in ['.docx', '.doc']:
                # Word 文件
                try:
                    from docx import Document
                    doc = Document(file_path)
                    text = ""
                    for paragraph in doc.paragraphs:
                        text += paragraph.text + "\n"
                    return text
                except ImportError:
                    logger.error("python-docx 未安裝，無法處理 Word 文件")
                    return ""
                except Exception as e:
                    logger.error(f"Word 文本提取失敗: {e}")
                    return ""
            
            else:
                logger.warning(f"不支持的文件格式: {suffix}")
                return ""
                
        except Exception as e:
            logger.error(f"文本提取失敗 {file_path}: {e}")
            return ""
    
    def load_user_documents(self, user_id: int) -> List[Dict]:
        """載入用戶文檔"""
        user_docs_folder = self.get_user_docs_folder(user_id)
        documents = []
        metadata = []
        
        # 支持的文件格式
        supported_formats = ['.txt', '.md', '.pdf', '.docx', '.doc']
        
        for file_path in user_docs_folder.glob("**/*"):
            if file_path.is_file() and file_path.suffix.lower() in supported_formats:
                try:
                    content = self.extract_text_from_file(file_path)
                    if content.strip():  # 確保提取到內容
                        documents.append(content)
                        metadata.append({
                            'filename': file_path.name,
                            'path': str(file_path),
                            'size': len(content),
                            'user_id': user_id
                        })
                        logger.info(f"載入用戶 {user_id} 文檔: {file_path.name}")
                    else:
                        logger.warning(f"用戶 {user_id} 文檔 {file_path.name} 沒有提取到文本內容")
                except Exception as e:
                    logger.error(f"載入用戶 {user_id} 文檔失敗 {file_path}: {e}")
        
        return documents, metadata
    
    def build_user_index(self, user_id: int):
        """為特定用戶建立向量索引"""
        documents, metadata = self.load_user_documents(user_id)
        
        if not documents:
            logger.warning(f"用戶 {user_id} 沒有文檔可建立索引")
            return False
        
        logger.info(f"開始為用戶 {user_id} 建立向量索引...")
        
        # 生成文檔嵌入向量
        embeddings = self.embed_model.encode(documents)
        embeddings = np.array(embeddings).astype('float32')
        
        # 創建 FAISS 索引
        faiss_index = faiss.IndexFlatIP(self.dimension)
        faiss_index.add(embeddings)
        
        # 保存索引和元數據
        user_index_path = self.get_user_index_path(user_id)
        index_file = user_index_path / "faiss.index"
        metadata_file = user_index_path / "metadata.pkl"
        documents_file = user_index_path / "documents.pkl"
        
        faiss.write_index(faiss_index, str(index_file))
        
        with open(metadata_file, 'wb') as f:
            pickle.dump(metadata, f)
        
        with open(documents_file, 'wb') as f:
            pickle.dump(documents, f)
        
        logger.info(f"用戶 {user_id} 索引建立完成，包含 {len(documents)} 個文檔")
        return True
    
    def load_user_index(self, user_id: int) -> tuple:
        """載入用戶的索引"""
        user_index_path = self.get_user_index_path(user_id)
        index_file = user_index_path / "faiss.index"
        metadata_file = user_index_path / "metadata.pkl"
        documents_file = user_index_path / "documents.pkl"
        
        if not all([index_file.exists(), metadata_file.exists(), documents_file.exists()]):
            return None, None, None
        
        try:
            faiss_index = faiss.read_index(str(index_file))
            
            with open(metadata_file, 'rb') as f:
                metadata = pickle.load(f)
            
            with open(documents_file, 'rb') as f:
                documents = pickle.load(f)
            
            logger.info(f"載入用戶 {user_id} 索引成功")
            return faiss_index, documents, metadata
        except Exception as e:
            logger.error(f"載入用戶 {user_id} 索引失敗: {e}")
            return None, None, None
    
    def search_user_documents(self, user_id: int, query: str, top_k: int = 5) -> List[dict]:
        """搜索用戶的相關文檔"""
        faiss_index, documents, metadata = self.load_user_index(user_id)
        
        if faiss_index is None:
            logger.error(f"用戶 {user_id} 索引未建立")
            return []
        
        # 生成查詢向量
        query_embedding = self.embed_model.encode([query])
        query_embedding = np.array(query_embedding).astype('float32')
        
        # 搜索
        scores, indices = faiss_index.search(query_embedding, top_k)
        
        results = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx < len(documents):
                results.append({
                    'rank': i + 1,
                    'score': float(score),
                    'content': documents[idx][:500] + "..." if len(documents[idx]) > 500 else documents[idx],
                    'metadata': metadata[idx] if idx < len(metadata) else {},
                    'user_id': user_id
                })
        
        return results
    
    def query_user_with_llm(self, user_id: int, query: str, context_docs: List[str]) -> str:
        """為特定用戶結合檢索結果調用 LLM"""
        # 構建提示詞
        context = "\n\n".join([f"文檔{i+1}: {doc}" for i, doc in enumerate(context_docs)])
        
        prompt = f"""基於以下您的私人文檔內容回答問題：

{context}

問題: {query}

請基於上述您上傳的文檔內容提供準確、詳細的回答："""
        
        # 調用 DeepSeek API
        import requests
        
        try:
            api_key = os.getenv("DEEPSEEK_API_KEY")
            if not api_key:
                logger.error("未設置 DEEPSEEK_API_KEY 環境變數")
                return "錯誤：未設置 DeepSeek API 密鑰"
                
            response = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                },
                json={
                    "model": os.getenv("MODEL_NAME", "deepseek-chat"),
                    "messages": [
                        {"role": "system", "content": f"你是用戶 {user_id} 的私人知識庫助手，只能基於該用戶上傳的文檔回答問題。"},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            else:
                logger.error(f"API 調用失敗: {response.status_code} {response.text}")
                return f"API 調用失敗: {response.text}"
                
        except Exception as e:
            logger.error(f"LLM 調用錯誤: {e}")
            return f"基於您的文檔，無法生成回答。錯誤: {str(e)}"
    
    def delete_user_document(self, user_id: int, filename: str) -> bool:
        """刪除用戶文檔"""
        user_docs_folder = self.get_user_docs_folder(user_id)
        file_path = user_docs_folder / filename
        
        if file_path.exists():
            try:
                file_path.unlink()
                logger.info(f"刪除用戶 {user_id} 文檔: {filename}")
                # 重新建立索引
                self.build_user_index(user_id)
                return True
            except Exception as e:
                logger.error(f"刪除用戶 {user_id} 文檔失敗: {e}")
                return False
        return False
    
    def get_user_document_list(self, user_id: int) -> List[dict]:
        """獲取用戶文檔列表"""
        user_docs_folder = self.get_user_docs_folder(user_id)
        documents = []
        
        for file_path in user_docs_folder.glob("*"):
            if file_path.is_file():
                documents.append({
                    'filename': file_path.name,
                    'size': file_path.stat().st_size,
                    'modified': file_path.stat().st_mtime,
                    'user_id': user_id
                })
        
        return documents
    
    def clear_user_data(self, user_id: int):
        """清除用戶所有數據（用於用戶刪除賬號）"""
        import shutil
        
        user_docs_folder = self.get_user_docs_folder(user_id)
        user_index_path = self.get_user_index_path(user_id)
        
        try:
            if user_docs_folder.exists():
                shutil.rmtree(user_docs_folder)
            if user_index_path.exists():
                shutil.rmtree(user_index_path)
            logger.info(f"清除用戶 {user_id} 所有數據")
            return True
        except Exception as e:
            logger.error(f"清除用戶 {user_id} 數據失敗: {e}")
            return False 