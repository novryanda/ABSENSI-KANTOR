// ============================================================================
// FOOTER COMPONENT
// src/components/layout/Footer.tsx
// ============================================================================

'use client'

import Link from 'next/link'
import { Building2, Mail, Phone, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="border-t bg-white">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
                    {/* Brand & Description */}
                    <div className="space-y-3 md:space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Sistem Absensi</h3>
                                <p className="text-xs text-muted-foreground">Kantor Pemerintahan</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Sistem manajemen absensi dan pengajuan surat digital untuk meningkatkan
                            efisiensi administrasi kepegawaian.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Menu Utama</h4>
                        <div className="space-y-2">
                            <Link
                                href="/dashboard"
                                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/attendance"
                                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Absensi
                            </Link>
                            <Link
                                href="/requests"
                                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Pengajuan
                            </Link>
                            <Link
                                href="/reports"
                                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Laporan
                            </Link>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Bantuan & Dukungan</h4>
                        <div className="space-y-2">
                            <Link
                                href="/help"
                                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Panduan Pengguna
                            </Link>
                            <Link
                                href="/faq"
                                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                FAQ
                            </Link>
                            <Link
                                href="/support"
                                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Hubungi Support
                            </Link>
                            <Link
                                href="/privacy"
                                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Kebijakan Privasi
                            </Link>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Kontak</h4>
                        <div className="space-y-3">
                            <div className="flex items-start space-x-2">
                                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <Link
                                        href="mailto:support@kantor.gov.id"
                                        className="text-sm hover:text-foreground transition-colors"
                                    >
                                        support@kantor.gov.id
                                    </Link>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Telepon</p>
                                    <Link
                                        href="tel:+6221123456"
                                        className="text-sm hover:text-foreground transition-colors"
                                    >
                                        (021) 123-456
                                    </Link>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Jam Operasional</p>
                                    <p className="text-sm">Senin - Jumat</p>
                                    <p className="text-sm">08:00 - 17:00 WIB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="my-4 lg:my-6" />

                {/* Bottom Footer */}
                <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
                    <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} Kantor Pemerintahan. Semua hak dilindungi.
                        </p>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/terms"
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Syarat & Ketentuan
                            </Link>
                            <Link
                                href="/privacy"
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Privasi
                            </Link>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-muted-foreground">Sistem Online</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <p className="text-xs text-muted-foreground">
                            v1.0.0
                        </p>
                    </div>
                </div>

                {/* Development Mode Indicator */}
                {process.env.NODE_ENV === 'development' && (
                    <>
                        <Separator className="my-4" />
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-yellow-800">Development Mode</span>
                                </div>
                                <div className="text-xs text-yellow-600 space-x-4">
                                    <span>Node: {process.env.NODE_ENV}</span>
                                    <span>Next.js: 14.x</span>
                                    <span>Build: {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </footer>
    )
}