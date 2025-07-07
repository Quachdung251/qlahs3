// src/hooks/useProsecutors.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchProsecutors, Prosecutor } from '../api/prosecutors'; // Import hàm fetch và interface
import { useSupabaseAuth } from './useSupabaseAuth'; // Import hook xác thực của bạn

/**
 * Hook tùy chỉnh để tải và quản lý danh sách Kiểm sát viên từ Supabase.
 * @returns Một đối tượng chứa danh sách kiểm sát viên, trạng thái tải, lỗi và hàm setProsecutors để cập nhật.
 */
export const useProsecutors = () => {
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth(); // Lấy user, trạng thái xác thực và trạng thái loading của auth
  const [prosecutors, setProsecutors] = useState<Prosecutor[]>([]);
  const [loading, setLoading] = useState(true); // Trạng thái loading riêng cho prosecutors
  const [error, setError] = useState<string | null>(null);

  // Sử dụng useCallback để memoize hàm fetch data, tránh tạo lại không cần thiết
  const loadProsecutors = useCallback(async () => {
    // Chỉ tải dữ liệu nếu auth đã hoàn tất và người dùng đã đăng nhập
    if (!authLoading) {
      setLoading(true);
      setError(null);
      if (isAuthenticated && user) {
        try {
          const data = await fetchProsecutors();
          setProsecutors(data);
        } catch (err: any) {
          console.error('Failed to load prosecutors:', err);
          setError('Không thể tải danh sách Kiểm sát viên: ' + err.message);
          setProsecutors([]); // Xóa dữ liệu cũ nếu có lỗi
        }
      } else {
        // Nếu không đăng nhập hoặc user null, danh sách KSV phải rỗng
        setProsecutors([]);
        console.log("Người dùng chưa xác thực hoặc không có, xóa dữ liệu Kiểm sát viên.");
      }
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]); // Phụ thuộc vào isAuthenticated, user, authLoading

  useEffect(() => {
    loadProsecutors(); // Gọi hàm tải dữ liệu khi hook được mount hoặc các dependencies thay đổi

    // Optional: Supabase Realtime subscription
    // Nếu bạn muốn danh sách KSV tự động cập nhật khi có thay đổi trên Supabase
    // mà không cần refresh trang, bạn có thể thêm đoạn code này:

    // const channel = supabase
    //   .channel('prosecutors_changes')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'prosecutors' }, (payload) => {
    //     console.log('Change received!', payload);
    //     // Re-fetch data or update state based on payload
    //     loadProsecutors(); // Cách đơn giản là fetch lại toàn bộ
    //   })
    //   .subscribe();

    // return () => {
    //   // Hủy đăng ký khi component unmount
    //   channel.unsubscribe();
    // };

  }, [loadProsecutors]); // Dependencies cho useEffect

  // Trả về danh sách kiểm sát viên, trạng thái tải, lỗi và hàm để cập nhật thủ công
  return { prosecutors, loading, error, setProsecutors };
};