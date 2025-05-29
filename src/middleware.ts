// ============================================================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// middleware.ts (root level)
// ============================================================================

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { UserStatus, RolePermissions } from "@/types/auth"

// Define route permissions and access levels
const routeConfig = {
    // Public routes (no authentication required)
    public: [
        "/",
        "/auth/signin",
        "/auth/signup",
        "/auth/error",
        "/auth/forgot-password",
        "/api/auth",
        "/api/health",
        "/_next",
        "/favicon.ico",
        "/public"
    ],

    // Protected routes with specific role requirements
    protected: {
        // Super Admin only routes
        superAdmin: [
            "/admin/system",
            "/admin/users/create",
            "/admin/roles",
            "/admin/settings/system",
            "/api/admin/system",
            "/api/admin/users/create",
            "/api/admin/roles"
        ],

        // Admin and above (Admin + Super Admin)
        admin: [
            "/admin",
            "/admin/users",
            "/admin/departments",
            "/admin/settings",
            "/admin/reports",
            "/api/admin",
            "/api/admin/users",
            "/api/admin/departments",
            "/api/reports/admin"
        ],

        // Supervisor/Atasan and above (Atasan + Admin + Super Admin)
        supervisor: [
            "/approvals",
            "/team",
            "/team/attendance",
            "/team/reports",
            "/reports/team",
            "/api/approvals",
            "/api/team",
            "/api/reports/team"
        ],

        // All authenticated users
        user: [
            "/dashboard",
            "/profile",
            "/attendance",
            "/requests",
            "/notifications",
            "/reports/personal",
            "/api/attendance",
            "/api/requests",
            "/api/profile",
            "/api/notifications",
            "/api/reports/personal"
        ]
    }
}

// Helper function to check if route is public
function isPublicRoute(pathname: string): boolean {
    return routeConfig.public.some(route =>
        pathname.startsWith(route) || pathname === route
    )
}

// Helper function to get required role for route
function getRequiredRole(pathname: string): string | null {
    // Check from most restrictive to least restrictive
    const roleHierarchy = [
        { role: 'Super Admin', routes: routeConfig.protected.superAdmin },
        { role: 'Admin', routes: routeConfig.protected.admin },
        { role: 'Atasan', routes: routeConfig.protected.supervisor },
        { role: 'Pegawai', routes: routeConfig.protected.user }
    ]

    for (const { role, routes } of roleHierarchy) {
        if (routes.some(route => pathname.startsWith(route))) {
            return role
        }
    }

    return null
}

// Helper function to check if user has permission for route
function hasPermissionForRoute(pathname: string, userRole?: string): boolean {
    if (!userRole) return false

    // Super Admin has access to everything
    if (userRole === "Super Admin") return true

    // Define role hierarchy with cumulative permissions
    const rolePermissions = {
        "Admin": [
            ...routeConfig.protected.admin,
            ...routeConfig.protected.user
        ],
        "Atasan": [
            ...routeConfig.protected.supervisor,
            ...routeConfig.protected.user
        ],
        "Pegawai": routeConfig.protected.user
    }

    const allowedRoutes = rolePermissions[userRole as keyof typeof rolePermissions] || []

    return allowedRoutes.some(route => pathname.startsWith(route))
}

// Helper function to get appropriate redirect URL based on role
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

