import { IUserRepository } from '@/domain/repositories/IUserRepository'
import { User } from '@/domain/entities/User'
import { supabaseAdmin, logAuditAction } from '../supabaseClient'
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { RegisterData, UpdateProfileData } from '@/types/auth'
import bcrypt from 'bcryptjs'

export class UserRepository implements IUserRepository {
    // ============================================================================
    // BASIC CRUD OPERATIONS
    // ============================================================================

    async findById(id: string): Promise<User | null> {
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select(`
          *,
          role:roles(*),
          department:departments(*)
        `)
                .eq('id', id)
                .single()

            if (error || !data) {
                return null
            }

            return User.fromDatabase({
                ...data,
                role: data.role,
                department: data.department
            })
        } catch (error) {
            console.error('Error finding user by ID:', error)
            return null
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select(`
          *,
          role:roles(*),
          department:departments(*)
        `)
                .ilike('email', email.trim().toLowerCase())
                .single()

            if (error || !data) {
                return null
            }

            return User.fromDatabase({
                ...data,
                role: data.role,
                department: data.department
            })
        } catch (error) {
            console.error('Error finding user by email:', error)
            return null
        }
    }

    async findByNip(nip: string): Promise<User | null> {
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select(`
          *,
          role:roles(*),
          department:departments(*)
        `)
                .eq('nip', nip.trim())
                .single()

            if (error || !data) {
                return null
            }

            return User.fromDatabase({
                ...data,
                role: data.role,
                department: data.department
            })
        } catch (error) {
            console.error('Error finding user by NIP:', error)
            return null
        }
    }

    async create(data: RegisterData): Promise<User> {
        try {
            // Validate data
            const validation = User.validate(data)
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
            }

            // Hash password
            const passwordHash = await bcrypt.hash(data.password, 12)

            // Check for existing email/NIP
            if (await this.emailExists(data.email)) {
                throw new Error('Email already exists')
            }

            if (data.nip && await this.nipExists(data.nip)) {
                throw new Error('NIP already exists')
            }

            // Generate NIP if not provided
            const nip = data.nip || await this.generateNextNip()

            const insertData: TablesInsert<'users'> = {
                id: crypto.randomUUID(),
                nip,
                name: data.name,
                email: data.email,
                phone: data.phone,
                birth_date: data.birthDate,
                gender: data.gender,
                address: data.address,
                hire_date: data.hireDate,
                department_id: data.departmentId,
                role_id: data.roleId,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            const { data: userData, error } = await supabaseAdmin
                .from('users')
                .insert(insertData)
                .select(`
          *,
          role:roles(*),
          department:departments(*)
        `)
                .single()

            if (error) {
                throw new Error(`Failed to create user: ${error.message}`)
            }

            // Store password hash separately (assuming you have a separate auth table)
            // For now, we'll log the action
            await logAuditAction({
                action: 'CREATE_USER',
                tableName: 'users',
                recordId: userData.id,
                newValues: { ...insertData, password: '[REDACTED]' }
            })

            return User.fromDatabase({
                ...userData,
                role: userData.role,
                department: userData.department
            })
        } catch (error) {
            console.error('Error creating user:', error)
            throw error
        }
    }

    async update(id: string, data: UpdateProfileData): Promise<User> {
        try {
            const existingUser = await this.findById(id)
            if (!existingUser) {
                throw new Error('User not found')
            }

            const updateData: TablesUpdate<'users'> = {
                name: data.name,
                phone: data.phone,
                birth_date: data.birthDate,
                gender: data.gender,
                address: data.address,
                image: data.image,
                updated_at: new Date().toISOString()
            }

            const { data: userData, error } = await supabaseAdmin
                .from('users')
                .update(updateData)
                .eq('id', id)
                .select(`
          *,
          role:roles(*),
          department:departments(*)
        `)
                .single()

            if (error) {
                throw new Error(`Failed to update user: ${error.message}`)
            }

            await logAuditAction({
                userId: id,
                action: 'UPDATE_USER',
                tableName: 'users',
                recordId: id,
                oldValues: existingUser.toJSON(),
                newValues: updateData
            })

            return User.fromDatabase({
                ...userData,
                role: userData.role,
                department: userData.department
            })
        } catch (error) {
            console.error('Error updating user:', error)
            throw error
        }
    }

    async updateStatus(id: string, status: Tables<'users'>['status']): Promise<User> {
        try {
            const { data: userData, error } = await supabaseAdmin
                .from('users')
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
          *,
          role:roles(*),
          department:departments(*)
        `)
                .single()

            if (error) {
                throw new Error(`Failed to update user status: ${error.message}`)
            }

            await logAuditAction({
                userId: id,
                action: 'UPDATE_USER_STATUS',
                tableName: 'users',
                recordId: id,
                newValues: { status }
            })

            return User.fromDatabase({
                ...userData,
                role: userData.role,
                department: userData.department
            })
        } catch (error) {
            console.error('Error updating user status:', error)
            throw error
        }
    }

    async updateLastLogin(id: string): Promise<void> {
        try {
            const { error } = await supabaseAdmin
                .from('users')
                .update({
                    last_login: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) {
                console.error('Error updating last login:', error)
            }
        } catch (error) {
            console.error('Error updating last login:', error)
        }
    }

    async delete(id: string): Promise<void> {
        try {
            // Soft delete by updating status
            await this.updateStatus(id, 'terminated')

            await logAuditAction({
                userId: id,
                action: 'DELETE_USER',
                tableName: 'users',
                recordId: id
            })
        } catch (error) {
            console.error('Error deleting user:', error)
            throw error
        }
    }

    // ============================================================================
    // QUERY OPERATIONS
    // ============================================================================

    async findAll(options: {
        page?: number
        limit?: number
        search?: string
        departmentId?: string
        roleId?: string
        status?: Tables<'users'>['status']
        sortBy?: 'name' | 'email' | 'created_at' | 'last_login'
        sortOrder?: 'asc' | 'desc'
    } = {}): Promise<{
        users: User[]
        total: number
        totalPages: number
        currentPage: number
    }> {
        try {
            const {
                page = 1,
                limit = 20,
                search,
                departmentId,
                roleId,
                status,
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = options

            let query = supabaseAdmin
                .from('users')
                .select(`
          *,
          role:roles(*),
          department:departments(*)
        `, { count: 'exact' })

            // Apply filters
            if (search) {
                query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,nip.ilike.%${search}%`)
            }

            if (departmentId) {
                query = query.eq('department_id', departmentId)
            }

            if (roleId) {
                query = query.eq('role_id', roleId)
            }

            if (status) {
                query = query.eq('status', status)
            }

            // Apply sorting
            const sortColumn = sortBy === 'name' ? 'name' :
                sortBy === 'email' ? 'email' :
                    sortBy === 'last_login' ? 'last_login' : 'created_at'

            query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

            // Apply pagination
            const from = (page - 1) * limit
            const to = from + limit - 1
            query = query.range(from, to)

            const { data, error, count } = await query

            if (error) {
                throw new Error(`Failed to fetch users: ${error.message}`)
            }

            const users = (data || []).map(userData =>
                User.fromDatabase({
                    ...userData,
                    role: userData.role,
                    department: userData.department
                })
            )

            const total = count || 0
            const totalPages = Math.ceil(total / limit)

            return {
                users,
                total,
                totalPages,
                currentPage: page
            }
        } catch (error) {
            console.error('Error finding all users:', error)
            throw error
        }
    }

    async findByDepartment(departmentId: string): Promise<User[]> {
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select(`
          *,
          role:roles(*),
          department:departments(*)
        `)
                .eq('department_id', departmentId)
                .eq('status', 'active')
                .order('name')

            if (error) {
                throw new Error(`Failed to fetch users by department: ${error.message}`)
            }

            return (data || []).map(userData =>
                User.fromDatabase({
                    ...userData,
                    role: userData.role,
                    department: userData.department
                })
            )
        } catch (error) {
            console.error('Error finding users by department:', error)
            throw error
        }
    }

    async findByRole(roleId: string): Promise<User[]> {
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select(`
          *,
          role:roles(*),
          department:departments(*)
        `)
                .eq('role_id', roleId)
                .eq('status', 'active')
                .order('name')

            if (error) {
                throw new Error(`Failed to fetch users by role: ${error.message}`)
            }

            return (data || []).map(userData =>
                User.fromDatabase({
                    ...userData,
                    role: userData.role,
                    department: userData.department
                })
            )
        } catch (error) {
            console.error('Error finding users by role:', error)
            throw error
        }
    }

    async findTeamMembers(managerId: string): Promise<User[]> {
        try {
            // First get manager's department
            const manager = await this.findById(managerId)
            if (!manager || !manager.departmentId) {
                return []
            }

            const { data, error } = await supabaseAdmin
                .from('users')
                .select(`
          *,
          role:roles(*),
          department:departments(*)
        `)
                .eq('department_id', manager.departmentId)
                .neq('id', managerId)
                .eq('status', 'active')
                .order('name')

            if (error) {
                throw new Error(`Failed to fetch team members: ${error.message}`)
            }

            return (data || []).map(userData =>
                User.fromDatabase({
                    ...userData,
                    role: userData.role,
                    department: userData.department
                })
            )
        } catch (error) {
            console.error('Error finding team members:', error)
            throw error
        }
    }

    async findApproversForDepartment(departmentId: string): Promise<User[]> {
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select(`
          *,
          role:roles(*)
        `)
                .eq('department_id', departmentId)
                .eq('status', 'active')

            if (error) {
                throw new Error(`Failed to fetch approvers: ${error.message}`)
            }

            // Filter users who have approval permissions
            const approvers = (data || [])
                .map(userData => User.fromDatabase({
                    ...userData,
                    role: userData.role,
                    department: null
                }))
                .filter(user => user.hasPermission('approvals', 'approve'))

            return approvers
        } catch (error) {
            console.error('Error finding approvers:', error)
            throw error
        }
    }

    async search(query: string, limit: number = 10): Promise<User[]> {
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select(`
          *,
          role:roles(*),
          department:departments(*)
        `)
                .or(`name.ilike.%${query}%,email.ilike.%${query}%,nip.ilike.%${query}%`)
                .eq('status', 'active')
                .limit(limit)
                .order('name')

            if (error) {
                throw new Error(`Search failed: ${error.message}`)
            }

            return (data || []).map(userData =>
                User.fromDatabase({
                    ...userData,
                    role: userData.role,
                    department: userData.department
                })
            )
        } catch (error) {
            console.error('Error searching users:', error)
            throw error
        }
    }

    // ============================================================================
    // AUTHENTICATION RELATED
    // ============================================================================

    async findForAuthentication(identifier: string): Promise<{
        user: User
        passwordHash?: string
    } | null> {
        try {
            // This would typically query a separate auth table
            // For now, we'll simulate it
            const user = identifier.includes('@')
                ? await this.findByEmail(identifier)
                : await this.findByNip(identifier)

            if (!user) {
                return null;
            }

            // Simulate password hash retrieval
            // In production, you should fetch this from a separate auth table
            // For testing, we'll use a hardcoded password hash for "password123"
            // This is the bcrypt hash of "password123"
            const passwordHash = '$2a$12$5kPD4YLOodrT4CqnS0kDLuiAqouJ7qMi4UbOkh4ZZ1dKWbQQ0VbsS';

            return {
                user,
                passwordHash
            };
        } catch (error) {
            console.error('Error finding user for authentication:', error);
            return null;
        }
    }

    async updatePassword(id: string, passwordHash: string): Promise<void> {
        try {
            // In real implementation, update password in auth table
            await logAuditAction({
                userId: id,
                action: 'UPDATE_PASSWORD',
                tableName: 'users',
                recordId: id
            })
        } catch (error) {
            console.error('Error updating password:', error)
            throw error
        }
    }

    async verifyEmail(id: string): Promise<void> {
        try {
            const { error } = await supabaseAdmin
                .from('users')
                .update({
                    email_verified: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) {
                throw new Error(`Failed to verify email: ${error.message}`)
            }

            await logAuditAction({
                userId: id,
                action: 'VERIFY_EMAIL',
                tableName: 'users',
                recordId: id
            })
        } catch (error) {
            console.error('Error verifying email:', error)
            throw error
        }
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    async emailExists(email: string, excludeId?: string): Promise<boolean> {
        try {
            let query = supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', email)

            if (excludeId) {
                query = query.neq('id', excludeId)
            }

            const { data, error } = await query.single()

            return !error && !!data
        } catch (error) {
            return false
        }
    }

    async nipExists(nip: string, excludeId?: string): Promise<boolean> {
        try {
            let query = supabaseAdmin
                .from('users')
                .select('id')
                .eq('nip', nip)

            if (excludeId) {
                query = query.neq('id', excludeId)
            }

            const { data, error } = await query.single()

            return !error && !!data
        } catch (error) {
            return false
        }
    }

    async generateNextNip(): Promise<string> {
        try {
            // Get the latest NIP and increment
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('nip')
                .order('nip', { ascending: false })
                .limit(1)
                .single()

            if (error || !data?.nip) {
                // Start with default format: YYYYMMDD001
                const today = new Date()
                const year = today.getFullYear()
                const month = (today.getMonth() + 1).toString().padStart(2, '0')
                const day = today.getDate().toString().padStart(2, '0')
                return `${year}${month}${day}001`
            }

            // Increment the last NIP
            const lastNip = parseInt(data.nip!)
            return (lastNip + 1).toString().padStart(data.nip!.length, '0')
        } catch (error) {
            console.error('Error generating next NIP:', error)
            // Fallback
            return Date.now().toString()
        }
    }

    async countByDepartment(departmentId: string): Promise<number> {
        try {
            const { count, error } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('department_id', departmentId)
                .eq('status', 'active')

            if (error) {
                throw new Error(`Failed to count users: ${error.message}`)
            }

            return count || 0
        } catch (error) {
            console.error('Error counting users by department:', error)
            return 0
        }
    }

    async countByRole(roleId: string): Promise<number> {
        try {
            const { count, error } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role_id', roleId)
                .eq('status', 'active')

            if (error) {
                throw new Error(`Failed to count users: ${error.message}`)
            }

            return count || 0
        } catch (error) {
            console.error('Error counting users by role:', error)
            return 0
        }
    }

    // ============================================================================
    // STATISTICS & ANALYTICS
    // ============================================================================

    async getStatistics(): Promise<{
        total: number
        active: number
        inactive: number
        byDepartment: Record<string, number>
        byRole: Record<string, number>
        newThisMonth: number
    }> {
        try {
            // Get total counts
            const { count: total } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })

            const { count: active } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active')

            const { count: inactive } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'active')

            // Get new users this month
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            const { count: newThisMonth } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth.toISOString())

            return {
                total: total || 0,
                active: active || 0,
                inactive: inactive || 0,
                byDepartment: {}, // Would implement detailed breakdown
                byRole: {}, // Would implement detailed breakdown
                newThisMonth: newThisMonth || 0
            }
        } catch (error) {
            console.error('Error getting user statistics:', error)
            throw error
        }
    }

    // Implement other methods...
    async findIncompleteProfiles(): Promise<User[]> {
        // Implementation would check for users with missing profile fields
        return []
    }

    async findRecentlyJoined(days: number = 30): Promise<User[]> {
        // Implementation would find users hired in the last N days
        return []
    }

    async findByHireDateRange(startDate: Date, endDate: Date): Promise<User[]> {
        // Implementation would find users hired within date range
        return []
    }

    async bulkUpdateStatus(userIds: string[], status: Tables<'users'>['status']): Promise<void> {
        // Implementation for bulk status updates
    }

    async bulkDelete(userIds: string[]): Promise<void> {
        // Implementation for bulk deletes
    }

    async bulkImport(users: RegisterData[]): Promise<{
        success: User[]
        errors: Array<{ data: RegisterData; error: string }>
    }> {
        // Implementation for bulk import
        return { success: [], errors: [] }
    }
}

