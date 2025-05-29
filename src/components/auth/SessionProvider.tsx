'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'
import { ReactNode } from 'react'

interface SessionProviderProps {
    children: ReactNode
    session?: Session | null
}

export default function SessionProvider({ children, session }: SessionProviderProps) {
    return (
        <NextAuthSessionProvider
            session={session}
            refetchInterval={5 * 60} // Refetch every 5 minutes
            refetchOnWindowFocus={true}
            refetchWhenOffline={false}
        >
            {children}
        </NextAuthSessionProvider>
    )
}