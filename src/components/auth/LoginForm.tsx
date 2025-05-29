'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { LoginCredentials, getIdentifierType } from '@/types/auth'

// Validation schema
const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, 'NIP atau Email harus diisi')
        .refine((val) => {
            const type = getIdentifierType(val)
            return type !== 'unknown'
        }, 'Format NIP atau Email tidak valid'),
    password: z
        .string()
        .min(6, 'Password minimal 6 karakter'),
    remember: z.boolean().optional()
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
    onSuccess?: () => void
    className?: string
}

export default function LoginForm({ onSuccess, className = '' }: LoginFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
    const error = searchParams.get('error')

    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identifier: '',
            password: '',
            remember: false
        }
    })

    const identifier = watch('identifier')

    // Handle form submission
    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        setAuthError(null)

        try {
            const result = await signIn('credentials', {
                identifier: data.identifier.trim(),
                password: data.password,
                redirect: false
            })

            if (result?.error) {
                setAuthError(getErrorMessage(result.error))
            } else if (result?.ok) {
                // Get updated session
                await getSession()

                // Call success callback
                onSuccess?.()

                // Redirect to callback URL
                router.push(callbackUrl)
                router.refresh()
            }
        } catch (error) {
            console.error('Login error:', error)
            setAuthError('Terjadi kesalahan sistem. Silakan coba lagi.')
        } finally {
            setIsLoading(false)
        }
    }

    // Handle OAuth login
    const handleOAuthLogin = async (provider: 'google' | 'azure-ad') => {
        setIsLoading(true)
        setAuthError(null)

        try {
            await signIn(provider, { callbackUrl })
        } catch (error) {
            console.error('OAuth login error:', error)
            setAuthError('Terjadi kesalahan saat login dengan OAuth')
            setIsLoading(false)
        }
    }

    // Get error message from error code
    const getErrorMessage = (errorCode: string): string => {
        const errorMessages: Record<string, string> = {
            'CredentialsSignin': 'NIP/Email atau password salah',
            'USER_NOT_FOUND': 'NIP atau email tidak ditemukan',
            'INVALID_PASSWORD': 'Password salah',
            'ACCOUNT_INACTIVE': 'Akun tidak aktif. Hubungi administrator.',
            'OAUTH_ONLY_ACCOUNT': 'Akun ini menggunakan OAuth. Silakan login dengan Google/Azure AD.',
            'VALIDATION_ERROR': 'Data yang dimasukkan tidak valid',
            'SYSTEM_ERROR': 'Terjadi kesalahan sistem. Silakan coba lagi.',
            'UserNotFound': 'Akun tidak ditemukan di sistem. Hubungi administrator.',
            'AccountInactive': 'Akun tidak aktif. Hubungi administrator.',
            'AccessDenied': 'Akses ditolak. Anda tidak memiliki izin untuk masuk.',
            'Verification': 'Email belum diverifikasi. Periksa inbox Anda.',
            'Default': 'Terjadi kesalahan. Silakan coba lagi.'
        }

        return errorMessages[errorCode] || errorMessages['Default']
    }

    // Auto-detect identifier type and show helper text
    const getIdentifierHelperText = () => {
        if (!identifier) return 'Masukkan NIP (10-20 digit) atau alamat email'

        const type = getIdentifierType(identifier)

        switch (type) {
            case 'email':
                return 'Format email terdeteksi'
            case 'nip':
                return 'Format NIP terdeteksi'
            case 'unknown':
                return 'Format tidak valid. Gunakan NIP (10-20 digit) atau email'
            default:
                return ''
        }
    }

    return (
        <div className={`w-full max-w-md mx-auto ${className}`}>
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Masuk ke Sistem
                </h1>
                <p className="text-gray-600">
                    Masukkan NIP atau email dan password Anda
                </p>
            </div>

            {/* Error display */}
            {(authError || error) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-800">
                                {authError || getErrorMessage(error || '')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Identifier Field */}
                <div>
                    <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                        NIP atau Email
                    </label>
                    <input
                        {...register('identifier')}
                        type="text"
                        id="identifier"
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.identifier ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Contoh: 199001010001 atau admin@kantor.gov.id"
                        disabled={isLoading}
                    />
                    {identifier && (
                        <p className={`mt-1 text-xs ${
                            getIdentifierType(identifier) === 'unknown' ? 'text-red-600' : 'text-green-600'
                        }`}>
                            {getIdentifierHelperText()}
                        </p>
                    )}
                    {errors.identifier && (
                        <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
                    )}
                </div>

                {/* Password Field */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            {...register('password')}
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            className={`w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.password ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Masukkan password Anda"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                        >
                            {showPassword ? (
                                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                                <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            {...register('remember')}
                            type="checkbox"
                            id="remember"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={isLoading}
                        />
                        <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                            Ingat saya
                        </label>
                    </div>

                    <div className="text-sm">
                        <a
                            href="/auth/forgot-password"
                            className="font-medium text-blue-600 hover:text-blue-500"
                        >
                            Lupa password?
                        </a>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memproses...
                        </div>
                    ) : (
                        'Masuk'
                    )}
                </button>
            </form>

            {/* Divider */}
            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Atau masuk dengan</span>
                    </div>
                </div>
            </div>

            {/* OAuth Providers */}
            <div className="mt-6 space-y-3">
                {/* Google Login */}
                <button
                    type="button"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={isLoading}
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                </button>

                {/* Azure AD Login */}
                <button
                    type="button"
                    onClick={() => handleOAuthLogin('azure-ad')}
                    disabled={isLoading}
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#00A4EF" d="M11.4 24H0V12.6h11.4V24z"/>
                        <path fill="#FFB900" d="M24 24H12.6V12.6H24V24z"/>
                        <path fill="#F25022" d="M11.4 11.4H0V0h11.4v11.4z"/>
                        <path fill="#00A4EF" d="M24 11.4H12.6V0H24v11.4z"/>
                    </svg>
                    Microsoft Azure AD
                </button>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Belum punya akun?{' '}
                    <a href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                        Hubungi administrator
                    </a>
                </p>
            </div>

            {/* Help Text */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                    Mengalami masalah login? Hubungi IT Support di{' '}
                    <a href="mailto:support@kantor.gov.id" className="text-blue-600 hover:text-blue-500">
                        support@kantor.gov.id
                    </a>
                </p>
            </div>
        </div>
    )
}
