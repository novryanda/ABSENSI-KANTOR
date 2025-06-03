# Location-Based Attendance Validation Implementation

## Overview
Implementasi validasi lokasi berbasis GPS untuk sistem absensi dengan radius 100m menggunakan formula Haversine. Sistem akan mencegah absensi jika pengguna berada di luar radius yang diizinkan.

## Fitur yang Diimplementasikan

### 1. **GPS Radius Validation**
- ✅ Validasi koordinat GPS menggunakan formula Haversine
- ✅ Toleransi radius 100m sesuai requirement
- ✅ Validasi terhadap semua lokasi kantor aktif
- ✅ Pencegahan absensi jika di luar radius

### 2. **User Feedback dalam Bahasa Indonesia**
- ✅ Pesan error: "Anda tidak dapat melakukan absensi karena berada di luar radius lokasi kantor yang terdaftar"
- ✅ Informasi detail lokasi terdekat dan jarak
- ✅ Toast notification dengan durasi 8 detik untuk error lokasi
- ✅ Status HTTP 422 untuk location validation errors

### 3. **Date-based Attendance Tracking**
- ✅ Validasi duplikasi absensi per tanggal
- ✅ Normalisasi tanggal untuk konsistensi
- ✅ Timezone handling yang tepat
- ✅ Grouping riwayat absensi berdasarkan tanggal

### 4. **Audit Logging untuk Failed Attempts**
- ✅ Log percobaan check-in yang gagal
- ✅ Log percobaan check-out yang gagal
- ✅ Tracking IP address dan user agent
- ✅ Metadata lengkap untuk security monitoring

## Perubahan Kode

### Use Cases
1. **CheckInWithLocationValidation.ts**
   - Menambahkan validasi lokasi sebelum membuat record absensi
   - Mencegah check-in jika lokasi tidak valid
   - Audit logging untuk failed attempts

2. **CheckOutWithLocationValidation.ts**
   - Menambahkan validasi lokasi untuk check-out
   - Mencegah check-out jika lokasi tidak valid
   - Audit logging untuk failed attempts

### Infrastructure
3. **AttendanceAuditService.ts**
   - Menambahkan method `logFailedCheckInAttempt`
   - Menambahkan method `logFailedCheckOutAttempt`
   - Support untuk action types: 'FAILED_CHECK_IN', 'FAILED_CHECK_OUT'

4. **LocationValidationService.ts**
   - Peningkatan pesan error dalam bahasa Indonesia
   - Pesan error yang lebih informatif dengan detail lokasi

### API Routes
5. **check-in/route.ts & check-out/route.ts**
   - HTTP status 422 untuk location validation errors
   - Response yang menyertakan locationValidation data
   - Error handling yang lebih spesifik

### Frontend
6. **dashboard/page.tsx**
   - Handling khusus untuk status 422 (location validation error)
   - Toast notification dengan informasi detail lokasi
   - Durasi toast 8 detik untuk error lokasi
   - Format pesan yang user-friendly

## Contoh Response Error

### Check-in Gagal (Status 422)
```json
{
  "success": false,
  "error": "Anda tidak dapat melakukan absensi karena berada di luar radius lokasi kantor yang terdaftar. Lokasi terdekat: Kantor Pusat (Jarak: 150m, Radius maksimal: 100m)",
  "locationValidation": {
    "isValid": false,
    "nearestOfficeLocation": {
      "id": "office-1",
      "name": "Kantor Pusat",
      "code": "HQ",
      "distance": 150
    },
    "distance": 150,
    "allowedRadius": 100,
    "errorMessage": "Anda tidak dapat melakukan absensi karena berada di luar radius lokasi kantor yang terdaftar. Lokasi: Kantor Pusat (Jarak: 150m, Radius maksimal: 100m)"
  }
}
```

## User Experience

### Sebelum Implementasi
- Absensi tetap berhasil meskipun di luar radius
- Hanya ditandai sebagai `isValidLocation: false`
- User tidak mendapat feedback yang jelas

### Setelah Implementasi
- Absensi dicegah jika di luar radius
- Pesan error yang jelas dalam bahasa Indonesia
- Informasi detail lokasi terdekat dan jarak
- Audit trail untuk monitoring keamanan

## Testing

Untuk menguji implementasi:

1. **Test Valid Location**
   - Koordinat dalam radius 100m dari office location
   - Absensi berhasil dengan feedback positif

2. **Test Invalid Location**
   - Koordinat di luar radius 100m
   - Absensi dicegah dengan error message
   - Audit log tercatat

3. **Test Edge Cases**
   - Tepat di batas radius (100m)
   - Tidak ada office location aktif
   - Koordinat tidak valid

## Security & Monitoring

- Semua failed attempts dicatat dalam audit log
- IP address dan user agent tracking
- Metadata lengkap untuk analisis security
- Unique ID untuk setiap failed attempt

## Konsistensi dengan Clean Architecture

- Domain layer: Repository interfaces tidak berubah
- Use case layer: Business logic untuk location validation
- Infrastructure layer: Audit service dan location validation
- Presentation layer: API routes dan frontend handling
- Separation of concerns tetap terjaga
