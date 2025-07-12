// ./components/CaseDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { Case, Defendant } from '../types';
import { X, Save, Clock, ArrowRight, CheckCircle, PauseCircle, Send, Edit2, MessageSquare, Printer, PlusCircle, Calendar } from 'lucide-react';
import { getCurrentDate, formatDisplayDate, parseDateForInput, isExpiringSoon, getDaysRemaining } from '../utils/dateUtils';
import NotesModal from './NotesModal';
import ExtensionModal from './ExtensionModal'; // Assuming this component exists and is used for both investigation and detention extensions
import QRCodeDisplayModal from './QRCodeDisplayModal';
import { generateQrCodeData } from '../utils/qrUtils';

interface CaseDetailModalProps {
  caseItem: Case;
  onClose: () => void;
  onUpdateCase: (updatedCase: Case) => void;
  onDeleteCase: (caseId: string) => void; // Added for 'Đình chỉ'
  onTransferStage: (caseId: string, newStage: Case['stage'], commandDate: string) => void;
  onToggleImportant: (caseId: string, isImportant: boolean) => void;
  // Potentially add onAddDefendant, onDeleteDefendant if defendant management is done here
}

const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  onClose,
  onUpdateCase,
  onDeleteCase,
  onTransferStage,
  onToggleImportant,
}) => {
  const [currentCase, setCurrentCase] = useState<Case>(caseItem);
  const [isEditing, setIsEditing] = useState(false); // State to control editing main case details
  const [notesCase, setNotesCase] = useState<Case | null>(null);
  const [extensionModal, setExtensionModal] = useState<{
    case: Case;
    type: 'investigation' | 'detention';
    defendant?: Defendant;
  } | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCaseData, setQrCaseData] = useState<{ qrValue: string; caseName: string } | null>(null);

  // Stage transfer confirmation state
  const [transferConfirm, setTransferConfirm] = useState<{ caseId: string; newStage: Case['stage']; commandDate: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);


  useEffect(() => {
    setCurrentCase(caseItem); // Update local state if parent's caseItem changes
  }, [caseItem]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentCase(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdateCase(currentCase);
    setIsEditing(false); // Exit editing mode after saving
  };

  const handleToggleImportant = () => {
    onToggleImportant(currentCase.id, !currentCase.isImportant);
    setCurrentCase(prev => ({ ...prev, isImportant: !prev.isImportant })); // Update local state immediately
  };

  const handlePrintQR = () => {
    const qrValue = generateQrCodeData(currentCase);
    setQrCaseData({ qrValue, caseName: currentCase.name });
    setShowQrModal(true);
  };

  const handleExtendInvestigation = () => {
    setExtensionModal({ case: currentCase, type: 'investigation' });
  };

  const handleExtendDetention = (defendant: Defendant) => {
    setExtensionModal({ case: currentCase, type: 'detention', defendant: defendant });
  };

  const handleStageTransferClick = (caseId: string, newStage: Case['stage']) => {
    setTransferConfirm({ caseId, newStage, commandDate: getCurrentDate() });
  };

  const confirmTransferAction = () => {
    if (transferConfirm) {
      onTransferStage(transferConfirm.caseId, transferConfirm.newStage, transferConfirm.commandDate);
      setTransferConfirm(null);
      onClose(); // Close the modal after transfer
    }
  };

  const confirmDeleteAction = () => {
    if (confirmDelete) {
      onDeleteCase(confirmDelete);
      setConfirmDelete(null);
      onClose(); // Close the modal after delete
    }
  };

  const getStageActions = (caseItem: Case) => {
    const actions = [];

    switch (caseItem.stage) {
      case 'Điều tra':
        actions.push(
          <button
            key="prosecution"
            onClick={() => handleStageTransferClick(caseItem.id, 'Truy tố')}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <ArrowRight size={16} />
            Chuyển Truy tố
          </button>
        );
        break;
      case 'Truy tố':
        actions.push(
          <button
            key="trial"
            onClick={() => handleStageTransferClick(caseItem.id, 'Xét xử')}
            className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            <ArrowRight size={16} />
            Chuyển Xét xử
          </button>
        );
        break;
      case 'Xét xử':
        actions.push(
          <button
            key="complete"
            onClick={() => handleStageTransferClick(caseItem.id, 'Hoàn thành')}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            <CheckCircle size={16} />
            Hoàn thành
          </button>
        );
        break;
    }

    if (!['Hoàn thành', 'Đình chỉ', 'Chuyển đi', 'Tạm đình chỉ'].includes(caseItem.stage)) {
      actions.push(
        <button
          key="transfer"
          onClick={() => handleStageTransferClick(caseItem.id, 'Chuyển đi')}
          className="flex items-center gap-1 px-3 py-1 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-700 transition-colors whitespace-nowrap"
        >
          <Send size={16} />
          Chuyển đi
        </button>
      );

      actions.push(
        <button
          key="suspend"
          onClick={() => handleStageTransferClick(caseItem.id, 'Tạm đình chỉ')}
          className="flex items-center gap-1 px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 transition-colors whitespace-nowrap"
        >
          <PauseCircle size={16} />
          Tạm đình chỉ
        </button>
      );

      actions.push(
        <button
          key="discontinue"
          onClick={() => setConfirmDelete(caseItem.id)}
          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          <X size={16} />
          Đình chỉ vụ án
        </button>
      );
    }
    return actions;
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            Chi tiết Vụ án: {currentCase.name}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleImportant}
              className={`p-2 rounded-full transition-colors ${
                currentCase.isImportant ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-100' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
              }`}
              title={currentCase.isImportant ? 'Bỏ đánh dấu quan trọng' : 'Đánh dấu quan trọng'}
            >
              <Clock size={20} fill={currentCase.isImportant ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-colors"
              title={isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa thông tin vụ án'}
            >
              <Edit2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Case Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Thông tin chung</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên vụ án</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={currentCase.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              ) : (
                <p className="mt-1 text-gray-900">{currentCase.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tội danh</label>
              {isEditing ? (
                <input
                  type="text"
                  name="charges"
                  value={currentCase.charges}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              ) : (
                <p className="mt-1 text-gray-900">{currentCase.charges}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số quyết định khởi tố</label>
              {isEditing ? (
                <input
                  type="text"
                  name="indictmentNumber"
                  value={currentCase.indictmentNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              ) : (
                <p className="mt-1 text-gray-900">{currentCase.indictmentNumber || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ngày khởi tố</label>
              {isEditing ? (
                <input
                  type="date"
                  name="indictmentDate"
                  value={parseDateForInput(currentCase.indictmentDate)}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              ) : (
                <p className="mt-1 text-gray-900">{formatDisplayDate(currentCase.indictmentDate)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Giai đoạn</label>
              {isEditing ? (
                 <select
                  name="stage"
                  value={currentCase.stage}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="Điều tra">Điều tra</option>
                  <option value="Truy tố">Truy tố</option>
                  <option value="Xét xử">Xét xử</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Chuyển đi">Chuyển đi</option>
                  <option value="Tạm đình chỉ">Tạm đình chỉ</option>
                  <option value="Đình chỉ">Đình chỉ</option>
                </select>
              ) : (
                <p className="mt-1 text-gray-900">{currentCase.stage}</p>
              )}
            </div>

            {/* Investigation Deadline & Extension */}
            <div className="flex items-end gap-2">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700">Thời hạn điều tra</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="investigationDeadline"
                    value={parseDateForInput(currentCase.investigationDeadline)}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                ) : (
                  <p className="mt-1 text-gray-900 font-bold">
                    {formatDisplayDate(currentCase.investigationDeadline)}{' '}
                    {isExpiringSoon(currentCase.investigationDeadline) && (
                      <span className="text-red-600 text-sm">(Còn {getDaysRemaining(currentCase.investigationDeadline)} ngày)</span>
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={handleExtendInvestigation}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors whitespace-nowrap text-sm"
                title="Gia hạn thời hạn điều tra"
              >
                <Calendar size={16} /> Gia hạn ĐT
              </button>
            </div>

            {isEditing && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save size={16} />
                Lưu thay đổi
              </button>
            )}
          </div>

          {/* Defendants Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Danh sách Bị can ({currentCase.defendants.length})</h3>
            {currentCase.defendants.length === 0 ? (
              <p className="text-gray-500">Chưa có bị can nào được thêm.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên bị can</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Biện pháp</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn tạm giam</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentCase.defendants.map((defendant) => (
                      <tr key={defendant.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{defendant.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{defendant.preventiveMeasure}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                          {defendant.preventiveMeasure === 'Tạm giam' && defendant.detentionDeadline ? (
                            <span className={isExpiringSoon(defendant.detentionDeadline) ? 'text-red-600 font-bold' : ''}>
                              {formatDisplayDate(defendant.detentionDeadline)}{' '}
                              {isExpiringSoon(defendant.detentionDeadline) && (
                                <span className="text-sm">({getDaysRemaining(defendant.detentionDeadline)} ngày)</span>
                              )}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {defendant.preventiveMeasure === 'Tạm giam' && (
                            <button
                              onClick={() => handleExtendDetention(defendant)}
                              className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded-md text-xs hover:bg-purple-700 transition-colors"
                              title="Gia hạn tạm giam cho bị can này"
                            >
                              <Calendar size={12} /> Gia hạn TG
                            </button>
                          )}
                          {/* Add other defendant-specific actions if needed, e.g., edit/delete defendant */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* You might want a button here to add new defendants, which would open CaseForm in a specific mode or a new modal */}
            {/* <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors mt-4">
              <PlusCircle size={16} /> Thêm Bị can
            </button> */}
          </div>

          {/* Actions Section */}
          <div className="md:col-span-2 space-y-4 pt-6 border-t border-gray-200 mt-6">
            <h3 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Hành động</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setNotesCase(currentCase)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <MessageSquare size={16} />
                Ghi chú
              </button>
              <button
                onClick={handlePrintQR}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Printer size={16} />
                In QR
              </button>
              {/* Stage transfer buttons */}
              {getStageActions(currentCase).map((actionButton, index) => (
                <React.Fragment key={index}>{actionButton}</React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Notes Modal */}
        {notesCase && (
          <NotesModal
            caseItem={notesCase}
            onUpdateNotes={(caseId, notes) => {
              onUpdateCase({ ...currentCase, id: caseId, notes: notes } as Case);
              setCurrentCase(prev => ({ ...prev, notes: notes })); // Update local state
              setNotesCase(null);
            }}
            onClose={() => setNotesCase(null)}
          />
        )}

        {/* Extension Modal */}
        {extensionModal && (
          <ExtensionModal
            caseItem={extensionModal.case}
            extensionType={extensionModal.type}
            defendant={extensionModal.defendant}
            onExtend={(caseId, type, newDate, defendantId) => {
              const updatedCase = { ...currentCase };
              if (type === 'investigation') {
                updatedCase.investigationDeadline = newDate;
              } else if (type === 'detention' && defendantId) {
                updatedCase.defendants = updatedCase.defendants.map(d =>
                  d.id === defendantId ? { ...d, detentionDeadline: newDate } : d
                );
              }
              onUpdateCase(updatedCase);
              setCurrentCase(updatedCase); // Update local state immediately
              setExtensionModal(null);
            }}
            onClose={() => setExtensionModal(null)}
          />
        )}

        {/* QR Code Display Modal */}
        {showQrModal && qrCaseData && (
          <QRCodeDisplayModal
            qrCodeValue={qrCaseData.qrValue}
            caseName={qrCaseData.caseName}
            onClose={() => setShowQrModal(false)}
          />
        )}

        {/* Confirmation Modal for Stage Transfer */}
        {transferConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận chuyển giai đoạn</h3>
              <p className="text-sm text-gray-600 mb-4">
                Bạn có chắc chắn muốn chuyển vụ án này sang giai đoạn **"{transferConfirm.newStage}"** không?
              </p>
              <div className="mb-4">
                <label htmlFor="commandDate" className="block text-sm font-medium text-gray-700 mb-1">Ngày ra lệnh:</label>
                <input
                  type="date"
                  id="commandDate"
                  value={transferConfirm.commandDate}
                  onChange={(e) => setTransferConfirm({ ...transferConfirm, commandDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setTransferConfirm(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmTransferAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Delete/Đình chỉ */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận Đình chỉ</h3>
              <p className="text-sm text-gray-600 mb-6">
                Bạn có chắc chắn muốn đình chỉ vụ án này không? Hành động này sẽ thay đổi trạng thái vụ án.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteAction}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Đình chỉ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseDetailModal;