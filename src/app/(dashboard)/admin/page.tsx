'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Shield,
  Settings,
  BarChart3,
  FileText,
  UserPlus,
  Database,
  Activity,
  Clock,
  MapPin
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session } = useSession();

  const adminCards = [
    {
      title: 'Manajemen Pengguna',
      description: 'Kelola akun pengguna, role, dan hak akses',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500',
      stats: 'Total Pengguna'
    },
    {
      title: 'Departemen',
      description: 'Kelola struktur departemen dan hierarki',
      icon: Building2,
      href: '/admin/departments',
      color: 'bg-green-500',
      stats: 'Total Departemen'
    },
    {
      title: 'Role & Permission',
      description: 'Atur role dan permission sistem',
      icon: Shield,
      href: '/admin/roles',
      color: 'bg-purple-500',
      stats: 'Total Role'
    },
    {
      title: 'Lokasi Kantor',
      description: 'Kelola lokasi kantor untuk validasi absensi',
      icon: MapPin,
      href: '/admin/office-locations',
      color: 'bg-indigo-500',
      stats: 'Total Lokasi'
    },
    {
      title: 'Pengaturan Sistem',
      description: 'Konfigurasi aplikasi dan parameter',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500',
      stats: 'Konfigurasi'
    },
    {
      title: 'Laporan Admin',
      description: 'Laporan komprehensif untuk manajemen',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'bg-orange-500',
      stats: 'Laporan'
    },
    {
      title: 'Audit Logs',
      description: 'Monitor aktivitas dan perubahan sistem',
      icon: Activity,
      href: '/admin/audit',
      color: 'bg-red-500',
      stats: 'Log Aktivitas'
    }
  ];

  const quickActions = [
    {
      title: 'Tambah Pengguna',
      description: 'Buat akun pengguna baru',
      icon: UserPlus,
      href: '/admin/users?action=create',
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100'
    },
    {
      title: 'Backup Database',
      description: 'Backup data sistem',
      icon: Database,
      href: '/admin/backup',
      color: 'text-green-600 bg-green-50 hover:bg-green-100'
    },
    {
      title: 'Laporan Harian',
      description: 'Generate laporan hari ini',
      icon: FileText,
      href: '/admin/reports/daily',
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100'
    },
    {
      title: 'Monitor Sistem',
      description: 'Cek status sistem real-time',
      icon: Clock,
      href: '/admin/monitor',
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Dashboard Admin
        </h1>
        <p className="text-gray-600 mt-2">
          Selamat datang, {session?.user?.name}. Kelola sistem dan pengguna dari sini.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Pengguna</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Departemen Aktif</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aktivitas Hari Ini</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Role Sistem</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Manajemen Sistem
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${card.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {card.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">{card.stats}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors duration-200 ${action.color}`}
              >
                <div className="text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2" />
                  <h3 className="text-sm font-medium mb-1">
                    {action.title}
                  </h3>
                  <p className="text-xs opacity-75">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Aktivitas Terbaru
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada aktivitas terbaru</p>
            <p className="text-sm mt-1">Aktivitas admin akan muncul di sini</p>
          </div>
        </div>
      </div>
    </div>
  );
}
