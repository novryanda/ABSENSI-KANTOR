// ============================================================================
// SIDEBAR COMPONENT
// src/components/layout/Sidebar.tsx
// ============================================================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Clock,
    FileText,
    CheckSquare,
    Users,
    Building2,
    BarChart3,
    Settings,
    ChevronDown,
    X,
    Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useAuth } from '@/hooks/useAuth'

interface SidebarProps {
    className?: string
    onClose?: () => void
}

export default function Sidebar({ className, onClose }: SidebarProps) {
    const pathname = usePathname()
    const { user, hasPermission, hasRole } = useAuth()
    const [isOpen, setIsOpen] = useState(true)

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
            title: 'Pengajuan',
            icon: FileText,
            show: true,
            children: [
                {
                    title: 'Pengajuan Saya',
                    href: '/requests',
                    current: pathname === '/requests',
                    show: true
                },
                {
                    title: 'Pengajuan Cuti',
                    href: '/requests/leave',
                    current: pathname === '/requests/leave',
                    show: true
                },
                {
                    title: 'Pengajuan Izin',
                    href: '/requests/permission',
                    current: pathname === '/requests/permission',
                    show: true
                },
                {
                    title: 'Surat Kerja',
                    href: '/requests/work-letter',
                    current: pathname === '/requests/work-letter',
                    show: true
                }
            ]
        },
        {
            title: 'Persetujuan',
            href: '/approvals',
            icon: CheckSquare,
            current: pathname.startsWith('/approvals'),
            show: hasPermission('approvals', 'read'),
            badge: 5 // This would come from API
        },
        {
            title: 'Tim',
            icon: Users,
            show: hasRole(['Atasan', 'Admin', 'Super Admin']),
            children: [
                {
                    title: 'Absensi Tim',
                    href: '/team/attendance',
                    current: pathname === '/team/attendance',
                    show: hasPermission('team_attendance', 'read')
                },
                {
                    title: 'Laporan Tim',
                    href: '/team/reports',
                    current: pathname === '/team/reports',
                    show: hasPermission('team_reports', 'read')
                }
            ]
        },
        {
            title: 'Administrasi',
            icon: Building2,
            show: hasRole(['Admin', 'Super Admin']),
            children: [
                {
                    title: 'Manajemen User',
                    href: '/admin/users',
                    current: pathname.startsWith('/admin/users'),
                    show: hasPermission('users', 'read')
                },
                {
                    title: 'Departemen',
                    href: '/admin/departments',
                    current: pathname === '/admin/departments',
                    show: hasPermission('departments', 'read')
                },
                {
                    title: 'Role & Permission',
                    href: '/admin/roles',
                    current: pathname === '/admin/roles',
                    show: hasPermission('roles', 'read')
                }
            ]
        },
        {
            title: 'Laporan',
            icon: BarChart3,
            show: hasPermission('reports', 'read'),
            children: [
                {
                    title: 'Laporan Absensi',
                    href: '/reports/attendance',
                    current: pathname === '/reports/attendance',
                    show: hasPermission('reports', 'read')
                },
                {
                    title: 'Laporan Cuti',
                    href: '/reports/leave',
                    current: pathname === '/reports/leave',
                    show: hasPermission('reports', 'read')
                },
                {
                    title: 'Laporan Departemen',
                    href: '/reports/department',
                    current: pathname === '/reports/department',
                    show: hasPermission('department_reports', 'read')
                }
            ]
        },
        {
            title: 'Pengaturan',
            href: '/settings',
            icon: Settings,
            current: pathname.startsWith('/settings'),
            show: hasPermission('settings', 'read')
        }
    ]

    return (
        <div className={cn("pb-12 w-64", className)}>
            <div className="space-y-4 py-4">
                {/* Logo/Brand */}
                <div className="px-3 py-2">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">Sistem Absensi</span>
                                <span className="text-xs text-muted-foreground">Kantor Pemerintahan</span>
                            </div>
                        </Link>
                        {onClose && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="lg:hidden"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* User Info */}
                <div className="px-3 py-2">
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-primary-foreground">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'UN'}
              </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {user?.name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user?.role?.name} • {user?.nip}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="px-3">
                    <ScrollArea className="h-[calc(100vh-12rem)]">
                        <div className="space-y-1">
                            {navigationItems.map((item, index) => {
                                if (!item.show) return null

                                if (item.children) {
                                    return (
                                        <NavigationGroup
                                            key={index}
                                            item={item}
                                            pathname={pathname}
                                        />
                                    )
                                }

                                return (
                                    <NavigationItem
                                        key={index}
                                        item={item}
                                        onClick={onClose}
                                    />
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}

// Navigation Item Component
interface NavigationItemProps {
    item: {
        title: string
        href?: string
        icon?: any
        current?: boolean
        badge?: number
    }
    onClick?: () => void
}

function NavigationItem({ item, onClick }: NavigationItemProps) {
    const content = (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                {item.icon && <item.icon className="h-4 w-4" />}
                <span className="text-sm font-medium">{item.title}</span>
            </div>
            {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                </Badge>
            )}
        </div>
    )

    if (item.href) {
        return (
            <Link
                href={item.href}
                onClick={onClick}
                className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    item.current ? "bg-accent text-accent-foreground" : "transparent"
                )}
            >
                {content}
            </Link>
        )
    }

    return (
        <div className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium">
            {content}
        </div>
    )
}

// Navigation Group Component (for items with children)
interface NavigationGroupProps {
    item: {
        title: string
        icon?: any
        children?: Array<{
            title: string
            href: string
            current?: boolean
            show?: boolean
        }>
    }
    pathname: string
}

function NavigationGroup({ item, pathname }: NavigationGroupProps) {
    const hasActivChild = item.children?.some(child => child.current)
    const [isOpen, setIsOpen] = useState(hasActivChild || false)

    const visibleChildren = item.children?.filter(child => child.show !== false) || []

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-between p-2 h-auto font-medium",
                        hasActivChild && "bg-accent text-accent-foreground"
                    )}
                >
                    <div className="flex items-center space-x-3">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span className="text-sm">{item.title}</span>
                    </div>
                    <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        isOpen && "rotate-180"
                    )} />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
                <div className="ml-6 space-y-1">
                    {visibleChildren.map((child, childIndex) => (
                        <Link
                            key={childIndex}
                            href={child.href}
                            className={cn(
                                "block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                                child.current ? "bg-accent text-accent-foreground font-medium" : ""
                            )}
                        >
                            {child.title}
                        </Link>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}