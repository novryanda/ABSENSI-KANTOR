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
import { generateAttendanceKey, generateRequestKey, validateUniqueKeys, debugKeys } from '@/utils/keyUtils'
import { formatWorkingHours, getAttendanceDate, parseAttendanceDate, formatRelativeTime, getDisplayWorkingMinutes } from '@/utils/dateUtils'
import ErrorBoundary from '@/components/common/ErrorBoundary'

interface RecentActivityProps {
  recentRequests?: RecentRequest[]
  attendanceTrend?: AttendanceTrend[]
  userRole: string
  className?: string
}

function RecentActivityComponent({
  recentRequests = [],
  attendanceTrend = [],
  userRole,
  className
}: RecentActivityProps) {

  // Combine and sort all activities with comprehensive error handling
  const getAllActivities = (): ActivityItem[] => {
    const activities: ActivityItem[] = []

    try {
      // Validate input data with detailed logging
      if (!Array.isArray(attendanceTrend)) {
        console.warn('RecentActivity: attendanceTrend is not an array:', {
          type: typeof attendanceTrend,
          value: attendanceTrend,
          isNull: attendanceTrend === null,
          isUndefined: attendanceTrend === undefined
        })
      }
      if (!Array.isArray(recentRequests)) {
        console.warn('RecentActivity: recentRequests is not an array:', {
          type: typeof recentRequests,
          value: recentRequests,
          isNull: recentRequests === null,
          isUndefined: recentRequests === undefined
        })
      }

      // Process attendance activities with comprehensive error handling
      const safeAttendanceTrend = Array.isArray(attendanceTrend) ? attendanceTrend : []
      console.log('🔍 Processing attendance trend:', {
        count: safeAttendanceTrend.length,
        sample: safeAttendanceTrend[0],
        rawData: safeAttendanceTrend
      })

      // Debug: Log each attendance record in detail
      safeAttendanceTrend.forEach((item, idx) => {
        console.log(`📅 Attendance ${idx}:`, {
          date: item?.date,
          dateType: typeof item?.date,
          dateISO: item?.date instanceof Date ? item.date.toISOString() : 'Not a Date',
          status: item?.status,
          checkInTime: item?.checkInTime,
          checkOutTime: item?.checkOutTime
        })
      })

      // CRITICAL FIX: Convert date strings to Date objects with proper normalization
      const normalizedAttendanceTrend = safeAttendanceTrend.map((item, idx) => {
        const originalDate = item.date

        // CRITICAL: Parse date with timezone awareness to prevent date shifts
        const parsedDate = parseAttendanceDate(item.date)

        // Debug timezone issues
        console.log(`🕐 Date conversion ${idx}:`, {
          original: originalDate,
          originalType: typeof originalDate,
          parsed: parsedDate,
          parsedISO: parsedDate.toISOString(),
          parsedLocal: parsedDate.toLocaleDateString('id-ID'),
          parsedLocalFull: parsedDate.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: parsedDate.getTimezoneOffset()
        })

        return {
          ...item,
          date: parsedDate, // Use simple parsed date without additional normalization
          checkInTime: item.checkInTime ? new Date(item.checkInTime) : undefined,
          checkOutTime: item.checkOutTime ? new Date(item.checkOutTime) : undefined
        }
      })

      console.log('🔧 Normalized attendance trend:', {
        original: safeAttendanceTrend.length,
        normalized: normalizedAttendanceTrend.length,
        sampleNormalized: normalizedAttendanceTrend[0] ? {
          date: normalizedAttendanceTrend[0].date,
          dateISO: normalizedAttendanceTrend[0].date.toISOString(),
          dateLocal: normalizedAttendanceTrend[0].date.toLocaleDateString('id-ID')
        } : null
      })

      normalizedAttendanceTrend.forEach((attendance, index) => {
        try {
          // Validate attendance record
          if (!attendance) {
            console.warn(`Skipping null/undefined attendance at index ${index}`)
            return
          }

          if (!attendance.date) {
            console.warn(`Skipping attendance with missing date at index ${index}:`, attendance)
            return
          }

          console.log(`📅 Processing normalized attendance ${index}:`, {
            date: attendance.date,
            dateISO: attendance.date.toISOString(),
            dateLocal: attendance.date.toLocaleDateString('id-ID'),
            status: attendance.status
          })

          // Generate unique, stable key using utility function
          const uniqueId = generateAttendanceKey(attendance, index)
          console.log(`Generated attendance key: ${uniqueId} for index ${index}`)

          // Safely get title and description
          const title = getAttendanceTitle(attendance.status)
          const description = getAttendanceDescription(attendance)

          // FIXED: Use check-in time for activity timestamp instead of attendance date
          const activityTimestamp = attendance.checkInTime || attendance.date

          activities.push({
            id: uniqueId,
            type: 'attendance',
            title,
            description,
            timestamp: activityTimestamp,
            metadata: {
              status: attendance.status,
              checkInTime: attendance.checkInTime,
              checkOutTime: attendance.checkOutTime,
              workingHours: attendance.workingHours,
              workingHoursMinutes: attendance.workingHoursMinutes
            }
          })
        } catch (error) {
          console.error(`Error processing attendance at index ${index}:`, error, attendance)
        }
      })

      // Process request activities with comprehensive error handling
      const safeRecentRequests = Array.isArray(recentRequests) ? recentRequests : []
      console.log('🔍 Processing recent requests:', {
        count: safeRecentRequests.length,
        sample: safeRecentRequests[0]
      })

      safeRecentRequests.forEach((request, index) => {
        try {
          // Validate request record
          if (!request) {
            console.warn(`Skipping null/undefined request at index ${index}`)
            return
          }

          // Generate unique, stable key using utility function
          const uniqueId = generateRequestKey(request, index)
          console.log(`Generated request key: ${uniqueId} for index ${index}`)

          // Safely get title and description
          const title = getRequestTitle(request.type, request.status)
          const description = getRequestDescription(request)

          activities.push({
            id: uniqueId,
            type: 'request',
            title,
            description,
            timestamp: request.createdAt,
            metadata: {
              requestType: request.type,
              status: request.status,
              startDate: request.startDate,
              endDate: request.endDate
            }
          })
        } catch (error) {
          console.error(`Error processing request at index ${index}:`, error, request)
        }
      })

      // Sort by timestamp (newest first) with error handling
      const sortedActivities = activities
        .sort((a, b) => {
          try {
            const timeA = new Date(b.timestamp).getTime()
            const timeB = new Date(a.timestamp).getTime()
            return timeA - timeB
          } catch (error) {
            console.error('Error sorting activities:', error)
            return 0
          }
        })
        .slice(0, 10) // Limit to 10 most recent

      // Validate keys in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const keys = sortedActivities.map(activity => activity.id)
          validateUniqueKeys(keys, 'RecentActivity')
          debugKeys(keys, 'RecentActivity')
        } catch (error) {
          console.error('Error validating keys:', error)
        }
      }

      console.log('✅ Successfully processed activities:', {
        total: activities.length,
        sorted: sortedActivities.length,
        keys: sortedActivities.map(a => a.id)
      })

      return sortedActivities

    } catch (error) {
      console.error('❌ Critical error in getAllActivities:', error)
      // Return empty array as fallback
      return []
    }
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
    try {
      if (!attendance || !attendance.date) {
        console.error('❌ getAttendanceDescription - Invalid attendance data:', attendance)
        return 'Data tidak tersedia'
      }

      // Debug logging to track date handling
      console.log('📅 getAttendanceDescription - Processing attendance:', {
        date: attendance.date,
        dateType: typeof attendance.date,
        dateISO: attendance.date instanceof Date ? attendance.date.toISOString() : 'Not a Date object',
        status: attendance.status
      })

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
    } catch (error) {
      console.error('Error generating attendance description:', error, attendance)
      return 'Error memuat deskripsi'
    }
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
    try {
      if (!request || !request.createdAt) {
        return 'Data tidak tersedia'
      }

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

      return `${createdDate} • ${request.title || 'Pengajuan'}`
    } catch (error) {
      console.error('Error generating request description:', error, request)
      return 'Error memuat deskripsi'
    }
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

  // REMOVED: Using the improved formatRelativeTime from dateUtils instead

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
                        
                        {/* Additional metadata with real-time working hours */}
                        {activity.type === 'attendance' && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {(() => {
                              try {
                                return formatWorkingHours(
                                  getDisplayWorkingMinutes(
                                    activity.metadata?.checkInTime,
                                    activity.metadata?.checkOutTime,
                                    activity.metadata?.workingHoursMinutes
                                  )
                                )
                              } catch (error) {
                                console.error('❌ Error calculating working hours in RecentActivity:', error)
                                return '0h 0m'
                              }
                            })()}
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

// Export wrapped component with error boundary
export default function RecentActivity(props: RecentActivityProps) {
  return (
    <ErrorBoundary
      componentName="RecentActivity"
      onError={(error, errorInfo) => {
        console.error('RecentActivity Error:', { error, errorInfo, props })
      }}
    >
      <RecentActivityComponent {...props} />
    </ErrorBoundary>
  )
}
