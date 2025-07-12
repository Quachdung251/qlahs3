// ./components/CaseForm.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Minus, User, FileText, Shield, Clock, X, Edit2, UserPlus, Printer } from 'lucide-react'; // Import Printer icon
import { CaseFormData, Defendant, Case } from '../types';
import { getCurrentDate } from '../utils/dateUtils';
import AutocompleteInput from './AutocompleteInput';
import DateInput from './DateInput';
import { criminalCodeData, formatCriminalCodeDisplay } from '../data/criminalCode';
import { Prosecutor } from '../api/prosecutors';

interface CaseFormProps {
  onSubmit: (caseData: CaseFormData, isEditing: boolean, printAfterSave: boolean) => Promise<Case | void>; // Cập nhật prop onSubmit
  prosecutors: Prosecutor[];
  initialData?: Case | null;
  onCancelEdit?: () => void;
}

const CaseForm: React.FC<CaseFormProps> = ({ onSubmit, prosecutors, initialData, onCancelEdit }) => {
  // Hàm helper để thêm số ngày vào ngày hiện tại
  const addDaysToCurrentDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [formData, setFormData] = useState<CaseFormData>(initialData ? {
    name: initialData.name,
    charges: initialData.charges,
    investigationDeadline: initialData.investigationDeadline,
    prosecutor: initialData.prosecutor,
    supportingProsecutors: initialData.supportingProsecutors || [],
    notes: initialData.notes,
    defendants: initialData.defendants ? initialData.defendants.map(d => ({ ...d })) : []
  } : {
    name: '',
    charges: '',
    investigationDeadline: getCurrentDate(),
    prosecutor: '',
    supportingProsecutors: [],
    notes: '',
    defendants: []
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Đặt mặc định printAfterSave là true khi thêm mới, false khi chỉnh sửa
  const [printAfterSave, setPrintAfterSave] = useState<boolean>(!initialData); 

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        charges: initialData.charges,
        investigationDeadline: initialData.investigationDeadline,
        prosecutor: initialData.prosecutor,
        supportingProsecutors: initialData.supportingProsecutors || [],
        notes: initialData.notes,
        defendants: initialData.defendants ? initialData.defendants.map(d => ({ ...d })) : []
      });
      setPrintAfterSave(false); // Reset khi chỉnh sửa
    } else {
      setFormData({
        name: '',
        charges: '',
        investigationDeadline: getCurrentDate(),
        prosecutor: '',
        supportingProsecutors: [],
        notes: '',
        defendants: []
      });
      setPrintAfterSave(true); // Mặc định là true khi thêm mới
    }
    setErrorMessage(null);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let finalCaseData = { ...formData };

    // Logic tự động điền Tên Vụ Án và Tội Danh Vụ Án khi submit, chỉ khi ở chế độ thêm mới và có bị can
    if (!initialData && formData.defendants && formData.defendants.length > 0) {
      const firstDefendant = formData.defendants[0];
      const criminalCodeItem = criminalCodeData.find(item => formatCriminalCodeDisplay(item) === firstDefendant.charges);
      const crimeDescription = criminalCodeItem ? criminalCodeItem.title : '';

      // Tự động điền Tên Vụ Án nếu đang trống (chỉ lấy tên bị can và viết hoa)
      if (!finalCaseData.name.trim() && firstDefendant.name.trim()) {
        finalCaseData.name = firstDefendant.name.toUpperCase();
      }

      // Tự động điền Tội Danh Vụ Án nếu đang trống (chỉ lấy từ charges của bị can, và thêm mô tả tội danh nếu có)
      if (!finalCaseData.charges.trim() && firstDefendant.charges.trim()) {
        // Kiểm tra để tránh lặp lại mô tả tội danh nếu nó đã có trong firstDefendant.charges
        if (firstDefendant.charges.includes(crimeDescription) && crimeDescription !== '') {
          finalCaseData.charges = firstDefendant.charges;
        } else {
          finalCaseData.charges = `${firstDefendant.charges}${crimeDescription ? ` - ${crimeDescription}` : ''}`;
        }
      }
    }

    // Kiểm tra các trường bắt buộc của vụ án sau khi đã xử lý tự động điền
    if (!finalCaseData.name.trim() || !finalCaseData.charges.trim() || !finalCaseData.investigationDeadline.trim() || !finalCaseData.prosecutor.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ các trường bắt buộc: Tên Vụ Án, Tội danh, Thời hạn Điều tra, và Kiểm sát viên Phụ Trách. (Tên Vụ Án và Tội danh có thể tự động điền nếu điền đủ thông tin bị can đầu tiên và vụ án chưa có tên/tội danh)');
      return;
    }

    // Kiểm tra tội danh của từng bị can phải là tội cụ thể (không phải rỗng hoặc "Chưa xác định")
    for (const defendant of finalCaseData.defendants) {
      if (defendant.charges.trim() === '' || defendant.charges === 'Chưa xác định') {
        setErrorMessage('Tội danh của tất cả bị can phải được xác định cụ thể. Vui lòng kiểm tra lại thông tin bị can.');
        return;
      }
    }
    
    try {
      // Gọi onSubmit và truyền thêm printAfterSave
      const result = await onSubmit(finalCaseData, !!initialData, printAfterSave);

      // Reset form chỉ khi ở chế độ thêm mới và submit thành công
      if (!initialData && result) { // Kiểm tra result để đảm bảo submit thành công
        setFormData({
          name: '',
          charges: '',
          investigationDeadline: getCurrentDate(),
          prosecutor: '',
          supportingProsecutors: [],
          notes: '',
          defendants: []
        });
        setPrintAfterSave(true); // Reset tùy chọn in về mặc định true sau khi submit thành công
      }
    } catch (error: any) {
      console.error("Lỗi khi gửi form:", error);
      setErrorMessage(`Đã xảy ra lỗi khi lưu vụ án: ${error.message || "Vui lòng thử lại."}`);
    }
  };

  const addDefendant = () => {
    setFormData(prev => {
      const newDefendants = [...prev.defendants];
      const firstDefendant = newDefendants.length > 0 ? newDefendants[0] : null;

      let newDefendant: Omit<Defendant, 'id'>;

      if (firstDefendant) {
        // Nếu đã có bị can đầu tiên, các bị can sau sẽ mặc định theo bị can đầu tiên
        newDefendant = {
          name: '', // Tên bị can để trống
          charges: firstDefendant.charges || '', // Tội danh mặc định theo bị can 1
          preventiveMeasure: firstDefendant.preventiveMeasure || 'Tại ngoại', // Biện pháp mặc định theo bị can 1
        };
        if (newDefendant.preventiveMeasure === 'Tạm giam') {
          newDefendant.detentionDeadline = firstDefendant.detentionDeadline || addDaysToCurrentDate(30); // Hạn tạm giam theo bị can 1 hoặc mặc định 30 ngày
        }
      } else {
        // Nếu là bị can đầu tiên, tội danh để trống để người dùng nhập cụ thể
        newDefendant = {
          name: '',
          charges: '', // Để trống để người dùng nhập cụ thể
          preventiveMeasure: 'Tại ngoại',
          detentionDeadline: addDaysToCurrentDate(30) // Mặc định 30 ngày (sẽ ẩn nếu tại ngoại)
        };
      }
      return {
        ...prev,
        defendants: [...newDefendants, newDefendant]
      };
    });
  };

  const removeDefendant = (index: number) => {
    setFormData({
      ...formData,
      defendants: formData.defendants.filter((_, i) => i !== index)
    });
  };

  const updateDefendant = (index: number, field: keyof Omit<Defendant, 'id'>, value: string) => {
    const updatedDefendants = formData.defendants.map((defendant, i) => {
      if (i === index) {
        const updated = { ...defendant, [field]: value };
        if (field === 'preventiveMeasure' && value === 'Tại ngoại') {
          delete updated.detentionDeadline;
        } else if (field === 'preventiveMeasure' && value === 'Tạm giam' && !updated.detentionDeadline) {
          // Nếu chuyển sang tạm giam mà chưa có hạn, tự động điền hạn mặc định
          updated.detentionDeadline = addDaysToCurrentDate(30);
        }
        return updated;
      }
      return defendant;
    });
    setFormData({ ...formData, defendants: updatedDefendants });
  };

  // --- Logic cho Kiểm sát viên hỗ trợ ---
  const addSupportingProsecutor = () => {
    setFormData(prev => ({
      ...prev,
      supportingProsecutors: [...(prev.supportingProsecutors || []), '']
    }));
  };

  const removeSupportingProsecutor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      supportingProsecutors: prev.supportingProsecutors?.filter((_, i) => i !== index) || []
    }));
  };

  const updateSupportingProsecutor = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      supportingProsecutors: prev.supportingProsecutors?.map((p, i) => i === index ? value : p) || []
    }));
  };
  // --- Hết logic cho Kiểm sát viên hỗ trợ ---

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
            Chỉnh Sửa Vụ Án
          </>
        ) : (
          <>
            <Plus className="text-blue-600" size={24} />
            Thêm Vụ Án Mới
          </>
        )}
      </h2>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Lỗi!</strong>
          <span className="block sm:inline"> {errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                Tên Vụ Án {isEditing ? '' : <span className="text-gray-500 text-xs">(để trống sẽ tự động tạo từ tên bị can đầu tiên nếu có bị can)</span>}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên vụ án"
              />
            </div>

            <DateInput
              value={formData.investigationDeadline}
              onChange={(value) => setFormData({ ...formData, investigationDeadline: value })}
              label="Thời Hạn Điều Tra"
              required
            />

            <div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield size={16} className="inline mr-1" />
                Tội Danh Vụ Án (Điều, Khoản) {isEditing ? '' : <span className="text-gray-500 text-xs">(tự động từ bị can số 1 nếu có bị can)</span>}
              </label>
              <AutocompleteInput
                value={formData.charges}
                onChange={(value) => setFormData({ ...formData, charges: value })}
                options={criminalCodeOptions}
                placeholder="Nhập hoặc tìm kiếm tội danh"
                icon={<Shield size={16} />}
              />
            </div>
          </div>

          <div className="space-y-6">
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

            <div className="border-t pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Kiểm Sát Viên Hỗ Trợ</h3>
                <button
                  type="button"
                  onClick={addSupportingProsecutor}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <UserPlus size={16} />
                  Thêm KSV Hỗ Trợ
                </button>
              </div>
              {formData.supportingProsecutors && formData.supportingProsecutors.length > 0 ? (
                formData.supportingProsecutors.map((sp, index) => (
                  <div key={index} className="flex items-center gap-2 mb-3">
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
                      className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      aria-label="Xóa kiểm sát viên hỗ trợ"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Chưa có kiểm sát viên hỗ trợ nào được thêm.</p>
              )}
            </div>

            <div className="border-t pt-6 mt-6">
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

              {formData.defendants && formData.defendants.length > 0 ? (
                formData.defendants.map((defendant, index) => (
                  <div key={defendant.id || index} className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-700">
                        Bị Can {index + 1} {index === 0 && !isEditing && <span className="text-sm text-blue-600">(tội danh sẽ tự động áp dụng cho vụ án)</span>}
                      </h4>
                      {formData.defendants.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeDefendant(index)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          <Minus size={14} />
                          Xóa Bị Can Này
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
                          onChange={(e) => updateDefendant(index, 'preventiveMeasure', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="col-span-1"
                        />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Vụ án này chưa có bị can nào. Bạn có thể thêm bị can bằng nút "Thêm Bị Can".</p>
              )}
            </div>
          </div>
        </div>

        {/* Thêm tùy chọn in báo cáo sau khi lưu */}
        {!isEditing && (
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="printAfterSave"
              checked={printAfterSave}
              onChange={(e) => setPrintAfterSave(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="printAfterSave" className="ml-2 block text-sm text-gray-900 flex items-center gap-1">
              <Printer size={16} />
              In báo cáo vụ án này sau khi lưu
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
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
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            {isEditing ? 'Cập Nhật Vụ Án' : 'Thêm Vụ Án'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseForm;
