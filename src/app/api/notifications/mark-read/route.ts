import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/infrastructure/auth/authOptions'
import { supabaseAdmin, logAuditAction } from '@/infrastructure/database/supabaseClient'

// PATCH /api/notifications/mark-read - Mark specific notifications as read
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { notificationIds } = body

        if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
            return NextResponse.json(
                { success: false, error: { message: 'Missing or invalid notification IDs' } },
                { status: 400 }
            )
        }

        // Update notifications as read
        const { data: updatedNotifications, error } = await supabaseAdmin
            .from('notifications')
            .update({
                status: 'read',
                read_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_id', session.user.id)
            .in('id', notificationIds)
            .eq('status', 'unread') // Only update unread notifications
            .select()

        if (error) {
            console.error('Error marking notifications as read:', error)
            return NextResponse.json(
                { success: false, error: { message: 'Failed to mark notifications as read' } },
                { status: 500 }
            )
        }

        // Log the action
        await logAuditAction({
            userId: session.user.id,
            action: 'MARK_NOTIFICATIONS_READ',
            tableName: 'notifications',
            newValues: {
                notificationIds,
                count: updatedNotifications?.length || 0,
                timestamp: new Date().toISOString()
            }
        })

        return NextResponse.json({
            success: true,
            updatedCount: updatedNotifications?.length || 0,
            notifications: updatedNotifications
        })

    } catch (error) {
        console.error('Mark notifications as read API error:', error)
        return NextResponse.json(
            { success: false, error: { message: 'Internal server error' } },
            { status: 500 }
        )
    }
}

// ============================================================================
// MARK ALL NOTIFICATIONS AS READ API
// src/app/api/notifications/mark-all-read/route.ts
// ============================================================================

// PATCH /api/notifications/mark-all-read - Mark all user notifications as read
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
                { status: 401 }
            )
        }

        // Update all unread notifications as read
        const { data: updatedNotifications, error } = await supabaseAdmin
            .from('notifications')
            .update({
                status: 'read',
                read_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_id', session.user.id)
            .eq('status', 'unread')
            .select('id')

        if (error) {
            console.error('Error marking all notifications as read:', error)
            return NextResponse.json(
                { success: false, error: { message: 'Failed to mark all notifications as read' } },
                { status: 500 }
            )
        }

        // Log the action
        await logAuditAction({
            userId: session.user.id,
            action: 'MARK_ALL_NOTIFICATIONS_READ',
            tableName: 'notifications',
            newValues: {
                count: updatedNotifications?.length || 0,
                timestamp: new Date().toISOString()
            }
        })

        return NextResponse.json({
            success: true,
            updatedCount: updatedNotifications?.length || 0
        })

    } catch (error) {
        console.error('Mark all notifications as read API error:', error)
        return NextResponse.json(
            { success: false, error: { message: 'Internal server error' } },
            { status: 500 }
        )
    }
}

// ============================================================================
// DELETE NOTIFICATION API
// src/app/api/notifications/[id]/route.ts
// ============================================================================

interface RouteParams {
    params: {
        id: string
    }
}

// DELETE /api/notifications/[id] - Delete specific notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
                { status: 401 }
            )
        }

        const notificationId = params.id

        if (!notificationId) {
            return NextResponse.json(
                { success: false, error: { message: 'Missing notification ID' } },
                { status: 400 }
            )
        }

        // Get notification first to verify ownership
        const { data: notification, error: fetchError } = await supabaseAdmin
            .from('notifications')
            .select('id, user_id, title')
            .eq('id', notificationId)
            .eq('user_id', session.user.id)
            .single()

        if (fetchError || !notification) {
            return NextResponse.json(
                { success: false, error: { message: 'Notification not found' } },
                { status: 404 }
            )
        }

        // Delete the notification
        const { error: deleteError } = await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', session.user.id)

        if (deleteError) {
            console.error('Error deleting notification:', deleteError)
            return NextResponse.json(
                { success: false, error: { message: 'Failed to delete notification' } },
                { status: 500 }
            )
        }

        // Log the action
        await logAuditAction({
            userId: session.user.id,
            action: 'DELETE_NOTIFICATION',
            tableName: 'notifications',
            recordId: notificationId,
            oldValues: {
                title: notification.title,
                timestamp: new Date().toISOString()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Notification deleted successfully'
        })

    } catch (error) {
        console.error('Delete notification API error:', error)
        return NextResponse.json(
            { success: false, error: { message: 'Internal server error' } },
            { status: 500 }
        )
    }
}