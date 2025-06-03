import { IUserRepository } from '@/domain/repositories/IUserRepository'
import { User } from '@/domain/entities/User'
import { AuthResponse, LoginCredentials } from '@/types/auth'
import { logAuditAction } from '@/infrastructure/database/supabaseClient'
import bcrypt from 'bcryptjs'

interface AuthenticateUserRequest {
    identifier: string // NIP or email
    password: string
    ipAddress?: string
    userAgent?: string
}

interface AuthenticateUserResponse extends AuthResponse<User> {
    user?: User
    requiresPasswordChange?: boolean
    lastLogin?: Date
}

export class AuthenticateUser {
    constructor(
        private userRepository: IUserRepository
    ) {}

    async execute(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
        try {
            // Validate input
            const validation = this.validateInput(request)
            if (!validation.isValid) {
                return {
                    success: false,
                    error: {
                        message: validation.message,
                        code: 'VALIDATION_ERROR'
                    }
                }
            }

            // Find user by identifier (email or NIP)
            const user = await this.findUserByIdentifier(request.identifier.trim())

            if (!user) {
                // Log failed attempt
                await this.logFailedAttempt(request, 'USER_NOT_FOUND')

                return {
                    success: false,
                    error: {
                        message: 'NIP atau email tidak ditemukan',
                        code: 'USER_NOT_FOUND'
                    }
                }
            }

            // Check if user account is active
            if (!user.isActive()) {
                await this.logFailedAttempt(request, 'ACCOUNT_INACTIVE', user.id)

                return {
                    success: false,
                    error: {
                        message: this.getInactiveAccountMessage(user.status),
                        code: 'ACCOUNT_INACTIVE'
                    }
                }
            }

            // Get user authentication data (including password hash)
            const authData = await this.userRepository.findForAuthentication(request.identifier.trim())

            if (!authData) {
                await this.logFailedAttempt(request, 'AUTH_DATA_NOT_FOUND', user.id)

                return {
                    success: false,
                    error: {
                        message: 'Data autentikasi tidak ditemukan',
                        code: 'AUTH_DATA_ERROR'
                    }
                }
            }

            // For OAuth users who might not have a password
            if (!authData.passwordHash) {
                await this.logFailedAttempt(request, 'NO_PASSWORD_SET', user.id)

                return {
                    success: false,
                    error: {
                        message: 'Akun ini menggunakan login OAuth. Silakan gunakan Google atau Azure AD untuk masuk.',
                        code: 'OAUTH_ONLY_ACCOUNT'
                    }
                }
            }

            // Verify password
            const isPasswordValid = await this.verifyPassword(request.password, authData.passwordHash)

            if (!isPasswordValid) {
                await this.logFailedAttempt(request, 'INVALID_PASSWORD', user.id)

                return {
                    success: false,
                    error: {
                        message: 'Password salah',
                        code: 'INVALID_PASSWORD'
                    }
                }
            }

            // Check if password change is required
            const requiresPasswordChange = await this.checkPasswordChangeRequired(user)

            // Update last login timestamp
            await this.userRepository.updateLastLogin(user.id)

            // Log successful authentication
            await this.logSuccessfulAttempt(request, user.id)

            return {
                success: true,
                user,
                requiresPasswordChange,
                lastLogin: user.lastLogin
            }

        } catch (error) {
            console.error('Authentication error:', error)

            // Log system error
            await logAuditAction({
                action: 'AUTHENTICATION_ERROR',
                tableName: 'users',
                newValues: {
                    identifier: request.identifier,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                },
                ipAddress: request.ipAddress,
                userAgent: request.userAgent
            })

            return {
                success: false,
                error: {
                    message: 'Terjadi kesalahan sistem. Silakan coba lagi.',
                    code: 'SYSTEM_ERROR'
                }
            }
        }
    }

    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================

    /**
     * Find user by identifier (email or NIP)
     */
    private async findUserByIdentifier(identifier: string): Promise<User | null> {
        try {
            // Determine if identifier is an email or NIP
            const isEmail = identifier.includes('@');

            // Use the appropriate repository method
            if (isEmail) {
                return await this.userRepository.findByEmail(identifier.toLowerCase());
            } else {
                return await this.userRepository.findByNip(identifier);
            }
        } catch (error) {
            console.error('Error finding user by identifier:', error);
            return null;
        }
    }

    private validateInput(request: AuthenticateUserRequest): { isValid: boolean; message: string } {
        if (!request.identifier || !request.identifier.trim()) {
            return {
                isValid: false,
                message: 'NIP atau email harus diisi'
            }
        }

        if (!request.password) {
            return {
                isValid: false,
                message: 'Password harus diisi'
            }
        }

        // Basic format validation
        const identifier = request.identifier.trim()

        // Check if it's email format
        const isEmail = identifier.includes('@')

        if (isEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(identifier)) {
                return {
                    isValid: false,
                    message: 'Format email tidak valid'
                }
            }
        } else {
            // Assume it's NIP - should be numeric
            const nipRegex = /^\d{10,20}$/
            if (!nipRegex.test(identifier)) {
                return {
                    isValid: false,
                    message: 'Format NIP tidak valid (harus 10-20 digit angka)'
                }
            }
        }

        if (request.password.length < 6) {
            return {
                isValid: false,
                message: 'Password minimal 6 karakter'
            }
        }

