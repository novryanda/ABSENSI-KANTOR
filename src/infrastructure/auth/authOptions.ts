import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import CredentialsProvider from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@next-auth/supabase-adapter"
import { UserRepository } from '@/infrastructure/database/repositories/UserRepository'
import { AuthenticateUser } from '@/use-cases/user/AuthenticateUser'
import { logAuditAction } from '@/infrastructure/database/supabaseClient'
import { UserStatus } from '@/types/auth'
import bcrypt from 'bcryptjs'

// Initialize repositories and use cases
const userRepository = new UserRepository()
const authenticateUser = new AuthenticateUser(userRepository)

export const authOptions: NextAuthOptions = {
    adapter: SupabaseAdapter({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    }),

    providers: [
        // Google OAuth Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),

        // Azure AD Provider (for government organizations)
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID!,
            authorization: {
                params: {
                    scope: "openid profile email User.Read"
                }
            }
        }),

        // Credentials Provider (NIP/Email + Password)
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                identifier: {
                    label: "NIP atau Email",
                    type: "text",
                    placeholder: "Masukkan NIP atau Email Anda"
                },
                password: {
                    label: "Password",
                    type: "password",
                    placeholder: "Masukkan Password Anda"
                }
            },
            async authorize(credentials, req) {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error("NIP/Email dan password harus diisi")
                }

                try {
                    // Use the authenticate use case
                    const result = await authenticateUser.execute({
                        identifier: credentials.identifier,
                        password: credentials.password,
                        ipAddress: req.headers?.['x-forwarded-for'] as string || 'unknown',
                        userAgent: req.headers?.['user-agent'] || 'unknown'
                    })

                    if (!result.success || !result.user) {
                        // Perbaiki agar pesan error lebih informatif
                        const errorMsg = typeof result.error === 'object' && result.error?.message
                            ? result.error.message
                            : (typeof result.error === 'string' ? result.error : 'Login gagal')
                        throw new Error(errorMsg)
                    }

                    const user = result.user

                    // Return user object for NextAuth
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        nip: user.nip,
                        role: user.role,
                        department: user.department,
                        status: user.status
                    }
                } catch (error) {
                    console.error("Authentication error:", error)

                    // Log failed login attempt
                    await logAuditAction({
                        action: 'LOGIN_FAILED',
                        tableName: 'users',
                        newValues: {
                            identifier: credentials.identifier,
                            error: error instanceof Error ? error.message : 'Unknown error',
                            timestamp: new Date().toISOString()
                        },
                        ipAddress: req.headers?.['x-forwarded-for'] as string,
                        userAgent: req.headers?.['user-agent']
                    })

                    throw error
                }
            }
        })
    ],

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },

    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            try {
                // For OAuth providers, check if user exists in our system
                if (account?.provider === "google" || account?.provider === "azure-ad") {
                    if (!user.email) {
                        console.log("OAuth user without email:", user)
                        return false
                    }

                    // Check if user exists in our database
                    const existingUser = await userRepository.findByEmail(user.email)

                    if (!existingUser) {
                        console.log("OAuth user not found in system:", user.email)
                        // Redirect to registration or contact admin page
                        return `/auth/error?error=UserNotFound&email=${encodeURIComponent(user.email)}`
                    }

                    if (existingUser.status !== 'active') {
                        console.log("Inactive OAuth user attempting login:", user.email)
                        return `/auth/error?error=AccountInactive`
                    }

                    // Update last login for OAuth users
                    await userRepository.updateLastLogin(existingUser.id)

                    // Log successful OAuth login
                    await logAuditAction({
                        userId: existingUser.id,
                        action: 'OAUTH_LOGIN_SUCCESS',
                        tableName: 'users',
                        recordId: existingUser.id,
                        newValues: {
                            provider: account.provider,
                            timestamp: new Date().toISOString()
                        }
                    })
                }

                return true
            } catch (error) {
                console.error("SignIn callback error:", error)
                return false
            }
        },

        async jwt({ token, user, account, profile, trigger, session }) {
            // Initial sign in
            if (user) {
                try {
                    // Fetch fresh user data from database
                    const dbUser = await userRepository.findByEmail(user.email!)

                    if (dbUser) {
                        token.id = dbUser.id
                        token.nip = dbUser.nip
                        token.role = dbUser.role ? {
                            id: dbUser.role.id,
                            name: dbUser.role.name,
                            permissions: dbUser.role.permissions as any
                        } : null
                        token.department = dbUser.department ? {
                            id: dbUser.department.id,
                            name: dbUser.department.name,
                            code: dbUser.department.code
                        } : null
                        token.status = dbUser.status
                    }
                } catch (error) {
                    console.error("JWT callback error:", error)
                }
            }

            // Handle session updates (when session is updated on client)
            if (trigger === "update" && session) {
                // Refresh user data from database
                try {
                    const dbUser = await userRepository.findById(token.id as string)
                    if (dbUser) {
                        token.name = dbUser.name
                        token.email = dbUser.email
                        token.picture = dbUser.image
                        token.nip = dbUser.nip
                        token.role = dbUser.role ? {
                            id: dbUser.role.id,
                            name: dbUser.role.name,
                            permissions: dbUser.role.permissions as any
                        } : null
                        token.department = dbUser.department ? {
                            id: dbUser.department.id,
                            name: dbUser.department.name,
                            code: dbUser.department.code
                        } : null
                        token.status = dbUser.status
                    }
                } catch (error) {
                    console.error("JWT update error:", error)
                }
            }

            return token
        },

        async session({ session, token }) {
            // Include additional data in session
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.nip = token.nip as string
                session.user.role = token.role as any
                session.user.department = token.department as any
                session.user.status = token.status as UserStatus
            }

            return session
        },

        async redirect({ url, baseUrl }) {
            // Handle redirects after authentication
            try {
                // If the URL is relative, make it absolute
                if (url.startsWith("/")) {
                    return `${baseUrl}${url}`
                }

                // If the URL is absolute and same origin, allow it
                const urlObj = new URL(url)
                const baseUrlObj = new URL(baseUrl)

                if (urlObj.origin === baseUrlObj.origin) {
                    return url
                }

                // Default redirect to dashboard
                return `${baseUrl}/dashboard`
            } catch (error) {
                console.error("Redirect callback error:", error)
                return `${baseUrl}/dashboard`
            }
        }
    },

    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
        signOut: "/auth/signout",
        verifyRequest: "/auth/verify-request"
    },

    events: {
        async signIn({ user, account, profile, isNewUser }) {
            try {
                // Log successful sign in
                await logAuditAction({
                    userId: user.id,
                    action: 'SIGN_IN_SUCCESS',
                    tableName: 'users',
                    recordId: user.id,
                    newValues: {
                        provider: account?.provider || 'credentials',
                        isNewUser: isNewUser || false,
                        timestamp: new Date().toISOString()
                    }
                })

                // Update last login
                if (user.id) {
                    await userRepository.updateLastLogin(user.id)
                }
            } catch (error) {
                console.error("SignIn event error:", error)
            }
        },

        async signOut({ session, token }) {
            try {
                // Log sign out
                const userId = session?.user?.id || token?.id as string

                if (userId) {
                    await logAuditAction({
                        userId,
                        action: 'SIGN_OUT',
                        tableName: 'users',
                        recordId: userId,
                        newValues: {
                            timestamp: new Date().toISOString()
                        }
                    })
                }
            } catch (error) {
                console.error("SignOut event error:", error)
            }
        },

        async createUser({ user }) {
            try {
                // This event is called when a new user is created via OAuth
                console.log("New user created via OAuth:", user.email)

                await logAuditAction({
                    userId: user.id,
                    action: 'CREATE_USER_OAUTH',
                    tableName: 'users',
                    recordId: user.id,
                    newValues: {
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        timestamp: new Date().toISOString()
                    }
                })
            } catch (error) {
                console.error("CreateUser event error:", error)
            }
        },

        async updateUser({ user }) {
            try {
                // This event is called when user data is updated
                await logAuditAction({
                    userId: user.id,
                    action: 'UPDATE_USER_OAUTH',
                    tableName: 'users',
                    recordId: user.id,
                    newValues: {
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        timestamp: new Date().toISOString()
                    }
                })
            } catch (error) {
                console.error("UpdateUser event error:", error)
            }
        },

        async linkAccount({ user, account, profile }) {
            try {
                // This event is called when an account is linked to a user
                await logAuditAction({
                    userId: user.id,
                    action: 'LINK_ACCOUNT',
                    tableName: 'accounts',
                    recordId: account.providerAccountId,
                    newValues: {
                        provider: account.provider,
                        type: account.type,
                        userId: user.id,
                        timestamp: new Date().toISOString()
                    }
                })
            } catch (error) {
                console.error("LinkAccount event error:", error)
            }
        }
    },

    // Enable debug in development
    debug: process.env.NODE_ENV === "development",

    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === "production",

    // Custom logger
    logger: {
        error(code, metadata) {
            console.error(`NextAuth Error [${code}]:`, metadata)
        },
        warn(code) {
            console.warn(`NextAuth Warning [${code}]`)
        },
        debug(code, metadata) {
            if (process.env.NODE_ENV === "development") {
                console.debug(`NextAuth Debug [${code}]:`, metadata)
            }
        }
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Hash password for storage
 */
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
}

/**
 * Generate secure random password
 */
export function generatePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let result = ''

    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    return result
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
    isValid: boolean
    score: number
    feedback: string[]
} {
    const feedback: string[] = []
    let score = 0

    // Length check
    if (password.length >= 8) {
        score += 1
    } else {
        feedback.push('Password harus minimal 8 karakter')
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
        score += 1
    } else {
        feedback.push('Password harus mengandung huruf besar')
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
        score += 1
    } else {
        feedback.push('Password harus mengandung huruf kecil')
    }

    // Number check
    if (/\d/.test(password)) {
        score += 1
    } else {
        feedback.push('Password harus mengandung angka')
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 1
    } else {
        feedback.push('Password harus mengandung karakter khusus')
    }

    return {
        isValid: score >= 4,
        score,
        feedback
    }
}

