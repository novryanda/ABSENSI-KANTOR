'use client';

import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { UserStatus } from '@prisma/client';

interface User {
  id: string;
  name?: string;
  email: string;
  nip?: string;
  status: UserStatus;
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

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

export default function DeleteUserModal({ isOpen, onClose, onSuccess, user }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
  const [reason, setReason] = useState('');

  const handleDelete = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        soft: deleteType === 'soft' ? 'true' : 'false'
      });

      if (reason.trim()) {
        params.append('reason', reason.trim());
      }

      const response = await fetch(`/api/admin/users/${user.id}?${params}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      onSuccess();
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setReason('');
    setDeleteType('soft');
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Hapus Pengguna
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Anda akan menghapus pengguna berikut:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Nama:</span>
                <span className="ml-2 text-sm text-gray-900">{user.name || 'Tidak tersedia'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-sm text-gray-900">{user.email}</span>
              </div>
              {user.nip && (
                <div>
                  <span className="text-sm font-medium text-gray-700">NIP:</span>
                  <span className="ml-2 text-sm text-gray-900">{user.nip}</span>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-700">Role:</span>
                <span className="ml-2 text-sm text-gray-900">{user.role?.name || 'Tidak ada role'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Departemen:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {user.department ? `${user.department.name} (${user.department.code})` : 'Tidak ada departemen'}
                </span>
              </div>
            </div>
          </div>

          {/* Delete Type Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Penghapusan
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deleteType"
                    value="soft"
                    checked={deleteType === 'soft'}
                    onChange={(e) => setDeleteType(e.target.value as 'soft' | 'hard')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Nonaktifkan (Soft Delete)
                  </span>
                </label>
                <p className="ml-6 text-xs text-gray-500">
                  Pengguna akan dinonaktifkan tetapi data tetap tersimpan
                </p>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deleteType"
                    value="hard"
                    checked={deleteType === 'hard'}
                    onChange={(e) => setDeleteType(e.target.value as 'soft' | 'hard')}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Hapus Permanen (Hard Delete)
                  </span>
                </label>
                <p className="ml-6 text-xs text-red-500">
                  ⚠️ Data pengguna akan dihapus secara permanen dan tidak dapat dikembalikan
                </p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alasan Penghapusan (Opsional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Masukkan alasan penghapusan untuk audit log..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {deleteType === 'hard' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Peringatan Penghapusan Permanen
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Tindakan ini tidak dapat dibatalkan. Semua data terkait pengguna akan hilang secara permanen.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
              deleteType === 'hard' 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading 
              ? 'Menghapus...' 
              : deleteType === 'hard' 
                ? 'Hapus Permanen' 
                : 'Nonaktifkan'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