        return {
            isValid: true,
            message: ''
        }
    }

    private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, hashedPassword)
        } catch (error) {
            console.error('Password verification error:', error)
            return false
        }
    }

    private getInactiveAccountMessage(status: string): string {
        switch (status) {
            case 'inactive':
                return 'Akun Anda tidak aktif. Hubungi administrator untuk mengaktifkan akun.'
            case 'terminated':
                return 'Akun Anda telah dihentikan. Hubungi administrator untuk informasi lebih lanjut.'
            default:
                return 'Status akun tidak valid. Hubungi administrator.'
        }
    }

    private async checkPasswordChangeRequired(user: User): Promise<boolean> {
        try {
            // Check if user has never changed password (example logic)
            // You might have a separate field to track this

            // Check if password is older than X days (if you track password creation date)
            // const passwordAge = // calculate password age
            // if (passwordAge > MAX_PASSWORD_AGE_DAYS) return true

            // Check if it's user's first login
            if (!user.lastLogin) {
                return true // First time login, require password change
            }

            // Check if password change was forced by admin
            // This would require additional database field

            return false
        } catch (error) {
            console.error('Error checking password change requirement:', error)
            return false
        }
    }

    private async logFailedAttempt(
        request: AuthenticateUserRequest,
        reason: string,
        userId?: string
    ): Promise<void> {
        try {
            await logAuditAction({
                userId,
                action: 'LOGIN_FAILED',
                tableName: 'users',
                recordId: userId,
                newValues: {
                    identifier: request.identifier,
                    reason,
                    timestamp: new Date().toISOString()
                },
                ipAddress: request.ipAddress,
                userAgent: request.userAgent
            })
        } catch (error) {
            console.error('Error logging failed attempt:', error)
        }
    }

    private async logSuccessfulAttempt(
        request: AuthenticateUserRequest,
        userId: string
    ): Promise<void> {
        try {
            await logAuditAction({
                userId,
                action: 'LOGIN_SUCCESS',
                tableName: 'users',
                recordId: userId,
                newValues: {
                    identifier: request.identifier,
                    loginMethod: 'credentials',
                    timestamp: new Date().toISOString()
                },
                ipAddress: request.ipAddress,
                userAgent: request.userAgent
            })
        } catch (error) {
            console.error('Error logging successful attempt:', error)
        }
    }
}

// ============================================================================
// AUTHENTICATION UTILITIES
// ============================================================================

/**
 * Check if identifier is email or NIP
 */
export function getIdentifierType(identifier: string): 'email' | 'nip' | 'unknown' {
    const trimmed = identifier.trim()

    if (trimmed.includes('@')) {
        return 'email'
    }

    if (/^\d{10,20}$/.test(trimmed)) {
        return 'nip'
    }

    return 'unknown'
}

/**
 * Sanitize identifier for safe logging
 */
export function sanitizeIdentifier(identifier: string): string {
    const trimmed = identifier.trim()

    if (trimmed.includes('@')) {
        // For email, show first 2 chars + domain
        const [local, domain] = trimmed.split('@')
        return `${local.substring(0, 2)}***@${domain}`
    }

    // For NIP, show first 4 and last 2 digits
    if (trimmed.length >= 6) {
        const start = trimmed.substring(0, 4)
        const end = trimmed.substring(trimmed.length - 2)
        return `${start}***${end}`
    }

    return '***'
}

/**
 * Rate limiting helper (would integrate with Redis in production)
 */
export class AuthRateLimiter {
    private attempts: Map<string, { count: number; lastAttempt: Date }> = new Map()
    private readonly maxAttempts = 5
    private readonly windowMs = 15 * 60 * 1000 // 15 minutes

    isRateLimited(identifier: string, ipAddress?: string): boolean {
        const key = `${identifier}:${ipAddress || 'unknown'}`
        const attempt = this.attempts.get(key)

        if (!attempt) {
            return false
        }

        const now = new Date()
        const timeDiff = now.getTime() - attempt.lastAttempt.getTime()

        // Reset if window has passed
        if (timeDiff > this.windowMs) {
            this.attempts.delete(key)
            return false
        }

        return attempt.count >= this.maxAttempts
    }

    recordAttempt(identifier: string, ipAddress?: string): void {
        const key = `${identifier}:${ipAddress || 'unknown'}`
        const existing = this.attempts.get(key)

        if (existing) {
            const now = new Date()
            const timeDiff = now.getTime() - existing.lastAttempt.getTime()

            if (timeDiff > this.windowMs) {
                // Reset counter if window has passed
                this.attempts.set(key, { count: 1, lastAttempt: now })
            } else {
                // Increment counter
                this.attempts.set(key, {
                    count: existing.count + 1,
                    lastAttempt: now
                })
            }
        } else {
            this.attempts.set(key, { count: 1, lastAttempt: new Date() })
        }
    }

    getRemainingTime(identifier: string, ipAddress?: string): number {
        const key = `${identifier}:${ipAddress || 'unknown'}`
        const attempt = this.attempts.get(key)

        if (!attempt) {
            return 0
        }

        const now = new Date()
        const timeDiff = now.getTime() - attempt.lastAttempt.getTime()
        const remaining = this.windowMs - timeDiff

        return Math.max(0, Math.ceil(remaining / 1000)) // Return seconds
    }
}

// Global rate limiter instance
export const authRateLimiter = new AuthRateLimiter()
