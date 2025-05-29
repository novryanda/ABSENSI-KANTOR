import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/infrastructure/auth/authOptions'
import { supabaseAdmin } from '@/infrastructure/database/supabaseClient'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = (page - 1) * limit

        // Get notifications
        const { data: notifications, error: notificationsError } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (notificationsError) {
            console.error('Error fetching notifications:', notificationsError)
            return NextResponse.json(
                { success: false, error: { message: 'Failed to fetch notifications' } },
                { status: 500 }
            )
        }

        // Get unread count
        const { count: unreadCount, error: countError } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('status', 'unread')

        if (countError) {
            console.error('Error fetching unread count:', countError)
        }

        return NextResponse.json({
            success: true,
            notifications: notifications || [],
            unreadCount: unreadCount || 0,
            pagination: {
                page,
                limit,
                hasMore: (notifications?.length || 0) === limit
            }
        })

    } catch (error) {
        console.error('Notifications API error:', error)
        return NextResponse.json(
            { success: false, error: { message: 'Internal server error' } },
            { status: 500 }
        )
    }
}

// POST /api/notifications - Create notification (admin/system use)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
                { status: 401 }
            )
        }

        // Check if user has permission to create notifications
        const userRole = session.user.role?.name
        if (!['Admin', 'Super Admin'].includes(userRole || '')) {
            return NextResponse.json(
                { success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { userId, title, message, type = 'info', data } = body

        if (!userId || !title || !message) {
            return NextResponse.json(
                { success: false, error: { message: 'Missing required fields' } },
                { status: 400 }
            )
        }

        // Create notification
        const { data: notification, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
                status: 'unread',
                data: data || null
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating notification:', error)
            return NextResponse.json(
                { success: false, error: { message: 'Failed to create notification' } },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            notification
        })

    } catch (error) {
        console.error('Create notification API error:', error)
        return NextResponse.json(
            { success: false, error: { message: 'Internal server error' } },
            { status: 500 }
        )
    }
}