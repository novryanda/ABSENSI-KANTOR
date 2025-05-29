// ============================================================================
// AUTHENTICATION HOOKS
// src/hooks/useAuth.ts
// ============================================================================

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import { SessionUser, RolePermissions, LoginCredentials } from '@/types/auth'

// ============================================================================
// MAIN AUTH HOOK
// ============================================================================

export function useAuth() {
    const { data: session, status, update } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const user = session?.user as SessionUser | undefined

    // Login function
    const login = useCallback(async (credentials: LoginCredentials, redirectTo?: string) => {
        setIsLoading(true)
        try {
            const result = await signIn('credentials', {
                identifier: credentials.nip,
                password: credentials.password,
                redirect: false
            })

            if (result?.error) {
                throw new Error(result.error)
            }

            if (result?.ok) {
                if (redirectTo) {
                    router.push(redirectTo)
                } else {
                    // Redirect based on user role
                    const redirectUrl = getDefaultRedirectForRole(user?.role?.name)
                    router.push(redirectUrl)
                }
                return { success: true }
            }

            throw new Error('Login failed')
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Login failed'
            }
        } finally {
            setIsLoading(false)
        }
    }, [router, user?.role?.name])

    // OAuth login function
    const loginWithOAuth = useCallback(async (provider: 'google' | 'azure-ad', redirectTo?: string) => {
        setIsLoading(true)
        try {
            await signIn(provider, {
                callbackUrl: redirectTo || getDefaultRedirectForRole()
            })
        } catch (error) {
            setIsLoading(false)
            throw error
        }
    }, [])

    // Logout function
    const logout = useCallback(async (redirectTo?: string) => {
        setIsLoading(true)
        try {
            await signOut({
                callbackUrl: redirectTo || '/auth/signin',
                redirect: true
            })
        } catch (error) {
            setIsLoading(false)
            throw error
        }
    }, [])

    // Refresh session
    const refreshSession = useCallback(async () => {
        try {
            await update()
        } catch (error) {
            console.error('Failed to refresh session:', error)
        }
    }, [update])

    // Check if user has specific role
    const hasRole = useCallback((roles: string | string[]) => {
        if (!user?.role?.name) return false

        const roleArray = Array.isArray(roles) ? roles : [roles]
        return roleArray.includes(user.role.name)
    }, [user?.role?.name])

    // Check if user has specific permission
    const hasPermission = useCallback((resource: string, action: string) => {
        if (!user?.role?.permissions) return false

        const permissions = user.role.permissions as RolePermissions

        // Super admin bypass
        if (permissions.all === true) return true

        // Check specific resource permission
        const resourcePermissions = permissions[resource as keyof RolePermissions] as string[] | undefined

        return resourcePermissions?.includes(action) || false
    }, [user?.role?.permissions])

    // Check if user can access department
    const canAccessDepartment = useCallback((departmentId: string) => {
        if (!user) return false

        // Super Admin and Admin can access all departments
        if (hasRole(['Super Admin', 'Admin'])) {
            return true
        }

        // Same department access
        return user.department?.id === departmentId
    }, [user, hasRole])

    // Check if user can approve
    const canApprove = useCallback((departmentId?: string) => {
        if (!hasPermission('approvals', 'approve')) return false

        // If no specific department, check if user can approve in general
        if (!departmentId) return true

        // Check department access
        return canAccessDepartment(departmentId)
    }, [hasPermission, canAccessDepartment])

    // Get user initials for avatar
    const getUserInitials = useCallback(() => {
        if (user?.name) {
            return user.name
                .split(' ')
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2)
        }
        return user?.email?.charAt(0).toUpperCase() || '??'
    }, [user?.name, user?.email])

    // Get user display name
    const getUserDisplayName = useCallback(() => {
        return user?.name || user?.email?.split('@')[0] || 'Unknown User'
    }, [user?.name, user?.email])

    return {
        // Session data
        user,
        session,
        status,
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading' || isLoading,

        // Auth functions
        login,
        loginWithOAuth,
        logout,
        refreshSession,

        // Permission checks
        hasRole,
        hasPermission,
        canAccessDepartment,
        canApprove,

        // Utility functions
        getUserInitials,
        getUserDisplayName
    }
}

// ============================================================================
// PERMISSION HOOK
// ============================================================================

