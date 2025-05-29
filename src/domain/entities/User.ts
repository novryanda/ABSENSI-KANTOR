import { Tables, Enums } from '@/types/database.types'
import { RolePermissions } from '@/types/auth'

export class User {
    public readonly id: string
    public readonly nip?: string | null
    public readonly name?: string | null
    public readonly email: string
    public readonly emailVerified?: Date | null
    public readonly image?: string | null
    public readonly phone?: string | null
    public readonly birthDate?: Date | null
    public readonly gender?: Enums<'gender'> | null
    public readonly address?: string | null
    public readonly hireDate?: Date | null
    public readonly status: Enums<'user_status'>
    public readonly departmentId?: string | null
    public readonly roleId?: string | null
    public readonly latitude?: number | null
    public readonly longitude?: number | null
    public readonly createdAt: Date
    public readonly updatedAt: Date
    public readonly lastLogin?: Date | null

    // Related entities
    public readonly role?: Tables<'roles'> | null
    public readonly department?: Tables<'departments'> | null

    constructor(data: Tables<'users'> & {
        role?: Tables<'roles'> | null
        department?: Tables<'departments'> | null
    }) {
        // Validate required fields
        if (!data.id) throw new Error('User ID is required')
        if (!data.email) throw new Error('User email is required')

        this.id = data.id
        this.nip = data.nip
        this.name = data.name
        this.email = data.email
        this.emailVerified = data.email_verified ? new Date(data.email_verified) : null
        this.image = data.image
        this.phone = data.phone
        this.birthDate = data.birth_date ? new Date(data.birth_date) : null
        this.gender = data.gender
        this.address = data.address
        this.hireDate = data.hire_date ? new Date(data.hire_date) : null
        this.status = data.status
        this.departmentId = data.department_id
        this.roleId = data.role_id
        this.latitude = data.latitude
        this.longitude = data.longitude
        this.createdAt = new Date(data.created_at)
        this.updatedAt = new Date(data.updated_at)
        this.lastLogin = data.last_login ? new Date(data.last_login) : null

        this.role = data.role
        this.department = data.department
    }

    // ============================================================================
    // BUSINESS METHODS
    // ============================================================================

    /**
     * Check if user is active
     */
    isActive(): boolean {
        return this.status === 'active'
    }

    /**
     * Check if user is new (hired within last 90 days)
     */
    isNewEmployee(): boolean {
        if (!this.hireDate) return false

        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        return this.hireDate > ninetyDaysAgo
    }

    /**
     * Get user's full display name
     */
    getDisplayName(): string {
        return this.name || this.email.split('@')[0] || 'Unknown User'
    }

    /**
     * Get user's initials for avatar
     */
    getInitials(): string {
        if (this.name) {
            return this.name
                .split(' ')
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2)
        }
        return this.email.charAt(0).toUpperCase()
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(resource: string, action: string): boolean {
        if (!this.role?.permissions) return false

        const permissions = this.role.permissions as RolePermissions

        // Super admin has all permissions
        if (permissions.all === true) return true

        // Check specific resource permission
        const resourcePermissions = permissions[resource as keyof RolePermissions] as string[] | undefined

        return resourcePermissions?.includes(action) || false
    }

    /**
     * Check if user can approve for specific department
     */
    canApproveForDepartment(departmentId: string): boolean {
        if (!this.hasPermission('approvals', 'approve')) return false

        // Can approve for own department or if super admin
        return this.departmentId === departmentId || this.hasPermission('all', 'true')
    }

    /**
     * Get user age
     */
    getAge(): number | null {
        if (!this.birthDate) return null

        const today = new Date()
        const age = today.getFullYear() - this.birthDate.getFullYear()
        const monthDiff = today.getMonth() - this.birthDate.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthDate.getDate())) {
            return age - 1
        }

        return age
    }

    /**
     * Get work experience in years
     */
    getWorkExperience(): number | null {
        if (!this.hireDate) return null

        const today = new Date()
        const years = today.getFullYear() - this.hireDate.getFullYear()
        const monthDiff = today.getMonth() - this.hireDate.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.hireDate.getDate())) {
            return years - 1
        }

        return years
    }

    /**
     * Check if user profile is complete
     */
    isProfileComplete(): boolean {
        return !!(
            this.name &&
            this.phone &&
            this.birthDate &&
            this.gender &&
            this.address &&
            this.departmentId &&
            this.roleId
        )
    }

    /**
     * Get profile completion percentage
     */
    getProfileCompletionPercentage(): number {
        const fields = [
            this.name,
            this.phone,
            this.birthDate,
            this.gender,
            this.address,
            this.departmentId,
            this.roleId,
            this.image
        ]

        const completedFields = fields.filter(field => field !== null && field !== undefined).length
        return Math.round((completedFields / fields.length) * 100)
    }

    /**
     * Convert to database format for updates
     */
    toUpdateData(): Partial<Tables<'users'>['Update']> {
        return {
            name: this.name,
            phone: this.phone,
            birth_date: this.birthDate?.toISOString().split('T')[0],
            gender: this.gender,
            address: this.address,
            department_id: this.departmentId,
            role_id: this.roleId,
            image: this.image,
            latitude: this.latitude,
            longitude: this.longitude,
            status: this.status,
            updated_at: new Date().toISOString()
        }
    }

    /**
     * Convert to JSON for API responses
     */
    toJSON() {
        return {
            id: this.id,
            nip: this.nip,
            name: this.name,
            email: this.email,
            emailVerified: this.emailVerified?.toISOString(),
            image: this.image,
            phone: this.phone,
            birthDate: this.birthDate?.toISOString().split('T')[0],
            gender: this.gender,
            address: this.address,
            hireDate: this.hireDate?.toISOString().split('T')[0],
            status: this.status,
            departmentId: this.departmentId,
            roleId: this.roleId,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            lastLogin: this.lastLogin?.toISOString(),
            role: this.role,
            department: this.department,

            // Computed properties
            displayName: this.getDisplayName(),
            initials: this.getInitials(),
            age: this.getAge(),
            workExperience: this.getWorkExperience(),
            isActive: this.isActive(),
            isNewEmployee: this.isNewEmployee(),
            profileCompletionPercentage: this.getProfileCompletionPercentage(),
            isProfileComplete: this.isProfileComplete()
        }
    }

    /**
     * Create User instance from database row
     */
    static fromDatabase(data: Tables<'users'> & {
        role?: Tables<'roles'> | null
        department?: Tables<'departments'> | null
    }): User {
        return new User(data)
    }

    /**
     * Validate user data before creation
     */
    static validate(data: Partial<Tables<'users'>['Insert']>): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (!data.email) {
            errors.push('Email is required')
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Email format is invalid')
        }

        if (data.nip && !/^\d{10,20}$/.test(data.nip)) {
            errors.push('NIP must be 10-20 digits')
        }

        if (data.phone && !/^(\+62|62|0)[0-9]{8,13}$/.test(data.phone)) {
            errors.push('Phone number format is invalid')
        }

        if (data.birth_date) {
            const birthDate = new Date(data.birth_date)
            const minAge = new Date()
            minAge.setFullYear(minAge.getFullYear() - 17) // Minimum 17 years old

            if (birthDate > minAge) {
                errors.push('User must be at least 17 years old')
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }
}