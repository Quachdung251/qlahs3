import React, { useState, useMemo, useEffect } from 'react';
import { Scale, FileText, LogOut, Users, Download } from 'lucide-react'; // Thêm Download icon
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
import { Prosecutor } from './api/prosecutors';
import { useProsecutors } from './hooks/useProsecutors';
import { exportToExcel } from './utils/excelExportUtils'; // <--- THÊM DÒNG NÀY: Import hàm exportToExcel
import { CaseFormData } from './types'; // Import CaseFormData để có type cho cases

type SystemType = 'cases' | 'reports';

const App: React.FC = () => {
  const { user, loading: authLoading, signIn, signOut, isAuthenticated } = useSupabaseAuth();
  const { isInitialized } = useIndexedDB();
  const [activeSystem, setActiveSystem] = useState<SystemType>('cases');
  const [activeTab, setActiveTab] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProsecutor, setSelectedProsecutor] = useState('');
  
  const { prosecutors, loading: prosecutorsLoading, error: prosecutorsError, setProsecutors } = useProsecutors();

  const userKey = user?.id || 'default';
  const { cases, addCase, updateCase, deleteCase, transferStage, getCasesByStage, getExpiringSoonCases, isLoading: casesLoading } = useCases(userKey, isInitialized);
  const { reports, addReport, updateReport, deleteReport, transferReportStage, getReportsByStage, getExpiringSoonReports, isLoading: reportsLoading } = useReports(userKey, isInitialized);

  // Show loading while initializing or fetching prosecutors
  if (authLoading || !isInitialized || prosecutorsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Scale className="text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Đang khởi tạo hệ thống và tải dữ liệu...</p>
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

  const handleUpdateProsecutors = (data: Prosecutor[]) => {
    console.log('Updated prosecutors data in App:', data);
    setProsecutors(data);
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
      
      const matchesProsecutor = !selectedProsecutor || 
        item.prosecutor === selectedProsecutor;
      
      return matchesSearch && matchesProsecutor;
    });
  };

  // Case management columns
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

  // Report management columns
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

  // Xử lý xuất Excel cho vụ án với nhiều bị can
  const handleExportCasesToExcel = () => {
    const dataToExport: any[] = [];
    const columns = [
      { key: 'caseName', label: 'Tên Vụ án' },
      { key: 'stage', label: 'Giai đoạn' },
      { key: 'investigationRemaining', label: 'Thời hạn ĐT còn lại' },
      { key: 'prosecutor', label: 'KSV' },
      { key: 'defendantName', label: 'Tên Bị can' },
      { key: 'defendantCharges', label: 'Tội danh Bị can' },
      { key: 'preventiveMeasure', label: 'Biện pháp Ngăn chặn' },
      { key: 'detentionDeadline', label: 'Thời hạn Tạm giam' },
      { key: 'caseNotes', label: 'Ghi chú Vụ án' }, // <--- DI CHUYỂN CỘT GHI CHÚ XUỐNG CUỐI CÙNG
    ];

    getCaseTableData().forEach((caseItem: CaseFormData) => {
      if (caseItem.defendants && caseItem.defendants.length > 0) {
        caseItem.defendants.forEach((defendant, index) => {
          const row: any = {};
          // Chỉ điền thông tin vụ án cho dòng đầu tiên của mỗi vụ
          if (index === 0) {
            row.caseName = caseItem.name;
            row.stage = caseItem.stage;
            row.investigationRemaining = caseItem.investigationDeadline; // Cần tính toán lại nếu muốn hiển thị "còn lại"
            row.prosecutor = caseItem.prosecutor;
            row.caseNotes = caseItem.notes;
          } else {
            // Để trống các cột vụ án cho các bị can tiếp theo
            row.caseName = '';
            row.stage = '';
            row.investigationRemaining = '';
            row.prosecutor = '';
            row.caseNotes = '';
          }

          // Điền thông tin bị can
          row.defendantName = defendant.name;
          row.defendantCharges = defendant.charges;
          row.preventiveMeasure = defendant.preventiveMeasure;
          row.detentionDeadline = defendant.detentionDeadline || ''; // Chỉ có nếu là tạm giam

          dataToExport.push(row);
        });
      } else {
        // Xử lý trường hợp vụ án không có bị can nào (nếu có)
        dataToExport.push({
          caseName: caseItem.name,
          stage: caseItem.stage,
          investigationRemaining: caseItem.investigationDeadline,
          prosecutor: caseItem.prosecutor,
          caseNotes: caseItem.notes,
          defendantName: 'Không có bị can',
          defendantCharges: '',
          preventiveMeasure: '',
          detentionDeadline: ''
        });
      }
    });

    exportToExcel(dataToExport, columns, 'BaoCaoVuAn');
  };

  // Xử lý xuất Excel cho tin báo
  const handleExportReportsToExcel = () => {
    const dataToExport = getReportTableData().map(report => ({
      'Tên Tin báo': report.name,
      'Tội danh': report.charges,
      'Hạn giải quyết': report.resolutionDeadline,
      'KSV': report.prosecutor,
      'Ghi chú': report.notes,
      'Trạng thái': report.stage,
    }));

    const columns = [
      { key: 'Tên Tin báo', label: 'Tên Tin báo' },
      { key: 'Tội danh', label: 'Tội danh' },
      { key: 'Hạn giải quyết', label: 'Hạn giải quyết' },
      { key: 'KSV', label: 'KSV' },
      { key: 'Ghi chú', label: 'Ghi chú' },
      { key: 'Trạng thái', label: 'Trạng thái' },
    ];

    exportToExcel(dataToExport, columns, 'BaoCaoTinBao');
  };


  const renderMainContent = () => {
    if (activeSystem === 'reports') {
      switch (activeTab) {
        case 'add':
          return <ReportForm onAddReport={addReport} onTransferToCase={addCase} prosecutors={prosecutors} />;
        case 'statistics':
          return <ReportStatistics reports={reports} />;
        case 'data':
          return (
            <DataManagement
              onUpdateCriminalCode={handleUpdateCriminalCode}
              onUpdateProsecutors={handleUpdateProsecutors}
              currentUserId={user?.id || ''}
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
                prosecutors={prosecutors}
              />
              <div className="flex justify-end mb-4"> {/* Nút xuất Excel cho tin báo */}
                <button
                  onClick={handleExportReportsToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Download size={16} />
                  Xuất Excel Tin Báo
                </button>
              </div>
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
          return <CaseForm onAddCase={addCase} prosecutors={prosecutors} />;
        case 'statistics':
          return <Statistics cases={cases} />;
        case 'data':
          return (
            <DataManagement
              onUpdateCriminalCode={handleUpdateCriminalCode}
              onUpdateProsecutors={handleUpdateProsecutors}
              currentUserId={user?.id || ''}
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
                prosecutors={prosecutors}
              />
              <div className="flex justify-end mb-4"> {/* Nút xuất Excel cho vụ án */}
                <button
                  onClick={handleExportCasesToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Download size={16} />
                  Xuất Excel Vụ Án
                </button>
              </div>
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
