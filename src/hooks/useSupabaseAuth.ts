// src/hooks/useSupabaseAuth.ts
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { authService, supabase } from '../utils/supabase'; // <--- ĐÃ THAY ĐỔI: Import supabase client trực tiếp

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // isAuthenticated có thể được tính toán từ user, nhưng giữ lại để rõ ràng
  const [isAuthenticated, setIsAuthenticated] = useState(false); 

  useEffect(() => {
    // Lắng nghe sự thay đổi trạng thái xác thực từ supabase client
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsAuthenticated(!!session?.user);
      setLoading(false);
    });

    // Kiểm tra trạng thái ban đầu khi component mount
    authService.getCurrentUser().then(currentUser => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setLoading(false);
    });

    // Cleanup listener
    return () => {
      authListener.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => { // Đã đổi lại tham số là email, password theo authService
    setLoading(true);
    const { data, error } = await authService.signIn(email, password); // Sử dụng authService
    
    if (data.user) {
      setUser(data.user);
      setIsAuthenticated(true); // Cập nhật trạng thái xác thực
    } else {
      setIsAuthenticated(false);
    }
    
    setLoading(false);
    return { success: !error, error };
  };

  const signUp = async (email: string, password: string, username: string) => { // Đã đổi lại tham số là email, password, username
    setLoading(true);
    // authService.signUp của bạn chỉ nhận username, password. Nếu muốn thêm username vào user_metadata, cần sửa authService.signUp
    const { data, error } = await authService.signUp(email, password); // Sử dụng authService
    
    if (data.user) {
      setUser(data.user);
      setIsAuthenticated(true); // Cập nhật trạng thái xác thực
    } else {
      setIsAuthenticated(false);
    }
    
    setLoading(false);
    return { success: !error, error };
  };

  const signOut = async () => {
    setLoading(true);
    await authService.signOut(); // Sử dụng authService
    setUser(null);
    setIsAuthenticated(false); // Cập nhật trạng thái xác thực
    setLoading(false);
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await authService.updatePassword(newPassword); // Sử dụng authService
    return { success: !error, error };
  };

  return {
    user,
    loading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    updatePassword,
    supabase, // <--- ĐÃ THÊM DÒNG NÀY: Trả về đối tượng supabase client
  };
};
