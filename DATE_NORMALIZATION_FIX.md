# Perbaikan Masalah Normalisasi Tanggal Attendance

## Masalah yang Ditemukan

### 1. Inkonsistensi Penggunaan Tanggal
- **Masalah**: Beberapa fungsi menggunakan `new Date()` langsung tanpa normalisasi
- **Dampak**: Attendance record dibuat dengan tanggal yang berbeda dari yang diharapkan
- **Contoh**: Jika sistem menunjukkan tanggal 3 Juni, tapi attendance tercatat tanggal 2 Juni

### 2. Lokasi Masalah Spesifik

#### `CheckOutWithLocationValidation.ts` line 74
```typescript
// SEBELUM (SALAH)
const today = new Date()

// SESUDAH (BENAR)
const today = getAttendanceDate()
```

#### `GetDashboardStats.ts` line 101
```typescript
// SEBELUM (SALAH)
const today = new Date()

// SESUDAH (BENAR)
const today = getAttendanceDate()
```

### 3. Root Cause Analysis
- **Check-in**: Menggunakan `getAttendanceDate()` ✅ (sudah benar)
- **Check-out**: Menggunakan `new Date()` ❌ (salah)
- **Dashboard Stats**: Menggunakan `new Date()` ❌ (salah)
- **Repository**: Menggunakan normalisasi ✅ (sudah benar)

## Perbaikan yang Dilakukan

### 1. Perbaikan `CheckOutWithLocationValidation.ts`

#### Import yang Ditambahkan
```typescript
import { getAttendanceDate } from '@/utils/dateUtils'
```

#### Perbaikan Fungsi `execute()`
```typescript
// Check if user has checked in today
// CRITICAL: Use normalized date for consistency
const today = getAttendanceDate()
console.log('📅 CheckOut - Using normalized today date:', today.toISOString())
const todayAttendance = await this.attendanceRepository.findByUserAndDate(request.userId, today)
```

#### Perbaikan Audit Logging
```typescript
// Log failed attempt for audit purposes
if (this.auditService) {
  try {
    await this.auditService.logFailedCheckOutAttempt(
      request.userId,
      {
        attendanceDate: today, // Use the same normalized date
        // ... rest of data
      }
    )
  }
}
```

### 2. Perbaikan `GetDashboardStats.ts`

#### Import yang Ditambahkan
```typescript
import { calculateAttendanceStats, isAttendancePresent, getAttendanceDate } from '@/utils/dateUtils'
```

#### Perbaikan `getAttendanceStats()`
```typescript
private async getAttendanceStats(userId: string): Promise<AttendanceStats> {
  // CRITICAL: Use normalized date for consistency
  const today = getAttendanceDate()
  const currentDate = new Date()
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const last7Days = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)

  console.log('📊 getAttendanceStats - Using normalized today date:', {
    today: today.toISOString(),
    todayLocal: today.toLocaleDateString('id-ID'),
    currentDate: currentDate.toISOString()
  })

  // Get today's attendance using normalized date
  const todayAttendance = await this.attendanceRepository.findByUserAndDate(userId, today)
  // ... rest of function
}
```

#### Perbaikan `getTeamStats()`
```typescript
private async getTeamStats(departmentId: string, managerId: string): Promise<TeamStats> {
  const teamMembers = await this.userRepository.findByDepartmentId(departmentId)
  // CRITICAL: Use normalized date for consistency
  const today = getAttendanceDate()
  console.log('👥 getTeamStats - Using normalized today date:', today.toISOString())
  // ... rest of function
}
```

#### Perbaikan `getCompanyStats()`
```typescript
private async getCompanyStats(): Promise<CompanyStats> {
  const allUsers = await this.userRepository.findAll()
  const departments = await this.departmentRepository.findAll()
  // CRITICAL: Use normalized date for consistency
  const today = getAttendanceDate()
  console.log('🏢 getCompanyStats - Using normalized today date:', today.toISOString())
  // ... rest of function
}
```

## Penjelasan Teknis

### Fungsi `getAttendanceDate()`
```typescript
export function getAttendanceDate(date?: Date): Date {
  const inputDate = date || new Date()
  const normalizedDate = normalizeToStartOfDay(inputDate)
  
  // Debug logging to track date handling
  console.log('🗓️ getAttendanceDate:', {
    input: inputDate.toISOString(),
    inputLocal: inputDate.toLocaleDateString('id-ID'),
    normalized: normalizedDate.toISOString(),
    normalizedLocal: normalizedDate.toLocaleDateString('id-ID')
  })
  
  return normalizedDate
}
```

