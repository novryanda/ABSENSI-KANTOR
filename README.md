# 📍 GeoAttendance - Sistem Absensi Berbasis Lokasi


## 📋 Ringkasan

GeoAttendance adalah sistem absensi modern berbasis web yang memverifikasi kehadiran pengguna berdasarkan lokasi geografis mereka. Sistem ini menggunakan koordinat GPS untuk memastikan pengguna benar-benar hadir di lokasi yang ditentukan saat menandai kehadiran, menjadikannya ideal untuk sekolah, kantor, acara, dan operasi lapangan.

## ✨ Fitur Utama

- **📱 Antarmuka Ramah Seluler**: Desain responsif yang berfungsi dengan mulus di berbagai perangkat
- **🗺️ Verifikasi Geolokasi**: Validasi kehadiran berdasarkan koordinat GPS yang tepat
- **🔒 Autentikasi Aman**: Autentikasi multi-faktor untuk mencegah kecurangan absensi
- **💼 Manajemen Organisasi**: Buat dan kelola beberapa lokasi untuk organisasi Anda
- **👥 Peran & Izin Pengguna**: Kontrol akses tingkat admin, manajer, dan pengguna
- **📊 Pelaporan & Analitik**: Laporan kehadiran dan wawasan komprehensif
- **🔔 Notifikasi**: Peringatan real-time untuk check-in yang berhasil/gagal
- **🔄 Dukungan Offline**: Antrean check-in saat masalah konektivitas

## 🛠️ Teknologi yang Digunakan

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Autentikasi**: JWT, NextAuth.js
- **Geolokasi**: API Geolokasi Browser
- **Deployment**: Vercel

## 🚀 Memulai

### Prasyarat

- Node.js 18.x atau lebih baru
- Package manager npm atau yarn
- PostgreSQL (lokal atau hosting)

### Instalasi

1. Klon repositori
```bash
https://github.com/novryanda/ABSENSI-KANTOR.git
```

2. Instal dependensi
```bash
npm install
# atau
yarn install
```

3. Siapkan variabel lingkungan
Buat file `.env.local` di direktori root dengan variabel berikut:
```
DATABASE_URL="postgresql://username:password@localhost:5432/absensi-kantor"
NEXTAUTH_SECRET=secret_nextauth_anda
NEXTAUTH_URL=http://localhost:3000
```

4. Jalankan server pengembangan
```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
# atau
bun dev
```

5. Buka [http://localhost:3000](http://localhost:3000) dengan browser Anda untuk melihat aplikasi.

## 📱 Panduan Penggunaan

### Untuk Administrator

1. **Pengaturan Organisasi**: Tetapkan organisasi Anda dan buat batas lokasi
2. **Kelola Pengguna**: Tambahkan pengguna dan tetapkan peran yang sesuai
3. **Konfigurasi Aturan Check-in**: Tetapkan jadwal kehadiran dan parameter lokasi
4. **Pantau Kehadiran**: Lihat data kehadiran real-time dan hasilkan laporan

### Untuk Pengguna

1. **Login**: Akses sistem menggunakan kredensial Anda
2. **Aktifkan Lokasi**: Izinkan akses lokasi saat diminta
3. **Check-in**: Ketuk tombol check-in saat berada di lokasi yang ditentukan
4. **Lihat Riwayat**: Akses riwayat kehadiran pribadi Anda

## 🔍 Cara Kerja

1. **Penentuan Lokasi**: Admin menentukan area check-in yang valid dengan menetapkan batas koordinat
2. **Verifikasi Lokasi**: Saat check-in, sistem membandingkan koordinat pengguna saat ini dengan batas yang ditentukan
3. **Pencatatan Kehadiran**: Check-in yang valid dicatat dengan data stempel waktu dan lokasi
4. **Analisis Data**: Sistem memproses data kehadiran untuk menghasilkan wawasan dan laporan

## 📁 Struktur Proyek

```
/
├── prisma/                 # Skema Prisma dan file migrasi
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/                # Routing dan komponen UI (App Router Next.js)
│   │   ├── api/
│   │   │   └── auth/       # API Routes untuk autentikasi
│   │   │       └── [...nextauth]/route.ts
│   │   └── page.tsx        # Halaman utama
│   ├── components/         # Komponen UI yang dapat digunakan kembali
│   ├── domain/             # Entitas dan antarmuka (Entities)
│   │   └── user.ts
│   ├── use-cases/          # Logika bisnis (Use Cases)
│   │   └── user/
│   │       └── createUser.ts
│   ├── infrastructure/     # Implementasi detail seperti Prisma Client
│   │   ├── prismaClient.ts
│   │   └── auth/           # Konfigurasi NextAuth.js
│   │       └── authOptions.ts
│   ├── services/           # Layanan eksternal atau utilitas
│   ├── utils/              # Fungsi utilitas umum
│   └── types/              # Tipe TypeScript global
├── .env                    # Variabel lingkungan
├── next.config.js          # Konfigurasi Next.js
├── package.json
└── tsconfig.json
```

## 🔐 Pertimbangan Keamanan

- Enkripsi transmisi data lokasi
- Pencegahan pemalsuan GPS melalui metode verifikasi tambahan
- Kepatuhan privasi data dengan regulasi terkait
- Audit keamanan dan pembaruan rutin

## 📈 Pengembangan Mendatang

- Integrasi dengan API Google Maps untuk visualisasi lokasi yang lebih baik
- Pengembangan fitur geofencing yang lebih canggih
- Optimalisasi untuk penggunaan baterai yang lebih efisien
- Dukungan untuk perangkat dengan iOS dan Android

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan kirimkan Pull Request.



## 📞 Dukungan

Untuk mendapatkan dukungan, kirim email ke novryandareza0@gmail.com atau buat isu di repositori.

---

Dibuat dengan ❤️ menggunakan Next.js
