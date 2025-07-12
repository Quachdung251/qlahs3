// components/CaseEditModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save, User, FileText, Shield, Calendar, Plus, Minus, CheckCircle } from 'lucide-react';
import { Case, Defendant } from '../types'; // Đảm bảo Case được import từ types.ts
import AutocompleteInput from './AutocompleteInput';
import DateInput from './DateInput';
import { criminalCodeData, formatCriminalCodeDisplay } from '../data/criminalCode';
import { prosecutorsData } from '../data/prosecutors'; // Giả định prosecutorsData được import từ đây

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

  useEffect(() => {
    // Reset hasChanges khi modal mở hoặc caseData thay đổi
    setHasChanges(false);
    setFormData({ ...caseData });
  }, [caseData]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleAutocompleteChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const addDefendant = () => {
    setFormData(prev => {
      const newDefendant: Omit<Defendant, 'id'> = {
        name: '',
        charges: '',
        preventiveMeasure: 'Tại ngoại',
      };
      return {
        ...prev,
        defendants: [...(prev.defendants || []), { ...newDefendant, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }]
      };
    });
    setHasChanges(true);
  };

  const removeDefendant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      defendants: prev.defendants.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  const updateDefendant = (index: number, field: keyof Omit<Defendant, 'id'>, value: string) => {
    const updatedDefendants = formData.defendants.map((defendant, i) => {
      if (i === index) {
        const updated = { ...defendant, [field]: value };
        if (field === 'preventiveMeasure' && value === 'Tại ngoại') {
          delete updated.detentionDeadline;
        } else if (field === 'preventiveMeasure' && value === 'Tạm giam' && !updated.detentionDeadline) {
          // Set a default detention deadline if changing to 'Tạm giam' and none exists
          const date = new Date();
          date.setDate(date.getDate() + 30); // Default 30 days
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          updated.detentionDeadline = `${day}/${month}/${year}`;
        }
        return updated;
      }
      return defendant;
    });
    setFormData({ ...formData, defendants: updatedDefendants });
    setHasChanges(true);
  };

  const addSupportingProsecutor = () => {
    setFormData(prev => ({
      ...prev,
      supportingProsecutors: [...(prev.supportingProsecutors || []), '']
    }));
    setHasChanges(true);
  };

  const removeSupportingProsecutor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      supportingProsecutors: prev.supportingProsecutors?.filter((_, i) => i !== index) || []
    }));
    setHasChanges(true);
  };

  const updateSupportingProsecutor = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      supportingProsecutors: prev.supportingProsecutors?.map((p, i) => i === index ? value : p) || []
    }));
    setHasChanges(true);
  };

  const handleConfirmSave = () => {
    // Logic validate cho các trường ngày tùy thuộc vào giai đoạn
    let isValid = true;
    let errorMessage = '';

    // Thời hạn điều tra luôn bắt buộc khi khởi tạo case hoặc khi ở giai đoạn điều tra
    if (!formData.investigationDeadline && formData.stage === 'Điều tra') {
      isValid = false;
      errorMessage = 'Thời hạn điều tra là bắt buộc ở giai đoạn Điều tra.';
    }

    // Kiểm tra các trường ngày chuyển giai đoạn
    if (formData.stage === 'Truy tố' && !formData.prosecutionTransferDate) {
      isValid = false;
      errorMessage = 'Ngày chuyển truy tố là bắt buộc ở giai đoạn Truy tố.';
    }
    if (formData.stage === 'Xét xử' && !formData.trialTransferDate) {
      isValid = false;
      errorMessage = 'Ngày chuyển xét xử là bắt buộc ở giai đoạn Xét xử.';
    }

    if (!isValid) {
      alert(errorMessage); // Sử dụng alert tạm thời, nên thay bằng modal thông báo
      return;
    }

    onSave(formData);
    onClose();
    setShowConfirmation(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasChanges) {
      setShowConfirmation(true);
    } else {
      onClose(); // Đóng modal nếu không có thay đổi
    }
  };

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

  const getResolutionFormOptions = (stage: Case['stage']) => {
    switch (stage) {
      case 'Điều tra':
        return [
          { value: 'Đề nghị truy tố', label: 'Đề nghị truy tố' },
          { value: 'Tạm đình chỉ điều tra', label: 'Tạm đình chỉ điều tra' },
          { value: 'Đình chỉ điều tra', label: 'Đình chỉ điều tra' },
          { value: 'Chuyển đi', label: 'Chuyển đi' },
        ];
      case 'Truy tố':
        return [
          { value: 'Truy tố', label: 'Truy tố' },
          { value: 'Tạm đình chỉ truy tố', label: 'Tạm đình chỉ truy tố' },
          { value: 'Đình chỉ truy tố', label: 'Đình chỉ truy tố' },
          { value: 'Trả hồ sơ điều tra bổ sung', label: 'Trả hồ sơ điều tra bổ sung' },
        ];
      case 'Xét xử':
        return [
          { value: 'Xét xử', label: 'Xét xử' },
          { value: 'Tạm đình chỉ xét xử', label: 'Tạm đình chỉ xét xử' },
          { value: 'Đình chỉ xét xử', label: 'Đình chỉ xét xử' },
          { value: 'Trả hồ sơ điều tra bổ sung', label: 'Trả hồ sơ điều tra bổ sung' },
          { value: 'Trả hồ sơ truy tố bổ sung', label: 'Trả hồ sơ truy tố bổ sung' },
        ];
      default:
        return [];
    }
  };

  const handleResolutionFormChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => {
      let newStage = prev.stage;
      let newProsecutionTransferDate = prev.prosecutionTransferDate;
      let newTrialTransferDate = prev.trialTransferDate;

      // Logic chuyển giai đoạn tự động dựa trên hình thức giải quyết
      if (prev.stage === 'Điều tra') {
        if (value === 'Đề nghị truy tố') {
          newStage = 'Truy tố';
          if (!newProsecutionTransferDate) newProsecutionTransferDate = new Date().toLocaleDateString('vi-VN');
        } else if (value.includes('đình chỉ') || value === 'Chuyển đi') {
          newStage = value === 'Tạm đình chỉ điều tra' ? 'Tạm đình chỉ' : 'Đình chỉ'; // Cập nhật stage cho đình chỉ
        }
      } else if (prev.stage === 'Truy tố') {
        if (value === 'Truy tố') {
          newStage = 'Xét xử';
          if (!newTrialTransferDate) newTrialTransferDate = new Date().toLocaleDateString('vi-VN');
        } else if (value.includes('đình chỉ') || value.includes('Trả hồ sơ')) {
          newStage = value === 'Tạm đình chỉ truy tố' ? 'Tạm đình chỉ' : 'Đình chỉ'; // Cập nhật stage cho đình chỉ
        }
      } else if (prev.stage === 'Xét xử') {
        if (value === 'Xét xử') {
          newStage = 'Hoàn thành'; // Giả định xét xử xong là hoàn thành
        } else if (value.includes('đình chỉ') || value.includes('Trả hồ sơ')) {
          newStage = value === 'Tạm đình chỉ xét xử' ? 'Tạm đình chỉ' : 'Đình chỉ'; // Cập nhật stage cho đình chỉ
        }
      }

      return {
        ...prev,
        resolutionForm: value,
        stage: newStage,
        prosecutionTransferDate: newProsecutionTransferDate,
        trialTransferDate: newTrialTransferDate,
      };
    });
    setHasChanges(true);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Edit2 className="text-blue-600" size={24} />
            Chỉnh Sửa Vụ Án
          </h2>
          <button
            onClick={handleSubmit} // Gọi handleSubmit để kiểm tra thay đổi trước khi đóng
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Vụ Án</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tên vụ án"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tội Danh Vụ Án (Điều, Khoản)</label>
                <AutocompleteInput
                  value={formData.charges}
                  onChange={(value) => handleAutocompleteChange('charges', value)}
                  options={criminalCodeOptions}
                  placeholder="Nhập hoặc tìm kiếm tội danh"
                  icon={<Shield size={16} />}
                />
              </div>

              <DateInput
                value={formData.investigationDeadline}
                onChange={(value) => handleDateChange('investigationDeadline', value)}
                label="Thời Hạn Điều Tra"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kiểm Sát Viên Phụ Trách</label>
                <AutocompleteInput
                  value={formData.prosecutor}
                  onChange={(value) => handleAutocompleteChange('prosecutor', value)}
                  options={prosecutorOptions}
                  placeholder="Nhập hoặc chọn kiểm sát viên"
                  required
                  icon={<User size={16} />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi Chú</label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Ghi chú về vụ án"
                />
              </div>

              {/* Mục Hình thức giải quyết */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức giải quyết</label>
                <select
                  name="resolutionForm"
                  value={formData.resolutionForm || ''}
                  onChange={handleResolutionFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Chọn hình thức giải quyết --</option>
                  {getResolutionFormOptions(formData.stage).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngày chuyển truy tố (chỉ hiện khi giai đoạn là Truy tố hoặc Xét xử) */}
              {(formData.stage === 'Truy tố' || formData.stage === 'Xét xử') && (
                <DateInput
                  value={formData.prosecutionTransferDate || ''}
                  onChange={(value) => handleDateChange('prosecutionTransferDate', value)}
                  label="Ngày Chuyển Truy Tố"
                  required={formData.stage === 'Truy tố'}
                />
              )}

              {/* Ngày chuyển xét xử (chỉ hiện khi giai đoạn là Xét xử) */}
              {formData.stage === 'Xét xử' && (
                <DateInput
                  value={formData.trialTransferDate || ''}
                  onChange={(value) => handleDateChange('trialTransferDate', value)}
                  label="Ngày Chuyển Xét Xử"
                  required
                />
              )}

            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-1">
                  <User size={18} />
                  Kiểm Sát Viên Hỗ Trợ
                  <button
                    type="button"
                    onClick={addSupportingProsecutor}
                    className="ml-auto flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                  >
                    <Plus size={14} /> Thêm
                  </button>
                </h3>
                {formData.supportingProsecutors && formData.supportingProsecutors.length > 0 ? (
                  formData.supportingProsecutors.map((sp, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <AutocompleteInput
                        value={sp}
                        onChange={(value) => updateSupportingProsecutor(index, value)}
                        options={prosecutorOptions}
                        placeholder={`KSV Hỗ Trợ ${index + 1}`}
                        className="flex-grow"
                        icon={<User size={16} />}
                      />
                      <button
                        type="button"
                        onClick={() => removeSupportingProsecutor(index)}
                        className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        aria-label="Xóa kiểm sát viên hỗ trợ"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Chưa có kiểm sát viên hỗ trợ nào.</p>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-1">
                  <User size={18} />
                  Thông Tin Bị Can
                  <button
                    type="button"
                    onClick={addDefendant}
                    className="ml-auto flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    <Plus size={14} /> Thêm
                  </button>
                </h3>
                {formData.defendants && formData.defendants.length > 0 ? (
                  formData.defendants.map((defendant, index) => (
                    <div key={defendant.id || index} className="bg-gray-50 p-3 rounded-md mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-700">Bị Can {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeDefendant(index)}
                          className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
                        >
                          <Minus size={12} /> Xóa
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tên Bị Can</label>
                          <input
                            type="text"
                            value={defendant.name}
                            onChange={(e) => updateDefendant(index, 'name', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tội Danh Bị Can</label>
                          <AutocompleteInput
                            value={defendant.charges}
                            onChange={(value) => updateDefendant(index, 'charges', value)}
                            options={criminalCodeOptions}
                            placeholder="Nhập hoặc tìm kiếm tội danh"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Biện Pháp Ngăn Chặn</label>
                          <select
                            value={defendant.preventiveMeasure}
                            onChange={(e) => updateDefendant(index, 'preventiveMeasure', e.target.value as 'Tại ngoại' | 'Tạm giam')}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="Tại ngoại">Tại ngoại</option>
                            <option value="Tạm giam">Tạm giam</option>
                          </select>
                        </div>
                        {defendant.preventiveMeasure === 'Tạm giam' && (
                          <DateInput
                            value={defendant.detentionDeadline || ''}
                            onChange={(value) => updateDefendant(index, 'detentionDeadline', value)}
                            label="Thời Hạn Tạm Giam"
                            required
                          />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Vụ án này chưa có bị can nào.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
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
