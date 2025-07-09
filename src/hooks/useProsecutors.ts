import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase'; // Import supabase client
import { dbManager } from '../utils/indexedDB'; // Import dbManager instance
import { useSupabaseAuth } from './useSupabaseAuth'; // Import hook xác thực của bạn

export interface Prosecutor {
  id: string;
  name: string;
  title: string; // Thêm trường title (chức vụ)
  department?: string; // Thêm trường department (phòng ban), có thể có hoặc không
  // Thêm các trường khác nếu có
}

export const useProsecutors = () => {
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth(); // Lấy user, trạng thái xác thực và trạng thái loading của auth
  const [prosecutors, setProsecutors] = useState<Prosecutor[]>([]);
  const [loading, setLoading] = useState(true); // Trạng thái loading riêng cho prosecutors
  const [error, setError] = useState<string | null>(null);

  // Function to fetch from Supabase and update IndexedDB
  const fetchProsecutorsFromSupabase = useCallback(async () => {
    if (!authLoading) { // Chỉ thực hiện khi trạng thái xác thực đã ổn định
      try {
        // Chỉ tải dữ liệu nếu người dùng đã đăng nhập
        if (isAuthenticated && user) {
          const { data, error: supabaseError } = await supabase
            .from('prosecutors') // Tên bảng kiểm sát viên trên Supabase
            .select('*')
            .order('name', { ascending: true }); // Sắp xếp theo tên

          if (supabaseError) {
            throw supabaseError;
          }

          // Update IndexedDB with the latest data from Supabase
          if (data) {
            await dbManager.saveData('prosecutors', data); // Sử dụng dbManager.saveData
            setProsecutors(data as Prosecutor[]);
            setError(null); // Xóa lỗi nếu fetch thành công
            console.log('Đã tải kiểm sát viên từ Supabase và cập nhật IndexedDB.');
          }
        } else {
          // Nếu không đăng nhập, đảm bảo không có dữ liệu KSV từ Supabase
          console.log("Người dùng chưa xác thực, không tải dữ liệu Kiểm sát viên từ Supabase.");
          setError("Không thể tải danh sách Kiểm sát viên: Vui lòng đăng nhập.");
        }
      } catch (err: any) {
        console.error('Lỗi khi tải kiểm sát viên từ Supabase:', err.message);
        setError(`Lỗi tải kiểm sát viên từ Supabase: ${err.message}`);
        // Nếu Supabase fetch thất bại, dữ liệu cục bộ (nếu có) vẫn được giữ lại.
      } finally {
        setLoading(false); // Kết thúc loading sau khi cố gắng fetch
      }
    }
  }, [isAuthenticated, user, authLoading]);

  // Function to load from IndexedDB
  const loadProsecutorsFromIndexedDB = useCallback(async () => {
    try {
      const localData = await dbManager.loadData<Prosecutor>('prosecutors'); // Sử dụng dbManager.loadData
      if (localData && localData.length > 0) {
        setProsecutors(localData);
        console.log('Đã tải kiểm sát viên từ IndexedDB.');
      } else {
        console.log('Không có dữ liệu kiểm sát viên trong IndexedDB.');
      }
    } catch (err: any) {
      console.error('Lỗi khi tải kiểm sát viên từ IndexedDB:', err.message);
      setError(`Lỗi tải kiểm sát viên từ bộ nhớ cục bộ: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    // 1. Cố gắng tải từ IndexedDB trước để hiển thị ngay lập tức (cho trải nghiệm offline/tải nhanh)
    loadProsecutorsFromIndexedDB();

    // 2. Sau đó, fetch từ Supabase để lấy dữ liệu mới nhất và đồng bộ cache cục bộ
    // Đảm bảo authLoading đã hoàn tất trước khi fetch từ Supabase
    if (!authLoading) {
      fetchProsecutorsFromSupabase();
    }
  }, [loadProsecutorsFromIndexedDB, fetchProsecutorsFromSupabase, authLoading]);

  // CRUD operations
  const addProsecutor = async (newProsecutor: Omit<Prosecutor, 'id'>) => {
    if (!user) {
      setError('Bạn cần đăng nhập để thêm Kiểm sát viên.');
      return { success: false, error: 'Chưa đăng nhập' };
    }

    try {
      // 1. Thêm vào IndexedDB trước để cập nhật UI ngay lập tức
      const tempId = `temp-${Date.now()}`; // ID tạm thời
      const prosecutorWithTempId = { ...newProsecutor, id: tempId };
      await dbManager.add('prosecutors', prosecutorWithTempId); // Sử dụng dbManager.add
      setProsecutors(prev => [...prev, prosecutorWithTempId]);

      // 2. Sau đó, insert vào Supabase
      const { data, error: supabaseError } = await supabase
        .from('prosecutors')
        .insert({ ...newProsecutor, user_id: user.id }) // Gán user_id
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      // 3. Nếu Supabase insert thành công, cập nhật IndexedDB với ID thực
      if (data) {
        await dbManager.delete('prosecutors', tempId); // Sử dụng dbManager.delete
        await dbManager.add('prosecutors', data as Prosecutor); // Sử dụng dbManager.add
        setProsecutors(prev => prev.map(p => (p.id === tempId ? (data as Prosecutor) : p)));
      }
      setError(null);
      return { success: true, data: data as Prosecutor };
    } catch (err: any) {
      console.error('Lỗi khi thêm kiểm sát viên:', err.message);
      setError(`Lỗi thêm kiểm sát viên: ${err.message}`);
      // Hoàn tác thay đổi cục bộ nếu Supabase thất bại
      setProsecutors(prev => prev.filter(p => p.id !== (newProsecutor as any).id));
      return { success: false, error: err.message };
    }
  };

  const updateProsecutor = async (updatedProsecutor: Prosecutor) => {
    if (!user) {
      setError('Bạn cần đăng nhập để cập nhật Kiểm sát viên.');
      return { success: false, error: 'Chưa đăng nhập' };
    }

    try {
      // 1. Cập nhật IndexedDB trước
      await dbManager.put('prosecutors', updatedProsecutor); // Sử dụng dbManager.put
      setProsecutors(prev => prev.map(p => (p.id === updatedProsecutor.id ? updatedProsecutor : p)));

      // 2. Sau đó, cập nhật Supabase
      const { error: supabaseError } = await supabase
        .from('prosecutors')
        .update({ name: updatedProsecutor.name, title: updatedProsecutor.title, department: updatedProsecutor.department })
        .eq('id', updatedProsecutor.id)
        .eq('user_id', user.id); // Đảm bảo chỉ cập nhật bản ghi của user hiện tại

      if (supabaseError) {
        throw supabaseError;
      }
      setError(null);
      return { success: true };
    } catch (err: any) {
      console.error('Lỗi khi cập nhật kiểm sát viên:', err.message);
      setError(`Lỗi cập nhật kiểm sát viên: ${err.message}`);
      // Đồng bộ lại từ mạng nếu Supabase thất bại để khôi phục trạng thái
      fetchProsecutorsFromSupabase(); 
      return { success: false, error: err.message };
    }
  };

  const deleteProsecutor = async (id: string) => {
    if (!user) {
      setError('Bạn cần đăng nhập để xóa Kiểm sát viên.');
      return { success: false, error: 'Chưa đăng nhập' };
    }

    try {
      // 1. Xóa khỏi IndexedDB trước
      await dbManager.delete('prosecutors', id); // Sử dụng dbManager.delete
      setProsecutors(prev => prev.filter(p => p.id !== id));

      // 2. Sau đó, xóa khỏi Supabase
      const { error: supabaseError } = await supabase
        .from('prosecutors')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Đảm bảo chỉ xóa bản ghi của user hiện tại

      if (supabaseError) {
        throw supabaseError;
      }
      setError(null);
      return { success: true };
    } catch (err: any) {
      console.error('Lỗi khi xóa kiểm sát viên:', err.message);
      setError(`Lỗi xóa kiểm sát viên: ${err.message}`);
      // Đồng bộ lại từ mạng nếu Supabase thất bại để khôi phục trạng thái
      fetchProsecutorsFromSupabase(); 
      return { success: false, error: err.message };
    }
  };

  // Hàm này được expose để DataManagement có thể gọi khi cần ghi đè toàn bộ (ví dụ: import từ file)
  const overwriteAllProsecutors = async (newProsecutors: Prosecutor[]) => {
    await dbManager.saveData('prosecutors', newProsecutors); // Sử dụng dbManager.saveData
    setProsecutors(newProsecutors);
    // Sau khi ghi đè cục bộ, có thể cân nhắc đồng bộ lên Supabase nếu có mạng
    // Tuy nhiên, việc này phức tạp hơn (cần xử lý conflicts), nên tạm thời chỉ ghi đè cục bộ.
    // Nếu muốn đồng bộ lên Supabase, cần một logic phức tạp hơn (ví dụ: so sánh timestamp, upsert từng cái).
    // Đối với trường hợp import từ file, thường người dùng sẽ mong đợi dữ liệu đó là nguồn đáng tin cậy.
  };

  return {
    prosecutors,
    loading,
    error,
    addProsecutor,
    updateProsecutor,
    deleteProsecutor,
    overwriteAllProsecutors, // Expose hàm ghi đè tất cả
    fetchProsecutorsFromSupabase // Expose hàm fetch để có thể gọi thủ công khi cần đồng bộ lại
  };
};
