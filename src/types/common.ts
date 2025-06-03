// ============================================================================
// COMMON TYPES
// src/types/common.ts
// ============================================================================

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Status Types
export type Status = 'active' | 'inactive' | 'pending' | 'suspended'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

// Date Range
export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface DateRangeString {
  startDate: string
  endDate: string
}

// Location
export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Location extends Coordinates {
  address?: string
  city?: string
  country?: string
}

// File Types
export interface FileInfo {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  url: string
  uploadedAt: Date
  uploadedBy: string
}

// Audit Fields
export interface AuditFields {
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

// Soft Delete
export interface SoftDelete {
  deletedAt?: Date
  deletedBy?: string
}

// Base Entity
export interface BaseEntity extends AuditFields {
  id: string
}

// Metadata
export interface Metadata {
  [key: string]: any
}

// Permission Types
export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete'
  conditions?: Record<string, any>
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  isActive: boolean
}

// Filter Types
export interface Filter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'between'
  value: any
}

export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  error?: string
  lastUpdated?: Date
}

export interface FormState<T = any> {
  data: T
  errors: Record<string, string>
  isSubmitting: boolean
  isDirty: boolean
  isValid: boolean
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// Language Types
export type Language = 'id' | 'en'

// Device Types
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

// Notification Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Modal Types
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

// Table Types
export interface TableColumn<T = any> {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (value: any, record: T, index: number) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: number | string
  align?: 'left' | 'center' | 'right'
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  selection?: {
    selectedRowKeys: string[]
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void
  }
  onSort?: (field: string, direction: 'asc' | 'desc') => void
}

// Form Field Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ label: string; value: any }>
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: any) => string | undefined
  }
}

// Chart Types
export interface ChartPoint {
  x: string | number
  y: number
  label?: string
}

export interface ChartSeries {
  name: string
  data: ChartPoint[]
  color?: string
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area'
  series: ChartSeries[]
  options?: {
    responsive?: boolean
    legend?: boolean
    tooltip?: boolean
    animation?: boolean
  }
}

// Export/Import Types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json'
  filename?: string
  columns?: string[]
  filters?: Filter[]
}

export interface ImportResult {
  success: boolean
  totalRows: number
  successRows: number
  errorRows: number
  errors?: Array<{
    row: number
    field: string
    message: string
  }>
}

// Settings Types
export interface AppSettings {
  theme: Theme
  language: Language
  timezone: string
  dateFormat: string
  timeFormat: string
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
  }
}

// Cache Types
export interface CacheItem<T = any> {
  key: string
  data: T
  timestamp: number
  ttl: number
}

// Event Types
export interface AppEvent {
  type: string
  payload: any
  timestamp: Date
  source: string
}

// Validation Types
export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}
