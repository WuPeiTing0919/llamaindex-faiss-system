/**
 * API 配置文件
 * 根據環境變數設置API的基礎URL
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * API 端點列表
 */
export const API_ENDPOINTS = {
  // 認證相關
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  ME: `${API_BASE_URL}/auth/me`,
  
  // 知識庫相關
  QUERY: `${API_BASE_URL}/query`,
  UPLOAD: `${API_BASE_URL}/upload`,
  DOCUMENTS: `${API_BASE_URL}/documents`,
  STATUS: `${API_BASE_URL}/status`,
  HEALTH: `${API_BASE_URL}/health`,
};

/**
 * 獲取API請求的headers
 */
export const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
};

/**
 * 獲取帶認證的API請求headers
 */
export const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * 獲取上傳文件的headers
 */
export const getUploadHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}; 