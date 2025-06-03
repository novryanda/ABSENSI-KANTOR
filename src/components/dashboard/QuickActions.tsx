// ============================================================================
// QUICK ACTIONS COMPONENT
// src/components/dashboard/QuickActions.tsx
// ============================================================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Clock, 
  FileText, 
  CheckSquare, 
  Users, 
  BarChart3, 
  Settings,
  Plus,
  LogIn,
  LogOut,
  Calendar,
  MapPin,
  Download,
  Upload,
  Bell,
  Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { QuickAction, TodayAttendance } from '@/types/domain'

interface QuickActionsProps {
  userRole: string
  todayAttendance?: TodayAttendance
  pendingApprovalsCount?: number
  className?: string
  onCheckIn?: () => void
  onCheckOut?: () => void
}

export default function QuickActions({ 
  userRole, 
  todayAttendance,
  pendingApprovalsCount = 0,
  className,
  onCheckIn,
  onCheckOut
}: QuickActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  // Get role-based quick actions
  const getQuickActions = (): QuickAction[] => {
    const baseActions: QuickAction[] = []

    // Attendance actions for all users
    if (todayAttendance?.status === 'not_checked_in') {
      baseActions.push({
        id: 'check-in',
        title: 'Absen Masuk',
        description: 'Catat kehadiran hari ini',
        icon: 'LogIn',
        variant: 'primary',
        action: onCheckIn
      })
    } else if (todayAttendance?.status === 'checked_in') {
      baseActions.push({
        id: 'check-out',
        title: 'Absen Pulang',
        description: 'Catat kepulangan hari ini',
        icon: 'LogOut',
        variant: 'success',
        action: onCheckOut
      })
    }

    // Request actions for all users
    baseActions.push(
      {
        id: 'leave-request',
        title: 'Pengajuan Cuti',
        description: 'Buat pengajuan cuti baru',
        icon: 'Calendar',
        href: '/requests/leave',
        variant: 'secondary'
      },
      {
        id: 'permission-request',
        title: 'Pengajuan Izin',
        description: 'Buat pengajuan izin',
        icon: 'FileText',
        href: '/requests/permission',
        variant: 'secondary'
      }
    )

    // Role-specific actions
    switch (userRole) {
      case 'EMPLOYEE':
        baseActions.push(
          {
            id: 'attendance-history',
            title: 'Riwayat Absensi',
            description: 'Lihat riwayat kehadiran',
            icon: 'Clock',
            href: '/attendance/history',
            variant: 'secondary'
          },
          {
            id: 'my-requests',
            title: 'Pengajuan Saya',
            description: 'Lihat status pengajuan',
            icon: 'FileText',
            href: '/requests',
            variant: 'secondary'
          }
        )
        break

      case 'SUPERVISOR':
      case 'MANAGER':
        baseActions.push(
          {
            id: 'approvals',
            title: 'Persetujuan',
            description: 'Kelola pengajuan tim',
            icon: 'CheckSquare',
            href: '/approvals',
            variant: 'warning',
            badge: pendingApprovalsCount
          },
          {
            id: 'team-attendance',
            title: 'Absensi Tim',
            description: 'Monitor kehadiran tim',
            icon: 'Users',
            href: '/reports/attendance',
            variant: 'secondary'
          },
          {
            id: 'team-reports',
            title: 'Laporan Tim',
            description: 'Generate laporan tim',
            icon: 'BarChart3',
            href: '/reports/department',
            variant: 'secondary'
          }
        )
        break

      case 'HR_ADMIN':
        baseActions.push(
          {
            id: 'approvals',
            title: 'Persetujuan',
            description: 'Kelola semua pengajuan',
            icon: 'CheckSquare',
            href: '/approvals',
            variant: 'warning',
            badge: pendingApprovalsCount
          },
          {
            id: 'user-management',
            title: 'Kelola Karyawan',
            description: 'Manajemen data karyawan',
            icon: 'Users',
            href: '/admin/users',
            variant: 'secondary'
          },
          {
            id: 'company-reports',
            title: 'Laporan Perusahaan',
            description: 'Laporan keseluruhan',
            icon: 'BarChart3',
            href: '/reports/admin',
            variant: 'secondary'
          },
          {
            id: 'export-data',
            title: 'Export Data',
            description: 'Download laporan Excel/PDF',
            icon: 'Download',
            href: '/reports/export',
            variant: 'secondary'
          }
        )
        break

      case 'SUPER_ADMIN':
        baseActions.push(
          {
            id: 'approvals',
            title: 'Persetujuan',
            description: 'Kelola semua pengajuan',
            icon: 'CheckSquare',
            href: '/approvals',
            variant: 'warning',
            badge: pendingApprovalsCount
          },
          {
            id: 'user-management',
            title: 'Kelola Karyawan',
            description: 'Manajemen data karyawan',
            icon: 'Users',
            href: '/admin/users',
            variant: 'secondary'
          },
          {
            id: 'system-settings',
            title: 'Pengaturan Sistem',
            description: 'Konfigurasi aplikasi',
            icon: 'Settings',
            href: '/admin/settings',
            variant: 'secondary'
          },
          {
            id: 'audit-logs',
            title: 'Audit Logs',
            description: 'Monitor aktivitas sistem',
            icon: 'Shield',
            href: '/admin/audit',
            variant: 'secondary'
          },
          {
            id: 'company-reports',
            title: 'Analytics',
            description: 'Dashboard analytics',
            icon: 'BarChart3',
            href: '/reports/analytics',
            variant: 'secondary'
          }
        )
        break
    }

    return baseActions
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      LogIn,
      LogOut,
      Clock,
      FileText,
      CheckSquare,
      Users,
      BarChart3,
      Settings,
      Plus,
      Calendar,
      MapPin,
      Download,
      Upload,
      Bell,
      Shield
    }
    return icons[iconName] || FileText
  }

  const getVariantStyles = (variant: QuickAction['variant']) => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600'
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600'
      case 'secondary':
      default:
        return 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200 hover:border-gray-300'
    }
  }

  const handleAction = async (action: QuickAction) => {
    if (action.disabled) return

    if (action.action) {
      setIsLoading(action.id)
      try {
        await action.action()
      } catch (error) {
        console.error('Action failed:', error)
      } finally {
        setIsLoading(null)
      }
    }
  }

  const actions = getQuickActions()

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Aksi Cepat
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Akses fitur yang sering digunakan
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = getIcon(action.icon)
            const isCurrentlyLoading = isLoading === action.id

            if (action.href) {
              return (
                <Link key={action.id} href={action.href}>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full h-auto p-4 flex flex-col items-start gap-2 transition-all duration-200',
                      getVariantStyles(action.variant),
                      action.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={action.disabled}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className="h-5 w-5" />
                      {action.badge && action.badge > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="text-xs px-1.5 py-0.5 min-w-[20px] h-5"
                        >
                          {action.badge > 99 ? '99+' : action.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs opacity-80 mt-1">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              )
            }

            return (
              <Button
                key={action.id}
                variant="outline"
                className={cn(
                  'w-full h-auto p-4 flex flex-col items-start gap-2 transition-all duration-200',
                  getVariantStyles(action.variant),
                  action.disabled && 'opacity-50 cursor-not-allowed'
                )}
                disabled={action.disabled || isCurrentlyLoading}
                onClick={() => handleAction(action)}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon className={cn(
                    'h-5 w-5',
                    isCurrentlyLoading && 'animate-spin'
                  )} />
                  {action.badge && action.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="text-xs px-1.5 py-0.5 min-w-[20px] h-5"
                    >
                      {action.badge > 99 ? '99+' : action.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs opacity-80 mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>

        {/* Additional Info */}
        {todayAttendance && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Status Hari Ini:</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {todayAttendance.status === 'not_checked_in' && 'Belum Absen Masuk'}
                {todayAttendance.status === 'checked_in' && 'Sudah Absen Masuk'}
                {todayAttendance.status === 'checked_out' && 'Sudah Absen Pulang'}
                {todayAttendance.status === 'absent' && 'Tidak Hadir'}
              </span>
              {todayAttendance.checkInTime && (
                <span className="text-xs text-gray-500">
                  Masuk: {new Date(todayAttendance.checkInTime).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
