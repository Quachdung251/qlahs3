import React, { useState } from 'react';
import { Download, Cloud, Upload, X } from 'lucide-react';

interface CloudBackupRestoreModalProps {
  onClose: () => void;
  onSaveData: () => Promise<void>;
  onLoadData: () => Promise<void>;
  backupMessage: string | null;
  restoreMessage: string | null;
}

const CloudBackupRestoreModal: React.FC<CloudBackupRestoreModalProps> = ({
  onClose,
  onSaveData,
  onLoadData,
  backupMessage,
  restoreMessage,
}) => {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const handleSave = async () => {
    setBackupLoading(true);
    await onSaveData();
    setBackupLoading(false);
  };

  const handleLoad = async () => {
    setRestoreLoading(true);
    await onLoadData();
    setRestoreLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Lưu & Khôi phục dữ liệu (Supabase)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Bạn có thể lưu dữ liệu hiện tại lên Supabase hoặc khôi phục dữ liệu đã lưu.
          Lưu ý: Chỉ có một bản sao lưu duy nhất cho mỗi tài khoản. Khi bạn lưu, bản sao lưu cũ sẽ bị ghi đè.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={backupLoading}
          >
            {backupLoading ? 'Đang lưu...' : <><Upload size={16} /> Lưu lên Cloud</>}
          </button>
          <button
            type="button"
            onClick={handleLoad}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            disabled={restoreLoading}
          >
            {restoreLoading ? 'Đang khôi phục...' : <><Download size={16} /> Khôi phục từ Cloud</>}
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
  );
};

export default CloudBackupRestoreModal;