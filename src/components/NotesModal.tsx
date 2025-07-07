import React, { useState } from 'react';
import { X, Save, MessageSquare } from 'lucide-react';
import { Case } from '../types';

interface NotesModalProps {
  case: Case;
  onSave: (updatedCase: Case) => void;
  onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ case: caseData, onSave, onClose }) => {
  const [notes, setNotes] = useState(caseData.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCase = { ...caseData, notes };
    onSave(updatedCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={20} />
            Ghi Chú - {caseData.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung ghi chú
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập ghi chú cho vụ án..."
              rows={8}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              Lưu Ghi Chú
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotesModal;