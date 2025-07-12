import React, { useState, useCallback } from 'react';
import TabNavigation from '../components/TabNavigation';
import CaseForm from '../components/CaseForm';
import CaseTable from '../components/CaseTable';
import DataManagement from '../components/DataManagement';
import Statistics from '../components/Statistics';
import SearchFilter from '../components/SearchFilter';
import { useCases } from '../hooks/useCases';
import { useProsecutors } from '../hooks/useProsecutors';
import { CriminalCodeItem } from '../data/criminalCode';
import { Prosecutor } from '../hooks/useProsecutors';
import { exportToExcel, prepareCaseDataForExcel, prepareCaseStatisticsForExcel } from '../utils/excelExportUtils';
import { Case, CaseFormData } from '../types';
import { getCurrentDate } from '../utils/dateUtils';
import { Download } from 'lucide-react';

const CaseManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProsecutor, setSelectedProsecutor] = useState('');
  const [statisticsFromDate, setStatisticsFromDate] = useState(getCurrentDate());
  const [statisticsToDate, setStatisticsToDate] = useState(getCurrentDate());
  const [editingCase, setEditingCase] = useState<Case | null>(null);

  const { cases, addCase, updateCase, deleteCase, transferStage, toggleImportant, getCasesByStage, getExpiringSoonCases, isLoading: casesLoading } = useCases(); // No userKey, isInitialized needed here
  const { prosecutors, loading: prosecutorsLoading, error: prosecutorsError, overwriteAllProsecutors } = useProsecutors();


  // Hàm xử lý khi người dùng nhấn nút "Sửa" trên một vụ án
  const handleEditCase = useCallback((caseToEdit: Case) => {
    setEditingCase(caseToEdit);
    setActiveTab('add'); // Chuyển sang tab "Thêm" để hiển thị form chỉnh sửa
  }, []);

  // Hàm xử lý khi form chỉnh sửa vụ án hoàn tất (lưu hoặc hủy)
  const handleCaseFormSubmit = async (caseData: CaseFormData, isEditing: boolean) => {
    let resultCase: Case | void;
    if (isEditing && editingCase) {
      resultCase = await updateCase({ ...caseData, id: editingCase.id, stage: editingCase.stage, createdAt: editingCase.createdAt, isImportant: editingCase.isImportant });
      setEditingCase(null);
      setActiveTab('all');
    } else {
      resultCase = await addCase(caseData);
    }
    return resultCase;
  };

  // Filter cases based on search term and prosecutor
  const filterItems = (itemsToFilter: Case[]) => {
    return itemsToFilter.filter(item => {
      const matchesSearch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.charges.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.defendants && item.defendants.some(d =>
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
          {
            key: 'charges' as const,
            label: 'Tội danh (VA)',
            render: (caseItem: Case) => {
              const match = caseItem.charges.match(/Điều \d+/);
              return match ? match[0] : caseItem.charges;
            }
          },
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
          {
            key: 'charges' as const,
            label: 'Tội danh (VA)',
            render: (caseItem: Case) => {
              const match = caseItem.charges.match(/Điều \d+/);
              return match ? match[0] : caseItem.charges;
            }
          },
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
          {
            key: 'charges' as const,
            label: 'Tội danh (VA)',
            render: (caseItem: Case) => {
              const match = caseItem.charges.match(/Điều \d+/);
              return match ? match[0] : caseItem.charges;
            }
          },
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
          {
            key: 'charges' as const,
            label: 'Tội danh (VA)',
            render: (caseItem: Case) => {
              const match = caseItem.charges.match(/Điều \d+/);
              return match ? match[0] : caseItem.charges;
            }
          },
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
          {
            key: 'charges' as const,
            label: 'Tội danh (VA)',
            render: (caseItem: Case) => {
              const match = caseItem.charges.match(/Điều \d+/);
              return match ? match[0] : caseItem.charges;
            }
          },
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

  const expiringSoonCount = getExpiringSoonCases().length;

  // Xử lý xuất Excel cho vụ án
  const handleExportCasesToExcel = () => {
    if (activeTab === 'statistics') {
      const { data: dataToExport, columns } = prepareCaseStatisticsForExcel(cases, statisticsFromDate, statisticsToDate);
      exportToExcel(dataToExport, columns, 'ThongKeVuAn');
    } else {
      const filteredCases = getCaseTableData();
      const { data: dataToExport, columns } = prepareCaseDataForExcel(filteredCases, activeTab);
      exportToExcel(dataToExport, columns, 'DanhSachVuAn');
    }
  };

  const handleUpdateCriminalCode = (data: CriminalCodeItem[]) => {
    console.log('Updated criminal code data:', data);
    // DataManagement handles IndexedDB update
  };

  const handleUpdateProsecutors = (data: Prosecutor[]) => {
    console.log('Updated prosecutors data in CaseManagementPage:', data);
    // useProsecutors hook handles state and IndexedDB update
    overwriteAllProsecutors(data); // This might be redundant if useProsecutors already handles it internally
  };


  if (prosecutorsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Đang tải danh sách kiểm sát viên...</p>
      </div>
    );
  }

  if (prosecutorsError) {
    return (
      <div className="text-red-600">Lỗi tải danh sách kiểm sát viên: {prosecutorsError.message}</div>
    );
  }


  return (
    <>
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        expiringSoonCount={expiringSoonCount}
        systemType="cases"
      />
      <div className="mt-8">
        {activeTab === 'add' && (
          <CaseForm
            onSubmit={(data, isEditing) => handleCaseFormSubmit(data, isEditing)}
            prosecutors={prosecutors}
            initialData={editingCase}
            onCancelEdit={() => {
              setEditingCase(null);
              setActiveTab('all');
            }}
          />
        )}
        {activeTab === 'statistics' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleExportCasesToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Download size={16} />
                Xuất Excel Vụ Án
              </button>
            </div>
            <Statistics
              cases={cases}
              fromDate={statisticsFromDate}
              toDate={statisticsToDate}
              setFromDate={setStatisticsFromDate}
              setToDate={setStatisticsToDate}
            />
          </>
        )}
        {activeTab === 'data' && (
          <DataManagement
            onUpdateCriminalCode={handleUpdateCriminalCode}
            onUpdateProsecutors={handleUpdateProsecutors}
            // currentUserId is not needed here if data is managed by hooks internally
          />
        )}
        {['all', 'investigation', 'prosecution', 'trial', 'expiring'].includes(activeTab) && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleExportCasesToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Download size={16} />
                Xuất Excel Vụ Án
              </button>
            </div>
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedProsecutor={selectedProsecutor}
              onProsecutorChange={setSelectedProsecutor}
              prosecutors={prosecutors}
            />
            <CaseTable
              cases={getCaseTableData()}
              columns={getCaseTableColumns(activeTab)}
              onDeleteCase={deleteCase}
              onTransferStage={transferStage}
              onUpdateCase={updateCase}
              onEditCase={handleEditCase}
              onToggleImportant={toggleImportant}
              showWarnings={activeTab === 'expiring'}
            />
          </>
        )}
      </div>
    </>
  );
};

export default CaseManagementPage;