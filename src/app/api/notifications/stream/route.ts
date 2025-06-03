// ============================================================================
// NOTIFICATIONS STREAM API - SERVER-SENT EVENTS
// src/app/api/notifications/stream/route.ts
// ============================================================================

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/infrastructure/auth/authOptions'
import { supabaseAdmin } from '@/infrastructure/database/supabaseClient'

// Store active connections
const connections = new Map<string, {
  controller: ReadableStreamDefaultController
  userId: string
  lastHeartbeat: number
}>()

// Cleanup interval for stale connections
const HEARTBEAT_INTERVAL = 30000 // 30 seconds
const CONNECTION_TIMEOUT = 60000 // 60 seconds

// Cleanup stale connections
setInterval(() => {
  const now = Date.now()
  for (const [connectionId, connection] of connections.entries()) {
    if (now - connection.lastHeartbeat > CONNECTION_TIMEOUT) {
      try {
        connection.controller.close()
      } catch (error) {
        console.error('Error closing stale connection:', error)
      }
      connections.delete(connectionId)
      console.log(`Cleaned up stale connection: ${connectionId}`)
    }
  }
}, HEARTBEAT_INTERVAL)

// GET /api/notifications/stream - Server-Sent Events endpoint
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = session.user.id
    const connectionId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log(`🔗 New SSE connection: ${connectionId} for user: ${userId}`)

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Store connection
        connections.set(connectionId, {
          controller,
          userId,
          lastHeartbeat: Date.now()
        })

        // Send initial connection message
        const initMessage = `data: ${JSON.stringify({
          type: 'connection',
          message: 'Connected to notification stream',
          timestamp: new Date().toISOString()
        })}\n\n`
        
        try {
          controller.enqueue(new TextEncoder().encode(initMessage))
        } catch (error) {
          console.error('Error sending init message:', error)
        }

        // Set up heartbeat
        const heartbeatInterval = setInterval(() => {
          const connection = connections.get(connectionId)
          if (!connection) {
            clearInterval(heartbeatInterval)
            return
          }

          try {
            const heartbeatMessage = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`
            
            controller.enqueue(new TextEncoder().encode(heartbeatMessage))
            connection.lastHeartbeat = Date.now()
          } catch (error) {
            console.error('Error sending heartbeat:', error)
            clearInterval(heartbeatInterval)
            connections.delete(connectionId)
          }
        }, HEARTBEAT_INTERVAL)

        // Set up Supabase real-time subscription for notifications
        const channel = supabaseAdmin
          .channel(`notifications_${connectionId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              try {
                const notification = payload.new
                const message = `data: ${JSON.stringify({
                  type: 'notification',
                  data: notification,
                  timestamp: new Date().toISOString()
                })}\n\n`
                
                controller.enqueue(new TextEncoder().encode(message))
                console.log(`📨 Sent notification to ${connectionId}:`, notification.id)
              } catch (error) {
                console.error('Error sending notification:', error)
              }
            }
          )
          .subscribe()

        // Cleanup function
        const cleanup = () => {
          clearInterval(heartbeatInterval)
          supabaseAdmin.removeChannel(channel)
          connections.delete(connectionId)
          console.log(`🔌 Cleaned up connection: ${connectionId}`)
        }

        // Handle connection close
        request.signal.addEventListener('abort', cleanup)
      },

      cancel() {
        connections.delete(connectionId)
        console.log(`❌ Connection cancelled: ${connectionId}`)
      }
    })

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('SSE endpoint error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// Send notification to specific user
export async function sendNotificationToUser(userId: string, notification: any) {
  const userConnections = Array.from(connections.entries())
    .filter(([_, conn]) => conn.userId === userId)

  if (userConnections.length === 0) {
    console.log(`No active connections for user: ${userId}`)
    return
  }

  const message = `data: ${JSON.stringify({
    type: 'notification',
    data: notification,
    timestamp: new Date().toISOString()
  })}\n\n`

  userConnections.forEach(([connectionId, connection]) => {
    try {
      connection.controller.enqueue(new TextEncoder().encode(message))
      console.log(`📨 Sent notification to connection: ${connectionId}`)
    } catch (error) {
      console.error(`Error sending to connection ${connectionId}:`, error)
      connections.delete(connectionId)
    }
  })
}

// Get connection stats
export function getConnectionStats() {
  return {
    totalConnections: connections.size,
    connectionsByUser: Array.from(connections.values()).reduce((acc, conn) => {
      acc[conn.userId] = (acc[conn.userId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}
