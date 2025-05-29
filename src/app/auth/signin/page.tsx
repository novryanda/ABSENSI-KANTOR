import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/infrastructure/auth/authOptions'
import LoginForm from '@/components/auth/LoginForm'
import { GuestGuard } from '@/components/auth/AuthGuard'

export const metadata: Metadata = {
    title: 'Masuk - Sistem Absensi',
    description: 'Masuk ke sistem absensi kantor pemerintahan',
    robots: 'noindex, nofollow'
}

export default async function SignInPage() {
    // Check if user is already authenticated (server-side)
    const session = await getServerSession(authOptions)

    if (session) {
        // Redirect based on user role
        const userRole = session.user?.role?.name
        const redirectUrl = getDefaultRedirectForRole(userRole)
        redirect(redirectUrl)
    }

    return (
        <GuestGuard>
            <div className="min-h-screen flex flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
            {/* Background decoration */}
            <div className="absolute inset-0">
    <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-bl from-blue-50 to-cyan-100"></div>
        </div>

    {/* Content */}
    <div className="relative">
        {/* Header */}
        <div className="text-center mb-8">
    <div className="flex justify-center mb-6">
        {/* Logo placeholder - replace with actual logo */}
        <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Sistem Absensi
    </h1>
    <p className="text-gray-600">
        Kantor Pemerintahan
    </p>
    </div>

    {/* Login Form */}
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
    <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
        <LoginForm />
        </div>
        </div>

    {/* Additional Information */}
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex">
    <div className="flex-shrink-0">
    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        </div>
        <div className="ml-3">
    <h3 className="text-sm font-medium text-blue-800">
        Informasi Login
    </h3>
    <div className="mt-2 text-sm text-blue-700">
    <ul className="list-disc pl-5 space-y-1">
        <li>Gunakan NIP atau email yang terdaftar</li>
    <li>Password minimal 6 karakter</li>
    <li>Atau login menggunakan Google/Azure AD</li>
    </ul>
    </div>
    </div>
    </div>
    </div>
    </div>

    {/* Demo Accounts (Development Only) */}
    {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
        <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        </div>
        <div className="ml-3">
    <h3 className="text-sm font-medium text-yellow-800">
        Demo Accounts (Development)
    </h3>
    <div className="mt-2 text-xs text-yellow-700 space-y-2">
        <div>
            <strong>Super Admin:</strong><br />
    NIP: 199001010001<br />
    Password: password123
    </div>
    <div>
    <strong>HR Admin:</strong><br />
    NIP: 199002020002<br />
    Password: password123
    </div>
    <div>
    <strong>Pegawai:</strong><br />
    NIP: 199001001<br />
    Password: password123
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
    )}

    {/* Footer */}
    <div className="mt-8 text-center">
    <p className="text-xs text-gray-500">
              © 2024 Kantor Pemerintahan. Semua hak dilindungi.
    </p>
    <div className="mt-2 space-x-4">
    <a href="/privacy" className="text-xs text-gray-500 hover:text-gray-700">
        Kebijakan Privasi
    </a>
    <a href="/terms" className="text-xs text-gray-500 hover:text-gray-700">
        Syarat & Ketentuan
        </a>
        <a href="/help" className="text-xs text-gray-500 hover:text-gray-700">
        Bantuan
        </a>
        </div>
        </div>
        </div>
        </div>
        </GuestGuard>
)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDefaultRedirectForRole(role?: string): string {
    switch (role) {
        case 'Super Admin':
        case 'Admin':
            return '/admin'
        case 'Atasan':
            return '/approvals'
        case 'Pegawai':
        default:
            return '/dashboard'
    }
}