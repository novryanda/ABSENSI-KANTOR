import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
}

// Server-side client with service role key (bypass RLS)
export const supabaseAdmin = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

// Client-side client with anon key (respects RLS)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseAnonKey) {
    throw new Error('Missing Supabase anon key')
}

export const supabase = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        }
    }
)

// ============================================================================
// DATABASE HELPER FUNCTIONS
// ============================================================================

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id')
            .limit(1)

        return !error
    } catch (error) {
        console.error('Database connection test failed:', error)
        return false
    }
}

/**
 * Get database health status
 */
export async function getHealthStatus() {
    try {
        const startTime = Date.now()

        const { data, error } = await supabaseAdmin
            .from('system_settings')
            .select('key, value')
            .eq('key', 'app_name')
            .single()

        const responseTime = Date.now() - startTime

        if (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                responseTime
            }
        }

        return {
            status: 'healthy',
            responseTime,
            appName: data?.value || 'Unknown'
        }
    } catch (error) {
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Execute raw SQL query (use with caution)
 */
export async function executeRawQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
    try {
        const { data, error } = await supabaseAdmin.rpc('execute_sql', {
            query,
            params: params || []
        })

        if (error) {
            throw new Error(`SQL execution failed: ${error.message}`)
        }

        return data
    } catch (error) {
        console.error('Raw query execution failed:', error)
        throw error
    }
}

// ============================================================================
// TRANSACTION HELPERS
// ============================================================================

/**
 * Execute multiple operations in a transaction-like manner
 * Note: Supabase doesn't support true transactions in client libraries
 * This is a best-effort implementation
 */
export async function withTransaction<T>(
    operations: Array<() => Promise<any>>
): Promise<T> {
    const results: any[] = []

    try {
        for (const operation of operations) {
            const result = await operation()
            results.push(result)
        }

        return results as T
    } catch (error) {
        // In a real transaction, we would rollback here
        // With Supabase, we need to handle rollback manually if needed
        console.error('Transaction failed:', error)
        throw error
    }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log user action for audit trail
 */
export async function logAuditAction(params: {
    userId?: string
    action: string
    tableName: string
    recordId?: string
    oldValues?: any
    newValues?: any
    ipAddress?: string
    userAgent?: string
}) {
    try {
        await supabaseAdmin
            .from('audit_logs')
            .insert({
                user_id: params.userId,
                action: params.action,
                table_name: params.tableName,
                record_id: params.recordId,
                old_values: params.oldValues,
                new_values: params.newValues,
                ip_address: params.ipAddress,
                user_agent: params.userAgent
            })
    } catch (error) {
        // Don't throw error for audit logging failures
        console.error('Audit logging failed:', error)
    }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to table changes
 */
export function subscribeToTable<T = any>(
    tableName: string,
    callback: (payload: {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
        new: T | null
        old: T | null
    }) => void,
    filter?: string
) {
    const channel = supabase
        .channel(`${tableName}_changes`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: tableName,
                filter
            },
            callback
        )
        .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
}

/**
 * Subscribe to user-specific changes
 */
export function subscribeToUserChanges(
    userId: string,
    callback: (payload: any) => void
) {
    return subscribeToTable(
        'notifications',
        callback,
        `user_id=eq.${userId}`
    )
}

// ============================================================================
// FILE STORAGE HELPERS
// ============================================================================

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
    bucket: string,
    path: string,
    file: File | Buffer,
    options?: {
        cacheControl?: string
        contentType?: string
        upsert?: boolean
    }
): Promise<{ path: string; url: string }> {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: options?.cacheControl || '3600',
            contentType: options?.contentType,
            upsert: options?.upsert || false
        })

    if (error) {
        throw new Error(`File upload failed: ${error.message}`)
    }

    const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

    return {
        path: data.path,
        url: urlData.publicUrl
    }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

    if (error) {
        throw new Error(`File deletion failed: ${error.message}`)
    }
}

/**
 * Get signed URL for private files
 */
export async function getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
): Promise<string> {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

    if (error) {
        throw new Error(`Signed URL generation failed: ${error.message}`)
    }

    return data.signedUrl
}

// ============================================================================
// ENVIRONMENT UTILITIES
// ============================================================================

export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Get current environment configuration
 */
export function getEnvironmentConfig() {
    return {
        supabaseUrl,
        environment: process.env.NODE_ENV,
        isDevelopment,
        isProduction,
        hasServiceKey: !!supabaseServiceKey,
        hasAnonKey: !!supabaseAnonKey
    }
}

export default supabase