export function usePermissions() {
    const { user, hasPermission, hasRole } = useAuth()

    const permissions = user?.role?.permissions as RolePermissions | undefined

    // Check multiple permissions at once
    const hasAnyPermission = useCallback((checks: Array<{resource: string, action: string}>) => {
        return checks.some(({ resource, action }) => hasPermission(resource, action))
    }, [hasPermission])

    const hasAllPermissions = useCallback((checks: Array<{resource: string, action: string}>) => {
        return checks.every(({ resource, action }) => hasPermission(resource, action))
    }, [hasPermission])

    // Get all permissions for current user
    const getAllPermissions = useCallback(() => {
        if (!permissions) return {}

        if (permissions.all === true) {
            return { all: true }
        }

        return permissions
    }, [permissions])

    // Check if user is admin level
    const isAdmin = useCallback(() => {
        return hasRole(['Admin', 'Super Admin'])
    }, [hasRole])

    // Check if user is supervisor level
    const isSupervisor = useCallback(() => {
        return hasRole(['Atasan', 'Admin', 'Super Admin'])
    }, [hasRole])

    return {
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        getAllPermissions,
        isAdmin,
        isSupervisor,
        hasRole
    }
}

// ============================================================================
// PROFILE HOOK
// ============================================================================

export function useProfile() {
    const { user, refreshSession } = useAuth()
    const [isUpdating, setIsUpdating] = useState(false)

    // Update profile
    const updateProfile = useCallback(async (data: {
        name?: string
        phone?: string
        address?: string
        image?: string
    }) => {
        setIsUpdating(true)
        try {
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to update profile')
            }

            // Refresh session to get updated data
            await refreshSession()

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update profile'
            }
        } finally {
            setIsUpdating(false)
        }
    }, [refreshSession])

    // Change password
    const changePassword = useCallback(async (data: {
        currentPassword: string
        newPassword: string
        confirmPassword: string
    }) => {
        setIsUpdating(true)
        try {
            const response = await fetch('/api/profile/password', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to change password')
            }

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to change password'
            }
        } finally {
            setIsUpdating(false)
        }
    }, [])

    // Get profile completion percentage
    const getProfileCompletion = useCallback(() => {
        if (!user) return 0

        const fields = [
            user.name,
            user.phone,
            user.image,
            user.department?.id,
            user.role?.id
        ]

        const completedFields = fields.filter(field => field !== null && field !== undefined).length
        return Math.round((completedFields / fields.length) * 100)
    }, [user])

    return {
        user,
        isUpdating,
        updateProfile,
        changePassword,
        getProfileCompletion
    }
}

// ============================================================================
// SESSION MANAGEMENT HOOK
// ============================================================================

export function useSessionManagement() {
    const { data: session, status } = useSession()
    const [lastActivity, setLastActivity] = useState(Date.now())

    // Update last activity
    const updateActivity = useCallback(() => {
        setLastActivity(Date.now())
    }, [])

    // Check if session is about to expire
    const isSessionExpiring = useCallback(() => {
        if (!session?.expires) return false

        const expiresAt = new Date(session.expires).getTime()
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        return (expiresAt - now) < fiveMinutes
    }, [session?.expires])

    // Get session remaining time in seconds
    const getSessionRemainingTime = useCallback(() => {
        if (!session?.expires) return 0

        const expiresAt = new Date(session.expires).getTime()
        const now = Date.now()

        return Math.max(0, Math.floor((expiresAt - now) / 1000))
    }, [session?.expires])

    // Auto-update activity on user interaction
    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

        const handleActivity = () => updateActivity()

        events.forEach(event => {
            document.addEventListener(event, handleActivity, true)
        })

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true)
            })
        }
    }, [updateActivity])

    return {
        session,
        status,
        lastActivity,
        updateActivity,
        isSessionExpiring,
        getSessionRemainingTime
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
// DEPARTMENT ACCESS HOOK
// ============================================================================

export function useDepartmentAccess() {
    const { user, hasRole } = useAuth()

    // Get accessible department IDs
    const getAccessibleDepartments = useCallback((): string[] | 'all' => {
        if (hasRole(['Super Admin', 'Admin'])) {
            return 'all'
        }

        return user?.department?.id ? [user.department.id] : []
    }, [user?.department?.id, hasRole])

    // Check if user can access specific department
    const canAccessDepartment = useCallback((departmentId: string): boolean => {
        const accessible = getAccessibleDepartments()

        if (accessible === 'all') return true

        return accessible.includes(departmentId)
    }, [getAccessibleDepartments])

    // Check if user can manage department (add/edit/delete users, etc.)
    const canManageDepartment = useCallback((departmentId: string): boolean => {
        // Only Admin and above can manage departments
        if (hasRole(['Super Admin', 'Admin'])) {
            return true
        }

        // Department heads might have limited management access
        // This would depend on your business rules
        return false
    }, [hasRole])

    return {
        getAccessibleDepartments,
        canAccessDepartment,
        canManageDepartment,
        userDepartment: user?.department
    }
}