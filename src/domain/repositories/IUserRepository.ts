import { User } from '@/domain/entities/User'
import { Tables } from '@/types/database.types'
import { RegisterData, UpdateProfileData } from '@/types/auth'

export interface IUserRepository {

    /**
     * Find user by ID with related data
     */
    findById(id: string): Promise<User | null>

    /**
     * Find user by email
     */
    findByEmail(email: string): Promise<User | null>

    /**
     * Find user by NIP
     */
    findByNip(nip: string): Promise<User | null>

    /**
     * Create new user
     */
    create(data: RegisterData): Promise<User>

    /**
     * Update user profile
     */
    update(id: string, data: UpdateProfileData): Promise<User>

    /**
     * Update user status
     */
    updateStatus(id: string, status: Tables<'users'>['status']): Promise<User>

    /**
     * Update last login timestamp
     */
    updateLastLogin(id: string): Promise<void>

    /**
     * Delete user (soft delete by changing status)
     */
    delete(id: string): Promise<void>

    // ============================================================================
    // QUERY OPERATIONS
    // ============================================================================

    /**
     * Get all users with pagination
     */
    findAll(options?: {
        page?: number
        limit?: number
        search?: string
        departmentId?: string
        roleId?: string
        status?: Tables<'users'>['status']
        sortBy?: 'name' | 'email' | 'created_at' | 'last_login'
        sortOrder?: 'asc' | 'desc'
    }): Promise<{
        users: User[]
        total: number
        totalPages: number
        currentPage: number
    }>

    /**
     * Get users by department
     */
    findByDepartment(departmentId: string): Promise<User[]>

    /**
     * Get users by role
     */
    findByRole(roleId: string): Promise<User[]>

    /**
     * Get team members for a manager
     */
    findTeamMembers(managerId: string): Promise<User[]>

    /**
     * Get users who can approve for specific department
     */
    findApproversForDepartment(departmentId: string): Promise<User[]>

    /**
     * Search users by name, email, or NIP
     */
    search(query: string, limit?: number): Promise<User[]>

    // ============================================================================
    // AUTHENTICATION RELATED
    // ============================================================================

    /**
     * Find user for authentication (with password hash)
     */
    findForAuthentication(identifier: string): Promise<{
        user: User
        passwordHash?: string
    } | null>

    /**
     * Update user password
     */
    updatePassword(id: string, passwordHash: string): Promise<void>

    /**
     * Verify email
     */
    verifyEmail(id: string): Promise<void>

    // ============================================================================
    // STATISTICS & ANALYTICS
    // ============================================================================

    /**
     * Get user statistics
     */
    getStatistics(): Promise<{
        total: number
        active: number
        inactive: number
        byDepartment: Record<string, number>
        byRole: Record<string, number>
        newThisMonth: number
    }>

    /**
     * Get users with incomplete profiles
     */
    findIncompleteProfiles(): Promise<User[]>

    /**
     * Get recently joined users
     */
    findRecentlyJoined(days?: number): Promise<User[]>

    /**
     * Get users by hire date range
     */
    findByHireDateRange(startDate: Date, endDate: Date): Promise<User[]>

    // ============================================================================
    // BULK OPERATIONS
    // ============================================================================

    /**
     * Bulk update user status
     */
    bulkUpdateStatus(userIds: string[], status: Tables<'users'>['status']): Promise<void>

    /**
     * Bulk delete users
     */
    bulkDelete(userIds: string[]): Promise<void>

    /**
     * Import users from CSV data
     */
    bulkImport(users: RegisterData[]): Promise<{
        success: User[]
        errors: Array<{ data: RegisterData; error: string }>
    }>

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Check if email already exists
     */
    emailExists(email: string, excludeId?: string): Promise<boolean>

    /**
     * Check if NIP already exists
     */
    nipExists(nip: string, excludeId?: string): Promise<boolean>

    /**
     * Get next available NIP
     */
    generateNextNip(): Promise<string>

    /**
     * Count users in department
     */
    countByDepartment(departmentId: string): Promise<number>

    /**
     * Count users with role
     */
    countByRole(roleId: string): Promise<number>
}