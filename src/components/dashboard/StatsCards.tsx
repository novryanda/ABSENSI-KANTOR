// ============================================================================
// STATS CARDS COMPONENT
// src/components/dashboard/StatsCards.tsx
// ============================================================================

'use client'

import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar,
  Timer,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AttendanceStats, RequestStats, TeamStats, CompanyStats } from '@/types/domain'
import { formatWorkingHours } from '@/utils/dateUtils'

interface StatsCardsProps {
  attendance?: AttendanceStats
  requests?: RequestStats
  team?: TeamStats
  company?: CompanyStats
  userRole: string
  className?: string
}

interface StatCard {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info'
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
}

export default function StatsCards({ 
  attendance, 
  requests, 
  team, 
  company, 
  userRole,
  className 
}: StatsCardsProps) {
  
  const getAttendanceCards = (): StatCard[] => {
    if (!attendance) return []

    const cards: StatCard[] = [
      {
        title: 'Status Hari Ini',
        value: getStatusText(attendance.today.status),
        subtitle: attendance.today.checkInTime 
          ? `Masuk: ${formatTime(attendance.today.checkInTime)}`
          : 'Belum absen masuk',
        icon: Clock,
        variant: getStatusVariant(attendance.today.status),
        badge: attendance.today.isLate ? {
          text: 'Terlambat',
          variant: 'destructive'
        } : undefined
      },
      {
        title: 'Jam Kerja Hari Ini',
        value: attendance.today.workingHoursMinutes !== undefined
          ? formatWorkingHours(attendance.today.workingHoursMinutes)
          : (attendance.today.workingHours ? `${attendance.today.workingHours}h` : '0h 0m'),
        subtitle: `Target: ${attendance.monthly.totalWorkDays * 8}h`,
        icon: Timer,
        variant: 'info',
        trend: {
          value: attendance.monthly.attendanceRate,
          isPositive: attendance.monthly.attendanceRate >= 90,
          label: `${attendance.monthly.attendanceRate}% kehadiran`
        }
      },
      {
        title: 'Hari Hadir',
        value: attendance.monthly.presentDays,
        subtitle: `dari ${attendance.monthly.totalWorkDays} hari kerja`,
        icon: CheckCircle,
        variant: 'success'
      },
      {
        title: 'Hari Tidak Hadir',
        value: attendance.monthly.absentDays,
        subtitle: `Terlambat: ${attendance.monthly.lateDays} hari`,
        icon: XCircle,
        variant: attendance.monthly.absentDays > 3 ? 'danger' : 'warning'
      }
    ]

    return cards
  }

  const getRequestCards = (): StatCard[] => {
    if (!requests) return []

    return [
      {
        title: 'Pengajuan Pending',
        value: requests.pending,
        subtitle: 'Menunggu persetujuan',
        icon: AlertCircle,
        variant: 'warning'
      },
      {
        title: 'Pengajuan Disetujui',
        value: requests.approved,
        subtitle: 'Bulan ini',
        icon: CheckCircle,
        variant: 'success'
      },
      {
        title: 'Total Pengajuan',
        value: requests.total,
        subtitle: 'Semua pengajuan',
        icon: Calendar,
        variant: 'info'
      }
    ]
  }

  const getTeamCards = (): StatCard[] => {
    if (!team) return []

    const attendanceRate = team.totalMembers > 0 
      ? (team.presentToday / team.totalMembers) * 100 
      : 0

    return [
      {
        title: 'Total Anggota Tim',
        value: team.totalMembers,
        subtitle: 'Anggota aktif',
        icon: Users,
        variant: 'info'
      },
      {
        title: 'Hadir Hari Ini',
        value: team.presentToday,
        subtitle: `${attendanceRate.toFixed(1)}% dari tim`,
        icon: CheckCircle,
        variant: 'success',
        trend: {
          value: attendanceRate,
          isPositive: attendanceRate >= 80,
          label: 'Tingkat kehadiran'
        }
      },
      {
        title: 'Tidak Hadir',
        value: team.absentToday,
        subtitle: `Cuti: ${team.onLeaveToday}`,
        icon: XCircle,
        variant: team.absentToday > team.totalMembers * 0.2 ? 'danger' : 'warning'
      },
      {
        title: 'Terlambat',
        value: team.lateToday,
        subtitle: 'Hari ini',
        icon: AlertCircle,
        variant: team.lateToday > 0 ? 'warning' : 'default'
      }
    ]
  }

  const getCompanyCards = (): StatCard[] => {
    if (!company) return []

    const attendanceRate = company.totalEmployees > 0 
      ? (company.presentToday / company.totalEmployees) * 100 
      : 0

    return [
      {
        title: 'Total Karyawan',
        value: company.totalEmployees,
        subtitle: 'Karyawan aktif',
        icon: Users,
        variant: 'info'
      },
      {
        title: 'Hadir Hari Ini',
        value: company.presentToday,
        subtitle: `${attendanceRate.toFixed(1)}% kehadiran`,
        icon: CheckCircle,
        variant: 'success',
        trend: {
          value: attendanceRate,
          isPositive: attendanceRate >= 85,
          label: 'Tingkat kehadiran perusahaan'
        }
      },
      {
        title: 'Tidak Hadir',
        value: company.absentToday,
        subtitle: `Cuti: ${company.onLeaveToday}`,
        icon: XCircle,
        variant: company.absentToday > company.totalEmployees * 0.15 ? 'danger' : 'warning'
      },
      {
        title: 'Departemen Aktif',
        value: company.departmentStats.length,
        subtitle: 'Total departemen',
        icon: Target,
        variant: 'info'
      }
    ]
  }

  const getAllCards = (): StatCard[] => {
    let cards: StatCard[] = []

    // Always show attendance for all roles
    cards = [...cards, ...getAttendanceCards()]

    // Show requests for all roles
    cards = [...cards, ...getRequestCards()]

    // Show team stats for supervisors/managers
    if (['SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      cards = [...cards, ...getTeamCards()]
    }

    // Show company stats for HR/Admin
    if (['HR_ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      cards = [...cards, ...getCompanyCards()]
    }

    return cards
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'not_checked_in': return 'Belum Absen'
      case 'checked_in': return 'Sudah Masuk'
      case 'checked_out': return 'Sudah Pulang'
      case 'absent': return 'Tidak Hadir'
      default: return 'Unknown'
    }
  }

  const getStatusVariant = (status: string): StatCard['variant'] => {
    switch (status) {
      case 'not_checked_in': return 'warning'
      case 'checked_in': return 'info'
      case 'checked_out': return 'success'
      case 'absent': return 'danger'
      default: return 'default'
    }
  }

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCardVariantStyles = (variant: StatCard['variant']) => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
      case 'danger':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
      default:
        return 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950'
    }
  }

  const getIconVariantStyles = (variant: StatCard['variant']) => {
    switch (variant) {
      case 'success': return 'text-green-600 dark:text-green-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      case 'danger': return 'text-red-600 dark:text-red-400'
      case 'info': return 'text-blue-600 dark:text-blue-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const cards = getAllCards()

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card 
            key={index} 
            className={cn(
              'transition-all duration-200 hover:shadow-md',
              getCardVariantStyles(card.variant)
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {card.badge && (
                  <Badge variant={card.badge.variant} className="text-xs">
                    {card.badge.text}
                  </Badge>
                )}
                <Icon className={cn('h-4 w-4', getIconVariantStyles(card.variant))} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              )}
              {card.trend && (
                <div className="flex items-center mt-2 text-xs">
                  {card.trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={cn(
                    card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}>
                    {card.trend.label}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
