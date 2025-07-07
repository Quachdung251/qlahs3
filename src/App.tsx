// src/App.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Scale, FileText, LogOut, Users } from 'lucide-react';
import TabNavigation from './components/TabNavigation';
import CaseForm from './components/CaseForm';
import CaseTable from './components/CaseTable';
import DataManagement from './components/DataManagement';
import Statistics from './components/Statistics';
import SearchFilter from './components/SearchFilter';
import ReportForm from './components/ReportForm';
import ReportTable from './components/ReportTable';
import ReportStatistics from './components/ReportStatistics';
import LoginForm from './components/LoginForm';
import UserManagement from './components/UserManagement';
import { useCases } from './hooks/useCases';
import { useReports } from './hooks/useReports';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useIndexedDB } from './hooks/useIndexedDB';
import { CriminalCodeItem } from './data/criminalCode';
// import { Prosecutor } from './data/prosecutors'; // XÓA BỎ DÒNG NÀY HOẶC COMMENT LẠI
import { Prosecutor } from './api/prosecutors'; // <--- THÊM DÒNG NÀY: Import Prosecutor từ api/prosecutors
import { useProsecutors } from './hooks/useProsecutors'; // <--- THÊM DÒNG NÀY: Import hook useProsecutors

type SystemType = 'cases' | 'reports';

