// ============================================================================
// DASHBOARD LAYOUT
// src/app/(dashboard)/layout.tsx
// ============================================================================

import { ReactNode } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface DashboardLayoutProps {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="lg:pl-64">
                    {/* Header */}
                    <Header />

                    {/* Page Content */}
                    <main className="min-h-screen pb-16">
                        <div className="py-6">
                            {children}
                        </div>
                    </main>

                    {/* Footer */}
                    <Footer />
                </div>
            </div>
        </AuthGuard>
    )
}