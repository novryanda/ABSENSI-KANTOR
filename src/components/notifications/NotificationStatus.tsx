// ============================================================================
// NOTIFICATION STATUS COMPONENT
// src/components/notifications/NotificationStatus.tsx
// ============================================================================

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Clock
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

interface NotificationStatusProps {
  className?: string
  showDetails?: boolean
}

export default function NotificationStatus({ 
  className = '', 
  showDetails = false 
}: NotificationStatusProps) {
  const { connectionStatus, error, reconnect } = useNotifications()
  const [isReconnecting, setIsReconnecting] = useState(false)

  const handleReconnect = async () => {
    setIsReconnecting(true)
    try {
      reconnect()
      // Give some time for the connection attempt
      setTimeout(() => setIsReconnecting(false), 2000)
    } catch (error) {
      console.error('Manual reconnect failed:', error)
      setIsReconnecting(false)
    }
  }

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: CheckCircle,
          label: 'Terhubung',
          description: 'Notifikasi real-time aktif',
          variant: 'success' as const,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'connecting':
        return {
          icon: Clock,
          label: 'Menghubungkan',
          description: 'Sedang menghubungkan ke server...',
          variant: 'secondary' as const,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Error',
          description: error || 'Gagal terhubung ke server',
          variant: 'destructive' as const,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          label: 'Terputus',
          description: 'Menggunakan polling untuk notifikasi',
          variant: 'outline' as const,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  if (!showDetails) {
    // Compact version - just a badge
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant={config.variant} className="gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
        {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReconnect}
            disabled={isReconnecting}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isReconnecting ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    )
  }

  // Detailed version - full card
  return (
    <Card className={`${config.bgColor} ${config.borderColor} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className={`font-medium ${config.color}`}>
                  Status Notifikasi: {config.label}
                </h4>
                <Badge variant={config.variant} size="sm">
                  {connectionStatus}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {config.description}
              </p>
              {error && connectionStatus === 'error' && (
                <p className="text-xs text-red-500 mt-1">
                  Detail: {error}
                </p>
              )}
            </div>
          </div>

          {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
              {isReconnecting ? 'Menghubungkan...' : 'Hubungkan Ulang'}
            </Button>
          )}
        </div>

        {/* Connection tips */}
        {connectionStatus === 'error' && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h5 className="text-sm font-medium text-yellow-800 mb-1">
              Tips Mengatasi Masalah Koneksi:
            </h5>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Periksa koneksi internet Anda</li>
              <li>• Refresh halaman jika masalah berlanjut</li>
              <li>• Notifikasi akan tetap berfungsi melalui polling</li>
            </ul>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-700">
              ✅ Anda akan menerima notifikasi secara real-time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Hook for getting connection status info
export function useNotificationStatus() {
  const { connectionStatus, error } = useNotifications()
  
  return {
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    hasError: connectionStatus === 'error',
    isDisconnected: connectionStatus === 'disconnected',
    error,
    status: connectionStatus
  }
}
