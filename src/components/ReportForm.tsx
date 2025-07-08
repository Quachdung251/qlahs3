import React, { useState, useEffect } from 'react'; // Thêm useEffect
import { Plus, FileText, Shield, User, Calendar, Edit2, X } from 'lucide-react'; // Thêm Edit2 và X icon
import { ReportFormData, CaseFormData, Report } from '../types'; // Import Report type
import { getCurrentDate, addDaysToDate } from '../utils/dateUtils';
import AutocompleteInput from './AutocompleteInput';
import DateInput from './DateInput';
import { criminalCodeData, formatCriminalCodeDisplay } from '../data/criminalCode';
import { Prosecutor } from '../api/prosecutors';

interface ReportFormProps {
  onSubmit: (reportData: ReportFormData, isEditing: boolean) => void; // Thay thế onAddReport và onUpdateReport
  onTransferToCase: (caseData: CaseFormData) => void;
  prosecutors: Prosecutor[];
  initialData?: Report | null; // Dữ liệu ban đầu khi chỉnh sửa
  onCancelEdit?: () => void; // Hàm để hủy chỉnh sửa
}

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, onTransferToCase, prosecutors, initialData, onCancelEdit }) => {
  const [formData, setFormData] = useState<ReportFormData>(initialData ? {
    name: initialData.name,
    charges: initialData.charges,
    resolutionDeadline: initialData.resolutionDeadline,
    prosecutor: initialData.prosecutor,
    notes: initialData.notes || '' // Đảm bảo notes không phải undefined
  } : {
    name: '',
    charges: '',
    resolutionDeadline: addDaysToDate(getCurrentDate(), 30), // Mặc định 30 ngày từ hôm nay
    prosecutor: '',
    notes: ''
  });

  // Sử dụng useEffect để cập nhật formData khi initialData thay đổi
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        charges: initialData.charges,
        resolutionDeadline: initialData.resolutionDeadline,
        prosecutor: initialData.prosecutor,
        notes: initialData.notes || ''
      });
    } else {
      // Reset form khi không có initialData (chế độ thêm mới)
      setFormData({
        name: '',
        charges: '',
        resolutionDeadline: addDaysToDate(getCurrentDate(), 30),
        prosecutor: '',
        notes: ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Thêm kiểm tra cho các trường bắt buộc, bao gồm prosecutor
    if (!formData.name.trim() || !formData.charges.trim() || !formData.resolutionDeadline.trim() || !formData.prosecutor.trim()) {
      // Thay thế alert bằng một thông báo trong UI nếu có thể
      alert('Vui lòng điền đầy đủ các trường bắt buộc: Tên Tin Báo, Tội danh, Ngày Hết Hạn Giải Quyết, và Kiểm sát viên Phụ Trách.');
      return;
    }

    onSubmit(formData, !!initialData); // Gọi onSubmit, truyền cờ isEditing
    
    // Reset form chỉ khi ở chế độ thêm mới
    if (!initialData) {
      setFormData({
        name: '',
        charges: '',
        resolutionDeadline: addDaysToDate(getCurrentDate(), 30),
        prosecutor: '',
        notes: ''
      });
    }
  };

  const handleProsecute = () => {
    // Thêm kiểm tra cho các trường bắt buộc trước khi khởi tố
    if (!formData.name.trim() || !formData.charges.trim() || !formData.prosecutor.trim()) {
      alert('Vui lòng điền đầy đủ Tên Tin Báo, Tội danh, và Kiểm sát viên Phụ Trách trước khi khởi tố.');
      return;
    }

    // Convert report to case
    const caseData: CaseFormData = {
      name: formData.name,
      charges: formData.charges,
      investigationDeadline: getCurrentDate(), // Set to today as starting point
      prosecutor: formData.prosecutor,
      notes: formData.notes,
      defendants: [] // Empty defendants array - will be added later
    };
    
    onTransferToCase(caseData);
    
    // Clear form
    setFormData({
      name: '',
      charges: '',
      resolutionDeadline: addDaysToDate(getCurrentDate(), 30),
      prosecutor: '',
      notes: ''
    });
    
    // Thay thế alert bằng một thông báo trong UI nếu có thể
    alert('Tin báo đã được khởi tố và chuyển sang hệ thống quản lý vụ án!');
  };

  // Prepare options for autocomplete
  const criminalCodeOptions = criminalCodeData.map(item => ({
    value: formatCriminalCodeDisplay(item),
    label: formatCriminalCodeDisplay(item),
    description: item.description
  }));

  const prosecutorOptions = prosecutors.map(prosecutor => ({
    value: prosecutor.name,
    label: prosecutor.name,
    description: `${prosecutor.title}${prosecutor.department ? ` - ${prosecutor.department}` : ''}`
  }));

  const isEditing = !!initialData;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        {isEditing ? (
          <>
            <Edit2 className="text-blue-600" size={24} />
            Chỉnh Sửa Tin Báo
          </>
        ) : (
          <>
            <Plus className="text-blue-600" size={24} />
            Thêm Tin Báo Mới
          </>
        )}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Nhập tên tin báo"
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

        <div className="flex justify-end gap-3">
          {isEditing && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
            >
              <X size={16} />
              Hủy Bỏ
            </button>
          )}
          {!isEditing && ( // Nút "Khởi Tố Ngay" chỉ hiển thị khi thêm mới
            <button
              type="button"
              onClick={handleProsecute}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
              disabled={!formData.name.trim() || !formData.charges.trim() || !formData.prosecutor.trim()}
            >
              Khởi Tố Ngay
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            {isEditing ? 'Cập Nhật Tin Báo' : 'Thêm Tin Báo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
