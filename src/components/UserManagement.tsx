import React, { useState } from 'react';
import { Plus, Trash2, Users, UserPlus, Eye, EyeOff, Key } from 'lucide-react';
import { User } from '../types';

interface UserManagementProps {
  users: User[];
  onCreateUser: (username: string, password: string) => boolean;
  onDeleteUser: (userId: string) => boolean;
  onChangePassword: (userId: string, newPassword: string) => boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  onCreateUser, 
  onDeleteUser, 
  onChangePassword 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [changePasswordUser, setChangePasswordUser] = useState<User | null>(null);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [viewPasswordUser, setViewPasswordUser] = useState<string | null>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    const success = onCreateUser(newUsername.trim(), newPassword);
    if (success) {
      setNewUsername('');
      setNewPassword('');
      setShowCreateForm(false);
      setError('');
    } else {
      setError('Tên đăng nhập đã tồn tại');
    }
  };

  const handleDeleteUser = (userId: string) => {
    onDeleteUser(userId);
    setConfirmDelete(null);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordUser) return;

    if (newUserPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    const success = onChangePassword(changePasswordUser.id, newUserPassword);
    if (success) {
      setChangePasswordUser(null);
      setNewUserPassword('');
      setError('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600" size={24} />
          Quản Lý Người Dùng
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={16} />
          Tạo Tài Khoản
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Tạo Tài Khoản Mới</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mật khẩu"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewUsername('');
                  setNewPassword('');
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus size={16} />
                Tạo Tài Khoản
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên đăng nhập
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mật khẩu
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{user.username}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {viewPasswordUser === user.id ? user.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => setViewPasswordUser(viewPasswordUser === user.id ? null : user.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {viewPasswordUser === user.id ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Người dùng
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.createdAt}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChangePasswordUser(user)}
                      className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                    >
                      <Key size={12} />
                      Đổi MK
                    </button>
                    <button
                      onClick={() => setConfirmDelete(user.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={12} />
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Chưa có người dùng nào
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {changePasswordUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Đổi Mật Khẩu - {changePasswordUser.username}
            </h3>
            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full p-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mật khẩu mới"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setChangePasswordUser(null);
                    setNewUserPassword('');
                    setError('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Đổi Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteUser(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;