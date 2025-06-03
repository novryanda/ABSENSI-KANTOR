// ============================================================================
// DASHBOARD LAYOUT
// src/app/(dashboard)/layout.tsx
// ============================================================================

'use client'

import { ReactNode } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface DashboardLayoutProps {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <AuthGuard>
            <SidebarProvider defaultOpen={true}>
                <AppSidebar />
                <SidebarInset>
                    <Header />
                    <main className="flex-1 space-y-4 p-4 md:p-6 lg:p-8">
                        {children}
                    </main>
                    <Footer />
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    )
}