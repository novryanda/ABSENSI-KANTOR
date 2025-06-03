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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useAuth } from '@/hooks/useAuth'

interface SidebarProps {
    className?: string
    onClose?: () => void
    isOpen?: boolean
}

export default function Sidebar({ className, onClose, isOpen }: SidebarProps) {
    const pathname = usePathname()
    const { user, hasPermission, hasRole } = useAuth()

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
                    title: 'Lokasi Kantor',
                    href: '/admin/office-locations',
                    current: pathname.startsWith('/admin/office-locations'),
                    show: hasRole(['Super Admin']) // Only Super Admin can manage office locations
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
        <div className={cn("h-screen w-80 flex flex-col bg-white border-r border-gray-200", className)}>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Logo/Brand */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                    <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                        onClick={onClose}
                    >
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-semibold text-gray-900">Sistem Absensi</span>
                            <span className="text-sm text-gray-500">Kantor Pemerintahan</span>
                        </div>
                    </Link>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="lg:hidden hover:bg-gray-100 rounded-lg"
                            aria-label="Close sidebar"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* User Info */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-base font-medium text-primary-foreground">
                                {user?.name?.split(' ').map(n => n[0]).join('') || 'UN'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-medium truncate">
                                {user?.name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                                {user?.role?.name} • {user?.nip}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <div className="p-6 space-y-2">
                        {navigationItems.map((item, index) => {
                            if (!item.show) return null

                            if (item.children) {
                                return (
                                    <NavigationGroup
                                        key={index}
                                        item={item}
                                        pathname={pathname}
                                        onItemClick={onClose}
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
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
                {item.icon && <item.icon className="h-5 w-5" />}
                <span className="text-base font-medium">{item.title}</span>
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
                    "flex items-center rounded-lg px-4 py-3 text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    item.current ? "bg-accent text-accent-foreground" : "transparent"
                )}
            >
                {content}
            </Link>
        )
    }

    return (
        <div className="flex items-center rounded-lg px-4 py-3 text-base font-medium">
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
    onItemClick?: () => void
}

function NavigationGroup({ item, pathname, onItemClick }: NavigationGroupProps) {
    const hasActivChild = item.children?.some(child => child.current)
    const [isOpen, setIsOpen] = useState(hasActivChild || false)

    const visibleChildren = item.children?.filter(child => child.show !== false) || []

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-between p-4 h-auto font-medium rounded-lg",
                        hasActivChild && "bg-accent text-accent-foreground"
                    )}
                >
                    <div className="flex items-center space-x-4">
                        {item.icon && <item.icon className="h-5 w-5" />}
                        <span className="text-base">{item.title}</span>
                    </div>
                    <ChevronDown className={cn(
                        "h-5 w-5 transition-transform",
                        isOpen && "rotate-180"
                    )} />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
                <div className="ml-8 space-y-1 mt-2">
                    {visibleChildren.map((child, childIndex) => (
                        <Link
                            key={childIndex}
                            href={child.href}
                            onClick={onItemClick}
                            className={cn(
                                "block rounded-lg px-4 py-3 text-base hover:bg-accent hover:text-accent-foreground transition-colors",
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