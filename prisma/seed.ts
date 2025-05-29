import { PrismaClient, Decimal } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seeding untuk Instansi Pemerintahan...')

    // ============================================================================
    // SYSTEM SETTINGS
    // ============================================================================

    const systemSettings = [
        // General Settings
        {
            key: 'INSTITUTION_NAME',
            value: 'Dinas Komunikasi dan Informatika Kota Pekanbaru',
            description: 'Nama instansi pemerintahan',
            dataType: 'string',
            category: 'general',
            isEditable: true
        },
        {
            key: 'INSTITUTION_ADDRESS',
            value: 'Jl. Jenderal Sudirman No. 377, Pekanbaru, Riau',
            description: 'Alamat instansi',
            dataType: 'string',
            category: 'general',
            isEditable: true
        },
        {
            key: 'HEAD_OF_INSTITUTION',
            value: 'Dr. H. Ahmad Syahrial, S.Kom, M.Si',
            description: 'Kepala Dinas',
            dataType: 'string',
            category: 'general',
            isEditable: true
        },
        // Attendance Settings - sesuai jam kerja PNS
        {
            key: 'WORKING_HOURS_PER_DAY',
            value: '7.5',
            description: 'Jam kerja PNS per hari (dalam jam)',
            dataType: 'number',
            category: 'attendance',
            isEditable: false
        },
        {
            key: 'MORNING_START_TIME',
            value: '07:30',
            description: 'Jam masuk pagi',
            dataType: 'time',
            category: 'attendance',
            isEditable: true
        },
        {
            key: 'MORNING_END_TIME',
            value: '12:00',
            description: 'Jam pulang siang',
            dataType: 'time',
            category: 'attendance',
            isEditable: true
        },
        {
            key: 'AFTERNOON_START_TIME',
            value: '13:00',
            description: 'Jam masuk siang',
            dataType: 'time',
            category: 'attendance',
            isEditable: true
        },
        {
            key: 'AFTERNOON_END_TIME',
            value: '16:00',
            description: 'Jam pulang sore',
            dataType: 'time',
            category: 'attendance',
            isEditable: true
        },
        {
            key: 'LATE_TOLERANCE_MINUTES',
            value: '10',
            description: 'Toleransi keterlambatan PNS (dalam menit)',
            dataType: 'number',
            category: 'attendance',
            isEditable: true
        },
        {
            key: 'FINGERPRINT_REQUIRED',
            value: 'true',
            description: 'Wajib absen fingerprint',
            dataType: 'boolean',
            category: 'attendance',
            isEditable: true
        },
        // Leave Settings - sesuai PP No. 11 Tahun 2017
        {
            key: 'ANNUAL_LEAVE_ALLOCATION',
            value: '12',
            description: 'Cuti tahunan PNS (hari)',
            dataType: 'number',
            category: 'leave',
            isEditable: false
        },
        {
            key: 'SICK_LEAVE_MAX_DAYS',
            value: '14',
            description: 'Cuti sakit maksimal berturut-turut (hari)',
            dataType: 'number',
            category: 'leave',
            isEditable: false
        },
        {
            key: 'MATERNITY_LEAVE_DAYS',
            value: '90',
            description: 'Cuti melahirkan (hari)',
            dataType: 'number',
            category: 'leave',
            isEditable: false
        },
        {
            key: 'PATERNITY_LEAVE_DAYS',
            value: '7',
            description: 'Cuti ayah (hari)',
            dataType: 'number',
            category: 'leave',
            isEditable: false
        },
        // System Settings
        {
            key: 'SIMPEG_INTEGRATION',
            value: 'enabled',
            description: 'Integrasi dengan SIMPEG',
            dataType: 'string',
            category: 'system',
            isEditable: true
        },
        {
            key: 'E_OFFICE_INTEGRATION',
            value: 'enabled',
            description: 'Integrasi dengan e-Office',
            dataType: 'string',
            category: 'system',
            isEditable: true
        },
        {
            key: 'SYSTEM_VERSION',
            value: '1.0.0',
            description: 'Versi sistem absensi',
            dataType: 'string',
            category: 'system',
            isEditable: false
        }
    ]

    for (const setting of systemSettings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            update: setting,
            create: setting
        })
    }

    console.log('✅ System settings seeded')

    // ============================================================================
    // ROLES - Sesuai Hierarki PNS/ASN
    // ============================================================================

    const roles = [
        {
            name: 'Administrator Sistem',
            description: 'Administrator sistem absensi dengan akses penuh',
            permissions: {
                users: ['create', 'read', 'update', 'delete'],
                departments: ['create', 'read', 'update', 'delete'],
                attendance: ['create', 'read', 'update', 'delete'],
                requests: ['create', 'read', 'update', 'delete', 'approve'],
                reports: ['read', 'export'],
                settings: ['read', 'update'],
                audit: ['read']
            }
        },
        {
            name: 'Kepala Dinas',
            description: 'Kepala instansi dengan akses persetujuan tingkat atas',
            permissions: {
                users: ['read'],
                departments: ['read'],
                attendance: ['read'],
                requests: ['read', 'approve'],
                reports: ['read', 'export']
            }
        },
        {
            name: 'Sekretaris Dinas',
            description: 'Sekretaris dengan akses persetujuan dan koordinasi',
            permissions: {
                users: ['read', 'update'],
                departments: ['read', 'update'],
                attendance: ['read', 'update'],
                requests: ['read', 'approve'],
                reports: ['read', 'export']
            }
        },
        {
            name: 'Kepala Bidang',
            description: 'Kepala bidang dengan akses persetujuan bidang',
            permissions: {
                users: ['read'],
                attendance: ['read'],
                requests: ['read', 'approve'],
                reports: ['read']
            }
        },
        {
            name: 'Kepala Sub Bagian',
            description: 'Kepala sub bagian dengan akses terbatas',
            permissions: {
                users: ['read'],
                attendance: ['read'],
                requests: ['read', 'approve']
            }
        },
        {
            name: 'Staff/Pelaksana',
            description: 'PNS pelaksana/staff biasa',
            permissions: {
                attendance: ['create', 'read'],
                requests: ['create', 'read'],
                profile: ['read', 'update']
            }
        },
        {
            name: 'PPPK',
            description: 'Pegawai Pemerintah dengan Perjanjian Kerja',
            permissions: {
                attendance: ['create', 'read'],
                requests: ['create', 'read'],
                profile: ['read', 'update']
            }
        }
    ]

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: role,
            create: role
        })
    }

    console.log('✅ Roles seeded')

    // ============================================================================
    // OFFICE LOCATIONS - Lokasi Kantor Pemerintahan
    // ============================================================================

    const officeLocations = [
        {
            name: 'Kantor Dinas Kominfo Kota Pekanbaru',
            code: 'KOMINFO-PKU',
            address: 'Jl. Jenderal Sudirman No. 377, Sukajadi, Pekanbaru',
            latitude: new Decimal(0.5071),
            longitude: new Decimal(101.4478),
            radiusMeters: 100
        },
        {
            name: 'Gedung Data Center',
            code: 'DC-PKU',
            address: 'Jl. Diponegoro No. 12, Pekanbaru',
            latitude: new Decimal(0.5074),
            longitude: new Decimal(101.4468),
            radiusMeters: 50
        },
        {
            name: 'Kantor Pelayanan Terpadu',
            code: 'KPT-PKU',
            address: 'Jl. Ahmad Yani No. 108, Pekanbaru',
            latitude: new Decimal(0.5083),
            longitude: new Decimal(101.4512),
            radiusMeters: 80
        },
        {
            name: 'Balai Pelatihan ICT',
            code: 'ICT-CENTER',
            address: 'Jl. Garuda Sakti KM 3, Panam, Pekanbaru',
            latitude: new Decimal(0.4729),
            longitude: new Decimal(101.3952),
            radiusMeters: 150
        }
    ]

    for (const location of officeLocations) {
        await prisma.officeLocation.upsert({
            where: { code: location.code },
            update: location,
            create: location
        })
    }

    console.log('✅ Office locations seeded')

    // ============================================================================
    // DEPARTMENTS - Struktur Organisasi Dinas
    // ============================================================================

    // Create parent departments first - sesuai struktur dinas
    const parentDepartments = [
        {
            code: 'SEKRETARIAT',
            name: 'Sekretariat',
            description: 'Sekretariat Dinas Komunikasi dan Informatika'
        },
        {
            code: 'KOMINFO',
            name: 'Bidang Komunikasi dan Informasi Publik',
            description: 'Bidang yang menangani komunikasi dan informasi publik'
        },
        {
            code: 'APTIKA',
            name: 'Bidang Aplikasi dan Tata Kelola TIK',
            description: 'Bidang aplikasi dan tata kelola teknologi informasi'
        },
        {
            code: 'INFRASTRUKTUR',
            name: 'Bidang Infrastruktur TIK',
            description: 'Bidang infrastruktur teknologi informasi dan komunikasi'
        },
        {
            code: 'STATISTIK',
            name: 'Bidang Statistik dan Persandian',
            description: 'Bidang statistik dan persandian'
        }
    ]

    for (const dept of parentDepartments) {
        await prisma.department.upsert({
            where: { code: dept.code },
            update: dept,
            create: dept
        })
    }

    // Create child departments - Sub Bagian
    const childDepartments = [
        // Sekretariat
        {
            code: 'UMUM',
            name: 'Sub Bagian Umum dan Kepegawaian',
            description: 'Sub bagian yang menangani administrasi umum dan kepegawaian',
            parentCode: 'SEKRETARIAT'
        },
        {
            code: 'KEUANGAN',
            name: 'Sub Bagian Keuangan',
            description: 'Sub bagian yang menangani keuangan dan aset',
            parentCode: 'SEKRETARIAT'
        },
        {
            code: 'PROGRAM',
            name: 'Sub Bagian Program',
            description: 'Sub bagian perencanaan dan program',
            parentCode: 'SEKRETARIAT'
        },
        // Bidang Komunikasi dan Informasi Publik
        {
            code: 'HUMAS',
            name: 'Seksi Hubungan Masyarakat',
            description: 'Seksi hubungan masyarakat dan protokol',
            parentCode: 'KOMINFO'
        },
        {
            code: 'INFORMASI',
            name: 'Seksi Informasi Publik',
            description: 'Seksi pengelolaan informasi publik',
            parentCode: 'KOMINFO'
        },
        // Bidang Aplikasi dan Tata Kelola TIK
        {
            code: 'APLIKASI',
            name: 'Seksi Pengembangan Aplikasi',
            description: 'Seksi pengembangan aplikasi dan sistem informasi',
            parentCode: 'APTIKA'
        },
        {
            code: 'TATAKELOLA',
            name: 'Seksi Tata Kelola TIK',
            description: 'Seksi tata kelola teknologi informasi dan komunikasi',
            parentCode: 'APTIKA'
        },
        // Bidang Infrastruktur TIK
        {
            code: 'JARINGAN',
            name: 'Seksi Jaringan dan Keamanan',
            description: 'Seksi jaringan dan keamanan informasi',
            parentCode: 'INFRASTRUKTUR'
        },
        {
            code: 'DATACENTER',
            name: 'Seksi Data Center dan Cloud',
            description: 'Seksi pengelolaan data center dan cloud computing',
            parentCode: 'INFRASTRUKTUR'
        },
        // Bidang Statistik dan Persandian
        {
            code: 'STATISTIK-SEKTORAL',
            name: 'Seksi Statistik Sektoral',
            description: 'Seksi statistik sektoral dan sensus',
            parentCode: 'STATISTIK'
        },
        {
            code: 'PERSANDIAN',
            name: 'Seksi Persandian',
            description: 'Seksi persandian dan keamanan siber',
            parentCode: 'STATISTIK'
        }
    ]

    for (const dept of childDepartments) {
        const parentDept = await prisma.department.findUnique({ where: { code: dept.parentCode } })
        if (parentDept) {
            await prisma.department.upsert({
                where: { code: dept.code },
                update: {
                    name: dept.name,
                    description: dept.description,
                    parentDepartmentId: parentDept.id
                },
                create: {
                    code: dept.code,
                    name: dept.name,
                    description: dept.description,
                    parentDepartmentId: parentDept.id
                }
            })
        }
    }

    console.log('✅ Departments seeded')

    // ============================================================================
    // USERS - Pegawai Pemerintahan
    // ============================================================================

    const hashedPassword = await bcrypt.hash('password123', 12)

    const users = [
        // Pimpinan Dinas
        {
            nip: '196505151990031001',
            name: 'Dr. H. Ahmad Syahrial, S.Kom, M.Si',
            email: 'kepala.dinas@pekanbarukota.go.id',
            passwordHash: hashedPassword,
            phone: '+6276142001',
            birthDate: new Date('1965-05-15'),
            gender: 'MALE' as const,
            address: 'Jl. Tuanku Tambusai No. 15, Pekanbaru',
            hireDate: new Date('1990-03-01'),
            departmentCode: 'KOMINFO',
            roleName: 'Kepala Dinas'
        },
        // Sekretaris Dinas
        {
            nip: '197203101995032001',
            name: 'Dra. Hj. Siti Nurhaliza, M.AP',
            email: 'sekretaris@pekanbarukota.go.id',
            passwordHash: hashedPassword,
            phone: '+6276142002',
            birthDate: new Date('1972-03-10'),
            gender: 'FEMALE' as const,
            address: 'Jl. Soekarno Hatta No. 88, Pekanbaru',
            hireDate: new Date('1995-03-01'),
            departmentCode: 'SEKRETARIAT',
            roleName: 'Sekretaris Dinas'
        },
        // Administrator Sistem
        {
            nip: '198505221010121001',
            name: 'Rizki Maulana Hakim, S.Kom',
            email: 'admin.sistem@pekanbarukota.go.id',
            passwordHash: hashedPassword,
            phone: '+628123456789',
            birthDate: new Date('1985-05-22'),
            gender: 'MALE' as const,
            address: 'Jl. HR Soebrantas No. 45, Panam, Pekanbaru',
            hireDate: new Date('2010-12-01'),
            departmentCode: 'APLIKASI',
            roleName: 'Administrator Sistem'
        },
        // Kepala Bidang Aplikasi dan Tata Kelola TIK
        {
            nip: '198001152005011002',
            name: 'Ir. Bambang Setiawan, M.T',
            email: 'kabid.aptika@pekanbarukota.go.id',
            passwordHash: hashedPassword,
            phone: '+6276142003',
            birthDate: new Date('1980-01-15'),
            gender: 'MALE' as const,
            address: 'Jl. Ahmad Yani No. 67, Pekanbaru',
            hireDate: new Date('2005-01-01'),
            departmentCode: 'APTIKA',
            roleName: 'Kepala Bidang'
        },
        // Staff Pengembangan Aplikasi
        {
            nip: '199204281015121002',
            name: 'Andi Pratama, S.Kom',
            email: 'andi.pratama@pekanbarukota.go.id',
            passwordHash: hashedPassword,
            phone: '+628123456790',
            birthDate: new Date('1992-04-28'),
            gender: 'MALE' as const,
            address: 'Jl. Hangtuah No. 123, Pekanbaru',
            hireDate: new Date('2015-12-01'),
            departmentCode: 'APLIKASI',
            roleName: 'Staff/Pelaksana'
        },
        // Staff Hubungan Masyarakat
        {
            nip: '199008151018032001',
            name: 'Lisa Andriani, S.Sos',
            email: 'lisa.humas@pekanbarukota.go.id',
            passwordHash: hashedPassword,
            phone: '+628123456791',
            birthDate: new Date('1990-08-15'),
            gender: 'FEMALE' as const,
            address: 'Jl. Pepaya No. 78, Pekanbaru',
            hireDate: new Date('2018-03-01'),
            departmentCode: 'HUMAS',
            roleName: 'Staff/Pelaksana'
        },
        // Kepala Sub Bagian Umum
        {
            nip: '197809122003121001',
            name: 'Drs. Agus Salim, M.AP',
            email: 'kasubag.umum@pekanbarukota.go.id',
            passwordHash: hashedPassword,
            phone: '+6276142004',
            birthDate: new Date('1978-09-12'),
            gender: 'MALE' as const,
            address: 'Jl. Diponegoro No. 34, Pekanbaru',
            hireDate: new Date('2003-12-01'),
            departmentCode: 'UMUM',
            roleName: 'Kepala Sub Bagian'
        },
        // Staff Jaringan
        {
            nip: '198807051012121001',
            name: 'Rudi Hermawan, A.Md.Kom',
            email: 'rudi.jaringan@pekanbarukota.go.id',
            passwordHash: hashedPassword,
            phone: '+628123456792',
            birthDate: new Date('1988-07-05'),
            gender: 'MALE' as const,
            address: 'Jl. Garuda Sakti KM 5, Pekanbaru',
            hireDate: new Date('2012-12-01'),
            departmentCode: 'JARINGAN',
            roleName: 'Staff/Pelaksana'
        },
        // Staff Statistik - PPPK
        {
            nip: '199305201020032002',
            name: 'Maya Sari, S.Si',
            email: 'maya.statistik@pekanbarukota.go.id',
            passwordHash: hashedPassword,
            phone: '+628123456793',
            birthDate: new Date('1993-05-20'),
            gender: 'FEMALE' as const,
            address: 'Jl. Sutan Syahrir No. 56, Pekanbaru',
            hireDate: new Date('2020-03-01'),
            departmentCode: 'STATISTIK-SEKTORAL',
            roleName: 'PPPK'
        },
        // Staff Persandian
        {
            nip: '199101081014121001',
            name: 'Fadli Rahman, S.Kom',
            email: 'fadli.sandi@pekanbarukota.go.id',
            passwordHash: hashedPassword,
            phone: '+628123456794',
            birthDate: new Date('1991-01-08'),
            gender: 'MALE' as const,
            address: 'Jl. Riau No. 90, Pekanbaru',
            hireDate: new Date('2014-12-01'),
            departmentCode: 'PERSANDIAN',
            roleName: 'Staff/Pelaksana'
        }
    ]

    for (const user of users) {
        const department = await prisma.department.findUnique({ where: { code: user.departmentCode } })
        const role = await prisma.role.findUnique({ where: { name: user.roleName } })

        if (department && role) {
            await prisma.user.upsert({
                where: { email: user.email },
                update: {
                    nip: user.nip,
                    name: user.name,
                    passwordHash: user.passwordHash,
                    phone: user.phone,
                    birthDate: user.birthDate,
                    gender: user.gender,
                    address: user.address,
                    hireDate: user.hireDate,
                    departmentId: department.id,
                    roleId: role.id
                },
                create: {
                    nip: user.nip,
                    name: user.name,
                    email: user.email,
                    passwordHash: user.passwordHash,
                    phone: user.phone,
                    birthDate: user.birthDate,
                    gender: user.gender,
                    address: user.address,
                    hireDate: user.hireDate,
                    departmentId: department.id,
                    roleId: role.id
                }
            })
        }
    }

    // Set department heads
    const kepalaDinas = await prisma.user.findUnique({ where: { email: 'kepala.dinas@pekanbarukota.go.id' } })
    const sekretarisDinas = await prisma.user.findUnique({ where: { email: 'sekretaris@pekanbarukota.go.id' } })
    const kabidAptika = await prisma.user.findUnique({ where: { email: 'kabid.aptika@pekanbarukota.go.id' } })
    const kasubagUmum = await prisma.user.findUnique({ where: { email: 'kasubag.umum@pekanbarukota.go.id' } })

    if (kepalaDinas) {
        await prisma.department.update({
            where: { code: 'KOMINFO' },
            data: { headUserId: kepalaDinas.id }
        })
    }

    if (sekretarisDinas) {
        await prisma.department.update({
            where: { code: 'SEKRETARIAT' },
            data: { headUserId: sekretarisDinas.id }
        })
    }

    if (kabidAptika) {
        await prisma.department.update({
            where: { code: 'APTIKA' },
            data: { headUserId: kabidAptika.id }
        })
    }

    if (kasubagUmum) {
        await prisma.department.update({
            where: { code: 'UMUM' },
            data: { headUserId: kasubagUmum.id }
        })
    }

    console.log('✅ Users seeded')

    // ============================================================================
    // WORK SCHEDULES - Jam Kerja PNS
    // ============================================================================

    const allUsers = await prisma.user.findMany()
    const workDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const
    const mainOffice = await prisma.officeLocation.findUnique({ where: { code: 'KOMINFO-PKU' } })

    for (const user of allUsers) {
        for (const day of workDays) {
            await prisma.workSchedule.upsert({
                where: {
                    userId_dayOfWeek: {
                        userId: user.id,
                        dayOfWeek: day
                    }
                },
                update: {},
                create: {
                    userId: user.id,
                    officeLocationId: mainOffice?.id,
                    dayOfWeek: day,
                    // Jam kerja PNS: 07:30-12:00 dan 13:00-16:00
                    startTime: new Date('1970-01-01T07:30:00.000Z'),
                    endTime: new Date('1970-01-01T16:00:00.000Z')
                }
            })
        }
    }

    console.log('✅ Work schedules seeded')

    // ============================================================================
    // LEAVE TYPE CONFIGS - Sesuai Peraturan PNS
    // ============================================================================

    const leaveTypes = [
        {
            name: 'Cuti Tahunan',
            code: 'TAHUNAN',
            description: 'Cuti tahunan berdasarkan PP No. 11 Tahun 2017',
            maxDaysPerYear: 12,
            requiresApproval: true
        },
        {
            name: 'Cuti Sakit',
            code: 'SAKIT',
            description: 'Cuti sakit dengan surat keterangan dokter',
            maxDaysPerYear: 30,
            requiresApproval: true
        },
        {
            name: 'Cuti Melahirkan',
            code: 'MELAHIRKAN',
            description: 'Cuti melahirkan untuk pegawai wanita (90 hari)',
            maxDaysPerYear: 90,
            requiresApproval: true
        },
        {
            name: 'Cuti Ayah',
            code: 'AYAH',
            description: 'Cuti untuk pegawai pria yang istrinya melahirkan',
            maxDaysPerYear: 7,
            requiresApproval: true
        },
        {
            name: 'Cuti Karena Alasan Penting',
            code: 'PENTING',
            description: 'Cuti karena alasan penting yang mendesak',
            maxDaysPerYear: 3,
            requiresApproval: true
        },
        {
            name: 'Cuti Besar',
            code: 'BESAR',
            description: 'Cuti besar setelah bekerja 6 tahun berturut-turut',
            maxDaysPerYear: 90,
            requiresApproval: true
        },
        {
            name: 'Cuti Haji/Umroh',
            code: 'HAJI',
            description: 'Cuti untuk menunaikan ibadah haji/umroh',
            maxDaysPerYear: 40,
            requiresApproval: true
        }
    ]

    for (const leave of leaveTypes) {
        await prisma.leaveTypeConfig.upsert({
            where: { code: leave.code },
            update: leave,
            create: leave
        })
    }

    console.log('✅ Leave type configs seeded')

    // ============================================================================
    // USER LEAVE BALANCES
    // ============================================================================

    const currentYear = new Date().getFullYear()
    const leaveConfigs = await prisma.leaveTypeConfig.findMany()

    for (const user of allUsers) {
        for (const leaveConfig of leaveConfigs) {
            await prisma.userLeaveBalance.upsert({
                where: {
                    userId_leaveTypeId_year: {
                        userId: user.id,
                        leaveTypeId: leaveConfig.id,
                        year: currentYear
                    }
                },
                update: {},
                create: {
                    userId: user.id,
                    leaveTypeId: leaveConfig.id,
                    year: currentYear,
                    allocatedDays: leaveConfig.maxDaysPerYear,
                    usedDays: 0,
                    remainingDays: leaveConfig.maxDaysPerYear
                }
            })
        }
    }

    console.log('✅ User leave balances seeded')

    // ============================================================================
    // APPROVAL WORKFLOWS - Sesuai Hierarki Pemerintahan
    // ============================================================================

    const sekretariatDept = await prisma.department.findUnique({ where: { code: 'SEKRETARIAT' } })
    const aptikaDept = await prisma.department.findUnique({ where: { code: 'APTIKA' } })

    const approvalWorkflows = [
        {
            name: 'Persetujuan Cuti Tahunan - Staff',
            documentType: 'LEAVE' as const,
            departmentId: null,
            approvalSteps: [
                { step: 1, roleRequired: 'Kepala Sub Bagian', required: true },
                { step: 2, roleRequired: 'Kepala Bidang', required: true },
                { step: 3, roleRequired: 'Sekretaris Dinas', required: true }
            ]
        },
        {
            name: 'Persetujuan Cuti Panjang',
            documentType: 'LEAVE' as const,
            departmentId: null,
            approvalSteps: [
                { step: 1, roleRequired: 'Kepala Sub Bagian', required: true },
                { step: 2, roleRequired: 'Kepala Bidang', required: true },
                { step: 3, roleRequired: 'Sekretaris Dinas', required: true },
                { step: 4, roleRequired: 'Kepala Dinas', required: true }
            ]
        },
        {
            name: 'Persetujuan Izin Dinas',
            documentType: 'PERMISSION' as const,
            departmentId: null,
            approvalSteps: [
                { step: 1, roleRequired: 'Kepala Sub Bagian', required: true },
                { step: 2, roleRequired: 'Kepala Bidang', required: true }
            ]
        },
        {
            name: 'Persetujuan Surat Tugas',
            documentType: 'WORK_LETTER' as const,
            departmentId: null,
            approvalSteps: [
                { step: 1, roleRequired: 'Kepala Bidang', required: true },
                { step: 2, roleRequired: 'Sekretaris Dinas', required: true },
                { step: 3, roleRequired: 'Kepala Dinas', required: true }
            ]
        }
    ]

    for (const workflow of approvalWorkflows) {
        const existing = await prisma.approvalWorkflow.findFirst({
            where: { name: workflow.name }
        })

        if (!existing) {
            await prisma.approvalWorkflow.create({ data: workflow })
        }
    }

    console.log('✅ Approval workflows seeded')

    // ============================================================================
    // SAMPLE ATTENDANCE DATA
    // ============================================================================

    const sampleUser = await prisma.user.findUnique({ where: { email: 'andi.pratama@pekanbarukota.go.id' } })
    const kominfoPKU = await prisma.officeLocation.findUnique({ where: { code: 'KOMINFO-PKU' } })

    if (sampleUser && kominfoPKU) {
        const attendanceDates = [
            new Date('2024-12-02'),  // Senin
            new Date('2024-12-03'),  // Selasa
            new Date('2024-12-04'),  // Rabu
            new Date('2024-12-05'),  // Kamis
            new Date('2024-12-06')   // Jumat
        ]

        for (const date of attendanceDates) {
            await prisma.attendance.upsert({
                where: {
                    userId_attendanceDate: {
                        userId: sampleUser.id,
                        attendanceDate: date
                    }
                },
                update: {},
                create: {
                    userId: sampleUser.id,
                    officeLocationId: kominfoPKU.id,
                    attendanceDate: date,
                    checkInTime: new Date('1970-01-01T07:35:00.000Z'),
                    checkOutTime: new Date('1970-01-01T16:05:00.000Z'),
                    checkInLatitude: new Decimal(0.5071),
                    checkInLongitude: new Decimal(101.4478),
                    checkOutLatitude: new Decimal(0.5071),
                    checkOutLongitude: new Decimal(101.4478),
                    checkInAddress: 'Kantor Dinas Kominfo Kota Pekanbaru',
                    checkOutAddress: 'Kantor Dinas Kominfo Kota Pekanbaru',
                    status: 'LATE',
                    workingHoursMinutes: 450, // 7.5 jam kerja
                    isValidLocation: true,
                    notes: 'Terlambat 5 menit'
                }
            })
        }
    }

    console.log('✅ Sample attendance data seeded')

    // ============================================================================
    // SAMPLE LEAVE REQUEST
    // ============================================================================

    const employee = await prisma.user.findUnique({ where: { email: 'lisa.humas@pekanbarukota.go.id' } })
    const approver = await prisma.user.findUnique({ where: { email: 'kasubag.umum@pekanbarukota.go.id' } })

    if (employee && approver) {
        const existingLeaveRequest = await prisma.leaveRequest.findFirst({
            where: {
                userId: employee.id,
                startDate: new Date('2024-12-23')
            }
        })

        if (!existingLeaveRequest) {
            const leaveRequest = await prisma.leaveRequest.create({
                data: {
                    userId: employee.id,
                    leaveType: 'ANNUAL',
                    startDate: new Date('2024-12-23'),
                    endDate: new Date('2024-12-27'),
                    totalDays: 5,
                    reason: 'Berlibur akhir tahun bersama keluarga',
                    description: 'Mengambil cuti tahunan untuk liburan akhir tahun ke Padang',
                    currentApproverId: approver.id
                }
            })

            await prisma.approval.create({
                data: {
                    documentType: 'LEAVE',
                    documentId: leaveRequest.id,
                    approverId: approver.id,
                    stepOrder: 1,
                    status: 'PENDING'
                }
            })
        }
    }

    console.log('✅ Sample leave request seeded')

    // ============================================================================
    // SAMPLE NOTIFICATIONS
    // ============================================================================

    if (employee) {
        const existingNotifications = await prisma.notification.findMany({
            where: { userId: employee.id }
        })

        if (existingNotifications.length === 0) {
            await prisma.notification.createMany({
                data: [
                    {
                        userId: employee.id,
                        title: 'Pengingat Absensi',
                        message: 'Selamat pagi! Jangan lupa untuk melakukan absensi masuk hari ini.',
                        type: 'INFO'
                    },
                    {
                        userId: employee.id,
                        title: 'Pengajuan Cuti Diproses',
                        message: 'Pengajuan cuti tahunan Anda sedang dalam proses persetujuan atasan.',
                        type: 'WARNING'
                    },
                    {
                        userId: employee.id,
                        title: 'Sistem Pemeliharaan',
                        message: 'Sistem absensi akan mengalami pemeliharaan pada Sabtu, 7 Desember 2024 pukul 20:00-22:00 WIB.',
                        type: 'INFO'
                    }
                ]
            })
        }
    }

    console.log('✅ Sample notifications seeded')

    console.log('🎉 Database seeding untuk Instansi Pemerintahan completed successfully!')
    console.log('')
    console.log('📋 INFORMASI LOGIN:')
    console.log('Password untuk semua user: password123')
    console.log('')
    console.log('👥 AKUN UTAMA:')
    console.log('• Kepala Dinas: kepala.dinas@pekanbarukota.go.id')
    console.log('• Sekretaris Dinas: sekretaris@pekanbarukota.go.id')
    console.log('• Admin Sistem: admin.sistem@pekanbarukota.go.id')
    console.log('• Kepala Bidang: kabid.aptika@pekanbarukota.go.id')
    console.log('• Staff/Pelaksana: andi.pratama@pekanbarukota.go.id')
    console.log('')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })