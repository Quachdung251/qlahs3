// src/api/prosecutors.ts

import { supabase } from '../utils/supabase';

// Interface cho Kiểm sát viên
export interface Prosecutor {
  id?: string; // id là tùy chọn vì khi thêm mới, id sẽ được Supabase tạo
  name: string;
  title: string;
  department?: string;
  user_id?: string; // Cần user_id để liên kết với người dùng tạo, nhưng Supabase RLS sẽ điền tự động
}

/**
 * Lấy danh sách Kiểm sát viên thuộc về người dùng hiện tại (dựa trên RLS).
 * @returns Mảng các Kiểm sát viên.
 */
export const fetchProsecutors = async (): Promise<Prosecutor[]> => {
  const { data, error } = await supabase
    .from('prosecutors') // Tên bảng của bạn
    .select('*') // Lấy tất cả các cột
    .order('name', { ascending: true }); // Sắp xếp theo tên

  if (error) {
    console.error('Error fetching prosecutors:', error);
    return [];
  }
  return data || [];
};

/**
 * Tìm kiếm Kiểm sát viên dựa trên từ khóa (tên, chức danh, phòng ban).
 * Lưu ý: Với RLS, hàm này chỉ tìm kiếm trong dữ liệu mà người dùng hiện tại có quyền truy cập.
 * @param query Từ khóa tìm kiếm.
 * @returns Mảng các Kiểm sát viên khớp với từ khóa.
 */
export const searchProsecutors = async (query: string): Promise<Prosecutor[]> => {
  if (!query.trim()) {
    return fetchProsecutors(); // Trả về tất cả nếu không có query
  }

  const searchTerm = `%${query.toLowerCase()}%`;

  const { data, error } = await supabase
    .from('prosecutors')
    .select('*')
    .or(`name.ilike.${searchTerm},title.ilike.${searchTerm},department.ilike.${searchTerm}`);

  if (error) {
    console.error('Error searching prosecutors:', error);
    return [];
  }
  return data || [];
};

/**
 * Thêm một Kiểm sát viên mới vào cơ sở dữ liệu.
 * user_id sẽ được tự động điền bởi RLS policy của Supabase.
 * @param newProsecutor Đối tượng Kiểm sát viên mới (không cần id và user_id).
 * @returns Kết quả thao tác (thành công/thất bại) và dữ liệu của Kiểm sát viên đã thêm.
 */
export const addProsecutor = async (newProsecutor: Omit<Prosecutor, 'id' | 'user_id'>): Promise<{ success: boolean; data?: Prosecutor; error?: any }> => {
  const { data, error } = await supabase
    .from('prosecutors')
    .insert([newProsecutor])
    .select(); // Thêm .select() để trả về dữ liệu của record đã insert

  if (error) {
    console.error('Error adding prosecutor:', error);
    return { success: false, error };
  }
  console.log('New prosecutor added:', data);
  return { success: true, data: data[0] };
};

/**
 * Cập nhật thông tin của một Kiểm sát viên hiện có.
 * @param id ID của Kiểm sát viên cần cập nhật.
 * @param updatedFields Các trường cần cập nhật.
 * @returns Kết quả thao tác (thành công/thất bại) và dữ liệu của Kiểm sát viên đã cập nhật.
 */
export const updateProsecutor = async (id: string, updatedFields: Partial<Omit<Prosecutor, 'id' | 'user_id'>>): Promise<{ success: boolean; data?: Prosecutor; error?: any }> => {
  const { data, error } = await supabase
    .from('prosecutors')
    .update(updatedFields)
    .eq('id', id)
    .select(); // Thêm .select() để trả về dữ liệu của record đã update

  if (error) {
    console.error('Error updating prosecutor:', error);
    return { success: false, error };
  }
  console.log('Prosecutor updated:', data);
  return { success: true, data: data[0] };
};

/**
 * Xóa một Kiểm sát viên khỏi cơ sở dữ liệu.
 * @param id ID của Kiểm sát viên cần xóa.
 * @returns Kết quả thao tác (thành công/thất bại).
 */
export const deleteProsecutor = async (id: string): Promise<{ success: boolean; error?: any }> => {
  const { error } = await supabase
    .from('prosecutors')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting prosecutor:', error);
    return { success: false, error };
  }
  console.log('Prosecutor deleted successfully.');
  return { success: true };
};