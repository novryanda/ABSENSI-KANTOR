// ============================================================================
// APP SIDEBAR COMPONENT (SHADCN VERSION)
// src/components/layout/AppSidebar.tsx
// ============================================================================

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Clock,
    FileText,
    Users,
    Building2,
    Settings,
    Shield,
    MapPin,
    ChevronDown,
    ChevronRight,
    LogOut,
    User,
    Bell
} from 'lucide-react'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function AppSidebar() {
    const pathname = usePathname()
    const { user, hasPermission, hasRole, logout, getUserInitials, getUserDisplayName } = useAuth()

    // Navigation items with permission checks
    const navigationItems = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            current: pathname === '/dashboard',
            show: true
        },
        {
            title: 'Absensi',
            icon: Clock,
            show: true,
            children: [
                {
                    title: 'Absen Hari Ini',
                    href: '/attendance',
                    current: pathname === '/attendance',
                    show: true
                },
                {
                    title: 'Riwayat Absensi',
                    href: '/attendance/history',
                    current: pathname === '/attendance/history',
                    show: true
                }
            ]
        },
        {
            title: 'Pengajuan Surat',
            icon: FileText,
            show: true,
            children: [
                {
                    title: 'Buat Pengajuan',
                    href: '/requests/create',
                    current: pathname === '/requests/create',
                    show: true
                },
                {
                    title: 'Riwayat Pengajuan',
                    href: '/requests/history',
                    current: pathname === '/requests/history',
                    show: true
                },
                {
                    title: 'Persetujuan',
                    href: '/requests/approvals',
                    current: pathname === '/requests/approvals',
                    show: hasPermission('APPROVE_REQUESTS')
                }
            ]
        }
    ]

    // Admin navigation items
    const adminItems = [
        {
            title: 'Dashboard Admin',
            href: '/admin',
            icon: Shield,
            current: pathname === '/admin',
            show: hasRole('SUPER_ADMIN') || hasRole('HR_ADMIN')
        },
        {
            title: 'Manajemen Pengguna',
            href: '/admin/users',
            icon: Users,
            current: pathname.startsWith('/admin/users'),
            show: hasRole('SUPER_ADMIN') || hasRole('HR_ADMIN')
        },
        {
            title: 'Departemen',
            href: '/admin/departments',
            icon: Building2,
            current: pathname.startsWith('/admin/departments'),
            show: hasRole('SUPER_ADMIN') || hasRole('HR_ADMIN')
        },
        {
            title: 'Role & Permission',
            href: '/admin/roles',
            icon: Shield,
            current: pathname.startsWith('/admin/roles'),
            show: hasRole('SUPER_ADMIN')
        },
        {
            title: 'Lokasi Kantor',
            href: '/admin/office-locations',
            icon: MapPin,
            current: pathname.startsWith('/admin/office-locations'),
            show: hasRole('SUPER_ADMIN')
        }
    ]

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <Building2 className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Sistem Absensi</span>
                                    <span className="truncate text-xs">Kantor Pemerintahan</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Navigasi Utama</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navigationItems.filter(item => item.show).map((item) => {
                                if (item.children) {
                                    const hasActiveChild = item.children.some(child => child.current && child.show)
                                    return (
                                        <Collapsible key={item.title} defaultOpen={hasActiveChild}>
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton tooltip={item.title}>
                                                        <item.icon />
                                                        <span>{item.title}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.children.filter(child => child.show).map((child) => (
                                                            <SidebarMenuSubItem key={child.href}>
                                                                <SidebarMenuSubButton asChild isActive={child.current}>
                                                                    <Link href={child.href}>
                                                                        <span>{child.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    )
                                }

                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton asChild isActive={item.current} tooltip={item.title}>
                                            <Link href={item.href}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Admin Navigation */}
                {(hasRole('SUPER_ADMIN') || hasRole('HR_ADMIN')) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Administrasi</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {adminItems.filter(item => item.show).map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton asChild isActive={item.current} tooltip={item.title}>
                                            <Link href={item.href}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {/* Settings */}
                <SidebarGroup>
                    <SidebarGroupLabel>Pengaturan</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip="Pengaturan">
                                    <Link href="/settings">
                                        <Settings />
                                        <span>Pengaturan</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <User className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{getUserDisplayName()}</span>
                                <span className="truncate text-xs">{user?.role?.name || 'User'}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="ml-auto flex size-4 items-center justify-center rounded-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                title="Logout"
                            >
                                <LogOut className="size-3" />
                            </button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
