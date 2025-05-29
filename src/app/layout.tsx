import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/infrastructure/auth/authOptions'
import SessionProvider from '@/components/auth/SessionProvider'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: {
        template: '%s | Sistem Absensi',
        default: 'Sistem Absensi - Kantor Pemerintahan'
    },
    description: 'Sistem manajemen absensi dan pengajuan surat untuk kantor pemerintahan',
    keywords: ['absensi', 'pemerintahan', 'pegawai', 'cuti', 'izin'],
    authors: [{ name: 'IT Department' }],
    creator: 'Kantor Pemerintahan',
    publisher: 'Kantor Pemerintahan',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    robots: {
        index: false,
        follow: false,
    },
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/apple-touch-icon.png',
    },
    openGraph: {
        type: 'website',
        locale: 'id_ID',
        url: process.env.NEXT_PUBLIC_APP_URL,
        title: 'Sistem Absensi - Kantor Pemerintahan',
        description: 'Sistem manajemen absensi dan pengajuan surat untuk kantor pemerintahan',
        siteName: 'Sistem Absensi',
    },
    twitter: {
        card: 'summary',
        title: 'Sistem Absensi - Kantor Pemerintahan',
        description: 'Sistem manajemen absensi dan pengajuan surat untuk kantor pemerintahan',
    },
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
        { media: '(prefers-color-scheme: dark)', color: '#1d4ed8' }
    ]
};

interface RootLayoutProps {
    children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
    // Get session on server side for initial hydration
    const session = await getServerSession(authOptions)

    return (
        <html lang="id" className="h-full">
        <body className={`${inter.className} h-full bg-gray-50`}>
        <SessionProvider session={session}>
            {/* Global Loading Indicator */}
            <div id="global-loading" className="hidden">
                <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-sm text-gray-600">Memuat...</p>
                    </div>
                </div>
            </div>

            {/* Main Application */}
            <div className="min-h-full">
                {children}
            </div>

            {/* Toast Container */}
            <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2">
                {/* Toast notifications will be rendered here */}
            </div>

            {/* Modal Container */}
            <div id="modal-container">
                {/* Modal dialogs will be rendered here */}
            </div>
        </SessionProvider>

        {/* Service Worker Registration */}
        <script
            dangerouslySetInnerHTML={{
                __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
            }}
        />

        {/* Global Error Handler */}
        <script
            dangerouslySetInnerHTML={{
                __html: `
              window.addEventListener('error', function(event) {
                console.error('Global error:', event.error);
                // Report to error tracking service if configured
                if (window.Sentry) {
                  window.Sentry.captureException(event.error);
                }
              });

              window.addEventListener('unhandledrejection', function(event) {
                console.error('Unhandled promise rejection:', event.reason);
                // Report to error tracking service if configured
                if (window.Sentry) {
                  window.Sentry.captureException(event.reason);
                }
              });
            `,
            }}
        />

        {/* Development Mode Indicators */}
        {process.env.NODE_ENV === 'development' && (
            <>
                <div className="fixed bottom-4 left-4 bg-yellow-500 text-yellow-900 px-2 py-1 rounded text-xs font-mono z-50">
                    DEV
                </div>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                  // Development mode console styling
                  console.log('%cSistem Absensi - Development Mode', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
                  console.log('Environment:', '${process.env.NODE_ENV}');
                  console.log('Next.js Version:', '${process.env.npm_package_dependencies_next || 'Unknown'}');
                `,
                    }}
                />
            </>
        )}
        </body>
        </html>
    )
}
