// ============================================================================
// DASHBOARD PAGE
// src/app/(dashboard)/dashboard/page.tsx
// ============================================================================

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  RefreshCw, 
  Calendar,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import StatsCards from '@/components/dashboard/StatsCards'
import AttendanceChart from '@/components/dashboard/AttendanceChart'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'
import NotificationPanel from '@/components/dashboard/NotificationPanel'
import { DashboardStats } from '@/types/domain'
import {toast} from "sonner";

export default function DashboardPage() {
  const { data: session } = useSession()


  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Get user role from session
  const userRole = session?.user?.role?.name || 'EMPLOYEE'
  const userName = session?.user?.name || 'User'

  // Fetch dashboard data
  const fetchDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      // Determine what data to include based on role
      const includeTeamStats = ['SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(userRole)
      const includeCompanyStats = ['HR_ADMIN', 'SUPER_ADMIN'].includes(userRole)

      const params = new URLSearchParams({
        includeTeam: includeTeamStats.toString(),
        includeCompany: includeCompanyStats.toString()
      })

      const response = await fetch(`/api/dashboard?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch dashboard data')
      }

      if (result.success) {
        setDashboardData(result.data)
        setLastUpdated(new Date())
      } else {
        throw new Error(result.error || 'Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal memuat data dashboard',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Handle check-in
  const handleCheckIn = async () => {
    try {
      // Get user location
      if (!navigator.geolocation) {
        throw new Error('Geolocation tidak didukung oleh browser')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal melakukan check-in')
      }

      toast({
        title: 'Berhasil',
        description: 'Check-in berhasil dicatat',
        variant: 'default'
      })

      // Refresh dashboard data
      fetchDashboardData(true)
    } catch (error) {
      console.error('Check-in error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal melakukan check-in',
        variant: 'destructive'
      })
    }
  }

  // Handle check-out
  const handleCheckOut = async () => {
    try {
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal melakukan check-out')
      }

      toast({
        title: 'Berhasil',
        description: 'Check-out berhasil dicatat',
        variant: 'default'
      })

      // Refresh dashboard data
      fetchDashboardData(true)
    } catch (error) {
      console.error('Check-out error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal melakukan check-out',
        variant: 'destructive'
      })
    }
  }

  // Handle mark notification as read
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })

      if (response.ok) {
        // Refresh dashboard data to update notification status
        fetchDashboardData(true)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Handle mark all notifications as read
  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      })

      if (response.ok) {
        toast({
          title: 'Berhasil',
          description: 'Semua notifikasi telah ditandai sebagai dibaca',
          variant: 'default'
        })
        fetchDashboardData(true)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Get greeting based on time
  const getGreeting = (): string => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 15) return 'Selamat Siang'
    if (hour < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  // Get dashboard layout based on role
  const getDashboardLayout = () => {
    switch (userRole) {
      case 'SUPER_ADMIN':
      case 'HR_ADMIN':
        return 'admin' // Full company view
      case 'SUPERVISOR':
      case 'MANAGER':
        return 'manager' // Team + personal view
      default:
        return 'employee' // Personal view only
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (session?.user) {
      fetchDashboardData()
    }
  }, [session, userRole])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && !isRefreshing) {
        fetchDashboardData(true)
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [isLoading, isRefreshing])

  const layout = getDashboardLayout()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {getGreeting()}, {userName}!
          </h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {lastUpdated && (
            <div className="text-xs lg:text-sm text-gray-500 order-2 sm:order-1">
              Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="gap-2 order-1 sm:order-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-6 lg:space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 lg:gap-8 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Skeleton className="h-[400px] lg:h-[500px]" />
            </div>
            <div>
              <Skeleton className="h-[400px] lg:h-[500px]" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <StatsCards
            attendance={dashboardData?.attendance}
            requests={dashboardData?.requests}
            team={dashboardData?.team}
            company={dashboardData?.company}
            userRole={userRole}
          />

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:gap-8 xl:grid-cols-3">
            {/* Left Column - Charts and Quick Actions */}
            <div className="xl:col-span-2 space-y-6 lg:space-y-8">
              {/* Attendance Chart */}
              <AttendanceChart
                attendance={dashboardData?.attendance}
                companyTrend={dashboardData?.company?.attendanceTrend}
                userRole={userRole}
              />

              {/* Quick Actions */}
              <QuickActions
                userRole={userRole}
                todayAttendance={dashboardData?.attendance?.today}
                pendingApprovalsCount={dashboardData?.approvals?.pendingCount}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
              />
            </div>

            {/* Right Column - Activity and Notifications */}
            <div className="space-y-6 lg:space-y-8">
              {/* Recent Activity */}
              <RecentActivity
                recentRequests={dashboardData?.requests?.recentRequests}
                attendanceTrend={dashboardData?.attendance?.trend}
                userRole={userRole}
              />

              {/* Notifications Panel */}
              <NotificationPanel
                pendingApprovals={dashboardData?.approvals?.pendingRequests}
                userRole={userRole}
                onMarkAsRead={handleMarkNotificationAsRead}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
              />
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  )
}
