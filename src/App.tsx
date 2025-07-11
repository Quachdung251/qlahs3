import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Scale, FileText, LogOut, Users, Download, Cloud, Upload, X, QrCode } from 'lucide-react';
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
import { Prosecutor } from './hooks/useProsecutors';
import { useProsecutors } from './hooks/useProsecutors';
import { exportToExcel, prepareCaseDataForExcel, prepareReportDataForExcel, prepareCaseStatisticsForExcel, prepareReportStatisticsForExcel } from './utils/excelExportUtils';
import { Case, Report, CaseFormData, ReportFormData } from './types';
import { getCurrentDate, getDaysRemaining } from './utils/dateUtils';
import QRCodeScannerModal from './components/QRCodeScannerModal';

type SystemType = 'cases' | 'reports';

const App: React.FC = () => {
  const { user, loading: authLoading, signIn, signOut, isAuthenticated, supabase } = useSupabaseAuth();
  const { isInitialized } = useIndexedDB();
  const [activeSystem, setActiveSystem] = useState<SystemType>('cases');
  const [activeTab, setActiveTab] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProsecutor, setSelectedProsecutor] = useState('');
  const [statisticsFromDate, setStatisticsFromDate] = useState(getCurrentDate());
  const [statisticsToDate, setStatisticsToDate] = useState(getCurrentDate());
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const { prosecutors, loading: prosecutorsLoading, error: prosecutorsError, overwriteAllProsecutors } = useProsecutors();
  const userKey = user?.id || 'default';
  const { cases, addCase, updateCase, deleteCase, transferStage, toggleImportant, getCasesByStage, getExpiringSoonCases, isLoading: casesLoading, overwriteAllCases } = useCases(userKey, isInitialized);
  const { reports, addReport, updateReport, deleteReport, transferReportStage, getReportsByStage, getExpiringSoonReports, isLoading: reportsLoading, overwriteAllReports } = useReports(userKey, isInitialized);
  const [showBackupRestoreModal, setShowBackupRestoreModal] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
  const [dataToRestore, setDataToRestore] = useState<{ cases: Case[], reports: Report[] } | null>(null);
  const [showQrScannerModal, setShowQrScannerModal] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null); // Thêm state để hiển thị thông báo quét

  // Hàm xử lý khi người dùng nhấn nút "Sửa" trên một vụ án
  const handleEditCase = useCallback((caseToEdit: Case) => {
    setEditingCase(caseToEdit);
    setActiveTab('add'); // Chuyển sang tab "Thêm" để hiển thị form chỉnh sửa
    setActiveSystem('cases'); // Đảm bảo hệ thống vụ án đang hoạt động
  }, []); // Không có dependencies vì chỉ set state

  // Hàm xử lý khi quét QR thành công
  // Hàm này đã có sẵn và sẽ được gọi khi nhận được QR data
  const handleQrScanSuccess = useCallback((qrData: string) => {
    console.log('QR Scan Success! QR Data:', qrData);
    // Giả định QR Data là Case ID
    const caseId = qrData;
    const foundCase = cases.find(c => c.id === caseId);

    if (foundCase) {
      handleEditCase(foundCase); // Mở form chỉnh sửa với dữ liệu vụ án
      // Optional: hide QR scanner modal if it's open
      setShowQrScannerModal(false);
    } else {
      console.warn(`Không tìm thấy vụ án với ID: ${caseId}`);
      setScanMessage(`Không tìm thấy vụ án với ID: ${caseId}. Vui lòng kiểm tra lại.`);
      setTimeout(() => setScanMessage(null), 3000);
    }
  }, [cases, handleEditCase]); // Thêm cases và handleEditCase vào dependency array

  // --- BỔ SUNG ĐOẠN CODE NÀY ĐỂ LẮNG NGHE SUPABASE REALTIME ---
  useEffect(() => {
    let realtimeChannel: any = null;

    if (isAuthenticated && user && supabase) {
      const channelName = `qr_scans_channel_${user.id}`; // Phải khớp với tên kênh trong index.html
      realtimeChannel = supabase.channel(channelName);

      realtimeChannel.on(
        'broadcast',
        { event: 'scan_event' },
        (payload: any) => {
          console.log('Received Realtime scan_event:', payload);
          if (payload.payload && payload.payload.qrData) {
            handleQrScanSuccess(payload.payload.qrData); // Gọi hàm xử lý QR code
          }
        }
      ).subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Đã đăng ký kênh Realtime: ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Lỗi đăng ký kênh Realtime: ${channelName}`);
        }
      });
    }

    // Cleanup function: Hủy đăng ký kênh khi component unmount hoặc user thay đổi
    return () => {
      if (realtimeChannel) {
        console.log(`Hủy đăng ký kênh Realtime: ${realtimeChannel.name}`);
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [isAuthenticated, user, supabase, handleQrScanSuccess]); // Loại bỏ 'cases' và 'handleEditCase' khỏi dependencies của useEffect này để tránh re-subscribe không cần thiết, vì handleQrScanSuccess đã là useCallback và có dependencies của nó.


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
    setEditingCase(null); // Clear editing state when switching systems
    setEditingReport(null); // Clear editing state when switching systems
    // Reset ngày thống kê khi chuyển hệ thống
    setStatisticsFromDate(getCurrentDate());
    setStatisticsToDate(getCurrentDate());
  };

  const handleUpdateCriminalCode = (data: CriminalCodeItem[]) => {
    console.log('Updated criminal code data:', data);
    // Không cần setCriminalCodeData ở đây vì DataManagement đã tự cập nhật IndexedDB
  };

  const handleUpdateProsecutors = (data: Prosecutor[]) => {
    console.log('Updated prosecutors data in App:', data);
    // useProsecutors hook đã tự cập nhật state và IndexedDB, không cần setProsecutors ở đây
    // setProsecutors(data); // Dòng này không còn cần thiết
  };

  // Hàm xử lý khi người dùng nhấn nút "Sửa" trên một tin báo
  const handleEditReport = (reportToEdit: Report) => {
    setEditingReport(reportToEdit);
    setActiveTab('add'); // Chuyển sang tab "Thêm" để hiển thị form chỉnh sửa
    setActiveSystem('reports'); // Đảm bảo hệ thống tin báo đang hoạt động
  };

  // Hàm xử lý khi form chỉnh sửa vụ án hoàn tất (lưu hoặc hủy)
  const handleCaseFormSubmit = async (caseData: CaseFormData, isEditing: boolean) => {
    let resultCase: Case | void;
    if (isEditing && editingCase) {
      resultCase = await updateCase({ ...caseData, id: editingCase.id, stage: editingCase.stage, createdAt: editingCase.createdAt, isImportant: editingCase.isImportant }); // GIỮ isImportant
      setEditingCase(null); // Xóa trạng thái chỉnh sửa
      setActiveTab('all'); // Chuyển về tab danh sách
    } else {
      resultCase = await addCase(caseData);
    }
    return resultCase; // Trả về vụ án đã được thêm/cập nhật
  };

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
        data = cases; // cases đã được sắp xếp trong useCases
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

  // Hàm lưu dữ liệu lên Supabase
  const handleSaveDataToSupabase = async () => {
    const currentUser = user;
    const currentSupabase = supabase;

    if (!currentUser || !currentSupabase) {
      setBackupMessage('Lỗi: Người dùng chưa đăng nhập hoặc Supabase chưa sẵn sàng.');
      return;
    }
    setBackupLoading(true);
    setBackupMessage(null);

    try {
      const combinedData = {
        cases: cases,
        reports: reports,
      };

      const { error } = await currentSupabase
        .from('user_backups')
        .upsert(
          { user_id: currentUser.id, data: combinedData, created_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      if (error) {
        throw error;
      }
      setBackupMessage('Lưu dữ liệu thành công lên Supabase!');
    } catch (error: any) {
      console.error('Lỗi khi lưu dữ liệu lên Supabase:', error.message);
      setBackupMessage(`Lỗi khi lưu dữ liệu: ${error.message}`);
    } finally {
      setBackupLoading(false);
    }
  };

  // Hàm khôi phục dữ liệu từ Supabase
  const handleLoadDataFromSupabase = async () => {
    const currentUser = user;
    const currentSupabase = supabase;

    if (!currentUser || !currentSupabase) {
      setRestoreMessage('Lỗi: Người dùng chưa đăng nhập hoặc Supabase chưa sẵn sàng.');
      return;
    }
    setRestoreLoading(true);
    setRestoreMessage(null);

    try {
      const { data, error } = await currentSupabase
        .from('user_backups')
        .select('data')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 là lỗi không tìm thấy bản ghi
        throw error;
      }

      if (!data || !data.data) {
        setRestoreMessage('Không tìm thấy bản sao lưu nào trên Supabase.');
        return;
      }

      // Lưu dữ liệu vào state tạm thời và hiển thị modal xác nhận
      setDataToRestore(data.data as { cases: Case[], reports: Report[] });
      setShowRestoreConfirmModal(true);

    } catch (error: any) {
      console.error('Lỗi khi khôi phục dữ liệu từ Supabase:', error.message);
      setRestoreMessage(`Lỗi khi khôi phục dữ liệu: ${error.message}`);
    } finally {
      setRestoreLoading(false);
    }
  };

  // Hàm xử lý khi người dùng xác nhận khôi phục
  const confirmRestoreAction = async () => {
    setShowRestoreConfirmModal(false); // Đóng modal xác nhận
    setRestoreLoading(true); // Bắt đầu lại trạng thái loading cho khôi phục
    setRestoreMessage(null);

    const currentUser = user;
    const currentSupabase = supabase;

    if (!currentUser || !currentSupabase || !dataToRestore) {
      setRestoreMessage('Lỗi: Dữ liệu hoặc thông tin người dùng không hợp lệ để khôi phục.');
      setRestoreLoading(false);
      return;
    }

    try {
      // Ghi đè dữ liệu vào IndexedDB thông qua các hooks
      await overwriteAllCases(dataToRestore.cases);
      await overwriteAllReports(dataToRestore.reports);
      setRestoreMessage('Khôi phục dữ liệu thành công từ Supabase! Dữ liệu đã được cập nhật.');
    } catch (error: any) {
      console.error('Lỗi khi khôi phục dữ liệu sau xác nhận:', error.message);
      setRestoreMessage(`Lỗi khi khôi phục dữ liệu: ${error.message}`);
    } finally {
      setRestoreLoading(false);
      setDataToRestore(null); // Xóa dữ liệu tạm thời
    }
  };

  const renderMainContent = () => {
    if (activeSystem === 'reports') {
      switch (activeTab) {
        case 'add':
          return (
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
          );
        case 'statistics':
          return (
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
          );
        case 'data':
          return (
            <DataManagement
              onUpdateCriminalCode={handleUpdateCriminalCode}
              onUpdateProsecutors={handleUpdateProsecutors}
              currentUserId={user?.id || ''}
            />
          );
        default: // Tabs khác (all, pending, expiring)
          return (
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
          );
      }
    } else { // activeSystem === 'cases'
      switch (activeTab) {
        case 'add':
          return (
            <CaseForm
              onSubmit={(data, isEditing) => handleCaseFormSubmit(data, isEditing)}
              prosecutors={prosecutors}
              initialData={editingCase}
              onCancelEdit={() => {
                setEditingCase(null);
                setActiveTab('all');
              }}
            />
          );
        case 'statistics':
          return (
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
          );
        case 'data':
          return (
            <DataManagement
              onUpdateCriminalCode={handleUpdateCriminalCode}
              onUpdateProsecutors={handleUpdateProsecutors}
              currentUserId={user?.id || ''}
            />
          );
        default: // Tabs khác (all, investigation, prosecution, trial, expiring)
          return (
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
                onToggleImportant={toggleImportant} // THÊM PROP NÀY
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

              {/* Nút Quét Hồ Sơ */}
              <button
                onClick={() => setShowQrScannerModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Quét mã QR hồ sơ"
              >
                <QrCode size={16} />
                Quét Hồ Sơ
              </button>

              {/* Nút Lưu/Khôi phục dữ liệu Supabase */}
              <button
                onClick={() => setShowBackupRestoreModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Lưu và Khôi phục dữ liệu từ Supabase"
                disabled={!user || !supabase}
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

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          expiringSoonCount={expiringSoonCount}
          systemType={activeSystem}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderMainContent()}
      </main>

      {/* Modal Lưu/Khôi phục dữ liệu */}
      {showBackupRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lưu & Khôi phục dữ liệu (Supabase)</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có thể lưu dữ liệu hiện tại lên Supabase hoặc khôi phục dữ liệu đã lưu.
              Lưu ý: Chỉ có một bản sao lưu duy nhất cho mỗi tài khoản. Khi bạn lưu, bản sao lưu cũ sẽ bị ghi đè.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleSaveDataToSupabase}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={backupLoading}
              >
                {backupLoading ? 'Đang lưu...' : <><Upload size={16} /> Lưu lên Cloud</>}
              </button>
              <button
                type="button"
                onClick={handleLoadDataFromSupabase}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                disabled={restoreLoading}
              >
                {restoreLoading ? 'Đang khôi phục...' : <><Download size={16} /> Khôi phục từ Cloud</>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBackupRestoreModal(false);
                  setBackupMessage(null);
                  setRestoreMessage(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Đóng
              </button>
            </div>
            {backupMessage && (
              <p className={`mt-4 text-sm ${backupMessage.startsWith('Lỗi') ? 'text-red-600' : 'text-green-600'}`}>
                {backupMessage}
              </p>
            )}
            {restoreMessage && (
              <p className={`mt-4 text-sm ${restoreMessage.startsWith('Lỗi') ? 'text-red-600' : 'text-green-600'}`}>
                {restoreMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal Xác nhận Khôi phục */}
      {showRestoreConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận Khôi phục Dữ liệu</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn khôi phục dữ liệu từ Cloud? Thao tác này sẽ GHI ĐÈ toàn bộ dữ liệu Vụ án và Tin báo hiện có trên thiết bị của bạn bằng dữ liệu từ bản sao lưu.
              Bạn sẽ không thể hoàn tác thao tác này.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={confirmRestoreAction}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <Upload size={16} />
                Xác nhận Ghi đè
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRestoreConfirmModal(false);
                  setDataToRestore(null); // Xóa dữ liệu tạm thời
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quét QR Code */}
      {showQrScannerModal && (
        <QRCodeScannerModal
          onScanSuccess={handleQrScanSuccess}
          onClose={() => setShowQrScannerModal(false)}
        />
      )}

      {/* Thông báo quét QR (hiển thị tạm thời) */}
      {scanMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 p-3 bg-blue-100 text-blue-800 rounded-md shadow-lg z-50">
          {scanMessage}
        </div>
      )}
    </div>
  );
};

export default App;