### Fungsi `normalizeToStartOfDay()`
```typescript
export function normalizeToStartOfDay(date: Date): Date {
  // Create a new date in local timezone to avoid timezone conversion issues
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()

  // Create normalized date in local timezone
  const normalized = new Date(year, month, day, 0, 0, 0, 0)
  return normalized
}
```

## Mengapa Masalah Ini Terjadi?

### 1. Timezone dan Waktu
- `new Date()` menghasilkan timestamp dengan jam, menit, detik, dan milidetik
- Database menyimpan tanggal dengan normalisasi ke 00:00:00.000
- Jika check-in dilakukan pada 22:04 tanggal 3 Juni, tapi sistem mencari dengan `new Date()` yang menghasilkan 22:04 tanggal 3 Juni, maka tidak akan match dengan record yang disimpan sebagai 00:00:00.000 tanggal 3 Juni

### 2. Unique Constraint
- Database memiliki unique constraint pada `(userId, attendanceDate)`
- Normalisasi memastikan satu user hanya bisa punya satu record per hari
- Tanpa normalisasi, pencarian bisa gagal karena perbedaan waktu

### 3. Konsistensi Data
- Check-in menggunakan normalisasi ✅
- Check-out tidak menggunakan normalisasi ❌
- Dashboard tidak menggunakan normalisasi ❌
- Hasil: Data tidak konsisten

## Validasi Perbaikan

### 1. Test Scenario: Check-in dan Check-out di Hari yang Sama
- User melakukan check-in pada tanggal 3 Juni jam 08:00
- User melakukan check-out pada tanggal 3 Juni jam 17:00
- Kedua operasi harus menggunakan tanggal yang sama (3 Juni 00:00:00.000)

### 2. Test Scenario: Dashboard Menampilkan Data Hari Ini
- Dashboard diakses pada tanggal 3 Juni jam 22:00
- Harus menampilkan attendance record yang dibuat pada tanggal 3 Juni
- Tidak boleh menampilkan "Belum absen" jika sudah ada record

### 3. Test Scenario: Cross-midnight Operations
- User check-in pada tanggal 2 Juni jam 23:30
- User check-out pada tanggal 3 Juni jam 00:30
- Check-out harus gagal karena tidak ada record untuk tanggal 3 Juni

## Logging untuk Debugging

### Console Output yang Diharapkan
```
🗓️ getAttendanceDate: {
  input: "2025-06-03T14:04:00.000Z",
  inputLocal: "3/6/2025",
  normalized: "2025-06-03T00:00:00.000Z",
  normalizedLocal: "3/6/2025"
}

📅 CheckOut - Using normalized today date: 2025-06-03T00:00:00.000Z

📊 getAttendanceStats - Using normalized today date: {
  today: "2025-06-03T00:00:00.000Z",
  todayLocal: "3/6/2025",
  currentDate: "2025-06-03T14:04:00.000Z"
}
```

## Dampak Perbaikan

### 1. Konsistensi Data
- Semua operasi attendance menggunakan tanggal yang sama
- Check-in, check-out, dan dashboard sinkron
- Tidak ada lagi masalah "attendance tidak ditemukan"

### 2. User Experience
- Dashboard menampilkan status yang akurat
- Tidak ada kebingungan tentang tanggal attendance
- Operasi check-out berfungsi dengan benar

### 3. Data Integrity
- Unique constraint bekerja dengan benar
- Tidak ada duplicate attendance records
- Audit trail yang akurat

## Testing yang Disarankan

### 1. Manual Testing
- Lakukan check-in pada hari ini
- Refresh dashboard, pastikan status "Sudah Absen Masuk"
- Lakukan check-out pada hari yang sama
- Refresh dashboard, pastikan status "Sudah Absen Pulang"

### 2. Edge Case Testing
- Test pada pergantian hari (23:59 -> 00:01)
- Test dengan timezone yang berbeda
- Test dengan multiple users secara bersamaan

### 3. Database Verification
- Periksa field `attendanceDate` di database
- Pastikan semua record memiliki waktu 00:00:00.000
- Verifikasi tidak ada duplicate records per user per hari
