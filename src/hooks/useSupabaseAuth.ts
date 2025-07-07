import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { authService } from '../utils/supabase';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    getInitialSession();
  }, []);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    const { data, error } = await authService.signIn(username, password);
    
    if (data.user) {
      setUser(data.user);
    }
    
    setLoading(false);
    return { success: !error, error };
  };

  const signUp = async (username: string, password: string) => {
    setLoading(true);
    const { data, error } = await authService.signUp(username, password);
    
    if (data.user) {
      setUser(data.user);
    }
    
    setLoading(false);
    return { success: !error, error };
  };

  const signOut = async () => {
    setLoading(true);
    await authService.signOut();
    setUser(null);
    setLoading(false);
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await authService.updatePassword(newPassword);
    return { success: !error, error };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updatePassword,
    isAuthenticated: !!user
  };
};