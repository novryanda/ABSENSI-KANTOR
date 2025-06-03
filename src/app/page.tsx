import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    Building2,
    Clock,
    FileText,
    CheckSquare,
    BarChart3,
    Shield,
    Users,
    Smartphone,
    ArrowRight,
    CheckCircle
} from 'lucide-react'
import { authOptions } from '@/infrastructure/auth/authOptions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
    title: 'Sistem Absensi Kantor Pemerintahan',
    description: 'Sistem manajemen absensi dan pengajuan surat digital untuk kantor pemerintahan yang modern, efisien, dan terintegrasi.',
    keywords: ['absensi', 'pemerintahan', 'pegawai', 'cuti', 'izin', 'digital', 'sistem'],
}

export default async function LandingPage() {
    // Check if user is already authenticated
    const session = await getServerSession(authOptions)

    if (session) {
        // Redirect based on user role
        const userRole = session.user?.role?.name
        const redirectUrl = getDefaultRedirectForRole(userRole)
        redirect(redirectUrl)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            {/* Navigation */}
            <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Sistem Absensi</h1>
                                <p className="text-xs text-gray-600">Kantor Pemerintahan</p>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center space-x-6">
                            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                                Fitur
                            </a>
                            <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">
                                Keunggulan
                            </a>
                            <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                                Kontak
                            </a>
                            <Button asChild>
                                <Link href="/auth/signin">
                                    Masuk
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/auth/signin">Masuk</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Content */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Badge variant="secondary" className="w-fit">
                                    🚀 Sistem Terbaru 2025
                                </Badge>
                                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                    Kelola Absensi
                                    <span className="text-blue-600"> Digital</span> untuk
                                    <span className="text-blue-600"> Kantor Modern</span>
                                </h1>
                                <p className="text-xl text-gray-600 leading-relaxed">
                                    Sistem absensi dan pengajuan surat terintegrasi yang memudahkan
                                    administrasi kepegawaian dengan teknologi modern dan user-friendly.
                                </p>
                            </div>

                            {/* Key Features */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-gray-700">Absensi GPS</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-gray-700">Pengajuan Online</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-gray-700">Laporan Real-time</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-gray-700">Multi-platform</span>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button asChild size="lg" className="text-lg">
                                    <Link href="/auth/signin">
                                        Mulai Sekarang
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" className="text-lg">
                                    <a href="#features">Pelajari Lebih Lanjut</a>
                                </Button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-6 pt-8 border-t">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">99.9%</div>
                                    <div className="text-sm text-gray-600">Uptime</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">1000+</div>
                                    <div className="text-sm text-gray-600">Pegawai</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">24/7</div>
                                    <div className="text-sm text-gray-600">Support</div>
                                </div>
                            </div>
                        </div>

                        {/* Visual/Image */}
                        <div className="relative">
                            <div className="bg-gradient-to-tr from-blue-600 to-cyan-600 rounded-3xl p-8 shadow-2xl">
                                <div className="bg-white rounded-2xl p-6 space-y-4">
                                    {/* Mock Dashboard */}
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">Dashboard Hari Ini</h3>
                                        <Badge variant="secondary">Live</Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                <span className="text-sm font-medium">Hadir</span>
                                            </div>
                                            <div className="text-2xl font-bold text-green-600">847</div>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <Clock className="h-5 w-5 text-blue-600" />
                                                <span className="text-sm font-medium">Terlambat</span>
                                            </div>
                                            <div className="text-2xl font-bold text-blue-600">23</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-700">Pengajuan Terbaru</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm">Cuti - Ahmad Wijaya</span>
                                                <Badge variant="outline" className="text-xs">Pending</Badge>
                                            </div>
                                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm">Izin - Siti Nurhaliza</span>
                                                <Badge variant="secondary" className="text-xs">Approved</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -top-4 -right-4 bg-white p-3 rounded-full shadow-lg">
                                <Shield className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-full shadow-lg">
                                <BarChart3 className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-4 mb-16">
                        <Badge variant="outline" className="w-fit mx-auto">
                            Fitur Lengkap
                        </Badge>
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                            Semua yang Anda Butuhkan dalam Satu Platform
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Sistem terintegrasi yang memudahkan pengelolaan absensi, pengajuan, dan pelaporan
                            untuk kantor pemerintahan modern.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Clock className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Absensi Digital</h3>
                            <p className="text-gray-600 mb-4">
                                Absensi berbasis GPS dengan validasi lokasi, check-in/out otomatis, dan tracking waktu real-time.
                            </p>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>GPS Location Tracking</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Real-time Monitoring</span>
                                </li>
                            </ul>
                        </div>

                        {/* Feature 2 */}
                        <div className="group p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pengajuan Online</h3>
                            <p className="text-gray-600 mb-4">
                                Pengajuan cuti, izin, dan surat kerja secara digital dengan workflow approval yang fleksibel.
                            </p>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Multi-level Approval</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Document Upload</span>
                                </li>
                            </ul>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <CheckSquare className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sistem Approval</h3>
                            <p className="text-gray-600 mb-4">
                                Workflow persetujuan bertingkat dengan notifikasi real-time dan tracking status lengkap.
                            </p>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Real-time Notifications</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Status Tracking</span>
                                </li>
                            </ul>
                        </div>

                        {/* Feature 4 */}
                        <div className="group p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Laporan & Analytics</h3>
                            <p className="text-gray-600 mb-4">
                                Dashboard analytics dengan laporan komprehensif dan export data dalam berbagai format.
                            </p>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Export Excel/PDF</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Custom Reports</span>
                                </li>
                            </ul>
                        </div>

                        {/* Feature 5 */}
                        <div className="group p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Keamanan Tinggi</h3>
                            <p className="text-gray-600 mb-4">
                                Sistem keamanan berlapis dengan enkripsi data, audit trail, dan role-based access control.
                            </p>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Data Encryption</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Audit Trail</span>
                                </li>
                            </ul>
                        </div>

                        {/* Feature 6 */}
                        <div className="group p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Smartphone className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Platform</h3>
                            <p className="text-gray-600 mb-4">
                                Akses dari desktop, tablet, atau smartphone dengan responsive design dan PWA support.
                            </p>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Responsive Design</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>PWA Ready</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-4 mb-16">
                        <Badge variant="outline" className="w-fit mx-auto">
                            Keunggulan
                        </Badge>
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                            Mengapa Memilih Sistem Kami?
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="flex items-start space-x-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                    <Users className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Mudah Digunakan</h3>
                                    <p className="text-gray-600">
                                        Interface yang intuitif dan user-friendly, mudah dipelajari oleh semua kalangan pegawai.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                    <BarChart3 className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Efisiensi Tinggi</h3>
                                    <p className="text-gray-600">
                                        Otomatisasi proses administrasi yang menghemat waktu dan mengurangi kesalahan manual.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                    <Shield className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Keamanan Data</h3>
                                    <p className="text-gray-600">
                                        Standar keamanan tinggi dengan enkripsi end-to-end dan backup otomatis.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Statistik Penggunaan</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Tingkat Kepuasan</span>
                                        <span className="text-sm font-bold text-green-600">98%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '98%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Efisiensi Waktu</span>
                                        <span className="text-sm font-bold text-blue-600">85%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Pengurangan Paperwork</span>
                                        <span className="text-sm font-bold text-purple-600">92%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        <h2 className="text-3xl lg:text-4xl font-bold text-white">
                            Siap Modernisasi Sistem Absensi Anda?
                        </h2>
                        <p className="text-xl text-blue-100">
                            Bergabunglah dengan ribuan pegawai yang telah merasakan kemudahan sistem absensi digital.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg" variant="secondary" className="text-lg">
                                <Link href="/auth/signin">
                                    Mulai Sekarang
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="text-lg bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                                <a href="#contact">Hubungi Kami</a>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-gray-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Brand */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Sistem Absensi</h3>
                                    <p className="text-sm text-gray-400">Kantor Pemerintahan</p>
                                </div>
                            </div>
                            <p className="text-gray-300">
                                Solusi digital terpercaya untuk modernisasi administrasi kepegawaian di lingkungan pemerintahan.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-semibold mb-4">Menu</h4>
                            <div className="space-y-2">
                                <Link href="#features" className="block text-gray-300 hover:text-white transition-colors">
                                    Fitur
                                </Link>
                                <Link href="#benefits" className="block text-gray-300 hover:text-white transition-colors">
                                    Keunggulan
                                </Link>
                                <Link href="/auth/signin" className="block text-gray-300 hover:text-white transition-colors">
                                    Login
                                </Link>
                            </div>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="font-semibold mb-4">Dukungan</h4>
                            <div className="space-y-2">
                                <a href="/help" className="block text-gray-300 hover:text-white transition-colors">
                                    Panduan
                                </a>
                                <a href="/faq" className="block text-gray-300 hover:text-white transition-colors">
                                    FAQ
                                </a>
                                <a href="/support" className="block text-gray-300 hover:text-white transition-colors">
                                    Support
                                </a>
                            </div>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-semibold mb-4">Kontak</h4>
                            <div className="space-y-2 text-gray-300">
                                <p>Email: support@kantor.gov.id</p>
                                <p>Telepon: (021) 123-456</p>
                                <p>Jam Kerja: 08:00 - 17:00 WIB</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 Kantor Pemerintahan. Semua hak dilindungi.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDefaultRedirectForRole(role?: string): string {
    switch (role) {
        case 'Super Admin':
        case 'Admin':
            return '/admin'
        case 'Atasan':
            return '/approvals'
        case 'Pegawai':
        default:
            return '/dashboard'
    }
}
