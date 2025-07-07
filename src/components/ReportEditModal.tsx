import React, { useState } from 'react';
import { X, Save, User, FileText, Shield } from 'lucide-react';
import { Report } from '../types';
import AutocompleteInput from './AutocompleteInput';
import DateInput from './DateInput';
import { criminalCodeData, formatCriminalCodeDisplay } from '../data/criminalCode';
import { prosecutorsData } from '../data/prosecutors';

interface ReportEditModalProps {
  report: Report;
  onSave: (updatedReport: Report) => void;
  onClose: () => void;
}

const ReportEditModal: React.FC<ReportEditModalProps> = ({ report, onSave, onClose }) => {
  const [formData, setFormData] = useState<Report>({ ...report });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Prepare options for autocomplete
  const criminalCodeOptions = criminalCodeData.map(item => ({
    value: formatCriminalCodeDisplay(item),
    label: formatCriminalCodeDisplay(item),
    description: item.description
  }));

  const prosecutorOptions = prosecutorsData.map(prosecutor => ({
    value: prosecutor.name,
    label: prosecutor.name,
    description: `${prosecutor.title}${prosecutor.department ? ` - ${prosecutor.department}` : ''}`
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Tin Báo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Report Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                Tên Tin Báo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield size={16} className="inline mr-1" />
                Tội Danh (Điều, Khoản)
              </label>
              <AutocompleteInput
                value={formData.charges}
                onChange={(value) => setFormData({ ...formData, charges: value })}
                options={criminalCodeOptions}
                placeholder="Nhập hoặc tìm kiếm tội danh"
                required
                icon={<Shield size={16} />}
              />
            </div>
            
            <DateInput
              value={formData.resolutionDeadline}
              onChange={(value) => setFormData({ ...formData, resolutionDeadline: value })}
              label="Ngày Hết Hạn Giải Quyết"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                Kiểm Sát Viên Phụ Trách
              </label>
              <AutocompleteInput
                value={formData.prosecutor}
                onChange={(value) => setFormData({ ...formData, prosecutor: value })}
                options={prosecutorOptions}
                placeholder="Nhập hoặc chọn kiểm sát viên"
                required
                icon={<User size={16} />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng Thái
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as Report['stage'] })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Khởi tố">Khởi tố</option>
                <option value="Không khởi tố">Không khởi tố</option>
                <option value="Tạm đình chỉ">Tạm đình chỉ</option>
              </select>
            </div>

            {formData.stage === 'Khởi tố' && (
              <DateInput
                value={formData.prosecutionDate || ''}
                onChange={(value) => setFormData({ ...formData, prosecutionDate: value })}
                label="Ngày Khởi Tố"
              />
            )}

            {(formData.stage === 'Không khởi tố' || formData.stage === 'Tạm đình chỉ') && (
              <DateInput
                value={formData.resolutionDate || ''}
                onChange={(value) => setFormData({ ...formData, resolutionDate: value })}
                label={formData.stage === 'Không khởi tố' ? 'Ngày Quyết Định' : 'Ngày Tạm Đình Chỉ'}
              />
            )}
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                Ghi Chú
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập ghi chú (tùy chọn)"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              <Save size={16} />
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportEditModal;