import React, { useState, useCallback } from 'react';
import TabNavigation from '../components/TabNavigation';
import ReportForm from '../components/ReportForm';
import ReportTable from '../components/ReportTable';
import DataManagement from '../components/DataManagement';
import ReportStatistics from '../components/ReportStatistics';
import SearchFilter from '../components/SearchFilter';
import { useReports } from '../hooks/useReports';
import { useCases } from '../hooks/useCases'; // To add case from report
import { useProsecutors } from '../hooks/useProsecutors';
import { CriminalCodeItem } from '../data/criminalCode';
import { Prosecutor } from '../hooks/useProsecutors';
import { exportToExcel, prepareReportDataForExcel, prepareReportStatisticsForExcel } from '../utils/excelExportUtils';
import { Report, ReportFormData } from '../types';
import { getCurrentDate } from '../utils/dateUtils';
import { Download } from 'lucide-react';

const ReportManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProsecutor, setSelectedProsecutor] = useState('');
  const [statisticsFromDate, setStatisticsFromDate] = useState(getCurrentDate());
  const [statisticsToDate, setStatisticsToDate] = useState(getCurrentDate());
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  const { reports, addReport, updateReport, deleteReport, transferReportStage, getReportsByStage, getExpiringSoonReports, isLoading: reportsLoading } = useReports(); // No userKey, isInitialized needed here
  const { addCase } = useCases(); // Need addCase for transferring report to case
  const { prosecutors, loading: prosecutorsLoading, error: prosecutorsError, overwriteAllProsecutors } = useProsecutors();


  // Hàm xử lý khi người dùng nhấn nút "Sửa" trên một tin báo
  const handleEditReport = useCallback((reportToEdit: Report) => {
    setEditingReport(reportToEdit);
    setActiveTab('add'); // Chuyển sang tab "Thêm" để hiển thị form chỉnh sửa
  }, []);

  // Hàm xử lý khi form chỉnh sửa tin báo hoàn tất (lưu hoặc hủy)
  const handleReportFormSubmit = (reportData: ReportFormData, isEditing: boolean) => {
    if (isEditing && editingReport) {
      updateReport({ ...reportData, id: editingReport.id, stage: editingReport.stage, createdAt: editingReport.createdAt });
      setEditingReport(null); // Xóa trạng thái chỉnh sửa
      setActiveTab('all'); // Chuyển về tab danh sách
    } else {
      addReport(reportData);
    }
  };

  // Filter reports based on search term and prosecutor
  const filterItems = (itemsToFilter: Report[]) => {
    return itemsToFilter.filter(item => {
      const matchesSearch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.charges.toLowerCase().includes(searchTerm.toLowerCase()); // Reports typically don't have defendants

      const matchesProsecutor = !selectedProsecutor ||
        item.prosecutor === selectedProsecutor;

      return matchesSearch && matchesProsecutor;
    });
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

  const expiringSoonCount = getExpiringSoonReports().length;

  // Xử lý xuất Excel cho tin báo
  const handleExportReportsToExcel = () => {
    if (activeTab === 'statistics') {
      const { data: dataToExport, columns } = prepareReportStatisticsForExcel(reports, statisticsFromDate, statisticsToDate);
      exportToExcel(dataToExport, columns, 'ThongKeTinBao');
    } else {
      const filteredReports = getReportTableData();
      const { data: dataToExport, columns } = prepareReportDataForExcel(filteredReports);
      exportToExcel(dataToExport, columns, 'DanhSachTinBao');
    }
  };

  const handleUpdateCriminalCode = (data: CriminalCodeItem[]) => {
    console.log('Updated criminal code data:', data);
    // DataManagement handles IndexedDB update
  };

  const handleUpdateProsecutors = (data: Prosecutor[]) => {
    console.log('Updated prosecutors data in ReportManagementPage:', data);
    // useProsecutors hook handles state and IndexedDB update
    overwriteAllProsecutors(data);
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
        systemType="reports"
      />
      <div className="mt-8">
        {activeTab === 'add' && (
          <ReportForm
            onSubmit={(data, isEditing) => handleReportFormSubmit(data, isEditing)}
            onTransferToCase={addCase}
            prosecutors={prosecutors}
            initialData={editingReport}
            onCancelEdit={() => {
              setEditingReport(null);
              setActiveTab('all');
            }}
          />
        )}
        {activeTab === 'statistics' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleExportReportsToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Download size={16} />
                Xuất Excel Tin Báo
              </button>
            </div>
            <ReportStatistics
              reports={reports}
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
            // currentUserId is not needed here
          />
        )}
        {['all', 'pending', 'expiring'].includes(activeTab) && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleExportReportsToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Download size={16} />
                Xuất Excel Tin Báo
              </button>
            </div>
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedProsecutor={selectedProsecutor}
              onProsecutorChange={setSelectedProsecutor}
              prosecutors={prosecutors}
            />
            <ReportTable
              reports={getReportTableData()}
              columns={getReportTableColumns(activeTab)}
              onDeleteReport={deleteReport}
              onTransferStage={transferReportStage}
              onUpdateReport={updateReport}
              onTransferToCase={addCase}
              onEditReport={handleEditReport}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ReportManagementPage;