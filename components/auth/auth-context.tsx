"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  username: string
  email: string
  full_name?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, email: string, password: string, fullName?: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // API 基礎 URL
  const getApiBaseUrl = () => {
  // 優先使用環境變數
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  }
  
  // 生產環境檢查
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    console.error('⚠️ NEXT_PUBLIC_API_URL 環境變數未設置！請在 Vercel 中配置正確的後端 API URL')
    // 在生產環境中，如果沒有設置環境變數，應該顯示錯誤而不是猜測
    return ''
  }
  
  // 僅在本地開發環境使用默認值
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:8000`
    }
  }
  
  return 'http://localhost:8000'
}

  const API_BASE_URL = getApiBaseUrl()

  // 初始化時檢查本地存儲的token
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('user_info')

      if (storedToken && storedUser) {
        try {
          // 驗證token是否仍然有效
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const userData = await response.json()
            setToken(storedToken)
            setUser(userData)
          } else {
            // Token無效，清除本地存儲
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user_info')
          }
        } catch (error) {
          console.error('驗證token失敗:', error)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_info')
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [API_BASE_URL])

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.access_token)
        setUser(data.user_info)
        
        // 保存到本地存儲
        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('user_info', JSON.stringify(data.user_info))
        
        setIsLoading(false)
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '登入失敗')
        setIsLoading(false)
        return false
      }
    } catch (error) {
      setError('網絡錯誤，請稍後再試')
      setIsLoading(false)
      return false
    }
  }

  const register = async (
    username: string, 
    email: string, 
    password: string, 
    fullName?: string
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.access_token)
        setUser(data.user_info)
        
        // 保存到本地存儲
        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('user_info', JSON.stringify(data.user_info))
        
        setIsLoading(false)
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '註冊失敗')
        setIsLoading(false)
        return false
      }
    } catch (error) {
      setError('網絡錯誤，請稍後再試')
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setError(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 