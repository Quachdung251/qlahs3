import { useState, useEffect } from 'react';
import { User, UserSession } from '../types';

const ADMIN_USER: User = {
  id: 'admin',
  username: 'xaxkilloxax',
  password: 'Bozzngu13@',
  role: 'admin',
  createdAt: '01/01/2024'
};

export const useAuth = () => {
  const [session, setSession] = useState<UserSession>({
    user: null as any,
    isLoggedIn: false
  });
  const [users, setUsers] = useState<User[]>([ADMIN_USER]);

  // Load session and users from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('userSession');
    const savedUsers = localStorage.getItem('systemUsers');
    
    if (savedSession) {
      const parsedSession = JSON.parse(savedSession);
      setSession(parsedSession);
    }
    
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      setUsers(parsedUsers);
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session.isLoggedIn) {
      localStorage.setItem('userSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('userSession');
    }
  }, [session]);

  // Save users to localStorage whenever users change
  useEffect(() => {
    localStorage.setItem('systemUsers', JSON.stringify(users));
  }, [users]);

  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setSession({
        user,
        isLoggedIn: true
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setSession({
      user: null as any,
      isLoggedIn: false
    });
    localStorage.removeItem('userSession');
  };

  const createUser = (username: string, password: string): boolean => {
    if (session.user?.role !== 'admin') return false;
    
    const existingUser = users.find(u => u.username === username);
    if (existingUser) return false;

    const newUser: User = {
      id: Date.now().toString(),
      username,
      password,
      role: 'user',
      createdAt: new Date().toLocaleDateString('vi-VN')
    };

    setUsers(prev => [...prev, newUser]);
    return true;
  };

  const deleteUser = (userId: string): boolean => {
    if (session.user?.role !== 'admin') return false;
    if (userId === 'admin') return false; // Cannot delete admin

    setUsers(prev => prev.filter(u => u.id !== userId));
    return true;
  };

  const changePassword = (userId: string, newPassword: string): boolean => {
    if (session.user?.role !== 'admin') return false;
    
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, password: newPassword } : u
    ));
    return true;
  };

  const getCurrentUserKey = (): string => {
    return session.user?.id || 'default';
  };

  return {
    session,
    users: users.filter(u => u.id !== 'admin'), // Don't show admin in user list
    login,
    logout,
    createUser,
    deleteUser,
    changePassword,
    getCurrentUserKey
  };
};