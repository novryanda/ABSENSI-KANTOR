// ============================================================================
// DEPARTMENT REPOSITORY IMPLEMENTATION
// src/infrastructure/database/repositories/DepartmentRepository.ts
// ============================================================================

import { PrismaClient } from '@prisma/client'
import {
  IDepartmentRepository,
  DepartmentEntity,
  CreateDepartmentData,
  UpdateDepartmentData,
  DepartmentFilters,
  DepartmentWithRelations,
  DepartmentHierarchy,
  DepartmentStatistics
} from '@/domain/repositories/IDepartmentRepository'

export class PrismaDepartmentRepository implements IDepartmentRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<DepartmentEntity | null> {
    const department = await this.prisma.department.findUnique({
      where: { id }
    })
    return department
  }

  async findByIdWithRelations(id: string): Promise<DepartmentWithRelations | null> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        head: {
          select: {
            id: true,
            name: true,
            nip: true
          }
        },
        employees: {
          select: {
            id: true,
            name: true,
            nip: true,
            status: true
          }
        },
        _count: {
          select: {
            employees: true,
            children: true
          }
        }
      }
    })
    return department as DepartmentWithRelations | null
  }

  async create(data: CreateDepartmentData): Promise<DepartmentEntity> {
    const department = await this.prisma.department.create({
      data: {
        ...data,
        isActive: data.isActive ?? true
      }
    })
    return department
  }

  async update(id: string, data: UpdateDepartmentData): Promise<DepartmentEntity> {
    const department = await this.prisma.department.update({
      where: { id },
      data
    })
    return department
  }

  async delete(id: string): Promise<void> {
    await this.prisma.department.delete({
      where: { id }
    })
  }

  async findAll(): Promise<DepartmentEntity[]> {
    const departments = await this.prisma.department.findMany({
      orderBy: { name: 'asc' }
    })
    return departments
  }

  async findAllWithRelations(): Promise<DepartmentWithRelations[]> {
    const departments = await this.prisma.department.findMany({
      include: {
        parent: true,
        children: true,
        head: {
          select: {
            id: true,
            name: true,
            nip: true
          }
        },
        employees: {
          select: {
            id: true,
            name: true,
            nip: true,
            status: true
          }
        },
        _count: {
          select: {
            employees: true,
            children: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    return departments as DepartmentWithRelations[]
  }

  async findByCode(code: string): Promise<DepartmentEntity | null> {
    const department = await this.prisma.department.findUnique({
      where: { code }
    })
    return department
  }

  async findByName(name: string): Promise<DepartmentEntity | null> {
    const department = await this.prisma.department.findFirst({
      where: { name }
    })
    return department
  }

  async findRootDepartments(): Promise<DepartmentEntity[]> {
    const departments = await this.prisma.department.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' }
    })
    return departments
  }

  async findChildren(parentId: string): Promise<DepartmentEntity[]> {
    const departments = await this.prisma.department.findMany({
      where: { parentId },
      orderBy: { name: 'asc' }
    })
    return departments
  }

  async findParent(departmentId: string): Promise<DepartmentEntity | null> {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      include: { parent: true }
    })
    return department?.parent || null
  }

  async findAncestors(departmentId: string): Promise<DepartmentEntity[]> {
    const ancestors: DepartmentEntity[] = []
    let currentDepartment = await this.findById(departmentId)

    while (currentDepartment?.parentId) {
      const parent = await this.findById(currentDepartment.parentId)
      if (parent) {
        ancestors.unshift(parent)
        currentDepartment = parent
      } else {
        break
      }
    }

    return ancestors
  }

  async findDescendants(departmentId: string): Promise<DepartmentEntity[]> {
    const descendants: DepartmentEntity[] = []
    
    const getDescendants = async (parentId: string): Promise<void> => {
      const children = await this.findChildren(parentId)
      for (const child of children) {
        descendants.push(child)
        await getDescendants(child.id)
      }
    }

    await getDescendants(departmentId)
    return descendants
  }

  async getDepartmentHierarchy(): Promise<DepartmentHierarchy[]> {
    const rootDepartments = await this.findRootDepartments()
    const hierarchy: DepartmentHierarchy[] = []

    for (const root of rootDepartments) {
      const hierarchyNode = await this.buildHierarchyNode(root, 0, root.name)
      hierarchy.push(hierarchyNode)
    }

    return hierarchy
  }

  private async buildHierarchyNode(department: DepartmentEntity, level: number, path: string): Promise<DepartmentHierarchy> {
    const children = await this.findChildren(department.id)
    const employeeCount = await this.countEmployees(department.id, false)
    const totalEmployeeCount = await this.countEmployees(department.id, true)

    const hierarchyChildren: DepartmentHierarchy[] = []
    for (const child of children) {
      const childNode = await this.buildHierarchyNode(child, level + 1, `${path} > ${child.name}`)
      hierarchyChildren.push(childNode)
    }

    return {
      ...department,
      level,
      path,
      children: hierarchyChildren,
      employeeCount,
      totalEmployeeCount
    }
  }

  async getDepartmentPath(departmentId: string): Promise<string> {
    const ancestors = await this.findAncestors(departmentId)
    const department = await this.findById(departmentId)
    
    if (!department) return ''

    const pathParts = [...ancestors.map(a => a.name), department.name]
    return pathParts.join(' > ')
  }

  async getDepartmentLevel(departmentId: string): Promise<number> {
    const ancestors = await this.findAncestors(departmentId)
    return ancestors.length
  }

  async findByHeadId(headId: string): Promise<DepartmentEntity[]> {
    const departments = await this.prisma.department.findMany({
      where: { headId },
      orderBy: { name: 'asc' }
    })
    return departments
  }

  async findEmployees(departmentId: string): Promise<Array<{
    id: string
    name: string
    nip?: string
    status: string
  }>> {
    const employees = await this.prisma.user.findMany({
      where: { departmentId },
      select: {
        id: true,
        name: true,
        nip: true,
        status: true
      },
      orderBy: { name: 'asc' }
    })
    return employees
  }

  async countEmployees(departmentId: string, includeSubDepartments?: boolean): Promise<number> {
    if (includeSubDepartments) {
      const descendants = await this.findDescendants(departmentId)
      const departmentIds = [departmentId, ...descendants.map(d => d.id)]
      
      return await this.prisma.user.count({
        where: {
          departmentId: { in: departmentIds }
        }
      })
    }

    return await this.prisma.user.count({
      where: { departmentId }
    })
  }

  async countActiveEmployees(departmentId: string, includeSubDepartments?: boolean): Promise<number> {
    if (includeSubDepartments) {
      const descendants = await this.findDescendants(departmentId)
      const departmentIds = [departmentId, ...descendants.map(d => d.id)]
      
      return await this.prisma.user.count({
        where: {
          departmentId: { in: departmentIds },
          status: 'ACTIVE'
        }
      })
    }

    return await this.prisma.user.count({
      where: {
        departmentId,
        status: 'ACTIVE'
      }
    })
  }

  async findMany(filters: DepartmentFilters, limit?: number, offset?: number): Promise<DepartmentWithRelations[]> {
    const where: any = {}

    if (filters.name) where.name = { contains: filters.name, mode: 'insensitive' }
    if (filters.code) where.code = { contains: filters.code, mode: 'insensitive' }
    if (filters.parentId !== undefined) where.parentId = filters.parentId
    if (filters.headId) where.headId = filters.headId
    if (filters.isActive !== undefined) where.isActive = filters.isActive

    const departments = await this.prisma.department.findMany({
      where,
      include: {
        parent: true,
        children: true,
        head: {
          select: {
            id: true,
            name: true,
            nip: true
          }
        },
        employees: {
          select: {
            id: true,
            name: true,
            nip: true,
            status: true
          }
        },
        _count: {
          select: {
            employees: true,
            children: true
          }
        }
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset
    })
    return departments as DepartmentWithRelations[]
  }

  async countMany(filters: DepartmentFilters): Promise<number> {
    const where: any = {}

    if (filters.name) where.name = { contains: filters.name, mode: 'insensitive' }
    if (filters.code) where.code = { contains: filters.code, mode: 'insensitive' }
    if (filters.parentId !== undefined) where.parentId = filters.parentId
    if (filters.headId) where.headId = filters.headId
    if (filters.isActive !== undefined) where.isActive = filters.isActive

    return await this.prisma.department.count({ where })
  }

  async search(query: string): Promise<DepartmentEntity[]> {
    const departments = await this.prisma.department.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { name: 'asc' }
    })
    return departments
  }

  async activate(id: string): Promise<DepartmentEntity> {
    const department = await this.prisma.department.update({
      where: { id },
      data: { isActive: true }
    })
    return department
  }

  async deactivate(id: string): Promise<DepartmentEntity> {
    const department = await this.prisma.department.update({
      where: { id },
      data: { isActive: false }
    })
    return department
  }

  async setHead(departmentId: string, headId: string): Promise<DepartmentEntity> {
    const department = await this.prisma.department.update({
      where: { id: departmentId },
      data: { headId }
    })
    return department
  }

  async removeHead(departmentId: string): Promise<DepartmentEntity> {
    const department = await this.prisma.department.update({
      where: { id: departmentId },
      data: { headId: null }
    })
    return department
  }

  async moveToParent(departmentId: string, newParentId: string | null): Promise<DepartmentEntity> {
    // Validate hierarchy to prevent circular references
    if (newParentId && !(await this.validateHierarchy(departmentId, newParentId))) {
      throw new Error('Moving department would create circular reference')
    }

    const department = await this.prisma.department.update({
      where: { id: departmentId },
      data: { parentId: newParentId }
    })
    return department
  }

  async reorderChildren(parentId: string, childrenIds: string[]): Promise<void> {
    // This would typically involve updating an order field
    // For now, we'll just ensure all children belong to the parent
    await this.prisma.department.updateMany({
      where: {
        id: { in: childrenIds }
      },
      data: {
        parentId: parentId
      }
    })
  }

  async validateHierarchy(departmentId: string, newParentId: string): Promise<boolean> {
    // Check if newParentId is a descendant of departmentId
    const descendants = await this.findDescendants(departmentId)
    return !descendants.some(d => d.id === newParentId)
  }

  async getDepartmentStatistics(departmentId: string, date?: Date): Promise<DepartmentStatistics> {
    const targetDate = date || new Date()
    const department = await this.findById(departmentId)

    if (!department) {
      throw new Error('Department not found')
    }

    const [totalEmployees, activeEmployees, subDepartments] = await Promise.all([
      this.countEmployees(departmentId, false),
      this.countActiveEmployees(departmentId, false),
      this.prisma.department.count({ where: { parentId: departmentId } })
    ])

    // Get attendance statistics for today
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const [presentToday, absentToday, onLeaveToday] = await Promise.all([
      this.prisma.attendance.count({
        where: {
          attendanceDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: 'PRESENT',
          user: { departmentId }
        }
      }),
      this.prisma.attendance.count({
        where: {
          attendanceDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: 'ABSENT',
          user: { departmentId }
        }
      }),
      this.prisma.leaveRequest.count({
        where: {
          startDate: { lte: targetDate },
          endDate: { gte: targetDate },
          status: 'APPROVED',
          user: { departmentId }
        }
      })
    ])

    const attendanceRate = activeEmployees > 0 ? (presentToday / activeEmployees) * 100 : 0

    return {
      departmentId,
      departmentName: department.name,
      totalEmployees,
      activeEmployees,
      presentToday,
      absentToday,
      onLeaveToday,
      attendanceRate,
      subDepartments
    }
  }

  async getAllDepartmentStatistics(date?: Date): Promise<DepartmentStatistics[]> {
    const departments = await this.findAll()
    const statistics: DepartmentStatistics[] = []

    for (const department of departments) {
      const stats = await this.getDepartmentStatistics(department.id, date)
      statistics.push(stats)
    }

    return statistics
  }

  async getAttendanceStatistics(departmentId: string, startDate: Date, endDate: Date): Promise<{
    totalWorkDays: number
    totalPresent: number
    totalAbsent: number
    totalLate: number
    attendanceRate: number
    employeeStats: Array<{
      userId: string
      name: string
      presentDays: number
      absentDays: number
      lateDays: number
      attendanceRate: number
    }>
  }> {
    const employees = await this.findEmployees(departmentId)
    const workDays = this.calculateWorkDays(startDate, endDate)

    let totalPresent = 0
    let totalAbsent = 0
    let totalLate = 0
    const employeeStats = []

    for (const employee of employees) {
      const [presentDays, absentDays, lateDays] = await Promise.all([
        this.prisma.attendance.count({
          where: {
            userId: employee.id,
            attendanceDate: { gte: startDate, lte: endDate },
            status: 'PRESENT'
          }
        }),
        this.prisma.attendance.count({
          where: {
            userId: employee.id,
            attendanceDate: { gte: startDate, lte: endDate },
            status: 'ABSENT'
          }
        }),
        this.prisma.attendance.count({
          where: {
            userId: employee.id,
            attendanceDate: { gte: startDate, lte: endDate },
            status: 'LATE'
          }
        })
      ])

      totalPresent += presentDays
      totalAbsent += absentDays
      totalLate += lateDays

      const attendanceRate = workDays > 0 ? (presentDays / workDays) * 100 : 0

      employeeStats.push({
        userId: employee.id,
        name: employee.name,
        presentDays,
        absentDays,
        lateDays,
        attendanceRate
      })
    }

    const totalWorkDays = workDays * employees.length
    const attendanceRate = totalWorkDays > 0 ? (totalPresent / totalWorkDays) * 100 : 0

    return {
      totalWorkDays,
      totalPresent,
      totalAbsent,
      totalLate,
      attendanceRate,
      employeeStats
    }
  }

  private calculateWorkDays(startDate: Date, endDate: Date): number {
    let workDays = 0
    const current = new Date(startDate)

    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        workDays++
      }
      current.setDate(current.getDate() + 1)
    }

    return workDays
  }

  async bulkCreate(departments: CreateDepartmentData[]): Promise<DepartmentEntity[]> {
    const created = await this.prisma.department.createMany({
      data: departments.map(dept => ({
        ...dept,
        isActive: dept.isActive ?? true
      }))
    })

    // Return the created departments (Prisma createMany doesn't return the records)
    const codes = departments.map(d => d.code)
    return await this.prisma.department.findMany({
      where: { code: { in: codes } }
    })
  }

  async bulkUpdate(updates: Array<{ id: string; data: UpdateDepartmentData }>): Promise<number> {
    let updatedCount = 0

    for (const update of updates) {
      try {
        await this.update(update.id, update.data)
        updatedCount++
      } catch (error) {
        // Continue with other updates even if one fails
        console.error(`Failed to update department ${update.id}:`, error)
      }
    }

    return updatedCount
  }

  async bulkDelete(ids: string[]): Promise<number> {
    const result = await this.prisma.department.deleteMany({
      where: { id: { in: ids } }
    })
    return result.count
  }

  async bulkActivate(ids: string[]): Promise<number> {
    const result = await this.prisma.department.updateMany({
      where: { id: { in: ids } },
      data: { isActive: true }
    })
    return result.count
  }

  async bulkDeactivate(ids: string[]): Promise<number> {
    const result = await this.prisma.department.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false }
    })
    return result.count
  }

  async isCodeUnique(code: string, excludeId?: string): Promise<boolean> {
    const where: any = { code }
    if (excludeId) {
      where.id = { not: excludeId }
    }

    const count = await this.prisma.department.count({ where })
    return count === 0
  }

  async isNameUnique(name: string, excludeId?: string): Promise<boolean> {
    const where: any = { name }
    if (excludeId) {
      where.id = { not: excludeId }
    }

    const count = await this.prisma.department.count({ where })
    return count === 0
  }

  async canDelete(id: string): Promise<boolean> {
    const [hasEmployees, hasChildren] = await Promise.all([
      this.prisma.user.count({ where: { departmentId: id } }),
      this.prisma.department.count({ where: { parentId: id } })
    ])

    return hasEmployees === 0 && hasChildren === 0
  }

  async hasCircularReference(departmentId: string, parentId: string): Promise<boolean> {
    return !(await this.validateHierarchy(departmentId, parentId))
  }

  async getDepartmentTree(): Promise<DepartmentHierarchy[]> {
    return await this.getDepartmentHierarchy()
  }

  async exportDepartmentStructure(): Promise<Array<{
    id: string
    name: string
    code: string
    parentName?: string
    headName?: string
    employeeCount: number
    level: number
    path: string
  }>> {
    const departments = await this.findAllWithRelations()
    const result = []

    for (const dept of departments) {
      const level = await this.getDepartmentLevel(dept.id)
      const path = await this.getDepartmentPath(dept.id)
      const employeeCount = await this.countEmployees(dept.id, false)

      result.push({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        parentName: dept.parent?.name,
        headName: dept.head?.name,
        employeeCount,
        level,
        path
      })
    }

    return result
  }

  async assignEmployee(departmentId: string, userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { departmentId }
    })
  }

  async removeEmployee(departmentId: string, userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { departmentId: null }
    })
  }

  async transferEmployee(userId: string, fromDepartmentId: string, toDepartmentId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { departmentId: toDepartmentId }
    })
  }

  async bulkTransferEmployees(userIds: string[], toDepartmentId: string): Promise<number> {
    const result = await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { departmentId: toDepartmentId }
    })
    return result.count
  }

  async getApprovalHierarchy(departmentId: string): Promise<Array<{
    level: number
    approverId: string
    approverName: string
    departmentId: string
    departmentName: string
  }>> {
    const ancestors = await this.findAncestors(departmentId)
    const department = await this.findByIdWithRelations(departmentId)

    if (!department) return []

    const hierarchy = []
    let level = 1

    // Add current department head as first approver
    if (department.head) {
      hierarchy.push({
        level: level++,
        approverId: department.head.id,
        approverName: department.head.name,
        departmentId: department.id,
        departmentName: department.name
      })
    }

    // Add parent department heads as higher level approvers
    for (const ancestor of ancestors.reverse()) {
      const ancestorWithRelations = await this.findByIdWithRelations(ancestor.id)
      if (ancestorWithRelations?.head) {
        hierarchy.push({
          level: level++,
          approverId: ancestorWithRelations.head.id,
          approverName: ancestorWithRelations.head.name,
          departmentId: ancestorWithRelations.id,
          departmentName: ancestorWithRelations.name
        })
      }
    }

    return hierarchy
  }

  async getDepartmentApprovers(departmentId: string): Promise<Array<{
    id: string
    name: string
    level: number
  }>> {
    const hierarchy = await this.getApprovalHierarchy(departmentId)
    return hierarchy.map(h => ({
      id: h.approverId,
      name: h.approverName,
      level: h.level
    }))
  }
}
