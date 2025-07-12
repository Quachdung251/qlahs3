// ./components/CaseDetailModal.tsx
import React, { useState } from 'react';
import { X, Save, MessageSquare, Clock, Printer, Trash2, ArrowRight, CheckCircle, PauseCircle, Send, Star } from 'lucide-react';
import { Case, Defendant } from '../types';
import NotesModal from './NotesModal';
import ExtensionModal from './ExtensionModal';
import QRCodeDisplayModal from './QRCodeDisplayModal';
import { generateQrCodeData } from '../utils/qrUtils';
import { getDaysRemaining, isExpiringSoon } from '../utils/dateUtils';

interface CaseDetailModalProps {
  caseItem: Case;
  onClose: () => void;
  onUpdateCase: (updatedCase: Case) => void;
  onDeleteCase: (caseId: string) => void;
  onTransferStage: (caseId: string, newStage: Case['stage']) => void;
  onToggleImportant: (caseId: string, isImportant: boolean) => void;
}

const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  onClose,
  onUpdateCase,
  onDeleteCase,
  onTransferStage,
  onToggleImportant,
}) => {
  const [formData, setFormData] = useState<Case>(caseItem);
  const [notesCase, setNotesCase] = useState<Case | null>(null);
  const [extensionModal, setExtensionModal] = useState<{
    case: Case;
    type: 'investigation' | 'detention';
    defendant?: Defendant;
  } | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCaseData, setQrCaseData] = useState<{ qrValue: string; caseName: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdateCase(formData);
    onClose();
  };

  const handlePrintExistingQR = (caseItemToPrint: Case) => {
    const qrValue = generateQrCodeData(caseItemToPrint);
    setQrCaseData({ qrValue, caseName: caseItemToPrint.name });
    setShowQrModal(true);
  };

  const getStageActions = (caseItem: Case) => {
    const actions = [];

    switch (caseItem.stage) {
      case 'Điều tra':
        actions.push(
          <button
            key="prosecution"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn chuyển sang giai đoạn Truy tố?')) {
                onTransferStage(caseItem.id, 'Truy tố');
                onClose();
              }
            }}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <ArrowRight size={12} />
            Chuyển TT
          </button>
        );
        break;
      case 'Truy tố':
        actions.push(
          <button
            key="trial"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn chuyển sang giai đoạn Xét xử?')) {
                onTransferStage(caseItem.id, 'Xét xử');
                onClose();
              }
            }}
            className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            <ArrowRight size={12} />
            Chuyển XX
          </button>
        );
        break;
      case 'Xét xử':
        actions.push(
          <button
            key="complete"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn chuyển sang giai đoạn Hoàn thành?')) {
                onTransferStage(caseItem.id, 'Hoàn thành');
                onClose();
              }
            }}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            <CheckCircle size={12} />
            Hoàn thành
          </button>
        );
        break;
    }

    if (!['Hoàn thành', 'Đình chỉ', 'Chuyển đi'].includes(caseItem.stage)) {
      actions.push(
        <button
          key="transfer"
          onClick={() => {
            if (window.confirm('Bạn có chắc chắn muốn chuyển vụ án này đi?')) {
              onTransferStage(caseItem.id, 'Chuyển đi');
              onClose();
            }
          }}
          className="flex items-center gap-1 px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700 transition-colors whitespace-nowrap"
        >
          <Send size={12} />
          Chuyển đi
        </button>
      );

      actions.push(
        <button
          key="suspend"
          onClick={() => {
            if (window.confirm('Bạn có chắc chắn muốn tạm đình chỉ vụ án này?')) {
              onTransferStage(caseItem.id, 'Tạm đình chỉ');
              onClose();
            }
          }}
          className="flex items-center gap-1 px-2 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 transition-colors whitespace-nowrap"
        >
          <PauseCircle size={12} />
          Tạm ĐC
        </button>
      );

      actions.push(
        <button
          key="discontinue"
          onClick={() => setConfirmDelete(caseItem.id)}
          className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          <Trash2 size={12} />
          Đình chỉ
        </button>
      );
    }
    return actions;
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-5xl w-full mx-4 relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          Chi tiết Vụ án: {formData.name}
          <button
            onClick={() => onToggleImportant(formData.id, !formData.isImportant)}
            className={`flex items-center ${formData.isImportant ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600 transition-colors`}
            title={formData.isImportant ? 'Hủy Quan trọng' : 'Đánh dấu Quan trọng'}
          >
            <Star size={20} fill={formData.isImportant ? 'currentColor' : 'none'} />
          </button>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Left Column for Case Details - col-span-2 */}
          <div className="lg:col-span-2">
            {/* Form chỉnh sửa chi tiết vụ án */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tội danh (new ô 1) */}
              <div>
                <label htmlFor="charges" className="block text-sm font-medium text-gray-700">Tội danh</label>
                <textarea
                  id="charges"
                  name="charges"
                  value={formData.charges}
                  onChange={handleChange}
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                ></textarea>
              </div>
              {/* Tên vụ án (new ô 2) */}
              <div>
                <label htmlFor="caseName" className="block text-sm font-medium text-gray-700">Tên vụ án</label>
                <input
                  type="text"
                  id="caseName"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="prosecutor" className="block text-sm font-medium text-gray-700">Kiểm sát viên</label>
                <input
                  type="text"
                  id="prosecutor"
                  name="prosecutor"
                  value={formData.prosecutor}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                />
              </div>
              <div className="col-span-2 flex items-end gap-2">
                <div>
                  <label htmlFor="investigationDeadline" className="block text-sm font-medium text-gray-700">Thời hạn Điều tra</label>
                  {formData.investigationDeadline ? (
                    <span className="mt-1 block w-full p-2 text-sm">
                      {formData.investigationDeadline}
                      <span className={`ml-1 ${isExpiringSoon(formData.investigationDeadline) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        ({getDaysRemaining(formData.investigationDeadline)} ngày)
                      </span>
                    </span>
                  ) : (
                    <input
                      type="date"
                      id="investigationDeadline"
                      name="investigationDeadline"
                      value={formData.investigationDeadline || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                    />
                  )}
                </div>
                {formData.stage === 'Điều tra' && (
                  <button
                    onClick={() => setExtensionModal({ case: formData, type: 'investigation' })}
                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-1 mb-1"
                  >
                    <Clock size={12} /> Gia hạn ĐT
                  </button>
                )}
              </div>
              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-gray-700">Giai đoạn</label>
                <select
                  id="stage"
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                >
                  <option value="Điều tra">Điều tra</option>
                  <option value="Truy tố">Truy tố</option>
                  <option value="Xét xử">Xét xử</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Tạm đình chỉ">Tạm đình chỉ</option>
                  <option value="Đình chỉ">Đình chỉ</option>
                  <option value="Chuyển đi">Chuyển đi</option>
                </select>
              </div>
            </div>

            {/* Hành động theo giai đoạn - Moved up */}
            <div className="flex flex-wrap gap-3 mb-6 border-t pt-4">
              <h3 className="text-lg font-semibold mb-2 w-full">Hành động theo giai đoạn:</h3>
              {getStageActions(formData).map((actionButton, index) => (
                <React.Fragment key={index}>{actionButton}</React.Fragment>
              ))}
            </div>

            {/* Khu vực các nút hành động chính */}
            <div className="flex flex-wrap gap-3 mb-6 border-t pt-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save size={16} /> Lưu Thay đổi
              </button>
              <button
                onClick={() => setNotesCase(formData)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                title="Xem/Sửa ghi chú"
              >
                <MessageSquare size={16} /> Ghi chú
              </button>
              <button
                onClick={() => handlePrintExistingQR(formData)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
                title="In nhãn QR Code"
              >
                <Printer size={16} /> In QR
              </button>
            </div>
          </div>

          {/* Right Column for Defendants - col-span-2 and adjusted presentation */}
          <div className="lg:col-span-2 border-l pl-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Thông tin Bị can:</h3>
              {formData.defendants && formData.defendants.length > 0 ? (
                <div className="space-y-4"> {/* Increased space-y for better separation and presentation */}
                  {formData.defendants.map(defendant => (
                    <div key={defendant.id} className="flex flex-col sm:flex-row sm:items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="flex-grow">
                        <p className="text-base font-semibold mb-1">{defendant.name}</p> {/* Increased font size */}
                        <p className="text-sm text-gray-700">Điều 120.</p>
                        {defendant.preventiveMeasure === 'Tạm giam' && defendant.detentionDeadline ? (
                          <div className="text-sm text-gray-800 mt-1">
                            BPNC: Tạm giam - {defendant.detentionDeadline}
                            <span className={`ml-1 ${isExpiringSoon(defendant.detentionDeadline) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              ({getDaysRemaining(defendant.detentionDeadline)} ngày)
                            </span>
                          </div>
                        ) : defendant.preventiveMeasure ? (
                            <p className="text-sm text-gray-700 mt-1">BPNC: {defendant.preventiveMeasure}</p>
                        ) : null}
                      </div>
                      {defendant.preventiveMeasure === 'Tạm giam' && (
                        <button
                          onClick={() => setExtensionModal({ case: formData, type: 'detention', defendant })}
                          className="p-1 text-orange-600 hover:text-orange-700 transition-colors mt-2 sm:mt-0 sm:ml-4 flex-shrink-0"
                          title="Gia hạn Tạm giam"
                        >
                          <Clock size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Không có bị can nào.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes Modal (Sub-modal) */}
      {notesCase && (
        <NotesModal
          case={notesCase}
          onSave={onUpdateCase}
          onClose={() => setNotesCase(null)}
        />
      )}

      {/* Extension Modal (Sub-modal) */}
      {extensionModal && (
        <ExtensionModal
          case={extensionModal.case}
          type={extensionModal.type}
          defendant={extensionModal.defendant}
          onSave={onUpdateCase}
          onClose={() => setExtensionModal(null)}
        />
      )}

      {/* QR Code Display Modal (Sub-modal) */}
      {showQrModal && qrCaseData && (
        <QRCodeDisplayModal
          qrCodeValue={qrCaseData.qrValue}
          caseName={qrCaseData.caseName}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {/* Confirmation Modal for Delete (Sub-modal) */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa vụ án này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onDeleteCase(confirmDelete);
                  setConfirmDelete(null);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetailModal;