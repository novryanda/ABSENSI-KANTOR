// ============================================================================
// NOTIFICATION DEBUG PANEL
// src/components/debug/NotificationDebugPanel.tsx
// ============================================================================

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bug, 
  Download, 
  Trash2, 
  RefreshCw,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { errorLogger } from '@/utils/errorLogger'

interface NotificationDebugPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationDebugPanel({ 
  isOpen, 
  onClose 
}: NotificationDebugPanelProps) {
  const { connectionStatus, error, notifications, unreadCount } = useNotifications()
  const [logs, setLogs] = useState(errorLogger.getLogs())
  const [stats, setStats] = useState(errorLogger.getStats())

  // Refresh logs and stats
  const refreshData = () => {
    setLogs(errorLogger.getLogs())
    setStats(errorLogger.getStats())
  }

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(refreshData, 5000)
    return () => clearInterval(interval)
  }, [isOpen])

  // Initial load
  useEffect(() => {
    if (isOpen) {
      refreshData()
    }
  }, [isOpen])

  const exportLogs = () => {
    const logsData = errorLogger.exportLogs()
    const blob = new Blob([logsData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notification-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    errorLogger.clearLogs()
    refreshData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-blue-600'
      case 'error': return 'text-red-600'
      case 'disconnected': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
      case 'debug': return <Bug className="h-4 w-4 text-gray-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Notification System Debug Panel
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Connection Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                        {connectionStatus}
                      </Badge>
                      <span className={`text-sm ${getStatusColor(connectionStatus)}`}>
                        {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                      </span>
                    </div>
                    {error && (
                      <p className="text-sm text-red-600 mt-2">
                        Error: {error}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span>{notifications.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Unread:</span>
                        <span className="text-red-600">{unreadCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>EventSource Support:</strong> {
                        typeof window !== 'undefined' && 'EventSource' in window ? '✅ Yes' : '❌ No'
                      }
                    </div>
                    <div>
                      <strong>Notification Permission:</strong> {
                        typeof window !== 'undefined' && 'Notification' in window 
                          ? Notification.permission 
                          : 'Not supported'
                      }
                    </div>
                    <div>
                      <strong>User Agent:</strong> {
                        typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 50) + '...' : 'N/A'
                      }
                    </div>
                    <div>
                      <strong>Current URL:</strong> {
                        typeof window !== 'undefined' ? window.location.href : 'N/A'
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Error Logs</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={refreshData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearLogs}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No logs available
                    </div>
                  ) : (
                    logs.map((log) => (
                      <Card key={log.id} className="p-3">
                        <div className="flex items-start gap-3">
                          {getLogIcon(log.level)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {log.level}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{log.message}</p>
                            {log.context && Object.keys(log.context).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-gray-600 cursor-pointer">
                                  Context
                                </summary>
                                <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                                  {JSON.stringify(log.context, null, 2)}
                                </pre>
                              </details>
                            )}
                            {log.stack && (
                              <details className="mt-2">
                                <summary className="text-xs text-gray-600 cursor-pointer">
                                  Stack Trace
                                </summary>
                                <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                                  {log.stack}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notifications" className="p-6">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((notification) => (
                      <Card key={notification.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={notification.status === 'unread' ? 'default' : 'secondary'}>
                                {notification.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(notification.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {notification.isNew && (
                            <Badge variant="destructive" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Log Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Logs:</span>
                        <span>{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Errors:</span>
                        <span className="text-red-600">{stats.error || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Warnings:</span>
                        <span className="text-yellow-600">{stats.warn || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Info:</span>
                        <span className="text-blue-600">{stats.info || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Debug:</span>
                        <span className="text-gray-600">{stats.debug || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {connectionStatus === 'connected' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          Real-time Connection: {connectionStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(stats.error || 0) === 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          Error Rate: {stats.error || 0} errors
                        </span>
                      </div>
                      {stats.lastError && (
                        <div className="text-xs text-gray-500">
                          Last Error: {new Date(stats.lastError).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
