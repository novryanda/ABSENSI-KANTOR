// ============================================================================
// RECENT ACTIVITY COMPONENT
// src/components/dashboard/RecentActivity.tsx
// ============================================================================

'use client'

import { 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Building2,
  Timer,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ActivityItem, RecentRequest, AttendanceTrend } from '@/types/domain'
import { RequestStatus, AttendanceStatus } from '@prisma/client'

interface RecentActivityProps {
  recentRequests?: RecentRequest[]
  attendanceTrend?: AttendanceTrend[]
  userRole: string
  className?: string
}

export default function RecentActivity({ 
  recentRequests = [], 
  attendanceTrend = [],
  userRole,
  className 
}: RecentActivityProps) {

  // Combine and sort all activities
  const getAllActivities = (): ActivityItem[] => {
    const activities: ActivityItem[] = []

    // Add attendance activities
    attendanceTrend.forEach(attendance => {
      activities.push({
        id: `attendance-${attendance.date}`,
        type: 'attendance',
        title: getAttendanceTitle(attendance.status),
        description: getAttendanceDescription(attendance),
        timestamp: attendance.date,
        metadata: {
          status: attendance.status,
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          workingHours: attendance.workingHours
        }
      })
    })

    // Add request activities
    recentRequests.forEach(request => {
      activities.push({
        id: `request-${request.id}`,
        type: 'request',
        title: getRequestTitle(request.type, request.status),
        description: getRequestDescription(request),
        timestamp: request.createdAt,
        metadata: {
          requestType: request.type,
          status: request.status,
          startDate: request.startDate,
          endDate: request.endDate
        }
      })
    })

    // Sort by timestamp (newest first)
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10) // Limit to 10 most recent
  }

  const getAttendanceTitle = (status: AttendanceStatus): string => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'Absensi Hadir'
      case AttendanceStatus.ABSENT:
        return 'Tidak Hadir'
      case AttendanceStatus.LEAVE:
        return 'Sedang Cuti'
      case AttendanceStatus.SICK:
        return 'Sakit'
      case AttendanceStatus.PERMISSION:
        return 'Izin'
      default:
        return 'Aktivitas Absensi'
    }
  }

  const getAttendanceDescription = (attendance: AttendanceTrend): string => {
    const date = new Date(attendance.date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })

    if (attendance.status === AttendanceStatus.PRESENT) {
      const checkIn = attendance.checkInTime 
        ? new Date(attendance.checkInTime).toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : '-'
      const checkOut = attendance.checkOutTime 
        ? new Date(attendance.checkOutTime).toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : '-'
      
      return `${date} • Masuk: ${checkIn} • Pulang: ${checkOut}`
    }

    return `${date} • ${getAttendanceTitle(attendance.status)}`
  }

  const getRequestTitle = (type: string, status: RequestStatus): string => {
    const typeMap = {
      leave: 'Pengajuan Cuti',
      permission: 'Pengajuan Izin',
      work_letter: 'Surat Kerja'
    }

    const statusMap = {
      [RequestStatus.PENDING]: 'Diajukan',
      [RequestStatus.APPROVED]: 'Disetujui',
      [RequestStatus.REJECTED]: 'Ditolak',
      [RequestStatus.CANCELLED]: 'Dibatalkan'
    }

    return `${typeMap[type as keyof typeof typeMap] || 'Pengajuan'} ${statusMap[status]}`
  }

  const getRequestDescription = (request: RecentRequest): string => {
    const createdDate = new Date(request.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long'
    })

    if (request.startDate && request.endDate) {
      const startDate = new Date(request.startDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      })
      const endDate = new Date(request.endDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      })
      return `${createdDate} • Periode: ${startDate} - ${endDate}`
    }

    return `${createdDate} • ${request.title}`
  }

  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'attendance':
        const status = activity.metadata?.status
        if (status === AttendanceStatus.PRESENT) return Clock
        if (status === AttendanceStatus.ABSENT) return XCircle
        if (status === AttendanceStatus.LEAVE) return Calendar
        return AlertCircle

      case 'request':
        const requestType = activity.metadata?.requestType
        if (requestType === 'leave') return Calendar
        if (requestType === 'permission') return FileText
        if (requestType === 'work_letter') return Building2
        return FileText

      case 'approval':
        return CheckCircle

      case 'system':
        return Activity

      default:
        return Activity
    }
  }

  const getActivityIconColor = (activity: ActivityItem): string => {
    switch (activity.type) {
      case 'attendance':
        const status = activity.metadata?.status
        if (status === AttendanceStatus.PRESENT) return 'text-green-600'
        if (status === AttendanceStatus.ABSENT) return 'text-red-600'
        if (status === AttendanceStatus.LEAVE) return 'text-blue-600'
        return 'text-yellow-600'

      case 'request':
        const requestStatus = activity.metadata?.status
        if (requestStatus === RequestStatus.APPROVED) return 'text-green-600'
        if (requestStatus === RequestStatus.REJECTED) return 'text-red-600'
        if (requestStatus === RequestStatus.PENDING) return 'text-yellow-600'
        return 'text-gray-600'

      case 'approval':
        return 'text-blue-600'

      case 'system':
        return 'text-purple-600'

      default:
        return 'text-gray-600'
    }
  }

  const getStatusBadge = (activity: ActivityItem) => {
    if (activity.type === 'request') {
      const status = activity.metadata?.status
      switch (status) {
        case RequestStatus.PENDING:
          return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
        case RequestStatus.APPROVED:
          return <Badge variant="outline" className="text-green-600 border-green-600">Disetujui</Badge>
        case RequestStatus.REJECTED:
          return <Badge variant="outline" className="text-red-600 border-red-600">Ditolak</Badge>
        case RequestStatus.CANCELLED:
          return <Badge variant="outline" className="text-gray-600 border-gray-600">Dibatalkan</Badge>
      }
    }

    if (activity.type === 'attendance') {
      const status = activity.metadata?.status
      switch (status) {
        case AttendanceStatus.PRESENT:
          return <Badge variant="outline" className="text-green-600 border-green-600">Hadir</Badge>
        case AttendanceStatus.ABSENT:
          return <Badge variant="outline" className="text-red-600 border-red-600">Tidak Hadir</Badge>
        case AttendanceStatus.LEAVE:
          return <Badge variant="outline" className="text-blue-600 border-blue-600">Cuti</Badge>
        case AttendanceStatus.SICK:
          return <Badge variant="outline" className="text-orange-600 border-orange-600">Sakit</Badge>
        case AttendanceStatus.PERMISSION:
          return <Badge variant="outline" className="text-purple-600 border-purple-600">Izin</Badge>
      }
    }

    return null
  }

  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffInHours = (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes} menit yang lalu`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} jam yang lalu`
    } else if (diffInHours < 48) {
      return 'Kemarin'
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} hari yang lalu`
    }
  }

  const activities = getAllActivities()

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Aktivitas Terbaru
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Riwayat aktivitas dan pengajuan terbaru
        </p>
      </CardHeader>
      
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada aktivitas</p>
              <p className="text-xs mt-1">Aktivitas akan muncul di sini</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = getActivityIcon(activity)
                const iconColor = getActivityIconColor(activity)
                const badge = getStatusBadge(activity)

                return (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                    {/* Icon */}
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                      'bg-gray-100 dark:bg-gray-800'
                    )}>
                      <Icon className={cn('h-4 w-4', iconColor)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {activity.description}
                          </p>
                        </div>
                        {badge && (
                          <div className="flex-shrink-0">
                            {badge}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                        
                        {/* Additional metadata */}
                        {activity.type === 'attendance' && activity.metadata?.workingHours && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {activity.metadata.workingHours}h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {/* View All Link */}
        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Lihat Semua Aktivitas →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
