// ./components/CaseDetailModal.tsx
import React, { useState } from 'react';
import { X, Save, MessageSquare, Clock, Printer, Trash2, ArrowRight, CheckCircle, PauseCircle, Send, Star } from 'lucide-react';
import { Case, Defendant } from '../types';
import NotesModal from './NotesModal'; // Giả sử bạn đã có component này
import ExtensionModal from './ExtensionModal'; // Giả sử bạn đã có component này
import QRCodeDisplayModal from './QRCodeDisplayModal'; // Giả sử bạn đã có component này
import { generateQrCodeData } from '../utils/qrUtils';
import { getDaysRemaining, isExpiringSoon } from '../utils/dateUtils'; // Cần import lại nếu sử dụng

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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // State cho modal xác nhận xóa

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
                onClose(); // Đóng modal sau khi chuyển giai đoạn
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
          onClick={() => setConfirmDelete(caseItem.id)} // Mở modal xác nhận xóa
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
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full mx-4 relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4">Chi tiết Vụ án: {formData.name}</h2>

        {/* Form chỉnh sửa chi tiết vụ án */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            <label htmlFor="caseNumber" className="block text-sm font-medium text-gray-700">Số vụ án</label>
            <input
              type="text"
              id="caseNumber"
              name="caseNumber"
              value={formData.caseNumber}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
            />
          </div>
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
          <div>
            <label htmlFor="investigationDeadline" className="block text-sm font-medium text-gray-700">Thời hạn Điều tra</label>
            <input
              type="date"
              id="investigationDeadline"
              name="investigationDeadline"
              value={formData.investigationDeadline}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
            />
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
          {/* Thêm các trường khác tương tự như CaseForm */}
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
            onClick={() => onToggleImportant(formData.id, !formData.isImportant)}
            className={`px-4 py-2 rounded-md ${formData.isImportant ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-500 hover:bg-gray-600'} text-white flex items-center gap-2`}
          >
            <Star size={16} fill={formData.isImportant ? 'currentColor' : 'none'} />
            {formData.isImportant ? 'Hủy Quan trọng' : 'Đánh dấu Quan trọng'}
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

        {/* Hành động theo giai đoạn */}
        <div className="flex flex-wrap gap-3 mb-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2 w-full">Hành động theo giai đoạn:</h3>
          {getStageActions(formData).map((actionButton, index) => (
            <React.Fragment key={index}>{actionButton}</React.Fragment>
          ))}
        </div>

        {/* Khu vực bị can và gia hạn tạm giam */}
        <div className="mb-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Thông tin Bị can:</h3>
            {formData.defendants && formData.defendants.length > 0 ? (
                <div className="space-y-2">
                    {formData.defendants.map(defendant => (
                        <div key={defendant.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                            <p className="text-sm">
                                <strong>{defendant.name}</strong> - Tội danh: {defendant.charges}
                                {defendant.preventiveMeasure && ` - Biện pháp ngăn chặn: ${defendant.preventiveMeasure}`}
                                {defendant.preventiveMeasure === 'Tạm giam' && defendant.detentionDeadline && (
                                    <span> - Hạn tạm giam: {defendant.detentionDeadline}
                                    <span className={`ml-1 ${isExpiringSoon(defendant.detentionDeadline) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                        ({getDaysRemaining(defendant.detentionDeadline)} ngày)
                                    </span>
                                    </span>
                                )}
                            </p>
                            {defendant.preventiveMeasure === 'Tạm giam' && (
                                <button
                                    onClick={() => setExtensionModal({ case: formData, type: 'detention', defendant })}
                                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-1"
                                >
                                    <Clock size={12} /> Gia hạn Tạm giam
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500">Không có bị can nào.</p>
            )}
        </div>

        {/* Nút Gia hạn Điều tra riêng */}
        {formData.stage === 'Điều tra' && (
            <div className="flex justify-end border-t pt-4">
                <button
                    onClick={() => setExtensionModal({ case: formData, type: 'investigation' })}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
                >
                    <Clock size={16} /> Gia hạn Điều tra
                </button>
            </div>
        )}

      </div>

      {/* Notes Modal (Sub-modal) */}
      {notesCase && (
        <NotesModal
          case={notesCase}
          onSave={onUpdateCase} // NotesModal sẽ gọi onUpdateCase để lưu ghi chú
          onClose={() => setNotesCase(null)}
        />
      )}

      {/* Extension Modal (Sub-modal) */}
      {extensionModal && (
        <ExtensionModal
          case={extensionModal.case}
          type={extensionModal.type}
          defendant={extensionModal.defendant}
          onSave={onUpdateCase} // ExtensionModal sẽ gọi onUpdateCase để cập nhật vụ án/bị can
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
                  onClose(); // Đóng cả CaseDetailModal sau khi xóa thành công
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