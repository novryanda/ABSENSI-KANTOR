'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { RolePermissions } from '@/types/auth'

// ============================================================================
// AUTH GUARD - Requires Authentication
// ============================================================================

interface AuthGuardProps {
    children: ReactNode
    fallback?: ReactNode
    redirectTo?: string
}

export function AuthGuard({
                              children,
                              fallback = <AuthLoadingSpinner />,
                              redirectTo = '/auth/signin'
                          }: AuthGuardProps) {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
        }
    }, [status, router, redirectTo])

    if (status === 'loading') {
        return <>{fallback}</>
    }

    if (status === 'unauthenticated') {
        return <>{fallback}</>
    }

    if (session?.user?.status !== 'active') {
        router.push('/auth/error?error=AccountInactive')
        return <>{fallback}</>
    }

    return <>{children}</>
}

// ============================================================================
// ROLE GUARD - Requires Specific Role
// ============================================================================

interface RoleGuardProps {
    children: ReactNode
    allowedRoles: string[]
    fallback?: ReactNode
    redirectTo?: string
}

export function RoleGuard({
                              children,
                              allowedRoles,
                              fallback = <UnauthorizedMessage />,
                              redirectTo
                          }: RoleGuardProps) {
    const { data: session, status } = useSession()
    const router = useRouter()

    if (status === 'loading') {
        return <AuthLoadingSpinner />
    }

    if (status === 'unauthenticated') {
        return <AuthLoadingSpinner />
    }

    const userRole = session?.user?.role?.name

    if (!userRole || !allowedRoles.includes(userRole)) {
        if (redirectTo) {
            router.push(`${redirectTo}?error=Unauthorized`)
            return <AuthLoadingSpinner />
        }
        return <>{fallback}</>
    }

    return <>{children}</>
}

// ============================================================================
// PERMISSION GUARD - Requires Specific Permission
// ============================================================================

interface PermissionGuardProps {
    children: ReactNode
    resource: string
    action: string
    fallback?: ReactNode
    redirectTo?: string
}

export function PermissionGuard({
                                    children,
                                    resource,
                                    action,
                                    fallback = <UnauthorizedMessage />,
                                    redirectTo
                                }: PermissionGuardProps) {
    const { data: session, status } = useSession()
    const router = useRouter()

    if (status === 'loading') {
        return <AuthLoadingSpinner />
    }

    if (status === 'unauthenticated') {
        return <AuthLoadingSpinner />
    }

    const hasPermission = checkUserPermission(session?.user?.role?.permissions, resource, action)

    if (!hasPermission) {
        if (redirectTo) {
            router.push(`${redirectTo}?error=Unauthorized`)
            return <AuthLoadingSpinner />
        }
        return <>{fallback}</>
    }

    return <>{children}</>
}

// ============================================================================
// DEPARTMENT GUARD - Requires Same Department or Higher Role
// ============================================================================

interface DepartmentGuardProps {
    children: ReactNode
    requiredDepartmentId?: string
    allowedRoles?: string[]
    fallback?: ReactNode
}

export function DepartmentGuard({
                                    children,
                                    requiredDepartmentId,
                                    allowedRoles = ['Admin', 'Super Admin'],
                                    fallback = <UnauthorizedMessage />
                                }: DepartmentGuardProps) {
    const { data: session, status } = useSession()

    if (status === 'loading') {
        return <AuthLoadingSpinner />
    }

    if (status === 'unauthenticated') {
        return <AuthLoadingSpinner />
    }

    const userRole = session?.user?.role?.name
    const userDepartmentId = session?.user?.department?.id

    // Allow if user has privileged role
    if (userRole && allowedRoles.includes(userRole)) {
        return <>{children}</>
    }

    // Allow if same department
    if (requiredDepartmentId && userDepartmentId === requiredDepartmentId) {
        return <>{children}</>
    }

    // Allow if no specific department required (own department access)
    if (!requiredDepartmentId) {
        return <>{children}</>
    }

    return <>{fallback}</>
}

// ============================================================================
// GUEST GUARD - Only for Unauthenticated Users
// ============================================================================

interface GuestGuardProps {
    children: ReactNode
    redirectTo?: string
}

export function GuestGuard({
                               children,
                               redirectTo = '/dashboard'
                           }: GuestGuardProps) {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'authenticated') {
            const userRole = session?.user?.role?.name
            const defaultRedirect = getDefaultRedirectForRole(userRole)
            router.push(redirectTo === '/dashboard' ? defaultRedirect : redirectTo)
        }
    }, [status, session, router, redirectTo])

    if (status === 'loading') {
        return <AuthLoadingSpinner />
    }

    if (status === 'authenticated') {
        return <AuthLoadingSpinner />
    }

    return <>{children}</>
}

// ============================================================================
// CONDITIONAL RENDER - Show/Hide Based on Auth Status
// ============================================================================

interface ConditionalRenderProps {
    children: ReactNode
    condition: 'authenticated' | 'unauthenticated' | 'loading'
    fallback?: ReactNode
}

export function ConditionalRender({
                                      children,
                                      condition,
                                      fallback = null
                                  }: ConditionalRenderProps) {
    const { status } = useSession()

    if (status === condition) {
        return <>{children}</>
    }

    return <>{fallback}</>
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function AuthLoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">Memuat...</p>
            </div>
        </div>
    )
}

function UnauthorizedMessage() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Akses Ditolak</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Anda tidak memiliki izin untuk melihat konten ini.
                </p>
            </div>
        </div>
    )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function checkUserPermission(
    permissions: RolePermissions | undefined,
    resource: string,
    action: string
): boolean {
    if (!permissions) return false

    // Super admin bypass
    if (permissions.all === true) return true

    // Check specific resource permission
    const resourcePermissions = permissions[resource as keyof RolePermissions] as string[] | undefined

    return resourcePermissions?.includes(action) || false
}

function getDefaultRedirectForRole(role?: string): string {
    switch (role) {
        case 'Super Admin':
        case 'Admin':
            return '/admin'
        case 'Atasan':
            return '/approvals'
        case 'Pegawai':
        default:
            return '/dashboard'
    }
}

// ============================================================================
// CUSTOM HOOKS FOR AUTH GUARDS
// ============================================================================

export function useAuthGuard() {
    const { data: session, status } = useSession()

    return {
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading',
        user: session?.user,
        hasRole: (roles: string[]) => {
            const userRole = session?.user?.role?.name
            return userRole ? roles.includes(userRole) : false
        },
        hasPermission: (resource: string, action: string) => {
            return checkUserPermission(session?.user?.role?.permissions, resource, action)
        },
        canAccessDepartment: (departmentId: string) => {
            const userRole = session?.user?.role?.name
            const userDepartmentId = session?.user?.department?.id

            // Admin and above can access all departments
            if (['Admin', 'Super Admin'].includes(userRole || '')) {
                return true
            }

            // Same department access
            return userDepartmentId === departmentId
        }
    }
}

export function useRoleGuard(allowedRoles: string[]) {
    const { hasRole, isLoading } = useAuthGuard()

    return {
        isAllowed: hasRole(allowedRoles),
        isLoading
    }
}

export function usePermissionGuard(resource: string, action: string) {
    const { hasPermission, isLoading } = useAuthGuard()

    return {
        isAllowed: hasPermission(resource, action),
        isLoading
    }
}