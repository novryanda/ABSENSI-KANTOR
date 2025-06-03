'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Key,
  Loader2
} from 'lucide-react';
import { UserStatus } from '@prisma/client';
import CreateUserModal from '@/components/admin/CreateUserModal';
import UserDetailsModal from '@/components/admin/UserDetailsModal';
import EditUserModal from '@/components/admin/EditUserModal';
import DeleteUserModal from '@/components/admin/DeleteUserModal';
import ResetPasswordModal from '@/components/admin/ResetPasswordModal';

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

interface UsersData {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter options
  const [roles, setRoles] = useState<Array<{id: string, name: string}>>([]);
  const [departments, setDepartments] = useState<Array<{id: string, name: string, code: string}>>([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Loading states for individual actions
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchUsers();
    fetchRolesAndDepartments();
  }, [currentPage, search, statusFilter, roleFilter, departmentFilter]);

  const fetchRolesAndDepartments = async () => {
    try {
      const response = await fetch('/api/admin/roles-departments');
      const result = await response.json();

      if (response.ok && result.data) {
        setRoles(result.data.roles);
        setDepartments(result.data.departments);
      }
    } catch (err) {
      console.error('Failed to fetch roles and departments:', err);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const actionKey = `toggle-${user.id}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch(`/api/admin/users/${user.id}/toggle-status`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to toggle user status');
      }

      // Refresh users list
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle user status');
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('roleId', roleFilter);
      if (departmentFilter) params.append('departmentId', departmentFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

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
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !users) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Manajemen Pengguna
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola akun pengguna dan hak akses sistem
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pengguna
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau NIP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus | '')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Tidak Aktif</option>
            <option value="SUSPENDED">Ditangguhkan</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Semua Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Semua Departemen</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Users Table */}
      {users && (
        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pengguna
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Departemen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Terakhir Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dibuat
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'Nama tidak tersedia'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.nip && (
                          <div className="text-xs text-gray-400">NIP: {user.nip}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {user.role?.name || 'Tidak ada role'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.department?.name || 'Tidak ada departemen'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Belum pernah'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        {/* View Button */}
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                          title="Edit Pengguna"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={actionLoading[`toggle-${user.id}`]}
                          className={`p-1 rounded ${
                            user.status === 'ACTIVE'
                              ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                              : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                          } disabled:opacity-50`}
                          title={user.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {actionLoading[`toggle-${user.id}`] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.status === 'ACTIVE' ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {users.pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!users.pagination.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!users.pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Menampilkan{' '}
                    <span className="font-medium">
                      {(users.pagination.page - 1) * users.pagination.limit + 1}
                    </span>{' '}
                    sampai{' '}
                    <span className="font-medium">
                      {Math.min(users.pagination.page * users.pagination.limit, users.pagination.total)}
                    </span>{' '}
                    dari{' '}
                    <span className="font-medium">{users.pagination.total}</span> hasil
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!users.pagination.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!users.pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchUsers();
          setShowCreateModal(false);
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          fetchUsers();
          setShowEditModal(false);
        }}
        user={selectedUser}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => {
          fetchUsers();
          setShowDeleteModal(false);
        }}
        user={selectedUser}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        onSuccess={() => {
          fetchUsers();
          setShowResetPasswordModal(false);
        }}
        user={selectedUser}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={showUserDetails}
        onClose={() => setShowUserDetails(false)}
        user={selectedUser}
      />
    </div>
  );
}
