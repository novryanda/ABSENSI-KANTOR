import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'
import { Tables } from '@/types/database.types'
import { logError, logWarn, logInfo, logEventSourceError } from '@/utils/errorLogger'

type NotificationData = Tables<'notifications'> & {
    isNew?: boolean
}

interface UseNotificationsReturn {
    notifications: NotificationData[]
    unreadCount: number
    isLoading: boolean
    error: string | null
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
    markAsRead: (notificationIds: string[]) => Promise<void>
    markAllAsRead: () => Promise<void>
    deleteNotification: (notificationId: string) => Promise<void>
    refreshNotifications: () => Promise<void>
    reconnect: () => void
}

// Connection configuration
const SSE_CONFIG = {
    maxRetries: 5,
    baseRetryDelay: 1000, // 1 second
    maxRetryDelay: 30000, // 30 seconds
    heartbeatTimeout: 45000, // 45 seconds
    connectionTimeout: 10000 // 10 seconds
}

export function useNotifications(): UseNotificationsReturn {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<NotificationData[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

    // Refs for managing connections and retries
    const eventSourceRef = useRef<EventSource | null>(null)
    const retryCountRef = useRef(0)
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isManualDisconnectRef = useRef(false)

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

    // Enhanced SSE connection with retry logic
    const connectSSE = useCallback(() => {
        if (!user?.id || isManualDisconnectRef.current) return

        // Clean up existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }

        // Clear existing timeouts
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
            retryTimeoutRef.current = null
        }
        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current)
            heartbeatTimeoutRef.current = null
        }

        setConnectionStatus('connecting')
        setError(null)

        try {
            console.log(`🔗 Attempting SSE connection (attempt ${retryCountRef.current + 1})`)

            const eventSource = new EventSource(`/api/notifications/stream?userId=${user.id}`)
            eventSourceRef.current = eventSource

            // Connection timeout
            const connectionTimeout = setTimeout(() => {
                if (eventSource.readyState === EventSource.CONNECTING) {
                    console.warn('⏰ SSE connection timeout')
                    eventSource.close()
                    handleConnectionError('Connection timeout')
                }
            }, SSE_CONFIG.connectionTimeout)

            eventSource.onopen = () => {
                clearTimeout(connectionTimeout)
                setConnectionStatus('connected')
                setError(null)
                retryCountRef.current = 0

                logInfo('SSE connection established successfully', {
                    userId: user.id,
                    component: 'useNotifications',
                    action: 'SSE_connected',
                    url: eventSource.url
                })

                // Set up heartbeat timeout
                resetHeartbeatTimeout()
            }

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)

                    // Reset heartbeat timeout on any message
                    resetHeartbeatTimeout()

                    if (data.type === 'heartbeat') {
                        // Just reset the timeout, no other action needed
                        return
                    }

                    if (data.type === 'connection') {
                        console.log('📡 SSE connection confirmed:', data.message)
                        return
                    }

                    if (data.type === 'notification' && data.data) {
                        const notification = data.data
                        console.log('📨 Received notification via SSE:', notification.id)

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
                    }
                } catch (err) {
                    console.error('❌ Error parsing SSE message:', err)
                }
            }

            eventSource.onerror = (event) => {
                clearTimeout(connectionTimeout)

                // Enhanced error logging
                const errorId = logEventSourceError(eventSource, event, {
                    userId: user.id,
                    component: 'useNotifications',
                    action: 'SSE_connection',
                    retryCount: retryCountRef.current
                })

                // Provide more detailed error information
                let errorMessage = 'Connection failed'
                switch (eventSource.readyState) {
                    case EventSource.CONNECTING:
                        errorMessage = 'Failed to establish connection'
                        break
                    case EventSource.CLOSED:
                        errorMessage = 'Connection was closed'
                        break
                    default:
                        errorMessage = 'Unknown connection error'
                }

                logWarn(`SSE Error Details: ${errorMessage}`, {
                    userId: user.id,
                    errorId,
                    readyState: eventSource.readyState,
                    url: eventSource.url
                })

                handleConnectionError(errorMessage)
            }

        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to create connection')
            logError('Failed to create EventSource', error, {
                userId: user.id,
                component: 'useNotifications',
                action: 'create_EventSource',
                retryCount: retryCountRef.current
            })
            handleConnectionError(error.message)
        }
    }, [user?.id])

    // Handle connection errors with retry logic
    const handleConnectionError = useCallback((errorMessage: string) => {
        setConnectionStatus('error')
        setError(errorMessage)

        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current)
            heartbeatTimeoutRef.current = null
        }

        if (retryCountRef.current < SSE_CONFIG.maxRetries && !isManualDisconnectRef.current) {
            const retryDelay = Math.min(
                SSE_CONFIG.baseRetryDelay * Math.pow(2, retryCountRef.current),
                SSE_CONFIG.maxRetryDelay
            )

            console.log(`🔄 Retrying SSE connection in ${retryDelay}ms (attempt ${retryCountRef.current + 1}/${SSE_CONFIG.maxRetries})`)

            retryTimeoutRef.current = setTimeout(() => {
                retryCountRef.current++
                connectSSE()
            }, retryDelay)
        } else {
            console.warn('❌ Max retry attempts reached or manual disconnect, falling back to polling')
            setConnectionStatus('disconnected')
            // Fallback to polling will be handled by the existing polling effect
        }
    }, [connectSSE])

    // Reset heartbeat timeout
    const resetHeartbeatTimeout = useCallback(() => {
        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current)
        }

        heartbeatTimeoutRef.current = setTimeout(() => {
            console.warn('💔 SSE heartbeat timeout')
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
                handleConnectionError('Heartbeat timeout')
            }
        }, SSE_CONFIG.heartbeatTimeout)
    }, [handleConnectionError])

    // Manual reconnect function
    const reconnect = useCallback(() => {
        console.log('🔄 Manual reconnect requested')
        isManualDisconnectRef.current = false
        retryCountRef.current = 0
        connectSSE()
    }, [connectSSE])

    // Disconnect function
    const disconnect = useCallback(() => {
        console.log('🔌 Disconnecting SSE')
        isManualDisconnectRef.current = true

        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
            retryTimeoutRef.current = null
        }

        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current)
            heartbeatTimeoutRef.current = null
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }

        setConnectionStatus('disconnected')
    }, [])

    // Set up SSE connection
    useEffect(() => {
        if (!user?.id) {
            disconnect()
            return
        }

        // Check if SSE is supported
        if (typeof window === 'undefined' || !('EventSource' in window)) {
            console.warn('⚠️ EventSource not supported, using polling only')
            setConnectionStatus('disconnected')
            return
        }

        isManualDisconnectRef.current = false
        connectSSE()

        return disconnect
    }, [user?.id, connectSSE, disconnect])

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        connectionStatus,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
        reconnect
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