import React from 'react';
import { Plus, List, Search, Scale, Gavel, AlertTriangle, Database, BarChart3, FileText, Clock, CheckCircle, XCircle, PauseCircle, Send } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  expiringSoonCount: number;
  systemType: 'cases' | 'reports';
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, expiringSoonCount, systemType }) => {
  const caseTabs = [
    { id: 'add', label: 'Thêm mới Vụ án', icon: Plus, color: 'bg-green-600' },
    { id: 'expiring', label: 'Vụ án Sắp hết hạn', icon: AlertTriangle, color: 'bg-red-600' },
    { id: 'all', label: 'Tổng tất cả các vụ', icon: List, color: 'bg-blue-600' },
    { id: 'investigation', label: 'Giai đoạn Điều tra', icon: Search, color: 'bg-orange-600' },
    { id: 'prosecution', label: 'Giai đoạn Truy tố', icon: Scale, color: 'bg-purple-600' },
    { id: 'trial', label: 'Giai đoạn Xét xử', icon: Gavel, color: 'bg-indigo-600' },
    { id: 'statistics', label: 'Thống kê Dữ liệu', icon: BarChart3, color: 'bg-teal-600' },
    { id: 'data', label: 'Quản lý Dữ liệu', icon: Database, color: 'bg-gray-600' }
  ];

  const reportTabs = [
    { id: 'add', label: 'Thêm mới Tin báo', icon: Plus, color: 'bg-green-600' },
    { id: 'expiring', label: 'Tin báo Sắp hết hạn', icon: AlertTriangle, color: 'bg-red-600' },
    { id: 'all', label: 'Tổng tất cả Tin báo', icon: List, color: 'bg-blue-600' },
    { id: 'pending', label: 'Đang xử lý', icon: Clock, color: 'bg-yellow-600' },
    { id: 'statistics', label: 'Thống kê Dữ liệu', icon: BarChart3, color: 'bg-teal-600' },
    { id: 'data', label: 'Quản lý Dữ liệu', icon: Database, color: 'bg-gray-600' }
  ];

  const tabs = systemType === 'cases' ? caseTabs : reportTabs;

  return (
    <div className="bg-white border-b border-gray-200 px-6">
      <nav className="flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isExpiring = tab.id === 'expiring';
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap
                ${isActive 
                  ? `border-blue-500 text-blue-600` 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                transition-colors
              `}
            >
              <Icon size={18} />
              {tab.label}
              {isExpiring && expiringSoonCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {expiringSoonCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;