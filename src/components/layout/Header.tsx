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
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'

interface HeaderProps {
    onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
    const router = useRouter()
    const { user, logout, getUserInitials, getUserDisplayName } = useAuth()