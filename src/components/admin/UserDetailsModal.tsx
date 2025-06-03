'use client';

import { X, Mail, Phone, Calendar, MapPin, Building, Shield, Clock } from 'lucide-react';
import { UserStatus } from '@prisma/client';

interface User {
  id: string;
  name?: string;
  email: string;
  nip?: string;
  phone?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  role?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function UserDetailsModal({ isOpen, onClose, user }: UserDetailsModalProps) {
  if (!isOpen || !user) return null;

  const getStatusBadge = (status: UserStatus) => {
    const statusConfig = {
      ACTIVE: { label: 'Aktif', className: 'bg-green-100 text-green-800' },
      INACTIVE: { label: 'Tidak Aktif', className: 'bg-red-100 text-red-800' },
      SUSPENDED: { label: 'Ditangguhkan', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status] || statusConfig.INACTIVE;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Detail Pengguna</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <p className="text-sm text-gray-900">
                  {user.name || 'Tidak tersedia'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div>
                  {getStatusBadge(user.status)}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
              </div>

              {user.nip && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIP
                  </label>
                  <p className="text-sm text-gray-900">{user.nip}</p>
                </div>
              )}

              {user.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Telepon
                    </label>
                    <p className="text-sm text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Role and Department */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Role & Departemen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <p className="text-sm text-gray-900">
                    {user.role?.name || 'Tidak ada role'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-blue-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departemen
                  </label>
                  <p className="text-sm text-gray-900">
                    {user.department ? 
                      `${user.department.name} (${user.department.code})` : 
                      'Tidak ada departemen'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Aktivitas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Dibuat
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terakhir Diupdate
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDate(user.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-green-500" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terakhir Login
                  </label>
                  <p className="text-sm text-gray-900">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Belum pernah login'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Aksi</h3>
            
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Edit Pengguna
              </button>
              
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Reset Password
              </button>
              
              {user.status === 'ACTIVE' ? (
                <button className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  Nonaktifkan
                </button>
              ) : (
                <button className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Aktifkan
                </button>
              )}
              
              <button className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Hapus Pengguna
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
