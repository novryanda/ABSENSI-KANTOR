// ============================================================================
// HEADER COMPONENT
// src/components/layout/Header.tsx
// ============================================================================

'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Transition } from '@headlessui/react'
import {
    Bars3Icon,
    BellIcon,
    ChevronDownIcon,
    UserCircleIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'

interface HeaderProps {
    onMenuClick?: () => void
    sidebarOpen?: boolean
}

export default function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
    const router = useRouter()
    const { user, logout, getUserInitials, getUserDisplayName } = useAuth()
    const { notifications, markAsRead } = useNotifications()

    return (
        <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between items-center">
                    <div className="flex items-center min-w-0">
                        {onMenuClick && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden mr-3 hover:bg-gray-100"
                                onClick={onMenuClick}
                                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                            >
                                <span className="sr-only">
                                    {sidebarOpen ? "Close sidebar" : "Open sidebar"}
                                </span>
                                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                            </Button>
                        )}

                        {/* Page Title - Responsive */}
                        <div className="hidden sm:block lg:hidden">
                            <h1 className="text-lg font-semibold text-gray-900 truncate">Dashboard</h1>
                        </div>

                        {/* Mobile Logo - Show when sidebar is closed */}
                        <div className="sm:hidden">
                            <h1 className="text-base font-semibold text-gray-900">Sistem Absensi</h1>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="relative hover:bg-gray-100">
                            <span className="sr-only">View notifications</span>
                            <BellIcon className="h-5 w-5" aria-hidden="true" />
                            {notifications?.length > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                >
                                    {notifications.length > 9 ? '9+' : notifications.length}
                                </Badge>
                            )}
                        </Button>
                        
                        {/* Profile dropdown */}
                        <Menu as="div" className="relative">
                            <div>
                                <Menu.Button className="flex items-center rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 hover:bg-gray-50 transition-colors">
                                    <span className="sr-only">Open user menu</span>
                                    {user ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-primary-foreground">
                                                {getUserInitials()}
                                            </div>
                                            <span className="hidden md:flex text-sm font-medium text-gray-700">
                                                {getUserDisplayName()}
                                            </span>
                                            <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                        </div>
                                    ) : (
                                        <UserCircleIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                                    )}
                                </Menu.Button>
                            </div>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-200"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={() => router.push('/profile')}
                                                className={`${
                                                    active ? 'bg-gray-100' : ''
                                                } flex w-full px-4 py-2 text-sm text-gray-700`}
                                            >
                                                <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                                Profile
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={() => router.push('/settings')}
                                                className={`${
                                                    active ? 'bg-gray-100' : ''
                                                } flex w-full px-4 py-2 text-sm text-gray-700`}
                                            >
                                                <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                                Settings
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={() => logout()}
                                                className={`${
                                                    active ? 'bg-gray-100' : ''
                                                } flex w-full px-4 py-2 text-sm text-gray-700`}
                                            >
                                                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                                Sign out
                                            </button>
                                        )}
                                    </Menu.Item>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>
                </div>
            </div>
        </header>
    )
}
