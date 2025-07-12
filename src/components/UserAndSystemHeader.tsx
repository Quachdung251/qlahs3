import React from 'react';
import { Scale, FileText, LogOut, Cloud, QrCode } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface UserAndSystemHeaderProps {
  user: User | null;
  activeSystem: 'cases' | 'reports';
  setActiveSystem: (system: 'cases' | 'reports') => void;
  signOut: () => Promise<void>;
  casesCount: number;
  reportsCount: number;
  onShowBackupRestoreModal: () => void;
  onShowQrScannerModal: () => void;
}

const UserAndSystemHeader: React.FC<UserAndSystemHeaderProps> = ({
  user,
  activeSystem,
  setActiveSystem,
  signOut,
  casesCount,
  reportsCount,
  onShowBackupRestoreModal,
  onShowQrScannerModal,
}) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Scale className="text-blue-600" size={28} />
              <h1 className="text-2xl font-bold text-gray-900">Hệ Thống Quản Lý</h1>
            </div>

            {/* System Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveSystem('cases')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  activeSystem === 'cases'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Scale size={16} />
                Vụ Án
              </button>
              <button
                onClick={() => setActiveSystem('reports')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  activeSystem === 'reports'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileText size={16} />
                Tin Báo
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {activeSystem === 'cases'
                ? `Tổng số vụ án: ${casesCount}`
                : `Tổng số tin báo: ${reportsCount}`
              }
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{user?.user_metadata?.username || user?.email}</span>
            </div>

            {/* Nút Quét Hồ Sơ */}
            <button
              onClick={onShowQrScannerModal}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="Quét mã QR hồ sơ"
            >
              <QrCode size={16} />
              Quét Hồ Sơ
            </button>

            {/* Nút Lưu/Khôi phục dữ liệu Supabase */}
            <button
              onClick={onShowBackupRestoreModal}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="Lưu và Khôi phục dữ liệu từ Supabase"
              disabled={!user} // Disable if user is not logged in
            >
              <Cloud size={16} />
              Cloud
            </button>

            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default UserAndSystemHeader;