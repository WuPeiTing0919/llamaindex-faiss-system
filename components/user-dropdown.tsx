"use client"

import React from 'react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail, 
  Calendar, 
  LogOut, 
  Settings,
  ChevronDown
} from "lucide-react"
import { useAuth } from '@/components'

export const UserDropdown: React.FC = () => {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-sm">
              {getInitials(user.full_name, user.username)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        {/* 用戶信息頭部 */}
        <div className="flex items-center space-x-3 p-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-base">
              {getInitials(user.full_name, user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.full_name || user.username}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <Badge variant="secondary" className="text-xs">
              個人知識庫會員
            </Badge>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* 用戶詳細信息 */}
        <div className="px-4 py-2 space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">用戶名:</span>
            <span className="font-medium">{user.username}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">郵箱:</span>
            <span className="font-medium">{user.email}</span>
          </div>
          
          {user.full_name && (
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">姓名:</span>
              <span className="font-medium">{user.full_name}</span>
            </div>
          )}
          
          {(user as any).created_at && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">加入時間:</span>
              <span className="font-medium">{formatDate((user as any).created_at)}</span>
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* 操作按鈕 */}
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>登出</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 