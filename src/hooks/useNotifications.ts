import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { Tables } from '@/types/database.types'

type NotificationData = Tables<'notifications'> & {
    isNew?: boolean
}

interface UseNotificationsReturn {
    notifications: NotificationData[]
    unreadCount: number
    isLoading: boolean
    error: string | null
    markAsRead: (notificationIds: string[]) => Promise<void>
    markAllAsRead: () => Promise<void>
    deleteNotification: (notificationId: string) => Promise<void>
    refreshNotifications: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<NotificationData[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/notifications', {
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch notifications')
            }

            const data = await response.json()

            if (data.success) {
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            } else {
                throw new Error(data.error?.message || 'Failed to fetch notifications')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
            console.error('Error fetching notifications:', err)
        } finally {
            setIsLoading(false)
        }
    }, [user?.id])

    // Mark notifications as read
    const markAsRead = useCallback(async (notificationIds: string[]) => {
        try {
            const response = await fetch('/api/notifications/mark-read', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notificationIds })
            })

            if (!response.ok) {
                throw new Error('Failed to mark notifications as read')
            }

            const data = await response.json()

            if (data.success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notification =>
                        notificationIds.includes(notification.id)
                            ? { ...notification, status: 'read' as const, read_at: new Date().toISOString() }
                            : notification
                    )
                )

                // Update unread count
                setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
            } else {
                throw new Error(data.error?.message || 'Failed to mark as read')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark as read')
            console.error('Error marking notifications as read:', err)
        }
    }, [])

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to mark all notifications as read')
            }

            const data = await response.json()

            if (data.success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notification => ({
                        ...notification,
                        status: 'read' as const,
                        read_at: new Date().toISOString()
                    }))
                )

                setUnreadCount(0)
            } else {
                throw new Error(data.error?.message || 'Failed to mark all as read')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark all as read')
            console.error('Error marking all notifications as read:', err)
        }
    }, [])

    // Delete notification
    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to delete notification')
            }

            const data = await response.json()

            if (data.success) {
                // Remove from local state
                const notificationToDelete = notifications.find(n => n.id === notificationId)

                setNotifications(prev => prev.filter(n => n.id !== notificationId))

                // Update unread count if the deleted notification was unread
                if (notificationToDelete?.status === 'unread') {
                    setUnreadCount(prev => Math.max(0, prev - 1))
                }
            } else {
                throw new Error(data.error?.message || 'Failed to delete notification')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete notification')
            console.error('Error deleting notification:', err)
        }
    }, [notifications])

    // Refresh notifications
    const refreshNotifications = useCallback(async () => {
        await fetchNotifications()
    }, [fetchNotifications])

    // Load notifications on mount and when user changes
    useEffect(() => {
        if (user?.id) {
            fetchNotifications()
        }
    }, [user?.id, fetchNotifications])

    // Set up polling for new notifications (every 30 seconds)
    useEffect(() => {
        if (!user?.id) return

        const interval = setInterval(() => {
            fetchNotifications()
        }, 30000) // 30 seconds

        return () => clearInterval(interval)
    }, [user?.id, fetchNotifications])

    // Set up real-time notifications using Server-Sent Events or WebSocket
    useEffect(() => {
        if (!user?.id) return

        // For simplicity, we'll use polling, but in production you might want to use:
        // - Server-Sent Events (SSE)
        // - WebSocket connection
        // - Supabase real-time subscriptions

        let eventSource: EventSource | null = null

        if (typeof window !== 'undefined' && 'EventSource' in window) {
            try {
                eventSource = new EventSource(`/api/notifications/stream?userId=${user.id}`)

                eventSource.onmessage = (event) => {
                    try {
                        const notification = JSON.parse(event.data)

                        // Add new notification to the list
                        setNotifications(prev => [{ ...notification, isNew: true }, ...prev])
                        setUnreadCount(prev => prev + 1)

                        // Show browser notification if permission granted
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification(notification.title, {
                                body: notification.message,
                                icon: '/favicon.ico',
                                tag: notification.id
                            })
                        }
                    } catch (err) {
                        console.error('Error parsing notification:', err)
                    }
                }

                eventSource.onerror = (error) => {
                    console.error('EventSource error:', error)
                    eventSource?.close()
                }
            } catch (err) {
                console.error('Error setting up EventSource:', err)
            }
        }

        return () => {
            eventSource?.close()
        }
    }, [user?.id])

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications
    }
}

// ============================================================================
// NOTIFICATION PERMISSION HOOK
// ============================================================================

export function useNotificationPermission() {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [isSupported, setIsSupported] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setIsSupported(true)
            setPermission(Notification.permission)
        }
    }, [])

    const requestPermission = useCallback(async () => {
        if (!isSupported) return 'denied'

        try {
            const result = await Notification.requestPermission()
            setPermission(result)
            return result
        } catch (error) {
            console.error('Error requesting notification permission:', error)
            return 'denied'
        }
    }, [isSupported])

    return {
        permission,
        isSupported,
        requestPermission,
        canShowNotifications: permission === 'granted' && isSupported
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatNotificationTime(timestamp: string): string {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMs = now.getTime() - notificationTime.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) {
        return 'Baru saja'
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} menit yang lalu`
    } else if (diffInHours < 24) {
        return `${diffInHours} jam yang lalu`
    } else if (diffInDays < 7) {
        return `${diffInDays} hari yang lalu`
    } else {
        return notificationTime.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: notificationTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        })
    }
}

export function getNotificationIcon(type: string): string {
    switch (type) {
        case 'success':
            return '✅'
        case 'warning':
            return '⚠️'
        case 'error':
            return '❌'
        case 'info':
        default:
            return 'ℹ️'
    }
}

export function getNotificationColor(type: string): string {
    switch (type) {
        case 'success':
            return 'bg-green-500'
        case 'warning':
            return 'bg-yellow-500'
        case 'error':
            return 'bg-red-500'
        case 'info':
        default:
            return 'bg-blue-500'
    }
}