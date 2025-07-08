import React, { useState, useMemo, useEffect } from 'react';
import { Scale, FileText, LogOut, Users, Download, Cloud, Upload } from 'lucide-react'; // Thêm Cloud, Upload icon
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
// Đã loại bỏ prepareCaseDataForExcel khỏi import vì nó không còn được sử dụng trực tiếp ở đây
import { exportToExcel, prepareReportDataForExcel, prepareCaseStatisticsForExcel, prepareReportStatisticsForExcel } from './utils/excelExportUtils'; 
import { Case, Report, CaseFormData } from './types'; // Import Case và Report types
import { getCurrentDate, getDaysRemaining } from './utils/dateUtils'; // Import getCurrentDate và getDaysRemaining

type SystemType = 'cases' | 'reports';

const App: React.FC = () => {
  const { user, loading: authLoading, signIn, signOut, isAuthenticated, supabase } = useSupabaseAuth(); // Lấy supabase client
  const { isInitialized } = useIndexedDB();
  const [activeSystem, setActiveSystem] = useState<SystemType>('cases');
  const [activeTab, setActiveTab] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProsecutor, setSelectedProsecutor] = useState('');
  
  // Thêm state cho ngày bắt đầu và ngày kết thúc thống kê
  const [statisticsFromDate, setStatisticsFromDate] = useState(getCurrentDate());
  const [statisticsToDate, setStatisticsToDate] = useState(getCurrentDate());

  // Thêm state để quản lý vụ án/tin báo đang được chỉnh sửa
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  const { prosecutors, loading: prosecutorsLoading, error: prosecutorsError, setProsecutors } = useProsecutors();

  const userKey = user?.id || 'default';
  // Cập nhật useCases và useReports để có hàm overwriteAll
  const { cases, addCase, updateCase, deleteCase, transferStage, getCasesByStage, getExpiringSoonCases, isLoading: casesLoading, overwriteAllCases } = useCases(userKey, isInitialized);
  const { reports, addReport, updateReport, deleteReport, transferReportStage, getReportsByStage, getExpiringSoonReports, isLoading: reportsLoading, overwriteAllReports } = useReports(userKey, isInitialized);

  // State cho thông báo và trạng thái lưu/khôi phục
  const [showBackupRestoreModal, setShowBackupRestoreModal] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false); // State cho modal xác nhận khôi phục

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
  };

  const handleUpdateProsecutors = (data: Prosecutor[]) => {
    console.log('Updated prosecutors data in App:', data);
    setProsecutors(data);
  };

  // Hàm xử lý khi người dùng nhấn nút "Sửa" trên một vụ án
  const handleEditCase = (caseToEdit: Case) => {
    setEditingCase(caseToEdit);
    setActiveTab('add'); // Chuyển sang tab "Thêm" để hiển thị form chỉnh sửa
    setActiveSystem('cases'); // Đảm bảo hệ thống vụ án đang hoạt động
  };

  // Hàm xử lý khi người dùng nhấn nút "Sửa" trên một tin báo
  const handleEditReport = (reportToEdit: Report) => {
    setEditingReport(reportToEdit);
    setActiveTab('add'); // Chuyển sang tab "Thêm" để hiển thị form chỉnh sửa
    setActiveSystem('reports'); // Đảm bảo hệ thống tin báo đang hoạt động
  };

  // Hàm xử lý khi form chỉnh sửa vụ án hoàn tất (lưu hoặc hủy)
  const handleCaseFormSubmit = (caseData: CaseFormData, isEditing: boolean) => {
    if (isEditing && editingCase) {
      updateCase({ ...caseData, id: editingCase.id, stage: editingCase.stage, createdAt: editingCase.createdAt });
      setEditingCase(null); // Xóa trạng thái chỉnh sửa
      setActiveTab('all'); // Chuyển về tab danh sách
    } else {
      addCase(caseData);
    }
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

  // Helper function to prepare case data for Excel based on the active tab
  const prepareCaseDataForCurrentTabExport = (casesToExport: Case[], currentTab: string) => {
    let dataToExport: any[] = [];
    let columns: { key: string; label: string }[] = [];

    // Define base columns that are always present or common
    const baseCaseColumns = [
        { key: 'caseName', label: 'Tên Vụ án' },
        { key: 'defendantsList', label: 'Bị can' }, // <--- THAY ĐỔI: Tội danh (VA) thành Bị can
        { key: 'prosecutor', label: 'KSV' },
        { key: 'caseNotes', label: 'Ghi chú Vụ án' },
        { key: 'stage', label: 'Giai đoạn' },
    ];

    // Define columns specific to each tab for export
    switch (currentTab) {
        case 'all':
            columns = [
                ...baseCaseColumns.filter(col => col.key !== 'stage'), // Stage will be added at the end
                { key: 'investigationDeadline', label: 'Thời hạn ĐT' },
                { key: 'totalDefendants', label: 'Tổng Bị can' },
                { key: 'shortestDetention', label: 'BP Ngăn chặn ngắn nhất' },
                { key: 'prosecutionTransferDate', label: 'Ngày chuyển TT' },
                { key: 'trialTransferDate', label: 'Ngày chuyển XX' },
                { key: 'stage', label: 'Giai đoạn' }, // Add stage at the end for 'all'
            ];
            break;
        case 'investigation':
            columns = [
                ...baseCaseColumns.filter(col => col.key !== 'stage'),
                { key: 'investigationDeadline', label: 'Thời hạn ĐT' },
                { key: 'investigationRemaining', label: 'Thời hạn ĐT còn lại' },
                { key: 'totalDefendants', label: 'Tổng Bị can' },
                { key: 'shortestDetention', label: 'BP Ngăn chặn ngắn nhất' },
                { key: 'shortestDetentionRemaining', label: 'Hạn Tạm giam ngắn nhất' },
                { key: 'stage', label: 'Giai đoạn' },
            ];
            break;
        case 'prosecution':
            columns = [
                ...baseCaseColumns.filter(col => col.key !== 'stage'),
                // Đã bỏ cột 'Thời hạn ĐT (Ban đầu)'
                { key: 'totalDefendants', label: 'Tổng Bị can' },
                // Đã bỏ cột 'BP Ngăn chặn ngắn nhất'
                { key: 'prosecutionTransferDate', label: 'Ngày chuyển TT' }, // NEW
                { key: 'stage', label: 'Giai đoạn' },
            ];
            break;
        case 'trial':
            columns = [
                ...baseCaseColumns.filter(col => col.key !== 'stage'),
                // Đã bỏ cột 'Thời hạn ĐT (Ban đầu)'
                { key: 'totalDefendants', label: 'Tổng Bị can' },
                // Đã bỏ cột 'BP Ngăn chặn ngắn nhất'
                { key: 'trialTransferDate', label: 'Ngày chuyển XX' }, // NEW
                { key: 'stage', label: 'Giai đoạn' },
            ];
            break;
        case 'expiring':
            columns = [
                ...baseCaseColumns.filter(col => col.key !== 'stage'),
                { key: 'investigationDeadline', label: 'Thời hạn ĐT' },
                { key: 'investigationRemaining', label: 'Thời hạn ĐT còn lại' },
                { key: 'totalDefendants', label: 'Tổng Bị can' },
                { key: 'shortestDetention', label: 'BP Ngăn chặn ngắn nhất' },
                { key: 'shortestDetentionRemaining', label: 'Hạn Tạm giam ngắn nhất' },
                { key: 'stage', label: 'Giai đoạn' },
            ];
            break;
        default:
            columns = baseCaseColumns;
    }

    casesToExport.forEach(caseItem => {
        const row: any = {}; // Initialize an empty row

        columns.forEach(col => { // Iterate through the selected columns for this tab
            switch (col.key) {
                case 'caseName':
                    row[col.key] = caseItem.name;
                    break;
                case 'defendantsList': // <--- THAY ĐỔI: Xử lý cột Bị can
                    if (caseItem.defendants && caseItem.defendants.length > 0) {
                        row[col.key] = caseItem.defendants.map(d => d.name).join('; ');
                    } else {
                        row[col.key] = 'Không có bị can';
                    }
                    break;
                case 'caseCharges': // Giữ nguyên tội danh vụ án nếu nó vẫn cần ở đâu đó
                    row[col.key] = caseItem.charges;
                    break;
                case 'prosecutor':
                    row[col.key] = caseItem.prosecutor;
                    break;
                case 'caseNotes':
                    row[col.key] = caseItem.notes;
                    break;
                case 'stage':
                    row[col.key] = caseItem.stage;
                    break;
                case 'investigationDeadline':
                    row[col.key] = caseItem.investigationDeadline;
                    break;
                case 'prosecutionTransferDate':
                    row[col.key] = caseItem.prosecutionTransferDate || '';
                    break;
                case 'trialTransferDate':
                    row[col.key] = caseItem.trialTransferDate || '';
                    break;
                case 'investigationRemaining':
                    row[col.key] = `${getDaysRemaining(caseItem.investigationDeadline)} ngày`;
                    break;
                case 'totalDefendants':
                    row[col.key] = caseItem.defendants.length > 0 ? `${caseItem.defendants.length} bị can` : '0 bị can';
                    break;
                case 'shortestDetention':
                    const detainedDefsForShortestDetention = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline);
                    if (detainedDefsForShortestDetention.length > 0) {
                        const shortestDays = Math.min(...detainedDefsForShortestDetention.map(d => getDaysRemaining(d.detentionDeadline!)));
                        row[col.key] = `${shortestDays} ngày`;
                    } else {
                        row[col.key] = 'Không có';
                    }
                    break;
                case 'shortestDetentionRemaining':
                    const detainedDefsForShortestDetentionRemaining = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline);
                    if (detainedDefsForShortestDetentionRemaining.length > 0) {
                        const shortestDays = Math.min(...detainedDefsForShortestDetentionRemaining.map(d => getDaysRemaining(d.detentionDeadline!)));
                        row[col.key] = `${shortestDays} ngày`;
                    } else {
                        row[col.key] = 'Không có';
                    }
                    break;
                // Add other case properties here if needed for specific columns
                default:
                    // If a column key doesn't match any specific case, try to get it directly from caseItem
                    // This handles generic keys like 'id', 'createdAt', etc., if they were to be added.
                    row[col.key] = (caseItem as any)[col.key] || '';
            }
        });

        dataToExport.push(row);
    });

    return { data: dataToExport, columns };
  };

  // Xử lý xuất Excel cho vụ án
  const handleExportCasesToExcel = () => {
    if (activeTab === 'statistics') {
      // Nếu đang ở tab thống kê, xuất dữ liệu thống kê vụ án
      const { data: dataToExport, columns } = prepareCaseStatisticsForExcel(cases, statisticsFromDate, statisticsToDate);
      exportToExcel(dataToExport, columns, 'ThongKeVuAn');
    } else {
      // Nếu đang ở các tab bảng, xuất dữ liệu chi tiết vụ án dựa trên tab hiện tại
      const filteredCases = getCaseTableData(); // Lấy dữ liệu đã được lọc theo tìm kiếm/kiểm sát viên
      const { data: dataToExport, columns } = prepareCaseDataForCurrentTabExport(filteredCases, activeTab); 
      exportToExcel(dataToExport, columns, 'DanhSachVuAn');
    }
  };

  // Xử lý xuất Excel cho tin báo
  const handleExportReportsToExcel = () => {
    if (activeTab === 'statistics') {
      // Nếu đang ở tab thống kê, xuất dữ liệu thống kê tin báo
      const { data: dataToExport, columns } = prepareReportStatisticsForExcel(reports, statisticsFromDate, statisticsToDate);
      exportToExcel(dataToExport, columns, 'ThongKeTinBao');
    } else {
      // Nếu đang ở các tab bảng, xuất dữ liệu chi tiết tin báo
      const filteredReports = getReportTableData();
      const { data: dataToExport, columns } = prepareReportDataForExcel(filteredReports);
      exportToExcel(dataToExport, columns, 'DanhSachTinBao');
    }
  };

  // Hàm lưu dữ liệu lên Supabase
  const handleSaveDataToSupabase = async () => {
    const currentUser = user; // Chụp giá trị user hiện tại
    const currentSupabase = supabase; // Chụp giá trị supabase client hiện tại

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

      // Sử dụng upsert để chỉ lưu 1 bản backup duy nhất cho mỗi user
      const { error } = await currentSupabase // Sử dụng biến đã chụp
        .from('user_backups')
        .upsert(
          { user_id: currentUser.id, data: combinedData, created_at: new Date().toISOString() }, // Sử dụng biến đã chụp
          { onConflict: 'user_id' } // Nếu có conflict với user_id, sẽ update bản ghi đó
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
    const currentUser = user; // Chụp giá trị user hiện tại
    const currentSupabase = supabase; // Chụp giá trị supabase client hiện tại

    if (!currentUser || !currentSupabase) {
      setRestoreMessage('Lỗi: Người dùng chưa đăng nhập hoặc Supabase chưa sẵn sàng.');
      return;
    }
    setRestoreLoading(true);
    setRestoreMessage(null);

    try {
      const { data, error } = await currentSupabase // Sử dụng biến đã chụp
        .from('user_backups')
        .select('data')
        .eq('user_id', currentUser.id) // Sử dụng biến đã chụp
        .single(); // Lấy bản ghi duy nhất

      if (error && error.code !== 'PGRST116') { // PGRST116 là lỗi không tìm thấy bản ghi
        throw error;
      }

      if (!data || !data.data) {
        setRestoreMessage('Không tìm thấy bản sao lưu nào trên Supabase.');
        return;
      }

      // Mở modal xác nhận thay vì dùng window.confirm
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

    const currentUser = user; // Chụp giá trị user hiện tại
    const currentSupabase = supabase; // Chụp giá trị supabase client hiện tại

    if (!currentUser || !currentSupabase) {
      // Trường hợp này lý tưởng là không xảy ra nếu handleLoadDataFromSupabase đã xử lý đúng,
      // nhưng đây là một lớp bảo vệ bổ sung.
      setRestoreMessage('Lỗi: Người dùng chưa đăng nhập hoặc Supabase chưa sẵn sàng.');
      setRestoreLoading(false); // Đảm bảo trạng thái loading được reset
      return;
    }

    try {
      // Đọc lại dữ liệu từ Supabase để đảm bảo dữ liệu mới nhất
      const { data, error } = await currentSupabase // Sử dụng biến đã chụp
        .from('user_backups')
        .select('data')
        .eq('user_id', currentUser.id) // Sử dụng biến đã chụp
        .single();

      if (error || !data || !data.data) {
        throw new Error(error?.message || 'Không tìm thấy dữ liệu để khôi phục.');
      }

      const restoredData = data.data as { cases: any[]; reports: any[] };
      
      // Ghi đè dữ liệu vào IndexedDB thông qua các hooks
      await overwriteAllCases(restoredData.cases);
      await overwriteAllReports(restoredData.reports);

      setRestoreMessage('Khôi phục dữ liệu thành công từ Supabase! Dữ liệu đã được cập nhật.');
      // Có thể cần refresh lại trang hoặc các state liên quan nếu dữ liệu không tự động cập nhật
      // window.location.reload(); // Hoặc gọi lại các hàm fetch dữ liệu
    } catch (error: any) {
      console.error('Lỗi khi khôi phục dữ liệu sau xác nhận:', error.message);
      setRestoreMessage(`Lỗi khi khôi phục dữ liệu: ${error.message}`);
    } finally {
      setRestoreLoading(false);
    }
  };

  const renderMainContent = () => {
    if (activeSystem === 'reports') {
      switch (activeTab) {
        case 'add':
          return (
            <ReportForm 
              onSubmit={(data, isEditing) => handleReportFormSubmit(data, isEditing)} // Cập nhật props
              onTransferToCase={addCase} 
              prosecutors={prosecutors} 
              initialData={editingReport} // Truyền dữ liệu tin báo đang chỉnh sửa
              onCancelEdit={() => { // Hàm hủy chỉnh sửa
                setEditingReport(null);
                setActiveTab('all'); // Chuyển về tab danh sách
              }}
            />
          );
        case 'statistics':
          return (
            <>
              <div className="flex justify-end mb-4"> {/* Nút xuất Excel cho thống kê tin báo */}
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
              <div className="flex justify-end mb-4"> {/* Nút xuất Excel Tin Báo cho các tab danh sách */}
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
                onEditReport={handleEditReport} // Truyền hàm xử lý chỉnh sửa
              />
            </>
          );
      }
    } else { // activeSystem === 'cases'
      switch (activeTab) {
        case 'add':
          return (
            <CaseForm 
              onSubmit={(data, isEditing) => handleCaseFormSubmit(data, isEditing)} // Cập nhật props
              prosecutors={prosecutors} 
              initialData={editingCase} // Truyền dữ liệu vụ án đang chỉnh sửa
              onCancelEdit={() => { // Hàm hủy chỉnh sửa
                setEditingCase(null);
                setActiveTab('all'); // Chuyển về tab danh sách
              }}
            />
          );
        case 'statistics':
          return (
            <>
              <div className="flex justify-end mb-4"> {/* Nút xuất Excel cho thống kê vụ án */}
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
              {/* Đảm bảo chỉ có MỘT nút Xuất Excel Vụ Án ở đây */}
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
                onEditCase={handleEditCase} // Truyền hàm xử lý chỉnh sửa
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
              
              {/* Nút Lưu/Khôi phục dữ liệu Supabase */}
              <button
                onClick={() => setShowBackupRestoreModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Lưu và Khôi phục dữ liệu từ Supabase"
                // Disable nút nếu user hoặc supabase chưa sẵn sàng
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
                onClick={handleSaveDataToSupabase}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={backupLoading}
              >
                {backupLoading ? 'Đang lưu...' : <><Upload size={16} /> Lưu lên Cloud</>}
              </button>
              <button
                onClick={handleLoadDataFromSupabase}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                disabled={restoreLoading}
              >
                {restoreLoading ? 'Đang khôi phục...' : <><Download size={16} /> Khôi phục từ Cloud</>}
              </button>
              <button
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

      {/* Modal xác nhận khôi phục */}
      {showRestoreConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận khôi phục dữ liệu</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn khôi phục dữ liệu từ Supabase? Thao tác này sẽ <span className="font-bold text-red-600">GHI ĐÈ</span> toàn bộ dữ liệu hiện có trên thiết bị của bạn và không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRestoreConfirmModal(false);
                  setRestoreMessage('Đã hủy khôi phục dữ liệu.');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={confirmRestoreAction}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
```