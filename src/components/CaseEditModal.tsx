// components/CaseEditModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save, User, FileText, Shield, Calendar, Plus, Minus, CheckCircle } from 'lucide-react';
import { Case, Defendant } from '../types'; // Đảm bảo Case được import từ types.ts
import AutocompleteInput from './AutocompleteInput';
import DateInput from './DateInput';
import { criminalCodeData, formatCriminalCodeDisplay } from '../data/criminalCode';
import { prosecutorsData } from '../data/prosecutors';

interface CaseEditModalProps {
  case: Case;
  onSave: (updatedCase: Case) => void;
  onClose: () => void;
}

const CaseEditModal: React.FC<CaseEditModalProps> = ({ case: caseData, onSave, onClose }) => {
  const [formData, setFormData] = useState<Case>({ ...caseData });
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Debug: Theo dõi formData để đảm bảo các giá trị ngày được cập nhật đúng
  // useEffect(() => {
  //   console.log("Current formData:", formData);
  // }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Logic validate cho các trường ngày tùy thuộc vào giai đoạn
    let isValid = true;
    let errorMessage = '';

    // Thời hạn điều tra luôn bắt buộc khi khởi tạo case hoặc khi ở giai đoạn điều tra
    // Nếu bạn muốn nó chỉ bắt buộc ở giai đoạn 'Điều tra', hãy điều chỉnh logic
    if (!formData.investigationDeadline) {
      isValid = false;
      errorMessage = 'Vui lòng nhập Thời Hạn Điều Tra.';
    }

    // Kiểm tra ngày chuyển truy tố nếu giai đoạn là Truy tố
    if (formData.stage === 'Truy tố' && !formData.prosecutionTransferDate) {
      isValid = false;
      errorMessage = (errorMessage ? errorMessage + '\n' : '') + 'Vui lòng nhập Ngày Chuyển Truy Tố.';
    }

    // Kiểm tra ngày chuyển xét xử nếu giai đoạn là Xét xử
    if (formData.stage === 'Xét xử' && !formData.trialTransferDate) {
      isValid = false;
      errorMessage = (errorMessage ? errorMessage + '\n' : '') + 'Vui lòng nhập Ngày Chuyển Xét Xử.';
    }

    // Validate hạn tạm giam cho bị can
    const defendantsValid = formData.defendants.every(d => d.preventiveMeasure !== 'Tạm giam' || d.detentionDeadline);
    if (!defendantsValid) {
        isValid = false;
        errorMessage = (errorMessage ? errorMessage + '\n' : '') + 'Vui lòng nhập đầy đủ Thời Hạn Tạm Giam cho tất cả bị can bị tạm giam.';
    }

    if (!isValid) {
      alert(errorMessage || 'Vui lòng nhập đầy đủ các trường ngày bắt buộc.');
      return;
    }

    if (hasChanges) {
      setShowConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleConfirmSave = () => {
    onSave(formData);
    onClose();
  };

  const handleFormChange = (newData: Partial<Case>) => {
    setFormData((prevData) => {
        const updatedData = { ...prevData, ...newData };
        
        // Logic để xóa các trường ngày không liên quan khi thay đổi giai đoạn
        if ('stage' in newData && newData.stage !== prevData.stage) {
            if (newData.stage !== 'Truy tố') {
                updatedData.prosecutionTransferDate = undefined; // Sử dụng tên biến đúng
            }
            if (newData.stage !== 'Xét xử') {
                updatedData.trialTransferDate = undefined; // Sử dụng tên biến đúng
            }
            // investigationDeadline luôn giữ lại
        }
        return updatedData;
    });
    setHasChanges(true);
  };

  const addDefendant = () => {
    const newDefendant: Defendant = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: '',
      charges: '',
      preventiveMeasure: 'Tại ngoại', // Mặc định là 'Tại ngoại'
    };
    handleFormChange({
      defendants: [...formData.defendants, newDefendant]
    });
  };

  const removeDefendant = (index: number) => {
    handleFormChange({
      defendants: formData.defendants.filter((_, i) => i !== index)
    });
  };

  const updateDefendant = (index: number, field: keyof Omit<Defendant, 'id'>, value: string | undefined) => {
    const updatedDefendants = formData.defendants.map((defendant, i) => {
      if (i === index) {
        let updated: Defendant = { ...defendant, [field]: value };
            
        if (field === 'preventiveMeasure') {
          if (value === 'Tạm giam') {
            // Nếu chuyển sang tạm giam và chưa có hạn, mặc định bằng hạn điều tra
            updated.detentionDeadline = defendant.detentionDeadline || formData.investigationDeadline;
          } else {
            // Nếu chuyển sang tại ngoại, bỏ hạn tạm giam
            updated.detentionDeadline = undefined;
          }
        }
        return updated;
      }
      return defendant;
    });
    setFormData({ ...formData, defendants: updatedDefendants });
    setHasChanges(true);
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Vụ Án</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Case Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                Tên Vụ Án
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange({ name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield size={16} className="inline mr-1" />
                Tội Danh Vụ Án (Điều, Khoản)
              </label>
              <AutocompleteInput
                value={formData.charges}
                onChange={(value) => handleFormChange({ charges: value })}
                options={criminalCodeOptions}
                placeholder="Nhập hoặc tìm kiếm tội danh"
                required
                icon={<Shield size={16} />}
              />
            </div>
            
            {/* Conditional Date Inputs based on Stage */}
            {formData.stage === 'Điều tra' && (
              <DateInput
                value={formData.investigationDeadline}
                onChange={(value) => handleFormChange({ investigationDeadline: value || '' })}
                label="Thời Hạn Điều Tra"
                required
              />
            )}
            
            {formData.stage === 'Truy tố' && (
              <DateInput
                value={formData.prosecutionTransferDate} // Đã đổi tên thuộc tính
                onChange={(value) => handleFormChange({ prosecutionTransferDate: value || '' })} // Đã đổi tên thuộc tính
                label="Ngày Chuyển Truy Tố"
                required
              />
            )}

            {formData.stage === 'Xét xử' && (
              <DateInput
                value={formData.trialTransferDate} // Đã đổi tên thuộc tính
                onChange={(value) => handleFormChange({ trialTransferDate: value || '' })} // Đã đổi tên thuộc tính
                label="Ngày Chuyển Xét Xử"
                required
              />
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                Kiểm Sát Viên Phụ Trách
              </label>
              <AutocompleteInput
                value={formData.prosecutor}
                onChange={(value) => handleFormChange({ prosecutor: value })}
                options={prosecutorOptions}
                placeholder="Nhập hoặc chọn kiểm sát viên"
                required
                icon={<User size={16} />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giai Đoạn
              </label>
              <select
                value={formData.stage}
                onChange={(e) => handleFormChange({ stage: e.target.value as Case['stage'] })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                Ghi Chú
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleFormChange({ notes: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập ghi chú (tùy chọn)"
                rows={3}
              />
            </div>
          </div>

          {/* Defendants Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Thông Tin Bị Can</h3>
              <button
                type="button"
                onClick={addDefendant}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus size={16} />
                Thêm Bị Can
              </button>
            </div>
            
            {formData.defendants.map((defendant, index) => (
              <div key={defendant.id} className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-700">Bị Can {index + 1}</h4>
                  {formData.defendants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDefendant(index)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                      <Minus size={14} />
                      Xóa
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên Bị Can
                    </label>
                    <input
                      type="text"
                      value={defendant.name}
                      onChange={(e) => updateDefendant(index, 'name', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tội Danh Bị Can (Điều, Khoản)
                    </label>
                    <AutocompleteInput
                      value={defendant.charges}
                      onChange={(value) => updateDefendant(index, 'charges', value)}
                      options={criminalCodeOptions}
                      placeholder="Nhập hoặc tìm kiếm tội danh"
                      required
                      className="p-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Biện Pháp Ngăn Chặn
                    </label>
                    <select
                      value={defendant.preventiveMeasure}
                      onChange={(e) => updateDefendant(index, 'preventiveMeasure', e.target.value as Defendant['preventiveMeasure'])}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Tại ngoại">Tại ngoại</option>
                      <option value="Tạm giam">Tạm giam</option>
                    </select>
                  </div>
                  
                  {defendant.preventiveMeasure === 'Tạm giam' && (
                    <DateInput
                      value={defendant.detentionDeadline} 
                      onChange={(value) => updateDefendant(index, 'detentionDeadline', value)}
                      label="Thời Hạn Tạm Giam"
                      required
                      className="col-span-1"
                    />
                  )}
                </div>
              </div>
            ))}
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
              {hasChanges ? 'Lưu Thay Đổi' : 'Đóng'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="text-blue-600" size={20} />
              Xác nhận lưu thay đổi
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có muốn lưu các thay đổi đã thực hiện không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={() => onClose()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Không lưu
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseEditModal;