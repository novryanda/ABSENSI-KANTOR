# Sistem Validasi Kehadiran Berbasis Lokasi GPS

## Overview

Sistem validasi kehadiran berbasis lokasi GPS telah diimplementasikan untuk memastikan karyawan melakukan check-in/check-out dari lokasi yang telah ditentukan. Sistem ini menggunakan koordinat GPS dan validasi radius dengan toleransi 100 meter.

## Fitur Utama

### 1. **Validasi GPS Koordinat**
- Validasi koordinat GPS saat check-in dan check-out
- Menggunakan Haversine formula untuk perhitungan jarak akurat
- Toleransi radius 100 meter dari lokasi kantor yang ditentukan
- Feedback real-time kepada pengguna tentang status lokasi

### 2. **Manajemen Lokasi Kantor (Super Admin)**
- Interface manual untuk input koordinat kantor
- Pengaturan radius validasi per lokasi (10-1000 meter)
- CRUD operations untuk lokasi kantor
- Aktivasi/deaktivasi lokasi kantor
- Tombol "Gunakan Lokasi Saat Ini" untuk kemudahan

### 3. **User Experience**
- Loading indicator saat mendapatkan lokasi GPS
- Error handling untuk berbagai kondisi GPS
- Feedback visual dengan emoji dan warna
- Informasi jarak dari kantor dan status validasi

### 4. **Security & Audit**
- Validasi koordinat di frontend dan backend
- Audit logging untuk semua aktivitas attendance
- Pencegahan spoofing dengan validasi tambahan
- Penyimpanan koordinat GPS untuk audit trail

## Implementasi Teknis

### Database Schema

```sql
-- Office Locations
model OfficeLocation {
  id           String   @id @default(cuid())
  name         String   @unique
  code         String   @unique
  address      String?
  latitude     Decimal  @db.Decimal(10, 8)
  longitude    Decimal  @db.Decimal(11, 8)
  radiusMeters Int      @default(100)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  attendances   Attendance[]
}

-- Attendance with GPS coordinates
model Attendance {
  id                  String           @id @default(cuid())
  userId              String
  officeLocationId    String?
  attendanceDate      DateTime         @db.Date
  checkInTime         DateTime?        @db.Time
  checkOutTime        DateTime?        @db.Time
  checkInLatitude     Decimal?         @db.Decimal(10, 8)
  checkInLongitude    Decimal?         @db.Decimal(11, 8)
  checkOutLatitude    Decimal?         @db.Decimal(10, 8)
  checkOutLongitude   Decimal?         @db.Decimal(11, 8)
  checkInAddress      String?
  checkOutAddress     String?
  status              AttendanceStatus @default(PRESENT)
  notes               String?
  workingHoursMinutes Int              @default(0)
  isValidLocation     Boolean          @default(true)
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  user           User            @relation(fields: [userId], references: [id])
  officeLocation OfficeLocation? @relation(fields: [officeLocationId], references: [id])
}
```

### API Endpoints

#### Check-in dengan Validasi Lokasi
```typescript
POST /api/attendance/check-in
{
  "latitude": 0.4647298976760957,
  "longitude": 101.41050382578146,
  "address": "Optional address"
}

Response:
{
  "success": true,
  "data": {
    "id": "attendance_id",
    "checkInTime": "2024-01-01T08:00:00Z",
    "isValidLocation": true,
    "locationValidation": {
      "isValid": true,
      "nearestOfficeLocation": {
        "id": "office_id",
        "name": "Kantor Pusat",
        "distance": 45
      },
      "distance": 45,
      "allowedRadius": 100
    }
  }
}
```

#### Check-out dengan Validasi Lokasi
```typescript
POST /api/attendance/check-out
{
  "latitude": 0.4647298976760957,
  "longitude": 101.41050382578146,
  "address": "Optional address"
}

Response:
{
  "success": true,
  "data": {
    "workingHours": "8h 30m",
    "locationValidation": {
      "isValid": false,
      "distance": 150,
      "allowedRadius": 100,
      "errorMessage": "Anda berada di luar radius yang diizinkan..."
    }
  }
}
```

### Core Services

#### LocationValidationService
```typescript
class LocationValidationService {
  // Validasi lokasi user terhadap office locations aktif
  async validateUserLocation(
    userLatitude: number,
    userLongitude: number,
    toleranceMeters: number = 100
  ): Promise<LocationValidationResult>

  // Validasi terhadap office location spesifik
  async validateAgainstOfficeLocation(
    userLatitude: number,
    userLongitude: number,
    officeLocationId: string,
    toleranceMeters: number = 100
  ): Promise<LocationValidationResult>

  // Perhitungan jarak menggunakan Haversine formula
  calculateDistance(
    coord1: LocationCoordinates,
    coord2: LocationCoordinates
  ): number
}
```

## Komponen UI

### 1. **LocationPicker Component**
- Input manual untuk latitude/longitude
- Pengaturan radius dengan visual feedback
- Tombol "Gunakan Lokasi Saat Ini"
- Informasi koordinat dan format yang jelas
- Validasi input koordinat real-time

### 2. **Dashboard Integration**
- Status lokasi pada QuickActions
- Indikator validasi lokasi (✅ Valid / ⚠️ Di luar radius)
- Informasi jarak dari kantor
- Feedback real-time saat check-in/check-out

### 3. **Office Location Management**
- Tabel lokasi kantor dengan search & pagination
- Form dengan input koordinat manual
- Status aktif/nonaktif
- Bulk operations

## Konfigurasi

### Environment Variables
```env
# Default office coordinates (Pekanbaru)
DEFAULT_OFFICE_LATITUDE=0.4647298976760957
DEFAULT_OFFICE_LONGITUDE=101.41050382578146
DEFAULT_OFFICE_RADIUS=100
```

### Default Settings
- **Radius Toleransi**: 100 meter
- **Timeout GPS**: 15 detik
- **Koordinat Default**: Pekanbaru (0.4647298976760957, 101.41050382578146)
- **Format Koordinat**: Decimal Degrees (DD)

## User Roles & Permissions

### Super Admin
- ✅ Kelola lokasi kantor (CRUD)
- ✅ Atur koordinat dan radius
- ✅ Aktivasi/deaktivasi lokasi
- ✅ Lihat audit logs lokasi

### HR Admin
- ✅ Lihat lokasi kantor
- ✅ Lihat laporan attendance dengan validasi lokasi
- ❌ Edit lokasi kantor

### Employee/Manager/Supervisor
- ✅ Check-in/check-out dengan validasi lokasi
- ✅ Lihat status validasi lokasi pribadi
- ❌ Akses manajemen lokasi

## User Experience Flow

### **Check-in Process:**
1. User klik "Absen Masuk"
2. System request GPS permission
3. Loading toast: "Memproses Check-in - Mendapatkan lokasi Anda..."
4. GPS coordinates diperoleh
5. Validasi terhadap office locations (100m radius)
6. Feedback detail:
   - ✅ "Check-in Berhasil - Lokasi valid di Kantor Pusat. Jarak: 45m (Radius: 100m)"
   - ⚠️ "Check-in Berhasil - Lokasi di luar radius Kantor Pusat. Jarak: 150m (Maks: 100m)"

### **Super Admin Location Management:**
1. Akses Office Locations page
2. Create/Edit location dengan form interface
3. Input manual coordinates atau gunakan "Lokasi Saat Ini"
4. Set radius dengan input field
5. Preview informasi koordinat dan radius

## Error Handling

### GPS Errors
```typescript
// Permission denied
"Akses lokasi ditolak. Mohon izinkan akses lokasi di browser Anda."

// Position unavailable
"Lokasi tidak tersedia. Pastikan GPS aktif."

// Timeout
"Timeout mendapatkan lokasi. Coba lagi."

// Outside radius
"Anda berada di luar radius yang diizinkan untuk Kantor Pusat. Jarak: 150m, Radius maksimal: 100m"
```

### Fallback Behavior
- Check-out tetap dapat dilakukan tanpa GPS jika diperlukan
- Warning ditampilkan jika lokasi tidak dapat diakses
- Audit log tetap mencatat attempt dengan status error

## Testing

### Test Scenarios
1. **Valid Location**: Check-in dalam radius 100m
2. **Invalid Location**: Check-in di luar radius
3. **GPS Unavailable**: Check-in tanpa akses GPS
4. **Multiple Offices**: Validasi terhadap office terdekat
5. **Permission Denied**: Handling error GPS permission

### Test Data
```typescript
// Test coordinates (Pekanbaru area)
const validCoordinates = {
  latitude: 0.4647298976760957,
  longitude: 101.41050382578146
}

const invalidCoordinates = {
  latitude: 0.4657298976760957, // ~1km away
  longitude: 101.42050382578146
}
```

## Monitoring & Analytics

### Metrics to Track
- Attendance validation success rate
- GPS accuracy and availability
- Location-based attendance patterns
- Invalid location attempts
- System performance metrics

### Audit Logs
- Semua attempt check-in/check-out dengan koordinat
- Perubahan konfigurasi lokasi kantor
- Error GPS dan handling
- Performance metrics

## Future Enhancements

### Planned Features
1. **Geofencing**: Notifikasi otomatis saat masuk/keluar area kantor
2. **Multiple Locations**: Support untuk karyawan dengan multiple office assignments
3. **Offline Support**: Caching lokasi untuk validasi offline
4. **Advanced Analytics**: Heat maps dan pattern analysis
5. **Mobile App**: Native mobile app dengan better GPS handling

### Technical Improvements
1. **PostGIS Integration**: Database-level geospatial queries
2. **Redis Caching**: Cache office locations untuk performance
3. **WebSocket**: Real-time location updates
4. **Machine Learning**: Anomaly detection untuk attendance patterns
