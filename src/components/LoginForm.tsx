import React, { useState } from 'react';
import { Scale, User, Lock, LogIn } from 'lucide-react';

interface LoginFormProps {
  // THAY ĐỔI: Chấp nhận 'email' thay vì 'username'
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  // THAY ĐỔI: Đổi state 'username' thành 'email'
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // THAY ĐỔI: Kiểm tra 'email' thay vì 'username'
    if (!email.trim() || !password.trim()) { 
      setError('Vui lòng nhập đầy đủ thông tin');
      setLoading(false);
      return;
    }

    // THAY ĐỔI: Truyền 'email' (giá trị từ state) vào hàm onLogin
    const result = await onLogin(email, password); 
    if (!result.success) {
      // Bạn có thể muốn hiển thị error.message cụ thể hơn từ Supabase nếu có
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.'); 
      // Hoặc: setError(result.error?.message || 'Đã có lỗi xảy ra');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Scale className="text-blue-600" size={48} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Hệ Thống Quản Lý</h1>
          <p className="text-gray-600 mt-2">Vụ Án & Tin Báo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-1" />
              {/* THAY ĐỔI: Nhãn là "Email" */}
              Email
            </label>
            <input
              // THAY ĐỔI: type="email"
              type="email" 
              // THAY ĐỔI: value là 'email' state
              value={email} 
              // THAY ĐỔI: onChange cập nhật 'email' state
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              // THAY ĐỔI: Placeholder là email
              placeholder="Nhập địa chỉ email của bạn" 
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-1" />
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập mật khẩu"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn size={16} />
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Liên hệ quản trị viên để được cấp tài khoản</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;