// ============================================================================
// API TYPES
// src/types/api.ts
// ============================================================================

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Dashboard API Types
export interface DashboardApiRequest {
  includeTeamStats?: boolean
  includeCompanyStats?: boolean
  dateRange?: {
    startDate: string
    endDate: string
  }
}

export interface DashboardApiResponse extends ApiResponse {
  data?: {
    attendance: any
    requests: any
    approvals?: any
    team?: any
    company?: any
  }
}

// Attendance API Types
export interface CheckInRequest {
  latitude: number
  longitude: number
  address?: string
}

export interface CheckOutRequest {
  latitude?: number
  longitude?: number
  address?: string
}

export interface AttendanceApiResponse extends ApiResponse {
  data?: {
    id: string
    checkInTime?: Date
    checkOutTime?: Date
    workingHours?: number
    status: string
    location?: string
  }
}

// Request API Types
export interface CreateRequestApiRequest {
  type: 'leave' | 'permission' | 'work_letter'
  title: string
  description?: string
  startDate: string
  endDate?: string
  attachments?: string[]
}

export interface UpdateRequestApiRequest {
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  attachments?: string[]
}

export interface RequestApiResponse extends ApiResponse {
  data?: {
    id: string
    type: string
    title: string
    status: string
    createdAt: Date
    startDate?: Date
    endDate?: Date
  }
}

// Approval API Types
export interface ProcessApprovalRequest {
  action: 'approve' | 'reject'
  comment?: string
}

export interface ApprovalApiResponse extends ApiResponse {
  data?: {
    id: string
    status: string
    processedAt: Date
    comment?: string
  }
}

// User API Types
export interface CreateUserRequest {
  name: string
  email: string
  nip?: string
  phone?: string
  departmentId?: string
  roleId?: string
  password: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  nip?: string
  phone?: string
  departmentId?: string
  roleId?: string
  status?: string
}

export interface UserApiResponse extends ApiResponse {
  data?: {
    id: string
    name: string
    email: string
    nip?: string
    status: string
    role?: any
    department?: any
  }
}

// Notification API Types
export interface NotificationApiResponse extends ApiResponse {
  data?: {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: Date
  }[]
}

export interface MarkNotificationReadRequest {
  notificationIds: string[]
}

// Report API Types
export interface ReportRequest {
  type: 'attendance' | 'leave' | 'department' | 'user'
  format: 'excel' | 'pdf' | 'json'
  dateRange: {
    startDate: string
    endDate: string
  }
  filters?: {
    departmentId?: string
    userId?: string
    status?: string
  }
}

export interface ReportApiResponse extends ApiResponse {
  data?: {
    downloadUrl?: string
    reportData?: any
  }
}

// File Upload Types
export interface FileUploadRequest {
  file: File
  type: 'avatar' | 'attachment' | 'document'
}

export interface FileUploadResponse extends ApiResponse {
  data?: {
    url: string
    filename: string
    size: number
    type: string
  }
}

// Error Types
export interface ApiError {
  code: string
  message: string
  details?: any
}

export interface ValidationError extends ApiError {
  field: string
  value: any
}

// Search Types
export interface SearchParams {
  query?: string
  filters?: Record<string, any>
  pagination?: PaginationParams
}

export interface SearchResponse<T> extends PaginatedResponse<T> {
  query: string
  filters: Record<string, any>
}
