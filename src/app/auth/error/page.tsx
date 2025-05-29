// ============================================================================
// AUTH ERROR PAGE
// src/app/auth/error/page.tsx
// ============================================================================

'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface AuthErrorInfo {
    title: string
    message: string
    description?: string
    actionText: string
    actionHref: string
    type: 'error' | 'warning' | 'info'
    showSupport: boolean
}

export default function AuthErrorPage() {
    const searchParams = useSearchParams()
    const [errorInfo, setErrorInfo] = useState<AuthErrorInfo | null>(null)

    useEffect(() => {
        const error = searchParams.get('error')
        const email = searchParams.get('email')
        const message = searchParams.get('message')

        setErrorInfo(getErrorInfo(error, { email, message }))
    }, [searchParams])

    const getErrorInfo = (
        errorCode: string | null,
        params: { email?: string | null; message?: string | null }
    ): AuthErrorInfo => {
        switch (errorCode) {
            case 'Configuration':
                return {
                    title: 'Kesalahan Konfigurasi',
                    message: 'Terjadi kesalahan konfigurasi sistem.',
                    description: 'Sistem authentication belum dikonfigurasi dengan benar. Hubungi administrator sistem.',
                    actionText: 'Kembali ke Beranda',
                    actionHref: '/',
                    type: 'error',
                    showSupport: true
                }

            case 'AccessDenied':
                return {
                    title: 'Akses Ditolak',
                    message: 'Anda tidak memiliki izin untuk mengakses sistem.',
                    description: 'Akun Anda mungkin belum diaktivasi atau tidak memiliki hak akses yang diperlukan.',
                    actionText: 'Coba Login Lagi',
                    actionHref: '/auth/signin',
                    type: 'error',
                    showSupport: true
                }

            case 'Verification':
                return {
                    title: 'Email Belum Diverifikasi',
                    message: 'Silakan verifikasi email Anda terlebih dahulu.',
                    description: 'Kami telah mengirimkan link verifikasi ke email Anda. Periksa inbox dan folder spam.',
                    actionText: 'Kembali ke Login',
                    actionHref: '/auth/signin',
                    type: 'warning',
                    showSupport: false
                }

            case 'UserNotFound':
                return {
                    title: 'Akun Tidak Ditemukan',
                    message: params.email
                        ? `Akun dengan email ${params.email} tidak ditemukan di sistem.`
                        : 'Akun Anda tidak ditemukan di sistem.',
                    description: 'Kemungkinan akun Anda belum didaftarkan oleh administrator atau menggunakan provider OAuth yang salah.',
                    actionText: 'Coba Login Lagi',
                    actionHref: '/auth/signin',
                    type: 'error',
                    showSupport: true
                }

            case 'AccountInactive':
                return {
                    title: 'Akun Tidak Aktif',
                    message: 'Akun Anda saat ini tidak aktif.',
                    description: 'Akun Anda mungkin telah dinonaktifkan atau ditangguhkan. Hubungi administrator untuk mengaktifkan kembali.',
                    actionText: 'Kembali ke Login',
                    actionHref: '/auth/signin',
                    type: 'warning',
                    showSupport: true
                }

            case 'OAuthSignin':
            case 'OAuthCallback':
            case 'OAuthCreateAccount':
            case 'EmailCreateAccount':
            case 'Callback':
                return {
                    title: 'Kesalahan OAuth',
                    message: 'Terjadi kesalahan saat login dengan provider OAuth.',
                    description: 'Kemungkinan provider OAuth (Google/Azure AD) mengalami masalah atau konfigurasi tidak tepat.',
                    actionText: 'Coba Lagi',
                    actionHref: '/auth/signin',
                    type: 'error',
                    showSupport: true
                }

            case 'OAuthAccountNotLinked':
                return {
                    title: 'Akun OAuth Tidak Terhubung',
                    message: 'Akun OAuth Anda belum terhubung dengan akun sistem.',
                    description: 'Email yang digunakan di provider OAuth harus sama dengan email yang terdaftar di sistem.',
                    actionText: 'Login dengan Credentials',
                    actionHref: '/auth/signin',
                    type: 'info',
                    showSupport: true
                }

            case 'EmailSignin':
                return {
                    title: 'Kesalahan Email Login',
                    message: 'Tidak dapat mengirim email login.',
                    description: 'Terjadi masalah saat mengirim email login. Periksa alamat email atau coba metode login lain.',
                    actionText: 'Coba Login Lagi',
                    actionHref: '/auth/signin',
                    type: 'error',
                    showSupport: true
                }

            case 'CredentialsSignin':
                return {
                    title: 'Login Gagal',
                    message: 'NIP/Email atau password yang Anda masukkan salah.',
                    description: 'Periksa kembali NIP/Email dan password Anda. Pastikan Caps Lock tidak aktif.',
                    actionText: 'Coba Login Lagi',
                    actionHref: '/auth/signin',
                    type: 'error',
                    showSupport: false
                }

            case 'SessionRequired':
                return {
                    title: 'Sesi Diperlukan',
                    message: 'Anda harus login untuk mengakses halaman ini.',
                    description: 'Sesi login Anda mungkin telah berakhir atau belum login.',
                    actionText: 'Login Sekarang',
                    actionHref: '/auth/signin',
                    type: 'info',
                    showSupport: false
                }

            case 'Unauthorized':
                return {
                    title: 'Tidak Memiliki Akses',
                    message: params.message || 'Anda tidak memiliki akses ke halaman yang diminta.',
                    description: 'Role atau permission Anda tidak mencukupi untuk mengakses resource ini.',
                    actionText: 'Kembali ke Dashboard',
                    actionHref: '/dashboard',
                    type: 'warning',
                    showSupport: false
                }

            default:
                return {
                    title: 'Terjadi Kesalahan',
                    message: params.message || 'Terjadi kesalahan yang tidak diketahui.',
                    description: 'Mohon coba lagi atau hubungi administrator jika masalah berlanjut.',
                    actionText: 'Coba Lagi',
                    actionHref: '/auth/signin',
                    type: 'error',
                    showSupport: true
                }
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400" />
            case 'info':
                return <InformationCircleIcon className="h-12 w-12 text-blue-400" />
            default:
                return <ExclamationTriangleIcon className="h-12 w-12 text-red-400" />
        }
    }

    const getBackgroundColor = (type: string) => {
        switch (type) {
            case 'warning':
                return 'bg-yellow-50 border-yellow-200'
            case 'info':
                return 'bg-blue-50 border-blue-200'
            default:
                return 'bg-red-50 border-red-200'
        }
    }

    if (!errorInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Logo/Header */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Sistem Absensi
                    </h1>
                    <p className="text-gray-600">
                        Kantor Pemerintahan
                    </p>
                </div>

                {/* Error Content */}
                <div className={`rounded-lg border p-6 ${getBackgroundColor(errorInfo.type)}`}>
                    <div className="flex flex-col items-center text-center space-y-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                            {getIcon(errorInfo.type)}
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-semibold text-gray-900">
                            {errorInfo.title}
                        </h2>

                        {/* Message */}
                        <p className="text-gray-700 font-medium">
                            {errorInfo.message}
                        </p>

                        {/* Description */}
                        {errorInfo.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {errorInfo.description}
                            </p>
                        )}

                        {/* Action Button */}
                        <div className="pt-2">
                            <Link
                                href={errorInfo.actionHref}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {errorInfo.actionText}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Support Information */}
                {errorInfo.showSupport && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                            Butuh Bantuan?
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>
                                Email: <a href="mailto:support@kantor.gov.id" className="text-blue-600 hover:text-blue-500">support@kantor.gov.id</a>
                            </p>
                            <p>
                                Telepon: <a href="tel:+6221123456" className="text-blue-600 hover:text-blue-500">(021) 123-456</a>
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Jam kerja: Senin - Jumat, 08:00 - 17:00 WIB
                            </p>
                        </div>
                    </div>
                )}

                {/* Additional Links */}
                <div className="text-center space-y-2">
                    <Link
                        href="/"
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        ← Kembali ke Beranda
                    </Link>

                    {errorInfo.type !== 'info' && (
                        <div>
                            <Link
                                href="/auth/signin"
                                className="text-sm text-blue-600 hover:text-blue-500"
                            >
                                Coba Login Lagi
                            </Link>
                        </div>
                    )}
                </div>

                {/* Debug Info (Development Only) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-gray-100 rounded-lg p-4 text-xs">
                        <h4 className="font-medium text-gray-900 mb-2">Debug Info:</h4>
                        <pre className="text-gray-600 whitespace-pre-wrap">
              {JSON.stringify({
                  error: searchParams.get('error'),
                  email: searchParams.get('email'),
                  message: searchParams.get('message'),
                  timestamp: new Date().toISOString()
              }, null, 2)}
            </pre>
                    </div>
                )}
            </div>
        </div>
    )
}