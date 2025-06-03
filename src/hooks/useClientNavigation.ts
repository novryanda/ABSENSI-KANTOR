// ============================================================================
// CLIENT NAVIGATION HOOK
// src/hooks/useClientNavigation.ts
// ============================================================================

'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

interface UseClientNavigationOptions {
  preventDuplicateNavigation?: boolean
  delay?: number
}

export function useClientNavigation(options: UseClientNavigationOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const [lastNavigation, setLastNavigation] = useState<string | null>(null)
  
  const { preventDuplicateNavigation = true, delay = 0 } = options

  // Safe navigation function that works on client-side only
  const navigateTo = useCallback((url: string, replace = false) => {
    // Prevent navigation if already navigating to the same URL
    if (preventDuplicateNavigation && (isNavigating || lastNavigation === url)) {
      return
    }

    // Only navigate on client-side
    if (typeof window === 'undefined') {
      return
    }

    setIsNavigating(true)
    setLastNavigation(url)

    const navigate = () => {
      try {
        if (replace) {
          router.replace(url)
        } else {
          router.push(url)
        }
      } catch (error) {
        console.error('Navigation error:', error)
        setIsNavigating(false)
      }
    }

    if (delay > 0) {
      setTimeout(navigate, delay)
    } else {
      navigate()
    }
  }, [router, isNavigating, lastNavigation, preventDuplicateNavigation, delay])

  // Reset navigation state when pathname changes
  useEffect(() => {
    setIsNavigating(false)
    setLastNavigation(null)
  }, [pathname])

  // Get current path safely
  const getCurrentPath = useCallback(() => {
    if (typeof window === 'undefined') {
      return '/'
    }
    return pathname || '/'
  }, [pathname])

  // Get callback URL for redirects
  const getCallbackUrl = useCallback((fallback = '/dashboard') => {
    const currentPath = getCurrentPath()
    return encodeURIComponent(currentPath === '/' ? fallback : currentPath)
  }, [getCurrentPath])

  return {
    navigateTo,
    isNavigating,
    getCurrentPath,
    getCallbackUrl,
    pathname: getCurrentPath()
  }
}

// ============================================================================
// AUTH NAVIGATION HOOK
// ============================================================================

export function useAuthNavigation() {
  const { navigateTo, getCallbackUrl, isNavigating } = useClientNavigation()

  const redirectToLogin = useCallback((callbackUrl?: string) => {
    const callback = callbackUrl || getCallbackUrl()
    navigateTo(`/auth/signin?callbackUrl=${callback}`)
  }, [navigateTo, getCallbackUrl])

  const redirectToError = useCallback((error: string, message?: string) => {
    const params = new URLSearchParams({ error })
    if (message) {
      params.set('message', message)
    }
    navigateTo(`/auth/error?${params.toString()}`)
  }, [navigateTo])

  const redirectToUnauthorized = useCallback((message?: string) => {
    redirectToError('Unauthorized', message || 'You do not have permission to access this page')
  }, [redirectToError])

  const redirectToInactive = useCallback(() => {
    redirectToError('AccountInactive', 'Your account is inactive. Please contact administrator.')
  }, [redirectToError])

  const redirectToDashboard = useCallback((userRole?: string) => {
    const defaultPath = getDefaultRedirectForRole(userRole)
    navigateTo(defaultPath)
  }, [navigateTo])

  return {
    redirectToLogin,
    redirectToError,
    redirectToUnauthorized,
    redirectToInactive,
    redirectToDashboard,
    navigateTo,
    isNavigating
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDefaultRedirectForRole(role?: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'HR_ADMIN':
      return '/admin'
    case 'SUPERVISOR':
    case 'MANAGER':
      return '/approvals'
    case 'EMPLOYEE':
    default:
      return '/dashboard'
  }
}

// ============================================================================
// SAFE WINDOW UTILITIES
// ============================================================================

export function useWindowLocation() {
  const [location, setLocation] = useState<Location | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocation(window.location)
    }
  }, [])

  return location
}

export function useSafeWindow() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return {
    isClient,
    window: isClient ? window : null
  }
}
