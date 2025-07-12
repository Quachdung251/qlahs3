import React from 'react';
import { Upload } from 'lucide-react';

interface ConfirmRestoreModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmRestoreModal: React.FC<ConfirmRestoreModalProps> = ({ onConfirm, onCancel }) => {
  return (
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
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Upload size={16} />
            Xác nhận Ghi đè
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRestoreModal;