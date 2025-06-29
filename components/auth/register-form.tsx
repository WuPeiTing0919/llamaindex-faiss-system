"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus } from "lucide-react"
import { useAuth } from './auth-context'

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const { register, isLoading, error } = useAuth()

  const validatePassword = (password: string, confirmPassword: string) => {
    if (password.length < 6) {
      setPasswordError('密碼至少需要6個字符')
      return false
    }
    if (password !== confirmPassword) {
      setPasswordError('兩次輸入的密碼不一致')
      return false
    }
    setPasswordError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePassword(password, confirmPassword)) {
      return
    }
    
    if (username && email && password) {
      await register(username, email, password, fullName || undefined)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">註冊</CardTitle>
        <CardDescription className="text-center">
          創建您的個人知識庫帳號
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {passwordError && (
            <Alert variant="destructive">
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">用戶名 *</Label>
            <Input
              id="username"
              type="text"
              placeholder="請輸入用戶名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">郵箱 *</Label>
            <Input
              id="email"
              type="email"
              placeholder="請輸入郵箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fullName">姓名</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="請輸入您的姓名（可選）"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">密碼 *</Label>
            <Input
              id="password"
              type="password"
              placeholder="請輸入密碼（至少6個字符）"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (confirmPassword) {
                  validatePassword(e.target.value, confirmPassword)
                }
              }}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">確認密碼 *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="請再次輸入密碼"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                validatePassword(password, e.target.value)
              }}
              required
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !username || !email || !password || !confirmPassword || !!passwordError}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                註冊中...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                註冊
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          已有帳號？{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary hover:underline"
            disabled={isLoading}
          >
            立即登入
          </button>
        </div>
      </CardContent>
    </Card>
  )
} 