// ============================================================================
// NOTIFICATION PANEL COMPONENT
// src/components/dashboard/NotificationPanel.tsx
// ============================================================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Bell, 
  CheckSquare, 
  AlertCircle, 
  Info, 
  Clock,
  X,
  Check,
  ExternalLink,
  Filter,
  MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { DashboardNotification, PendingApproval } from '@/types/domain'

interface NotificationPanelProps {
  notifications?: DashboardNotification[]
  pendingApprovals?: PendingApproval[]
  userRole: string
  className?: string
  onMarkAsRead?: (notificationId: string) => void
  onMarkAllAsRead?: () => void
}

export default function NotificationPanel({ 
  notifications = [],
  pendingApprovals = [],
  userRole,
  className,
  onMarkAsRead,
  onMarkAllAsRead
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'approval' | 'system'>('all')

  // Combine notifications and approvals
  const getAllNotifications = (): DashboardNotification[] => {
    const allNotifications: DashboardNotification[] = [...notifications]

    // Convert pending approvals to notifications for supervisors/managers
    if (['SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      pendingApprovals.forEach(approval => {
        allNotifications.push({
          id: `approval-${approval.id}`,
          type: 'approval',
          title: 'Pengajuan Perlu Persetujuan',
          message: `${approval.requesterName} mengajukan ${getRequestTypeLabel(approval.type)}`,
          priority: approval.urgency,
          isRead: false,
          createdAt: approval.submittedAt,
          actionUrl: `/approvals/${approval.id}`,
          metadata: {
            requestType: approval.type,
            requesterName: approval.requesterName,
            requesterDepartment: approval.requesterDepartment,
            urgency: approval.urgency
          }
        })
      })
    }

    return allNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  const getFilteredNotifications = (): DashboardNotification[] => {
    const allNotifications = getAllNotifications()

    switch (filter) {
      case 'unread':
        return allNotifications.filter(n => !n.isRead)
      case 'approval':
        return allNotifications.filter(n => n.type === 'approval')
      case 'system':
        return allNotifications.filter(n => n.type === 'system')
      default:
        return allNotifications
    }
  }

  const getRequestTypeLabel = (type: string): string => {
    switch (type) {
      case 'leave': return 'cuti'
      case 'permission': return 'izin'
      case 'work_letter': return 'surat kerja'
      default: return 'pengajuan'
    }
  }

  const getNotificationIcon = (notification: DashboardNotification) => {
    switch (notification.type) {
      case 'approval':
        return CheckSquare
      case 'request_update':
        return Info
      case 'system':
        return AlertCircle
      case 'reminder':
        return Clock
      default:
        return Bell
    }
  }

  const getNotificationIconColor = (notification: DashboardNotification): string => {
    switch (notification.priority) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>
      case 'medium':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs">Medium</Badge>
      case 'low':
        return <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">Low</Badge>
      default:
        return null
    }
  }

  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffInHours = (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}m`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d`
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(notificationId)
    }
  }

  const filteredNotifications = getFilteredNotifications()
  const unreadCount = getAllNotifications().filter(n => !n.isRead).length

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifikasi
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  Semua Notifikasi
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('unread')}>
                  Belum Dibaca ({unreadCount})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilter('approval')}>
                  Persetujuan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('system')}>
                  Sistem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mark All as Read */}
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8"
                onClick={onMarkAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Tandai Semua
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {filteredNotifications.length === 0 
            ? 'Tidak ada notifikasi' 
            : `${filteredNotifications.length} notifikasi`
          }
        </p>
      </CardHeader>
      
      <CardContent>
        {filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="text-center">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada notifikasi</p>
              <p className="text-xs mt-1">
                {filter === 'unread' 
                  ? 'Semua notifikasi sudah dibaca' 
                  : 'Notifikasi akan muncul di sini'
                }
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification)
                const iconColor = getNotificationIconColor(notification)
                const priorityBadge = getPriorityBadge(notification.priority)

                return (
                  <div 
                    key={notification.id} 
                    className={cn(
                      'p-3 rounded-lg border transition-all duration-200 hover:shadow-sm',
                      notification.isRead 
                        ? 'bg-white border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                        notification.isRead ? 'bg-gray-100' : 'bg-blue-100'
                      )}>
                        <Icon className={cn('h-4 w-4', iconColor)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={cn(
                              'text-sm',
                              notification.isRead 
                                ? 'text-gray-900 font-normal' 
                                : 'text-gray-900 font-medium'
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {priorityBadge}
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            {notification.actionUrl && (
                              <Link href={notification.actionUrl}>
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Lihat Detail
                                </Button>
                              </Link>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Tandai Dibaca
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.isRead && (
                                  <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                    Tandai Dibaca
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-red-600">
                                  Hapus Notifikasi
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {/* View All Link */}
        {filteredNotifications.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/notifications">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Lihat Semua Notifikasi →
              </button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
