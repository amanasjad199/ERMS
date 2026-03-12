import { useEffect, useState } from 'react';
import { Ban, CheckCircle, Shield } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Card, CardContent, Badge, PageSpinner, EmptyState, Button, Modal, Select, Pagination } from '../../components/ui';
import type { PaginationInfo } from '../../components/ui';
import { User, Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<Role>('USER');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const roleOptions = [
    { value: 'USER', label: 'User' },
    { value: 'MODERATOR', label: 'Moderator' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
  ];

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getUsers({ page, limit: 12 });
      setUsers(response.data.data.items);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockToggle = async (user: User) => {
    const action = user.isBlocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) return;

    try {
      await adminApi.blockUser(user.id, !user.isBlocked);
      toast.success(`User ${action}ed successfully`);
      fetchUsers();
    } catch {
      // Error handled by interceptor
    }
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleModalOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      await adminApi.updateUserRole(selectedUser.id, newRole);
      toast.success('Role updated successfully');
      setIsRoleModalOpen(false);
      fetchUsers();
    } catch {
      // Error handled by interceptor
    }
  };

  const getRoleBadge = (role: Role) => {
    const variants: Record<Role, 'gray' | 'yellow' | 'green'> = {
      USER: 'gray',
      MODERATOR: 'yellow',
      SUPER_ADMIN: 'green',
    };
    return <Badge variant={variants[role]}>{role}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          User Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage user accounts and roles
        </p>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <Card>
          <EmptyState title="No users found" />
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300 shadow-inner">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-300">
                        {user.email}
                      </td>
                      <td className="py-4 px-6">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-4 px-6">
                        {user.isBlocked ? (
                          <Badge variant="red">Blocked</Badge>
                        ) : (
                          <Badge variant="green">Active</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          {currentUser?.role === 'SUPER_ADMIN' && currentUser.id !== user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRoleModal(user)}
                              title="Change role"
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          {currentUser?.id !== user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBlockToggle(user)}
                              className={user.isBlocked ? 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'}
                              title={user.isBlocked ? 'Unblock user' : 'Block user'}
                            >
                              {user.isBlocked ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Ban className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {currentUser?.role === 'SUPER_ADMIN' && currentUser.id !== user.id && (
                        <Button variant="ghost" size="sm" onClick={() => openRoleModal(user)}>
                          <Shield className="w-4 h-4" />
                        </Button>
                      )}
                      {currentUser?.id !== user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBlockToggle(user)}
                          className={user.isBlocked ? 'text-green-600' : 'text-red-600'}
                        >
                          {user.isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getRoleBadge(user.role)}
                    {user.isBlocked ? (
                      <Badge variant="red">Blocked</Badge>
                    ) : (
                      <Badge variant="green">Active</Badge>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Joined {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pagination && (
        <Pagination pagination={pagination} onPageChange={setPage} />
      )}

      {/* Role Change Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Change User Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Change role for <span className="font-medium">{selectedUser?.firstName} {selectedUser?.lastName}</span>
          </p>

          <Select
            label="Select Role"
            options={roleOptions}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsRoleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleRoleChange}>
              Update Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;
