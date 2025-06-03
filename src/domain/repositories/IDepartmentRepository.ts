// ============================================================================
// DEPARTMENT REPOSITORY INTERFACE
// src/domain/repositories/IDepartmentRepository.ts
// ============================================================================

export interface DepartmentEntity {
  id: string
  name: string
  code: string
  description?: string
  parentId?: string
  headId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateDepartmentData {
  name: string
  code: string
  description?: string
  parentId?: string
  headId?: string
  isActive?: boolean
}

export interface UpdateDepartmentData {
  name?: string
  code?: string
  description?: string
  parentId?: string
  headId?: string
  isActive?: boolean
}

export interface DepartmentFilters {
  name?: string
  code?: string
  parentId?: string
  headId?: string
  isActive?: boolean
}

export interface DepartmentWithRelations extends DepartmentEntity {
  parent?: DepartmentEntity
  children?: DepartmentEntity[]
  head?: {
    id: string
    name: string
    nip?: string
  }
  employees?: Array<{
    id: string
    name: string
    nip?: string
    status: string
  }>
  _count?: {
    employees: number
    children: number
  }
}

export interface DepartmentHierarchy extends DepartmentEntity {
  level: number
  path: string
  children: DepartmentHierarchy[]
  employeeCount: number
  totalEmployeeCount: number // including sub-departments
}

export interface DepartmentStatistics {
  departmentId: string
  departmentName: string
  totalEmployees: number
  activeEmployees: number
  presentToday: number
  absentToday: number
  onLeaveToday: number
  attendanceRate: number
  subDepartments: number
}

export interface IDepartmentRepository {
  // Basic CRUD operations
  findById(id: string): Promise<DepartmentEntity | null>
  findByIdWithRelations(id: string): Promise<DepartmentWithRelations | null>
  create(data: CreateDepartmentData): Promise<DepartmentEntity>
  update(id: string, data: UpdateDepartmentData): Promise<DepartmentEntity>
  delete(id: string): Promise<void>

  // Basic queries
  findAll(): Promise<DepartmentEntity[]>
  findAllWithRelations(): Promise<DepartmentWithRelations[]>
  findByCode(code: string): Promise<DepartmentEntity | null>
  findByName(name: string): Promise<DepartmentEntity | null>

  // Hierarchy queries
  findRootDepartments(): Promise<DepartmentEntity[]>
  findChildren(parentId: string): Promise<DepartmentEntity[]>
  findParent(departmentId: string): Promise<DepartmentEntity | null>
  findAncestors(departmentId: string): Promise<DepartmentEntity[]>
  findDescendants(departmentId: string): Promise<DepartmentEntity[]>
  getDepartmentHierarchy(): Promise<DepartmentHierarchy[]>
  getDepartmentPath(departmentId: string): Promise<string>
  getDepartmentLevel(departmentId: string): Promise<number>

  // Employee-related queries
  findByHeadId(headId: string): Promise<DepartmentEntity[]>
  findEmployees(departmentId: string): Promise<Array<{
    id: string
    name: string
    nip?: string
    status: string
  }>>
  countEmployees(departmentId: string, includeSubDepartments?: boolean): Promise<number>
  countActiveEmployees(departmentId: string, includeSubDepartments?: boolean): Promise<number>

  // Advanced queries
  findMany(filters: DepartmentFilters, limit?: number, offset?: number): Promise<DepartmentWithRelations[]>
  countMany(filters: DepartmentFilters): Promise<number>
  search(query: string): Promise<DepartmentEntity[]>

  // Status management
  activate(id: string): Promise<DepartmentEntity>
  deactivate(id: string): Promise<DepartmentEntity>
  setHead(departmentId: string, headId: string): Promise<DepartmentEntity>
  removeHead(departmentId: string): Promise<DepartmentEntity>

  // Hierarchy management
  moveToParent(departmentId: string, newParentId: string | null): Promise<DepartmentEntity>
  reorderChildren(parentId: string, childrenIds: string[]): Promise<void>
  validateHierarchy(departmentId: string, newParentId: string): Promise<boolean>

  // Statistics and reporting
  getDepartmentStatistics(departmentId: string, date?: Date): Promise<DepartmentStatistics>
  getAllDepartmentStatistics(date?: Date): Promise<DepartmentStatistics[]>
  getAttendanceStatistics(departmentId: string, startDate: Date, endDate: Date): Promise<{
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
  }>

  // Bulk operations
  bulkCreate(departments: CreateDepartmentData[]): Promise<DepartmentEntity[]>
  bulkUpdate(updates: Array<{ id: string; data: UpdateDepartmentData }>): Promise<number>
  bulkDelete(ids: string[]): Promise<number>
  bulkActivate(ids: string[]): Promise<number>
  bulkDeactivate(ids: string[]): Promise<number>

  // Validation helpers
  isCodeUnique(code: string, excludeId?: string): Promise<boolean>
  isNameUnique(name: string, excludeId?: string): Promise<boolean>
  canDelete(id: string): Promise<boolean>
  hasCircularReference(departmentId: string, parentId: string): Promise<boolean>

  // Reporting helpers
  getDepartmentTree(): Promise<DepartmentHierarchy[]>
  exportDepartmentStructure(): Promise<Array<{
    id: string
    name: string
    code: string
    parentName?: string
    headName?: string
    employeeCount: number
    level: number
    path: string
  }>>

  // Employee assignment helpers
  assignEmployee(departmentId: string, userId: string): Promise<void>
  removeEmployee(departmentId: string, userId: string): Promise<void>
  transferEmployee(userId: string, fromDepartmentId: string, toDepartmentId: string): Promise<void>
  bulkTransferEmployees(userIds: string[], toDepartmentId: string): Promise<number>

  // Approval workflow helpers
  getApprovalHierarchy(departmentId: string): Promise<Array<{
    level: number
    approverId: string
    approverName: string
    departmentId: string
    departmentName: string
  }>>
  getDepartmentApprovers(departmentId: string): Promise<Array<{
    id: string
    name: string
    level: number
  }>>
}
