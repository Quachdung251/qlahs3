import React, { useState, useEffect, useCallback } from 'react';
import LoginForm from './components/LoginForm';
import UserAndSystemHeader from './components/UserAndSystemHeader'; // NEW
import CloudBackupRestoreModal from './components/CloudBackupRestoreModal'; // NEW
import ConfirmRestoreModal from './components/ConfirmRestoreModal'; // NEW
import QRCodeScannerModal from './components/QRCodeScannerModal';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useIndexedDB } from './hooks/useIndexedDB';
import { useCases } from './hooks/useCases';
import { useReports } from './hooks/useReports';
import { Case, Report } from './types';
import CaseManagementPage from './pages/CaseManagementPage'; // NEW
import ReportManagementPage from './pages/ReportManagementPage'; // NEW

type SystemType = 'cases' | 'reports';

const App: React.FC = () => {
  const { user, loading: authLoading, signIn, signOut, isAuthenticated, supabase } = useSupabaseAuth();
  const { isInitialized } = useIndexedDB();
  const [activeSystem, setActiveSystem] = useState<SystemType>('cases');
  const [showBackupRestoreModal, setShowBackupRestoreModal] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
  const [dataToRestore, setDataToRestore] = useState<{ cases: Case[], reports: Report[] } | null>(null);
  const [showQrScannerModal, setShowQrScannerModal] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Use cases/reports hooks at top level so data is available to backup/restore
  const userKey = user?.id || 'default';
  const { cases, updateCase, addCase, overwriteAllCases } = useCases(userKey, isInitialized); // Keep updateCase and addCase for QR scan
  const { reports, overwriteAllReports } = useReports(userKey, isInitialized);


  // Hàm xử lý khi quét QR thành công
  const handleQrScanSuccess = useCallback((qrData: string) => {
    console.log('QR Scan Success! QR Data:', qrData);
    const caseId = qrData;
    const foundCase = cases.find(c => c.id === caseId);

    if (foundCase) {
      setActiveSystem('cases'); // Chuyển sang hệ thống vụ án
      // Pass the found case to the CaseManagementPage or directly set editing state if App manages it
      // For now, let's assume CaseManagementPage will handle setting its own editing state via prop drill or context if needed.
      // Or, we could trigger a global event/context update. For simplicity, we'll just log and let the user navigate.
      // A more complex solution would involve a global state management for 'editingCaseId'
      setScanMessage(`Tìm thấy vụ án: "${foundCase.name}". Vui lòng chuyển đến tab "Thêm" hoặc "Tất cả" để xem chi tiết.`);
      setTimeout(() => setScanMessage(null), 5000); // Hide message after 5 seconds
      setShowQrScannerModal(false); // Close the scanner modal
      // Ideally, we'd want to set editingCase on CaseManagementPage, but App.tsx doesn't know its internal state.
      // This is a good candidate for a shared context or a direct prop drill from App to CaseManagementPage.
      // For now, the user needs to manually go to the 'add' tab and input the ID or we pass it down.
      // Let's modify CaseManagementPage to accept an `initialEditingCaseId` prop.
    } else {
      console.warn(`Không tìm thấy vụ án với ID: ${caseId}`);
      setScanMessage(`Không tìm thấy vụ án với ID: ${caseId}. Vui lòng kiểm tra lại.`);
      setTimeout(() => setScanMessage(null), 3000);
    }
  }, [cases]); // Dependency on 'cases' is fine here as it's a top-level collection.

  // Supabase Realtime Listener for QR Scans (from external sources like a desktop app)
  useEffect(() => {
    let realtimeChannel: any = null;

    if (isAuthenticated && user && supabase) {
      const channelName = `qr_scans_channel_${user.id}`;
      realtimeChannel = supabase.channel(channelName);

      realtimeChannel.on(
        'broadcast',
        { event: 'scan_event' },
        (payload: any) => {
          console.log('Received Realtime scan_event:', payload);
          if (payload.payload && payload.payload.qrData) {
            handleQrScanSuccess(payload.payload.qrData);
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

    return () => {
      if (realtimeChannel) {
        console.log(`Hủy đăng ký kênh Realtime: ${realtimeChannel.name}`);
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [isAuthenticated, user, supabase, handleQrScanSuccess]);


  // Show loading while initializing or fetching prosecutors
  if (authLoading || !isInitialized) { // prosecutorsLoading removed, handled inside pages
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Đang khởi tạo hệ thống và tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={signIn} />;
  }

  // Hàm lưu dữ liệu lên Supabase (di chuyển vào CloudBackupRestoreModal nhưng logic vẫn ở App để truy cập useCases/useReports data)
  const handleSaveDataToSupabase = async () => {
    setBackupMessage(null);
    try {
      const combinedData = {
        cases: cases,
        reports: reports,
      };

      const { error } = await supabase
        .from('user_backups')
        .upsert(
          { user_id: user!.id, data: combinedData, created_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      if (error) {
        throw error;
      }
      setBackupMessage('Lưu dữ liệu thành công lên Supabase!');
    } catch (error: any) {
      console.error('Lỗi khi lưu dữ liệu lên Supabase:', error.message);
      setBackupMessage(`Lỗi khi lưu dữ liệu: ${error.message}`);
    }
  };

  // Hàm khôi phục dữ liệu từ Supabase (di chuyển vào CloudBackupRestoreModal)
  const handleLoadDataFromSupabase = async () => {
    setRestoreMessage(null);
    try {
      const { data, error } = await supabase
        .from('user_backups')
        .select('data')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data || !data.data) {
        setRestoreMessage('Không tìm thấy bản sao lưu nào trên Supabase.');
        return;
      }

      setDataToRestore(data.data as { cases: Case[], reports: Report[] });
      setShowRestoreConfirmModal(true); // Hiển thị modal xác nhận

    } catch (error: any) {
      console.error('Lỗi khi khôi phục dữ liệu từ Supabase:', error.message);
      setRestoreMessage(`Lỗi khi khôi phục dữ liệu: ${error.message}`);
    }
  };

  // Hàm xử lý khi người dùng xác nhận khôi phục
  const confirmRestoreAction = async () => {
    setShowRestoreConfirmModal(false);
    setRestoreMessage(null);

    if (!dataToRestore) {
      setRestoreMessage('Lỗi: Dữ liệu để khôi phục không hợp lệ.');
      return;
    }

    try {
      await overwriteAllCases(dataToRestore.cases);
      await overwriteAllReports(dataToRestore.reports);
      setRestoreMessage('Khôi phục dữ liệu thành công từ Supabase! Dữ liệu đã được cập nhật.');
    } catch (error: any) {
      console.error('Lỗi khi khôi phục dữ liệu sau xác nhận:', error.message);
      setRestoreMessage(`Lỗi khi khôi phục dữ liệu: ${error.message}`);
    } finally {
      setDataToRestore(null);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <UserAndSystemHeader
        user={user}
        activeSystem={activeSystem}
        setActiveSystem={setActiveSystem}
        signOut={signOut}
        casesCount={cases.length}
        reportsCount={reports.length}
        onShowBackupRestoreModal={() => setShowBackupRestoreModal(true)}
        onShowQrScannerModal={() => setShowQrScannerModal(true)}
      />

      {/* Main Content Pages */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSystem === 'cases' ? (
          <CaseManagementPage />
        ) : (
          <ReportManagementPage />
        )}
      </main>

      {/* Modals */}
      {showBackupRestoreModal && (
        <CloudBackupRestoreModal
          onClose={() => {
            setShowBackupRestoreModal(false);
            setBackupMessage(null);
            setRestoreMessage(null);
          }}
          onSaveData={handleSaveDataToSupabase}
          onLoadData={handleLoadDataFromSupabase}
          backupMessage={backupMessage}
          restoreMessage={restoreMessage}
        />
      )}

      {showRestoreConfirmModal && (
        <ConfirmRestoreModal
          onConfirm={confirmRestoreAction}
          onCancel={() => {
            setShowRestoreConfirmModal(false);
            setDataToRestore(null);
          }}
        />
      )}

      {showQrScannerModal && (
        <QRCodeScannerModal
          onScanSuccess={handleQrScanSuccess}
          onClose={() => setShowQrScannerModal(false)}
        />
      )}

      {scanMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 p-3 bg-blue-100 text-blue-800 rounded-md shadow-lg z-50">
          {scanMessage}
        </div>
      )}
    </div>
  );
};

export default App;