const App: React.FC = () => {
  const { user, loading: authLoading, signIn, signOut, isAuthenticated } = useSupabaseAuth(); // Đổi tên 'loading' thành 'authLoading' để tránh trùng với prosecutorsLoading
  const { isInitialized } = useIndexedDB();
  const [activeSystem, setActiveSystem] = useState<SystemType>('cases');
  const [activeTab, setActiveTab] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProsecutor, setSelectedProsecutor] = useState('');

  // <--- THÊM DÒNG NÀY: Sử dụng hook useProsecutors để lấy danh sách KSV
  const { prosecutors, loading: prosecutorsLoading, error: prosecutorsError, setProsecutors } = useProsecutors();
  // console.log("Prosecutors in App:", prosecutors); // Dùng để debug, có thể xóa sau

  const userKey = user?.id || 'default';
  const { cases, addCase, updateCase, deleteCase, transferStage, getCasesByStage, getExpiringSoonCases, isLoading: casesLoading } = useCases(userKey, isInitialized);
  const { reports, addReport, updateReport, deleteReport, transferReportStage, getReportsByStage, getExpiringSoonReports, isLoading: reportsLoading } = useReports(userKey, isInitialized);

  // Show loading while initializing or fetching prosecutors
  // <--- THAY ĐỔI ĐIỀU KIỆN LOADING Ở ĐÂY
  if (authLoading || !isInitialized || prosecutorsLoading) { // Thêm prosecutorsLoading vào điều kiện
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Scale className="text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Đang khởi tạo hệ thống và tải dữ liệu...</p> {/* Cập nhật thông báo */}
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={signIn} />;
  }

  // Reset tab when switching systems
  const handleSystemChange = (system: SystemType) => {
    setActiveSystem(system);
    setActiveTab('add');
    setSearchTerm('');
    setSelectedProsecutor('');
  };

  const handleUpdateCriminalCode = (data: CriminalCodeItem[]) => {
    console.log('Updated criminal code data:', data);
  };

  // <--- THAY ĐỔI HÀM NÀY: Cập nhật state prosecutors của App
  const handleUpdateProsecutors = (data: Prosecutor[]) => {
    console.log('Updated prosecutors data in App:', data);
    setProsecutors(data); // Cập nhật state prosecutors trong App.tsx
  };

  // Filter cases/reports based on search term and prosecutor
  const filterItems = (itemsToFilter: any[]) => {
    return itemsToFilter.filter(item => {
      const matchesSearch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.charges.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.defendants && item.defendants.some((d: any) =>
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.charges.toLowerCase().includes(searchTerm.toLowerCase())
        ));

      // So sánh với tên kiểm sát viên (item.prosecutor lưu tên KSV)
      const matchesProsecutor = !selectedProsecutor ||
        item.prosecutor === selectedProsecutor;

      return matchesSearch && matchesProsecutor;
    });
  };

  // Case management columns (giữ nguyên)
  const getCaseTableColumns = (tabId: string) => {
    const baseColumns = [
      { key: 'name' as const, label: 'Tên Vụ án' },
    ];

    switch (tabId) {
      case 'all':
        return [
          ...baseColumns,
          { key: 'charges' as const, label: 'Tội danh (VA)' },
          { key: 'investigationDeadline' as const, label: 'Thời hạn ĐT' },
          { key: 'totalDefendants' as const, label: 'Tổng Bị can' },
          { key: 'shortestDetention' as const, label: 'BP Ngăn chặn ngắn nhất' },
          { key: 'prosecutor' as const, label: 'KSV' },
          { key: 'notes' as const, label: 'Ghi chú' },
          { key: 'stage' as const, label: 'Giai đoạn' },
          { key: 'prosecutionTransferDate' as const, label: 'Ngày chuyển TT' },
          { key: 'trialTransferDate' as const, label: 'Ngày chuyển XX' },
          { key: 'actions' as const, label: 'Hành động' }
        ];
      case 'investigation':
        return [
          ...baseColumns,
          { key: 'investigationDeadline' as const, label: 'Thời hạn ĐT' },
          { key: 'totalDefendants' as const, label: 'Tổng Bị can' },
          { key: 'shortestDetention' as const, label: 'BP Ngăn chặn ngắn nhất' },
          { key: 'prosecutor' as const, label: 'KSV' },
          { key: 'notes' as const, label: 'Ghi chú' },
          { key: 'actions' as const, label: 'Hành động' }
        ];
      case 'prosecution':
        return [
          ...baseColumns,
          { key: 'totalDefendants' as const, label: 'Tổng Bị can' },
          { key: 'shortestDetention' as const, label: 'BP Ngăn chặn ngắn nhất' },
          { key: 'prosecutor' as const, label: 'KSV' },
          { key: 'notes' as const, label: 'Ghi chú' },
          { key: 'prosecutionTransferDate' as const, label: 'Ngày chuyển TT' },
          { key: 'actions' as const, label: 'Hành động' }
        ];
      case 'trial':
        return [
          ...baseColumns,
          { key: 'totalDefendants' as const, label: 'Tổng Bị can' },
          { key: 'shortestDetention' as const, label: 'BP Ngăn chặn ngắn nhất' },
          { key: 'prosecutor' as const, label: 'KSV' },
          { key: 'notes' as const, label: 'Ghi chú' },
          { key: 'trialTransferDate' as const, label: 'Ngày chuyển XX' },
          { key: 'actions' as const, label: 'Hành động' }
        ];
      case 'expiring':
        return [
          ...baseColumns,
          { key: 'stage' as const, label: 'Giai đoạn' },
          { key: 'investigationRemaining' as const, label: 'Thời hạn ĐT còn lại' },
          { key: 'totalDefendants' as const, label: 'Tổng Bị can' },
          { key: 'shortestDetentionRemaining' as const, label: 'Hạn Tạm giam ngắn nhất' },
          { key: 'prosecutor' as const, label: 'KSV' },
          { key: 'notes' as const, label: 'Ghi chú' },
          { key: 'actions' as const, label: 'Hành động' }
        ];
      default:
        return baseColumns;
    }
  };

  // Report management columns (giữ nguyên)
  const getReportTableColumns = (tabId: string) => {
    const baseColumns = [
      { key: 'name' as const, label: 'Tên Tin báo' },
    ];

    switch (tabId) {
      case 'all':
        return [
          ...baseColumns,
          { key: 'charges' as const, label: 'Tội danh' },
          { key: 'resolutionDeadline' as const, label: 'Hạn giải quyết' },
          { key: 'prosecutor' as const, label: 'KSV' },
          { key: 'notes' as const, label: 'Ghi chú' },
          { key: 'stage' as const, label: 'Trạng thái' },
          { key: 'actions' as const, label: 'Hành động' }
        ];
      case 'pending':
        return [
          ...baseColumns,
          { key: 'charges' as const, label: 'Tội danh' },
          { key: 'resolutionDeadline' as const, label: 'Hạn giải quyết' },
          { key: 'prosecutor' as const, label: 'KSV' },
          { key: 'notes' as const, label: 'Ghi chú' },
          { key: 'actions' as const, label: 'Hành động' }
        ];
      case 'expiring':
        return [
          ...baseColumns,
          { key: 'charges' as const, label: 'Tội danh' },
          { key: 'resolutionDeadline' as const, label: 'Hạn giải quyết' },
          { key: 'prosecutor' as const, label: 'KSV' },
          { key: 'notes' as const, label: 'Ghi chú' },
          { key: 'actions' as const, label: 'Hành động' }
        ];
      default:
        return baseColumns;
    }
  };

  const getCaseTableData = () => {
    if (casesLoading) return [];

    let data;
    switch (activeTab) {
      case 'all':
        data = cases;
        break;
      case 'investigation':
        data = getCasesByStage('Điều tra');
        break;
      case 'prosecution':
        data = getCasesByStage('Truy tố');
        break;
      case 'trial':
        data = getCasesByStage('Xét xử');
        break;
      case 'expiring':
        data = getExpiringSoonCases();
        break;
      default:
        data = [];
    }
    return filterItems(data);
  };

  const getReportTableData = () => {
    if (reportsLoading) return [];

    let data;
    switch (activeTab) {
      case 'all':
        data = reports;
        break;
      case 'pending':
        data = getReportsByStage('Đang xử lý');
        break;
      case 'expiring':
        data = getExpiringSoonReports();
        break;
      default:
        data = [];
    }
    return filterItems(data);
  };

  const expiringSoonCount = activeSystem === 'cases' ? getExpiringSoonCases().length : getExpiringSoonReports().length;

  const renderMainContent = () => {
    if (activeSystem === 'reports') {
      switch (activeTab) {
        case 'add':
          // <--- TRUYỀN PROPS prosecutors VÀO ReportForm
          return <ReportForm onAddReport={addReport} onTransferToCase={addCase} prosecutors={prosecutors} />;
        case 'statistics':
          return <ReportStatistics reports={reports} />;
        case 'data':
          return (
            <DataManagement
              onUpdateCriminalCode={handleUpdateCriminalCode}
              onUpdateProsecutors={handleUpdateProsecutors} // <--- TRUYỀN HÀM NÀY ĐỂ DATAMANAGEMENT CÓ THỂ GỌI LÊN
              currentUserId={user?.id || ''} // Truyền user id để DataManagement có thể sử dụng cho RLS
            />
          );
        default:
          return (
            <>
              <SearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedProsecutor={selectedProsecutor}
                onProsecutorChange={setSelectedProsecutor}
                prosecutors={prosecutors} // <--- TRUYỀN PROPS prosecutors VÀO SearchFilter
              />
              <ReportTable
                reports={getReportTableData()}
                columns={getReportTableColumns(activeTab)}
                onDeleteReport={deleteReport}
                onTransferStage={transferReportStage}
                onUpdateReport={updateReport}
                onTransferToCase={addCase}
              />
            </>
          );
      }
    } else { // activeSystem === 'cases'
      switch (activeTab) {
        case 'add':
          // <--- TRUYỀN PROPS prosecutors VÀO CaseForm
          return <CaseForm onAddCase={addCase} prosecutors={prosecutors} />;
        case 'statistics':
          return <Statistics cases={cases} />;
        case 'data':
          return (
            <DataManagement
              onUpdateCriminalCode={handleUpdateCriminalCode}
              onUpdateProsecutors={handleUpdateProsecutors} // <--- TRUYỀN HÀM NÀY ĐỂ DATAMANAGEMENT CÓ THỂ GỌI LÊN
              currentUserId={user?.id || ''} // Truyền user id để DataManagement có thể sử dụng cho RLS
            />
          );
        default:
          return (
            <>
              <SearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedProsecutor={selectedProsecutor}
                onProsecutorChange={setSelectedProsecutor}
                prosecutors={prosecutors} // <--- TRUYỀN PROPS prosecutors VÀO SearchFilter
              />
              <CaseTable
                cases={getCaseTableData()}
                columns={getCaseTableColumns(activeTab)}
                onDeleteCase={deleteCase}
                onTransferStage={transferStage}
                onUpdateCase={updateCase}
                showWarnings={activeTab === 'expiring'}
              />
            </>
          );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                  onClick={() => handleSystemChange('cases')}
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
                  onClick={() => handleSystemChange('reports')}
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
                  ? `Tổng số vụ án: ${cases.length}`
                  : `Tổng số tin báo: ${reports.length}`
                }
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{user?.user_metadata?.username || user?.email}</span>
              </div>

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

      {/* Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        expiringSoonCount={expiringSoonCount}
        systemType={activeSystem}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default App;