// ============================================================================
// DASHBOARD LAYOUT
// src/app/(dashboard)/layout.tsx
// ============================================================================

'use client'

import { ReactNode, useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface DashboardLayoutProps {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Close sidebar when clicking outside or pressing escape
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSidebarOpen(false)
            }
        }

        if (sidebarOpen) {
            document.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden' // Prevent background scroll
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'unset'
        }
    }, [sidebarOpen])

    // Close sidebar on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) { // lg breakpoint
                setSidebarOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                {/* Mobile sidebar overlay */}
                <div
                    className={`
                        fixed inset-0 z-40 bg-black transition-opacity duration-300 lg:hidden
                        ${sidebarOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}
                    `}
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />

                {/* Sidebar */}
                <div className={`
                    fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
                    lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <Sidebar
                        onClose={() => setSidebarOpen(false)}
                        isOpen={sidebarOpen}
                    />
                </div>

                {/* Main Content Area */}
                <div className="lg:pl-80">
                    {/* Header */}
                    <Header
                        onMenuClick={() => setSidebarOpen(true)}
                        sidebarOpen={sidebarOpen}
                    />

                    {/* Page Content */}
                    <main className="min-h-screen bg-gray-50">
                        {children}
                    </main>

                    {/* Footer */}
                    <Footer />
                </div>
            </div>
        </AuthGuard>
    )
}