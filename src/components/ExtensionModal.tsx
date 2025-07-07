import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Case, Defendant } from '../types';
import { parseDate, formatDate } from '../utils/dateUtils';

interface ExtensionModalProps {
  case: Case;
  type: 'investigation' | 'detention';
  defendant?: Defendant;
  onSave: (updatedCase: Case) => void;
  onClose: () => void;
}

const ExtensionModal: React.FC<ExtensionModalProps> = ({ 
  case: caseData, 
  type, 
  defendant, 
  onSave, 
  onClose 
}) => {
  const [extensionValue, setExtensionValue] = useState(1);
  const [extensionUnit, setExtensionUnit] = useState<'days' | 'months'>(type === 'investigation' ? 'months' : 'days');

  const getCurrentDeadline = () => {
    if (type === 'investigation') {
      return caseData.investigationDeadline;
    } else if (defendant) {
      return defendant.detentionDeadline || '';
    }
    return '';
  };

  const calculateNewDeadline = () => {
    const currentDeadline = getCurrentDeadline();
    if (!currentDeadline) return '';

    const currentDate = parseDate(currentDeadline);
    const newDate = new Date(currentDate);

    if (extensionUnit === 'months') {
      newDate.setMonth(newDate.getMonth() + extensionValue);
    } else {
      newDate.setDate(newDate.getDate() + extensionValue);
    }

    return formatDate(newDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDeadline = calculateNewDeadline();
    
    if (type === 'investigation') {
      const updatedCase = {
        ...caseData,
        investigationDeadline: newDeadline
      };
      onSave(updatedCase);
    } else if (defendant) {
      const updatedDefendants = caseData.defendants.map(d => 
        d.id === defendant.id 
          ? { ...d, detentionDeadline: newDeadline }
          : d
      );
      const updatedCase = {
        ...caseData,
        defendants: updatedDefendants
      };
      onSave(updatedCase);
    }
    
    onClose();
  };

  const title = type === 'investigation' 
    ? 'Gia Hạn Điều Tra' 
    : `Gia Hạn Tạm Giam - ${defendant?.name}`;

  const currentDeadline = getCurrentDeadline();
  const newDeadline = calculateNewDeadline();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="text-blue-600" size={20} />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Thông tin hiện tại</h3>
              <p className="text-sm text-gray-600">
                <Calendar size={14} className="inline mr-1" />
                Hạn hiện tại: <span className="font-medium">{currentDeadline}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian gia hạn
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  max={type === 'investigation' ? 12 : 365}
                  value={extensionValue}
                  onChange={(e) => setExtensionValue(parseInt(e.target.value) || 1)}
                  className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={extensionUnit}
                  onChange={(e) => setExtensionUnit(e.target.value as 'days' | 'months')}
                  className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={type === 'investigation'}
                >
                  {type === 'investigation' ? (
                    <option value="months">Tháng</option>
                  ) : (
                    <>
                      <option value="days">Ngày</option>
                      <option value="months">Tháng</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {newDeadline && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-700 mb-2">Hạn mới sau gia hạn</h3>
                <p className="text-sm text-blue-600">
                  <Calendar size={14} className="inline mr-1" />
                  Hạn mới: <span className="font-medium">{newDeadline}</span>
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
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
              <Clock size={16} />
              Gia Hạn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtensionModal;