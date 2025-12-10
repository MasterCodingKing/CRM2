import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Loading } from '../components/common/Loading';

const Users = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', searchTerm, roleFilter],
    queryFn: () => api.get('/users', {
      params: { search: searchTerm, role: roleFilter }
    }).then(res => res.data)
  });

  // Fetch available roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/users/roles').then(res => res.data)
  });

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.get('/users/me').then(res => res.data)
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData) => api.post('/users', userData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setIsCreateModalOpen(false);
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...userData }) => api.put(`/users/${id}`, userData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setIsEditModalOpen(false);
      setSelectedUser(null);
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => api.delete(`/users/${userId}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    }
  });

  const handleCreateUser = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    createUserMutation.mutate({
      email: formData.get('email'),
      password_hash: formData.get('password_hash'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone: formData.get('phone'),
      role: formData.get('role')
    });
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    updateUserMutation.mutate({
      id: selectedUser.id,
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone: formData.get('phone'),
      role: formData.get('role'),
      is_active: formData.get('is_active') === 'true'
    });
  };

  const handleDeleteUser = (userId, userName) => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      sales_agent: 'bg-green-100 text-green-800',
      support: 'bg-yellow-100 text-yellow-800',
      read_only: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatRoleName = (role) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isLoading) return <Loading />;

  const users = usersData?.users || [];
  const canCreateUser = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
        </div>
        {canCreateUser && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            + Add User
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.phone || 'No phone'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {formatRoleName(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.CreatedBy 
                    ? `${user.CreatedBy.first_name} ${user.CreatedBy.last_name}`
                    : '-'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setIsEditModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  {isSuperAdmin && user.id !== currentUser?.id && (
                    <button
                      onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No users found
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="first_name"
              label="First Name"
              required
            />
            <Input
              name="last_name"
              label="Last Name"
              required
            />
          </div>
          <Input
            name="email"
            type="email"
            label="Email"
            required
          />
          <Input
            name="password_hash"
            type="password"
            label="Password"
            required
          />
          <Input
            name="phone"
            type="tel"
            label="Phone (optional)"
          />
          <Select name="role" label="Role" required>
            {roles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label} - {role.description}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </div>
          {createUserMutation.isError && (
            <div className="text-red-600 text-sm">
              {createUserMutation.error?.response?.data?.error || 'Failed to create user'}
            </div>
          )}
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        title="Edit User"
      >
        {selectedUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="first_name"
                label="First Name"
                defaultValue={selectedUser.first_name}
                required
              />
              <Input
                name="last_name"
                label="Last Name"
                defaultValue={selectedUser.last_name}
                required
              />
            </div>
            <Input
              name="phone"
              type="tel"
              label="Phone"
              defaultValue={selectedUser.phone || ''}
            />
            <Select name="role" label="Role" defaultValue={selectedUser.role} required>
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
            <Select name="is_active" label="Status" defaultValue={selectedUser.is_active.toString()} required>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </div>
            {updateUserMutation.isError && (
              <div className="text-red-600 text-sm">
                {updateUserMutation.error?.response?.data?.error || 'Failed to update user'}
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Users;
