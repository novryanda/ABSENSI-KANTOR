'use client';

import { useState } from 'react';
import { X, Key, Eye, EyeOff, Copy, Check, Loader2 } from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email: string;
  nip?: string;
}

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

export default function ResetPasswordModal({ isOpen, onClose, onSuccess, user }: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatePassword, setGeneratePassword] = useState(true);
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const handleResetPassword = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generatePassword,
          customPassword: generatePassword ? undefined : customPassword
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      if (result.data.temporaryPassword) {
        setNewPassword(result.data.temporaryPassword);
      } else {
        onSuccess();
        onClose();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = async () => {
    if (newPassword) {
      await navigator.clipboard.writeText(newPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (newPassword) {
      onSuccess();
    }
    setError(null);
    setCustomPassword('');
    setGeneratePassword(true);
    setNewPassword(null);
    setPasswordCopied(false);
    onClose();
  };

  if (!isOpen || !user) return null;

  // Show password result screen
  if (newPassword) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Password Berhasil Direset
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Password baru telah dibuat untuk {user.name || user.email}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Baru:
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-white border rounded px-3 py-2 text-sm font-mono">
                  {newPassword}
                </code>
                <button
                  onClick={copyPassword}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Copy password"
                >
                  {passwordCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Penting:</strong> Berikan password ini kepada pengguna dan minta mereka untuk menggantinya saat login pertama kali.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Key className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Reset Password
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
            Anda akan mereset password untuk pengguna:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
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
            </div>
          </div>

          {/* Password Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opsi Password
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="passwordType"
                    checked={generatePassword}
                    onChange={() => setGeneratePassword(true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Generate password otomatis (Direkomendasikan)
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="passwordType"
                    checked={!generatePassword}
                    onChange={() => setGeneratePassword(false)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    Set password custom
                  </span>
                </label>
              </div>
            </div>

            {!generatePassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Custom
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {customPassword && customPassword.length < 8 && (
                  <p className="text-xs text-red-600 mt-1">
                    Password harus minimal 8 karakter
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Catatan:</strong> Setelah password direset, pengguna harus login dengan password baru dan disarankan untuk menggantinya segera.
            </p>
          </div>
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
            onClick={handleResetPassword}
            disabled={loading || (!generatePassword && customPassword.length < 8)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? 'Mereset...' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
