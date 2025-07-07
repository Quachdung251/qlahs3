// src/components/DataManagement.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Book, Users, Upload, Download } from 'lucide-react';

// Import dữ liệu và interface cho Bộ luật Hình sự (vẫn cục bộ)
import { criminalCodeData, CriminalCodeItem } from '../data/criminalCode';
// Import các tiện ích IndexedDB
import { dbManager } from '../utils/indexedDB';
import { useIndexedDB } from '../hooks/useIndexedDB';

// Import các hàm và interface cho Kiểm sát viên từ Supabase API
import {
  fetchProsecutors,
  addProsecutor,
  updateProsecutor,
  deleteProsecutor,
  Prosecutor
} from '../api/prosecutors';

// Import hook xác thực Supabase
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

interface DataManagementProps {
  // Các hàm này có thể được dùng để thông báo cho component cha
  // về sự thay đổi của dữ liệu, nếu cần re-render hoặc cập nhật ở nơi khác.
  onUpdateCriminalCode: (data: CriminalCodeItem[]) => void;
  onUpdateProsecutors: (data: Prosecutor[]) => void;
  currentUserId: string; // <--- THÊM PROP NÀY: ID của người dùng hiện tại
}

const DataManagement: React.FC<DataManagementProps> = ({ onUpdateCriminalCode, onUpdateProsecutors, currentUserId }) => { // Nhận prop currentUserId
  const { user, loading: authLoading } = useSupabaseAuth(); // Lấy thông tin user Supabase
  const [activeSection, setActiveSection] = useState<'criminal' | 'prosecutors' | 'backup'>('criminal');
  const [criminalData, setCriminalData] = useState<CriminalCodeItem[]>(criminalCodeData);

  // Khởi tạo prosecutorData là mảng rỗng, dữ liệu sẽ được tải từ Supabase
  const [prosecutorData, setProsecutorData] = useState<Prosecutor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<any>(null); // Có thể là CriminalCodeItem hoặc Prosecutor
  const [bulkImportText, setBulkImportText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [prosecutorLoading, setProsecutorLoading] = useState(true); // Trạng thái loading riêng cho Kiểm sát viên

  const { exportData, importData } = useIndexedDB();

  // useEffect để tải dữ liệu Bộ luật Hình sự từ IndexedDB khi component mount
  useEffect(() => {
    const loadCriminalData = async () => {
      try {
        const savedCriminalCode = await dbManager.loadData<CriminalCodeItem>('criminalCode');
        if (savedCriminalCode.length > 0) {
          setCriminalData(savedCriminalCode);
        }
      } catch (error) {
        console.error('Failed to load criminal code data from IndexedDB:', error);
      }
    };
    loadCriminalData();
  }, []); // Chạy một lần khi component mount

  // useEffect để lưu dữ liệu Bộ luật Hình sự vào IndexedDB khi có thay đổi
  useEffect(() => {
    const saveCriminalData = async () => {
      try {
        await dbManager.saveData('criminalCode', criminalData);
      } catch (error) {
        console.error('Failed to save criminal code data to IndexedDB:', error);
      }
    };
    saveCriminalData();
  }, [criminalData]); // Chạy khi criminalData thay đổi

  // useEffect để tải dữ liệu Kiểm sát viên từ Supabase
  useEffect(() => {
    const loadProsecutorsFromSupabase = async () => {
      // Chỉ tải dữ liệu nếu người dùng đã được xác định và không còn trong trạng thái loading của auth
      if (!authLoading) {
        setProsecutorLoading(true); // Bắt đầu loading
        if (user && currentUserId) { // <--- THÊM KIỂM TRA currentUserId
          const data = await fetchProsecutors(); // RLS sẽ tự động lọc dữ liệu của user hiện tại
          setProsecutorData(data);
        } else {
          // Nếu không có người dùng đăng nhập hoặc currentUserId không có, xóa dữ liệu Kiểm sát viên hiện có
          setProsecutorData([]);
          console.log("No user logged in or currentUserId is missing, cannot fetch prosecutors data from Supabase.");
        }
        setProsecutorLoading(false); // Kết thúc loading
      }
    };
    loadProsecutorsFromSupabase();
  }, [user, authLoading, currentUserId]); // <--- THÊM currentUserId VÀO DEPENDENCY ARRAY

  // Bulk Import for Criminal Code (vẫn giữ nguyên logic IndexedDB)
  const processBulkImport = () => {
    const lines = bulkImportText.split('\n').filter(line => line.trim());
    const newCodes: CriminalCodeItem[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const parts = trimmedLine.split(';');
        if (parts.length >= 2) {
          const article = parts[0].trim();
          const title = parts[1].trim();

          const exists = criminalData.some(code => code.article === article);
          if (!exists) {
            newCodes.push({
              article,
              title,
              description: ''
            });
          }
        }
      }
    });

    if (newCodes.length > 0) {
      const updated = [...criminalData, ...newCodes];
      setCriminalData(updated);
      onUpdateCriminalCode(updated);
      setBulkImportText('');
      setShowBulkImport(false);
      alert(`Đã thêm ${newCodes.length} điều luật mới vào IndexedDB!`);
    } else {
      alert('Không có dữ liệu hợp lệ để thêm hoặc tất cả đã tồn tại.');
    }
  };

  // Criminal Code Management (vẫn giữ nguyên logic IndexedDB)
  const addCriminalCode = () => {
    const newCode: CriminalCodeItem = {
      article: '',
      title: '',
      description: ''
    };
    setNewItem(newCode);
  };

  const saveCriminalCode = (item: CriminalCodeItem, isNew: boolean = false) => {
    if (isNew) {
      const updated = [...criminalData, item];
      setCriminalData(updated);
      onUpdateCriminalCode(updated);
      setNewItem(null);
    } else {
      const updated = criminalData.map(code =>
        code.article === item.article ? item : code
      );
      setCriminalData(updated);
      onUpdateCriminalCode(updated);
      setEditingId(null);
    }
  };

  const deleteCriminalCode = (article: string) => {
    const updated = criminalData.filter(code => code.article !== article);
    setCriminalData(updated);
    onUpdateCriminalCode(updated);
  };

  // Prosecutor Management (Đã thay đổi để sử dụng Supabase)
  const handleAddProsecutor = () => {
    if (!user || !currentUserId) { // <--- THÊM KIỂM TRA currentUserId
      alert('Vui lòng đăng nhập để thêm Kiểm sát viên.');
      return;
    }
    // Đặt newItem để hiển thị form thêm mới
    setNewItem({ name: '', title: 'Kiểm sát viên', department: '' });
  };

  const saveOrUpdateProsecutor = async (item: Prosecutor, isNew: boolean = false) => {
    if (!user || !currentUserId) { // <--- THÊM KIỂM TRA currentUserId
      alert('Bạn cần đăng nhập để thực hiện thao tác này.');
      return;
    }

    if (isNew) {
      // <--- TRUYỀN currentUserId VÀO addProsecutor
      const addedProsecutor = await addProsecutor(item, currentUserId);
      if (addedProsecutor) {
        alert('Thêm Kiểm sát viên thành công!');
        setNewItem(null); // Đóng form thêm mới
        setEditingId(null); // Đảm bảo không có item nào đang được chỉnh sửa
        const updatedData = await fetchProsecutors(); // Tải lại dữ liệu từ Supabase
        setProsecutorData(updatedData);
        onUpdateProsecutors(updatedData); // Cập nhật dữ liệu cho component cha nếu cần
      } else {
        alert('Lỗi khi thêm Kiểm sát viên.'); // Thông báo lỗi chung, chi tiết hơn đã có trong console
      }
    } else {
      // Logic cho việc UPDATE
      // Đảm bảo item.id tồn tại khi cập nhật
      if (!item.id) {
          alert('Không tìm thấy ID Kiểm sát viên để cập nhật.');
          return;
      }
      // <--- TRUYỀN currentUserId VÀO updateProsecutor
      const updatedProsecutor = await updateProsecutor(item.id, { name: item.name, title: item.title, department: item.department }, currentUserId);
      if (updatedProsecutor) {
        alert('Cập nhật Kiểm sát viên thành công!');
        setEditingId(null);
        const updatedData = await fetchProsecutors(); // Tải lại dữ liệu từ Supabase
        setProsecutorData(updatedData);
        onUpdateProsecutors(updatedData); // Cập nhật dữ liệu cho component cha nếu cần
      } else {
        alert('Lỗi khi cập nhật Kiểm sát viên.'); // Thông báo lỗi chung
      }
    }
  };

  const handleDeleteProsecutor = async (id: string) => {
    if (!user || !currentUserId) { // <--- THÊM KIỂM TRA currentUserId
      alert('Vui lòng đăng nhập để thực hiện thao tác này.');
      return;
    }
    // Thay vì window.confirm, sử dụng modal tùy chỉnh nếu có
    if (window.confirm('Bạn có chắc chắn muốn xóa Kiểm sát viên này?')) {
      // <--- TRUYỀN currentUserId VÀO deleteProsecutor
      const success = await deleteProsecutor(id, currentUserId);
      if (success) {
        alert('Xóa Kiểm sát viên thành công!');
        const updatedData = await fetchProsecutors(); // Tải lại dữ liệu từ Supabase
        setProsecutorData(updatedData);
        onUpdateProsecutors(updatedData); // Cập nhật dữ liệu cho component cha nếu cần
      } else {
        alert('Lỗi khi xóa Kiểm sát viên.'); // Thông báo lỗi chung
      }
    }
  };

  // Backup & Restore (vẫn giữ nguyên logic IndexedDB)
  const handleExportData = async () => {
    const success = await exportData();
    if (success) {
      alert('Dữ liệu đã được xuất thành công!');
    } else {
      alert('Có lỗi xảy ra khi xuất dữ liệu.');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const success = await importData(file);
    if (success) {
      alert('Dữ liệu đã được nhập thành công! Vui lòng tải lại trang.');
      window.location.reload(); // Reload để tải lại dữ liệu từ IndexedDB sau khi import
    } else {
      alert('Có lỗi xảy ra khi nhập dữ liệu. Vui lòng kiểm tra định dạng file.');
    }
    event.target.value = ''; // Reset input file để có thể chọn lại cùng một file
  };

  // Form cho Bộ luật Hình sự
  const CriminalCodeForm: React.FC<{ item: CriminalCodeItem; onSave: (item: CriminalCodeItem) => void; onCancel: () => void }> = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item);

    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-2">
          <input
            type="text"
            value={formData.article}
            onChange={(e) => setFormData({ ...formData, article: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="Số điều"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="Tên tội danh"
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => onSave(formData)}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Save size={14} />
              Lưu
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <X size={14} />
              Hủy
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Form cho Kiểm sát viên
  const ProsecutorForm: React.FC<{ item: Prosecutor; onSave: (item: Prosecutor, isNew: boolean) => void; onCancel: () => void; isNew: boolean }> = ({ item, onSave, onCancel, isNew }) => {
    const [formData, setFormData] = useState(item);

    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-2">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="Họ tên"
          />
        </td>
        <td className="px-4 py-2">
          <select
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="Kiểm sát viên sơ cấp">Kiểm sát viên sơ cấp</option>
            <option value="Kiểm sát viên trung cấp">Kiểm sát viên trung cấp</option>
            <option value="Kiểm tra viên">Kiểm tra viên</option>
            <option value="Cán bộ">Cán bộ</option>
          </select>
        </td>
        <td className="px-4 py-2">
          <select
            value={formData.department || ''}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Chọn phòng ban</option>
            <option value="Ban Lãnh đạo">Ban Lãnh đạo</option>
            <option value="Phòng Điều tra">Phòng Điều tra</option>
            <option value="Phòng Truy tố">Phòng Truy tố</option>
            <option value="Phòng Xét xử">Phòng Xét xử</option>
            <option value="Văn phòng">Văn phòng</option>
          </select>
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => onSave(formData, isNew)}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Save size={14} />
              Lưu
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <X size={14} />
              Hủy
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Quản Lý Dữ Liệu Hệ Thống</h2>

      {/* Section Tabs */}
      <div className="flex mb-6 border-b">
        <button
          onClick={() => setActiveSection('criminal')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium ${
            activeSection === 'criminal'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Book size={18} />
          Bộ Luật Hình Sự
        </button>
        <button
          onClick={() => setActiveSection('prosecutors')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium ${
            activeSection === 'prosecutors'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={18} />
          Kiểm Sát Viên
        </button>
        <button
          onClick={() => setActiveSection('backup')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium ${
            activeSection === 'backup'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Download size={18} />
          Sao Lưu & Khôi Phục
        </button>
      </div>

      {/* Backup & Restore Section */}
      {activeSection === 'backup' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Sao Lưu & Khôi Phục Dữ Liệu</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Xuất Dữ Liệu</h4>
              <p className="text-sm text-blue-600 mb-3">
                Xuất toàn bộ dữ liệu (vụ án, tin báo, điều luật, kiểm sát viên) thành file JSON để sao lưu.
              </p>
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Download size={16} />
                Xuất Dữ Liệu
              </button>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Nhập Dữ Liệu</h4>
              <p className="text-sm text-green-600 mb-3">
                Khôi phục dữ liệu từ file JSON đã xuất trước đó. <strong>Lưu ý:</strong> Thao tác này sẽ ghi đè lên dữ liệu hiện tại.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Lưu Ý Quan Trọng</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Dữ liệu được lưu trữ cục bộ trên máy tính của bạn</li>
                <li>• Thường xuyên sao lưu dữ liệu để tránh mất mát</li>
                <li>• Khi chuyển máy tính, hãy xuất dữ liệu và nhập lại trên máy mới</li>
                <li>• File sao lưu chứa toàn bộ thông tin nhạy cảm, hãy bảo mật cẩn thận</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Criminal Code Section */}
      {activeSection === 'criminal' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Danh Sách Điều Luật</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkImport(!showBulkImport)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Upload size={16} />
                Import Hàng Loạt
              </button>
              <button
                onClick={addCriminalCode}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus size={16} />
                Thêm Điều Luật
              </button>
            </div>
          </div>

          {/* Bulk Import Section */}
          {showBulkImport && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-lg font-medium mb-3">Import Hàng Loạt Điều Luật</h4>
              <p className="text-sm text-gray-600 mb-3">
                Nhập dữ liệu theo định dạng: <strong>Số điều ; Tên tội danh</strong> (mỗi dòng một điều luật)
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Ví dụ:<br/>
                165 ; Tội làm, tàng trữ, lưu hành tiền giả<br/>
                166 ; Tội lừa đảo chiếm đoạt tài sản
              </p>
              <textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                className="w-full p-3 border rounded-md h-32 mb-3"
                placeholder="165 ; Tội làm, tàng trữ, lưu hành tiền giả&#10;166 ; Tội lừa đảo chiếm đoạt tài sản&#10;167 ; Tội khác..."
              />
              <div className="flex gap-2">
                <button
                  onClick={processBulkImport}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Xử Lý Import
                </button>
                <button
                  onClick={() => {
                    setShowBulkImport(false);
                    setBulkImportText('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Điều</th>
                  <th className="px-4 py-2 text-left">Tên Tội Danh</th>
                  <th className="px-4 py-2 text-left">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {newItem && activeSection === 'criminal' && (
                  <CriminalCodeForm
                    item={newItem}
                    onSave={(item) => saveCriminalCode(item, true)}
                    onCancel={() => setNewItem(null)}
                  />
                )}
                {criminalData.map((code) => (
                  editingId === code.article ? (
                    <CriminalCodeForm
                      key={code.article}
                      item={code}
                      onSave={(item) => saveCriminalCode(item)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <tr key={code.article} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{code.article}</td>
                      <td className="px-4 py-2">{code.title}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(code.article)}
                            className="flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                          >
                            <Edit2 size={12} />
                            Sửa
                          </button>
                          <button
                            onClick={() => deleteCriminalCode(code.article)}
                            className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            <Trash2 size={12} />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prosecutors Section (Đã thay đổi để dùng Supabase) */}
      {activeSection === 'prosecutors' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Danh Sách Kiểm Sát Viên</h3>
            <button
              onClick={handleAddProsecutor}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus size={16} />
              Thêm Kiểm Sát Viên
            </button>
          </div>

          {prosecutorLoading ? (
            <div>Đang tải danh sách Kiểm sát viên...</div>
          ) : !user ? (
            <div>Vui lòng đăng nhập để xem và quản lý danh sách Kiểm sát viên của bạn.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Họ Tên</th>
                    <th className="px-4 py-2 text-left">Chức Vụ</th>
                    <th className="px-4 py-2 text-left">Phòng Ban</th>
                    <th className="px-4 py-2 text-left">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {newItem && activeSection === 'prosecutors' && (
                    <ProsecutorForm
                      item={newItem}
                      onSave={(item) => saveOrUpdateProsecutor(item, true)}
                      onCancel={() => setNewItem(null)}
                      isNew={true}
                    />
                  )}
                  {prosecutorData.map((prosecutor) => (
                    editingId === prosecutor.id ? (
                      <ProsecutorForm
                        key={prosecutor.id}
                        item={prosecutor}
                        onSave={(item) => saveOrUpdateProsecutor(item, false)}
                        onCancel={() => setEditingId(null)}
                        isNew={false}
                      />
                    ) : (
                      <tr key={prosecutor.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{prosecutor.name}</td>
                        <td className="px-4 py-2">{prosecutor.title}</td>
                        <td className="px-4 py-2">{prosecutor.department || '-'}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingId(prosecutor.id || null)}
                              className="flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                            >
                              <Edit2 size={12} />
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteProsecutor(prosecutor.id!)}
                              className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              <Trash2 size={12} />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataManagement;