// Main middleware function
export default withAuth(
    async function middleware(req: NextRequest) {
        const token = await getToken({
            req,
            secret: process.env.AUTH_SECRET
        })

        const { pathname } = req.nextUrl

        // Skip middleware for static files and API routes we don't want to protect
        if (
            pathname.startsWith('/_next') ||
            pathname.startsWith('/favicon.ico') ||
            pathname.startsWith('/public/') ||
            pathname.includes('.')
        ) {
            return NextResponse.next()
        }

        // Allow public routes
        if (isPublicRoute(pathname)) {
            // If user is already logged in and tries to access auth pages, redirect to dashboard
            if (token && (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup'))) {
                const redirectUrl = new URL(getDefaultRedirectForRole(token.role?.name), req.url)
                return NextResponse.redirect(redirectUrl)
            }
            return NextResponse.next()
        }

        // Redirect to signin if no token
        if (!token) {
            const signInUrl = new URL("/auth/signin", req.url)
            signInUrl.searchParams.set("callbackUrl", pathname)
            return NextResponse.redirect(signInUrl)
        }

        // Check if user account is active
        if (token.status !== 'active') {
            const errorUrl = new URL("/auth/error", req.url)
            errorUrl.searchParams.set("error", "AccountInactive")
            return NextResponse.redirect(errorUrl)
        }

        // Check role-based permissions
        const userRole = token.role?.name
        const requiredRole = getRequiredRole(pathname)

        if (requiredRole && !hasPermissionForRoute(pathname, userRole)) {
            // Log unauthorized access attempt
            console.warn(`Unauthorized access attempt: ${userRole} tried to access ${pathname}`)

            // Redirect to appropriate dashboard with error message
            const dashboardUrl = new URL(getDefaultRedirectForRole(userRole), req.url)
            dashboardUrl.searchParams.set("error", "Unauthorized")
            dashboardUrl.searchParams.set("message", "Anda tidak memiliki akses ke halaman tersebut")
            return NextResponse.redirect(dashboardUrl)
        }

        // Add user info to headers for API routes
        if (pathname.startsWith("/api/")) {
            const requestHeaders = new Headers(req.headers)
            requestHeaders.set("x-user-id", token.id as string)
            requestHeaders.set("x-user-role", userRole || "")
            requestHeaders.set("x-user-department", token.department?.id || "")
            requestHeaders.set("x-user-nip", token.nip || "")

            return NextResponse.next({
                request: {
                    headers: requestHeaders
                }
            })
        }

        // Log access for audit in production
        if (process.env.NODE_ENV === "production") {
            console.log(`Access: ${userRole} (${token.email}) -> ${pathname}`)
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl

                // Allow public routes
                if (isPublicRoute(pathname)) return true

                // Require token for protected routes
                return !!token
            }
        }
    }
)

// Configure which routes this middleware runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files with extensions
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)"
    ]
}

// ============================================================================
// PERMISSION CHECKING UTILITIES
// ============================================================================

/**
 * Check if user has specific permission
 */
export function checkPermission(
    userPermissions: RolePermissions,
    resource: string,
    action: string
): boolean {
    // Super admin bypass
    if (userPermissions.all === true) return true

    // Check specific resource permission
    const resourcePermissions = userPermissions[resource as keyof RolePermissions] as string[] | undefined

    return resourcePermissions?.includes(action) || false
}

/**
 * Check if user can access department data
 */
export function canAccessDepartment(
    userRole: string,
    userDepartmentId: string,
    targetDepartmentId: string
): boolean {
    // Super Admin and Admin can access all departments
    if (userRole === 'Super Admin' || userRole === 'Admin') {
        return true
    }

    // Atasan can access own department
    if (userRole === 'Atasan') {
        return userDepartmentId === targetDepartmentId
    }

    // Pegawai can only access own department data
    if (userRole === 'Pegawai') {
        return userDepartmentId === targetDepartmentId
    }

    return false
}

/**
 * Get accessible department IDs for user
 */
export function getAccessibleDepartments(
    userRole: string,
    userDepartmentId: string
): string[] | 'all' {
    // Super Admin and Admin can access all
    if (userRole === 'Super Admin' || userRole === 'Admin') {
        return 'all'
    }

    // Others can only access own department
    return userDepartmentId ? [userDepartmentId] : []
}

/**
 * Check if user can approve requests
 */
export function canApprove(
    userRole: string,
    userDepartmentId: string,
    requestDepartmentId: string
): boolean {
    // Only Atasan and above can approve
    if (!['Atasan', 'Admin', 'Super Admin'].includes(userRole)) {
        return false
    }

    // Super Admin and Admin can approve anything
    if (userRole === 'Super Admin' || userRole === 'Admin') {
        return true
    }

    // Atasan can approve for own department
    return userDepartmentId === requestDepartmentId
}

/**
 * API Response wrapper for unauthorized access
 */
export function unauthorizedResponse(message?: string) {
    return NextResponse.json(
        {
            success: false,
            error: {
                message: message || "Anda tidak memiliki akses untuk melakukan tindakan ini",
                code: "UNAUTHORIZED"
            }
        },
        { status: 403 }
    )
}

/**
 * API Response wrapper for unauthenticated access
 */
export function unauthenticatedResponse(message?: string) {
    return NextResponse.json(
        {
            success: false,
            error: {
                message: message || "Anda harus login terlebih dahulu",
                code: "UNAUTHENTICATED"
            }
        },
        { status: 401 }
    )
}