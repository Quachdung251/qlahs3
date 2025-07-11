// app.txt (hoặc App.tsx nếu là TypeScript)

import React, { useState, useMemo, useEffect } from 'react';
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
  const { user, loading: authLoading, signIn, signOut, isAuthenticated, supabase } = useSupabaseAuth(); [cite: 192]
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
  const { cases, addCase, updateCase, deleteCase, transferStage, toggleImportant, getCasesByStage, getExpiringSoonCases, isLoading: casesLoading, overwriteAllCases } = useCases(userKey, isInitialized); [cite: 198]
  const { reports, addReport, updateReport, deleteReport, transferReportStage, getReportsByStage, getExpiringSoonReports, isLoading: reportsLoading, overwriteAllReports } = useReports(userKey, isInitialized);
  const [showBackupRestoreModal, setShowBackupRestoreModal] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
  const [dataToRestore, setDataToRestore] = useState<{ cases: Case[], reports: Report[] } | null>(null);
  const [showQrScannerModal, setShowQrScannerModal] = useState(false); [cite: 203]
  const [scanMessage, setScanMessage] = useState<string | null>(null); // Thêm state để hiển thị thông báo quét

  // Hàm xử lý khi quét QR thành công
  // Hàm này đã có sẵn và sẽ được gọi khi nhận được QR data
  const handleQrScanSuccess = (qrData: string) => { [cite: 273]
    console.log('QR Scan Success! QR Data:', qrData);
    // Giả định QR Data là Case ID
    const caseId = qrData;
    const foundCase = cases.find(c => c.id === caseId); [cite: 274]

    if (foundCase) {
      handleEditCase(foundCase); // Mở form chỉnh sửa với dữ liệu vụ án [cite: 275]
      // Optional: hide QR scanner modal if it's open
      setShowQrScannerModal(false);
    } else {
      console.warn(`Không tìm thấy vụ án với ID: ${caseId}`); [cite: 275]
      setScanMessage(`Không tìm thấy vụ án với ID: ${caseId}. Vui lòng kiểm tra lại.`); [cite: 276]
      setTimeout(() => setScanMessage(null), 3000);
    }
  };

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
  }, [isAuthenticated, user, supabase, cases, handleEditCase, handleQrScanSuccess]); // Thêm cases và handleEditCase vào dependency array

  // ... (phần còn lại của component App)

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

  if (!isAuthenticated) {
    return <LoginForm onLogin={signIn} />; [cite: 205]
  }

  // ... (các hàm xử lý và render khác)
  // Có thể hiển thị scanMessage nếu cần
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... header và các phần khác ... */}
      {scanMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 p-3 bg-blue-100 text-blue-800 rounded-md shadow-lg z-50">
          {scanMessage}
        </div>
      )}
      {/* ... main content ... */}
    </div>
  );
};

export default App;