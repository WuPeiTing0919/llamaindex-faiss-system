"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Mail, Calendar } from "lucide-react"
import { useAuth } from './auth-context'

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth()

  if (!user) return null

  const getInitials = (name?: string, username?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return username?.slice(0, 2).toUpperCase() || 'U'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-lg">
              {getInitials(user.full_name, user.username)}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-xl">
          {user.full_name || user.username}
        </CardTitle>
        <CardDescription>
          個人知識庫會員
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">用戶名</p>
              <p className="text-sm text-muted-foreground">{user.username}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">郵箱</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          {user.full_name && (
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">姓名</p>
                <p className="text-sm text-muted-foreground">{user.full_name}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t">
          <Button 
            onClick={logout} 
            variant="outline" 
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            登出
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 