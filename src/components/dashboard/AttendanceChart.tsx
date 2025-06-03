// ============================================================================
// ATTENDANCE CHART COMPONENT
// src/components/dashboard/AttendanceChart.tsx
// ============================================================================

'use client'

import { useState } from 'react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AttendanceStats, AttendanceTrend, CompanyAttendanceTrend } from '@/types/domain'
import { AttendanceStatus } from '@prisma/client'

interface AttendanceChartProps {
  attendance?: AttendanceStats
  companyTrend?: CompanyAttendanceTrend[]
  userRole: string
  className?: string
}

type ChartType = 'line' | 'bar' | 'pie'
type ChartPeriod = 'daily' | 'weekly' | 'monthly'

const COLORS = {
  present: '#10b981', // green-500
  absent: '#ef4444',  // red-500
  late: '#f59e0b',    // amber-500
  leave: '#6366f1',   // indigo-500
  overtime: '#8b5cf6' // violet-500
}

export default function AttendanceChart({ 
  attendance, 
  companyTrend, 
  userRole,
  className 
}: AttendanceChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [period, setPeriod] = useState<ChartPeriod>('daily')

  // Prepare chart data based on user role and available data
  const getChartData = () => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN') {
      return getCompanyChartData()
    }
    return getPersonalChartData()
  }

  const getPersonalChartData = () => {
    if (!attendance?.trend) return []

    return attendance.trend.map((item, index) => {
      const date = new Date(item.date)
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' })
      const dateStr = date.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: '2-digit' 
      })

      return {
        name: `${dayName}\n${dateStr}`,
        date: dateStr,
        hadir: item.status === AttendanceStatus.PRESENT ? 1 : 0,
        tidak_hadir: item.status === AttendanceStatus.ABSENT ? 1 : 0,
        terlambat: item.checkInTime && isLate(item.checkInTime) ? 1 : 0,
        jam_kerja: item.workingHours || 0,
        status: getStatusLabel(item.status),
        masuk: item.checkInTime ? formatTime(item.checkInTime) : '-',
        pulang: item.checkOutTime ? formatTime(item.checkOutTime) : '-'
      }
    })
  }

  const getCompanyChartData = () => {
    if (!companyTrend) return []

    return companyTrend.map((item, index) => {
      const date = new Date(item.date)
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' })
      const dateStr = date.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: '2-digit' 
      })

      return {
        name: `${dayName}\n${dateStr}`,
        date: dateStr,
        hadir: item.totalPresent,
        tidak_hadir: item.totalAbsent,
        tingkat_kehadiran: item.attendanceRate,
        total_karyawan: item.totalPresent + item.totalAbsent
      }
    })
  }

  const getPieChartData = () => {
    if (!attendance?.monthly) return []

    return [
      { 
        name: 'Hadir', 
        value: attendance.monthly.presentDays, 
        color: COLORS.present 
      },
      { 
        name: 'Tidak Hadir', 
        value: attendance.monthly.absentDays, 
        color: COLORS.absent 
      },
      { 
        name: 'Terlambat', 
        value: attendance.monthly.lateDays, 
        color: COLORS.late 
      }
    ].filter(item => item.value > 0)
  }

  const isLate = (checkInTime: Date): boolean => {
    const time = new Date(checkInTime)
    const hours = time.getHours()
    const minutes = time.getMinutes()
    return hours > 8 || (hours === 8 && minutes > 0) // Assuming 08:00 is the start time
  }

  const getStatusLabel = (status: AttendanceStatus): string => {
    switch (status) {
      case AttendanceStatus.PRESENT: return 'Hadir'
      case AttendanceStatus.ABSENT: return 'Tidak Hadir'
      case AttendanceStatus.LEAVE: return 'Cuti'
      case AttendanceStatus.SICK: return 'Sakit'
      case AttendanceStatus.PERMISSION: return 'Izin'
      default: return 'Unknown'
    }
  }

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
              {entry.dataKey === 'tingkat_kehadiran' && '%'}
              {entry.dataKey === 'jam_kerja' && 'h'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const data = getChartData()
    
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Tidak ada data untuk ditampilkan</p>
          </div>
        </div>
      )
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              {userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN' ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="tingkat_kehadiran" 
                    stroke={COLORS.present}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Tingkat Kehadiran (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hadir" 
                    stroke={COLORS.present}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Total Hadir"
                  />
                </>
              ) : (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="jam_kerja" 
                    stroke={COLORS.present}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Jam Kerja"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hadir" 
                    stroke={COLORS.present}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Kehadiran"
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hadir" fill={COLORS.present} name="Hadir" />
              <Bar dataKey="tidak_hadir" fill={COLORS.absent} name="Tidak Hadir" />
              <Bar dataKey="terlambat" fill={COLORS.late} name="Terlambat" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        const pieData = getPieChartData()
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const getChartTitle = () => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN') {
      return 'Tren Kehadiran Perusahaan'
    }
    return 'Tren Kehadiran Personal'
  }

  const getChartSubtitle = () => {
    const data = getChartData()
    if (!data || data.length === 0) return 'Tidak ada data'
    
    if (userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN') {
      return `Data ${data.length} hari terakhir - Seluruh karyawan`
    }
    return `Data ${data.length} hari terakhir - Kehadiran pribadi`
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {getChartTitle()}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {getChartSubtitle()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              7 Hari Terakhir
            </Badge>
          </div>
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
            className="h-8"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Line
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
            className="h-8"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Bar
          </Button>
          {userRole !== 'SUPER_ADMIN' && userRole !== 'HR_ADMIN' && (
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
              className="h-8"
            >
              <PieChartIcon className="h-3 w-3 mr-1" />
              Pie
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {renderChart()}
        
        {/* Chart Legend */}
        {chartType !== 'pie' && (
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.present }} />
              <span>Hadir</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.absent }} />
              <span>Tidak Hadir</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.late }} />
              <span>Terlambat</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
