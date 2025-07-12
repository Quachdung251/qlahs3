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
import { Prosecutor, useProsecutors } from './hooks/useProsecutors'; // Ensure Prosecutor type is imported
import { exportToExcel, prepareCaseDataForExcel, prepareReportDataForExcel, prepareCaseStatisticsForExcel, prepareReportStatisticsForExcel } from './utils/excelExportUtils';
import { Case, Report, CaseFormData, ReportFormData, UserRole } from './types'; // Ensure UserRole is imported if used
import { getCurrentDate, getDaysRemaining } from './utils/dateUtils';
import QRCodeScannerModal from './components/QRCodeScannerModal';
import NotesModal from './components/NotesModal'; // Ensure NotesModal is imported
import ExtensionModal from './components/ExtensionModal'; // Ensure ExtensionModal is imported
import QRCodeDisplayModal from './components/QRCodeDisplayModal'; // Ensure QRCodeDisplayModal is imported

function App() {
  const { session, user, signIn, signOut } = useSupabaseAuth();
  const { cases, addCase, updateCase, deleteCase, transferCaseStage, toggleCaseImportant } = useCases();
  const { reports, addReport, updateReport, deleteReport } = useReports();
  const { prosecutors } = useProsecutors();
  const {
    saveDataToIndexedDB,
    loadDataFromIndexedDB,
    syncDataWithCloud,
    clearAllIndexedDBData,
    isSyncing,
    lastSync,
    isLoadingIndexedDB,
    indexedDBError
  } = useIndexedDB();

  const [activeTab, setActiveTab] = useState('cases'); // 'cases', 'reports', 'data-management', 'statistics', 'users'
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProsecutorFilter, setSelectedProsecutorFilter] = useState('');
  const [selectedCaseStageFilter, setSelectedCaseStageFilter] = useState('');
  const [importantCasesOnly, setImportantCasesOnly] = useState(false);

  // States for Modals
  const [notesCase, setNotesCase] = useState<Case | null>(null);
  const [extensionModal, setExtensionModal] = useState<{
    case: Case;
    type: 'investigation' | 'detention';
    defendant?: Defendant;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // For case deletion confirmation
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCaseData, setQrCaseData] = useState<{ qrValue: string; caseName: string } | null>(null);
  const [showQrScannerModal, setShowQrScannerModal] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
  const [dataToRestore, setDataToRestore] = useState<any>(null); // Data fetched from cloud to be restored

  const caseStages = ['Điều tra', 'Truy tố', 'Xét xử', 'Hoàn thành', 'Tạm đình chỉ', 'Đình chỉ', 'Chuyển đi'];

  // Effect to load data from IndexedDB on component mount
  useEffect(() => {
    loadDataFromIndexedDB();
  }, [loadDataFromIndexedDB]);

  // Filtered Cases
  const filteredCases = useMemo(() => {
    let currentCases = cases;

    if (searchQuery) {
      currentCases = currentCases.filter(caseItem =>
        caseItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        caseItem.charges.toLowerCase().includes(searchQuery.toLowerCase()) ||
        caseItem.prosecutor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        caseItem.defendants.some(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedProsecutorFilter) {
      currentCases = currentCases.filter(caseItem =>
        caseItem.prosecutor === selectedProsecutorFilter ||
        caseItem.supportingProsecutors?.includes(selectedProsecutorFilter)
      );
    }

    if (selectedCaseStageFilter) {
      currentCases = currentCases.filter(caseItem =>
        caseItem.stage === selectedCaseStageFilter
      );
    }

    if (importantCasesOnly) {
      currentCases = currentCases.filter(caseItem => caseItem.isImportant);
    }

    return currentCases;
  }, [cases, searchQuery, selectedProsecutorFilter, selectedCaseStageFilter, importantCasesOnly]);

  const handleAddCaseClick = () => {
    setEditingCase(null);
    setShowCaseForm(true);
  };

  const handleEditCase = (caseItem: Case) => {
    setEditingCase(caseItem);
    setShowCaseForm(true);
  };

  const handleCaseFormSubmit = (caseData: CaseFormData, isEditing: boolean) => {
    if (isEditing && editingCase) {
      updateCase(editingCase.id, caseData);
    } else {
      addCase(caseData);
    }
    setShowCaseForm(false);
    setEditingCase(null);
  };

  const handleCancelCaseEdit = () => {
    setShowCaseForm(false);
    setEditingCase(null);
  };

  const handleAddReportClick = () => {
    setEditingReport(null);
    setShowReportForm(true);
  };

  const handleEditReport = (reportItem: Report) => {
    setEditingReport(reportItem);
    setShowReportForm(true);
  };

  const handleReportFormSubmit = (reportData: ReportFormData, isEditing: boolean) => {
    if (isEditing && editingReport) {
      updateReport(editingReport.id, reportData);
    } else {
      addReport(reportData);
    }
    setShowReportForm(false);
    setEditingReport(null);
  };

  const handleCancelReportEdit = () => {
    setShowReportForm(false);
    setEditingReport(null);
  };

  // QR Code Generation for existing case
  const handlePrintExistingQR = useCallback((caseItem: Case) => {
    const qrValue = caseItem.id; // Using case ID as the QR value
    setQrCaseData({ qrValue, caseName: caseItem.name });
    setShowQrModal(true);
  }, []);

  // QR Scan Success Handler
  const handleQrScanSuccess = useCallback((scannedId: string) => {
    setShowQrScannerModal(false);
    const foundCase = cases.find(c => c.id === scannedId);
    if (foundCase) {
      setScanMessage(`Đã tìm thấy vụ án: ${foundCase.name}`);
      handleEditCase(foundCase); // Mở form chỉnh sửa vụ án được quét
    } else {
      setScanMessage('Không tìm thấy vụ án với mã QR này.');
    }
    setTimeout(() => setScanMessage(null), 3000); // Clear message after 3 seconds
  }, [cases, handleEditCase]);

  // Handle data export
  const handleExportData = async () => {
    try {
      await exportToExcel(
        prepareCaseDataForExcel(cases),
        prepareReportDataForExcel(reports),
        prepareCaseStatisticsForExcel(cases),
        prepareReportStatisticsForExcel(reports),
        'Dữ liệu quản lý án'
      );
      alert('Xuất dữ liệu thành công!');
    } catch (error) {
      console.error('Lỗi khi xuất dữ liệu:', error);
      alert('Có lỗi xảy ra khi xuất dữ liệu.');
    }
  };

  // Handle Sync with Cloud
  const handleSyncWithCloud = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để đồng bộ dữ liệu.');
      return;
    }
    await syncDataWithCloud(cases, reports);
  };

  // Handle Restore from Cloud (Step 1: Fetch and confirm)
  const handleRestoreFromCloud = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để khôi phục dữ liệu.');
      return;
    }
    try {
      const cloudData = await loadDataFromIndexedDB(true); // Fetch directly from cloud
      if (cloudData && (cloudData.cases || cloudData.reports)) {
        setDataToRestore(cloudData);
        setShowRestoreConfirmModal(true);
      } else {
        alert('Không tìm thấy dữ liệu để khôi phục từ Cloud.');
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu từ Cloud:', error);
      alert('Có lỗi xảy ra khi tải dữ liệu từ Cloud.');
    }
  };

  // Handle Restore from Cloud (Step 2: Confirmation and restore)
  const confirmRestoreAction = async () => {
    if (dataToRestore) {
      await clearAllIndexedDBData(); // Clear local first
      // Assuming loadDataFromIndexedDB with true argument also saves to local after fetching
      // Or you might need a separate function to explicitly set data locally
      // For now, let's re-run loadDataFromIndexedDB which fetches and updates local
      await loadDataFromIndexedDB(true); // This will load from cloud and also update local IndexedDB
      alert('Khôi phục dữ liệu từ Cloud thành công!');
      setShowRestoreConfirmModal(false);
      setDataToRestore(null); // Clear temporary data
    }
  };

  if (!session) {
    return <LoginForm onLogin={signIn} />;
  }

  // Determine user role for conditional rendering
  const currentUserRole: UserRole = user?.user_metadata?.role || 'user'; // Default to 'user' if not set

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Scale size={32} className="text-blue-200" />
          <h1 className="text-3xl font-extrabold tracking-tight">Quản lý Hồ sơ Vụ án</h1>
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} currentUserRole={currentUserRole} />
        </div>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm font-medium">Xin chào, {user.email} ({currentUserRole === 'admin' ? 'Quản trị viên' : 'Người dùng'})</span>}
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="flex-grow p-6">
        {activeTab === 'cases' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Danh Sách Vụ Án</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQrScannerModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <QrCode size={18} />
                  Quét QR Vụ án
                </button>
                <button
                  onClick={handleAddCaseClick}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  Thêm Vụ Án Mới
                </button>
              </div>
            </div>

            <SearchFilter
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              prosecutors={prosecutors.map(p => p.name)}
              selectedProsecutor={selectedProsecutorFilter}
              setSelectedProsecutor={setSelectedProsecutorFilter}
              caseStages={caseStages}
              selectedCaseStage={selectedCaseStageFilter}
              setSelectedCaseStage={setSelectedCaseStageFilter}
              importantCasesOnly={importantCasesOnly}
              setImportantCasesOnly={setImportantCasesOnly}
            />

            {isLoadingIndexedDB ? (
              <p className="text-center text-gray-600 py-8">Đang tải dữ liệu...</p>
            ) : indexedDBError ? (
              <p className="text-center text-red-600 py-8">Lỗi tải dữ liệu: {indexedDBError.message}. Vui lòng thử lại.</p>
            ) : (
              <CaseTable
                cases={filteredCases}
                columns={[
                  { key: 'name', label: 'Tên Vụ Án', sortable: true },
                  { key: 'charges', label: 'Tội Danh', sortable: true },
                  { key: 'stage', label: 'Giai Đoạn', sortable: true },
                  { key: 'prosecutor', label: 'KSV Phụ Trách', sortable: true },
                  {
                    key: 'investigationDeadline', label: 'Hạn ĐT', sortable: true,
                    render: (caseItem) => {
                      const days = getDaysRemaining(caseItem.investigationDeadline);
                      const isExpiring = isExpiringSoon(caseItem.investigationDeadline);
                      return (
                        <span className={`${isExpiring ? 'text-red-600 font-bold' : ''}`}>
                          {caseItem.investigationDeadline} {days !== null ? `(${days} ngày)` : ''}
                        </span>
                      );
                    }
                  },
                  {
                    key: 'shortestDetention', label: 'TG Ngắn nhất',
                    render: (caseItem) => {
                      const detainedDefendants = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline);
                      if (detainedDefendants.length === 0) return 'N/A';
                      const shortest = detainedDefendants.reduce((min, d) => {
                        const minDate = new Date(min.split('/').reverse().join('-'));
                        const dDate = new Date(d.detentionDeadline!.split('/').reverse().join('-'));
                        return dDate < minDate ? d.detentionDeadline! : min;
                      }, detainedDefendants[0].detentionDeadline!);
                      const days = getDaysRemaining(shortest);
                      const isExpiring = isExpiringSoon(shortest);
                      return (
                        <span className={`${isExpiring ? 'text-red-600 font-bold' : ''}`}>
                          {shortest} {days !== null ? `(${days} ngày)` : ''}
                        </span>
                      );
                    }
                  },
                  { key: 'notes', label: 'Ghi Chú', render: (caseItem) => (
                      <button
                        onClick={() => setNotesCase(caseItem)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                      >
                        <MessageSquare size={12} className="inline mr-1" />
                        Xem/Sửa
                      </button>
                    )},
                  { key: 'isImportant', label: 'Quan trọng', sortable: true },
                  {
                    key: 'actions', label: 'Hành động',
                    render: (caseItem) => (
                      <div className="flex gap-2">
                        {/* CaseActions component now handles these */}
                      </div>
                    )
                  }
                ]}
                onDeleteCase={(id) => setConfirmDelete(id)}
                onTransferStage={transferCaseStage}
                onUpdateCase={updateCase}
                onEditCase={handleEditCase}
                onToggleImportant={toggleCaseImportant}
                showWarnings={true}
                // Pass the setter for extension modal to CaseTable as well
                onSetExtensionModal={setExtensionModal}
                // Pass the QR print handler
                onHandlePrintExistingQR={handlePrintExistingQR}
                // Pass setNotesCase to CaseTable
                onSetNotesCase={setNotesCase}
              />
            )}

            {showCaseForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <CaseForm
                    onSubmit={handleCaseFormSubmit}
                    prosecutors={prosecutors}
                    initialData={editingCase}
                    onCancelEdit={handleCancelCaseEdit}
                    onSetExtensionModal={setExtensionModal} {/* Pass the setter here */}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Danh Sách Tin Báo</h2>
              <button
                onClick={handleAddReportClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Thêm Tin Báo Mới
              </button>
            </div>
            {isLoadingIndexedDB ? (
              <p className="text-center text-gray-600 py-8">Đang tải dữ liệu...</p>
            ) : indexedDBError ? (
              <p className="text-center text-red-600 py-8">Lỗi tải dữ liệu: {indexedDBError.message}. Vui lòng thử lại.</p>
            ) : (
              <ReportTable
                reports={reports}
                onEditReport={handleEditReport}
                onDeleteReport={deleteReport}
              />
            )}
            {showReportForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <ReportForm
                    onSubmit={handleReportFormSubmit}
                    prosecutors={prosecutors}
                    initialData={editingReport}
                    onCancelEdit={handleCancelReportEdit}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Thống Kê</h2>
            <Statistics cases={cases} />
            <ReportStatistics reports={reports} />
          </div>
        )}

        {activeTab === 'data-management' && (
          <DataManagement
            onExportData={handleExportData}
            onSyncWithCloud={handleSyncWithCloud}
            onRestoreFromCloud={handleRestoreFromCloud}
            isSyncing={isSyncing}
            lastSync={lastSync}
          />
        )}

        {activeTab === 'users' && currentUserRole === 'admin' && (
          <UserManagement />
        )}
      </main>

      {/* Modals */}
      {notesCase && (
        <NotesModal
          caseItem={notesCase}
          onClose={() => setNotesCase(null)}
          onSaveNotes={(caseId, notes) => {
            updateCase(caseId, { notes });
            setNotesCase(prev => prev ? { ...prev, notes } : null); // Update local state for immediate feedback
          }}
        />
      )}

      {extensionModal && (
        <ExtensionModal
          caseItem={extensionModal.case}
          type={extensionModal.type}
          defendant={extensionModal.defendant}
          onClose={() => setExtensionModal(null)}
          onExtend={(updatedCase) => {
            updateCase(updatedCase.id, updatedCase); // Cập nhật vụ án trong state `cases` của App
            setExtensionModal(null); // Đóng modal gia hạn
            // Nếu form đang mở, bạn có thể muốn cập nhật lại initialData của form
            if (editingCase && editingCase.id === updatedCase.id) {
              setEditingCase(updatedCase);
            }
          }}
        />
      )}

      {/* Confirmation Modal for deletion */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa vụ án này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3}>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  deleteCase(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị QR Code cho vụ án hiện có */}
      {showQrModal && qrCaseData && (
        <QRCodeDisplayModal
          qrCodeValue={qrCaseData.qrValue}
          caseName={qrCaseData.caseName}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {/* Confirmation Modal for Restore from Cloud */}
      {showRestoreConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"><Cloud size={20} /> Xác nhận Khôi phục Dữ liệu</h3>
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
}

export default App;