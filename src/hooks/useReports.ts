import { useState, useEffect } from 'react';
import { Report, ReportFormData } from '../types';
import { getCurrentDate } from '../utils/dateUtils';
import { dbManager } from '../utils/indexedDB';

export const useReports = (userKey: string, isDBInitialized: boolean) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load reports from IndexedDB on mount
  useEffect(() => {
    if (!isDBInitialized) return;

    const loadReports = async () => {
      try {
        const savedReports = await dbManager.loadData<Report>('reports');
        setReports(savedReports);
      } catch (error) {
        console.error('Failed to load reports:', error);
        // Fallback to localStorage (consider removing localStorage fallback if IndexedDB is primary)
        const fallbackReports = localStorage.getItem(`legalReports_${userKey}`);
        if (fallbackReports) {
          setReports(JSON.parse(fallbackReports));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [userKey, isDBInitialized]);

  // Save reports to IndexedDB whenever reports change
  useEffect(() => {
    // Chỉ lưu khi DB đã khởi tạo và không trong trạng thái loading ban đầu
    if (!isDBInitialized || isLoading) return; 

    const saveReports = async () => {
      try {
        await dbManager.saveData('reports', reports);
        // Also save to localStorage as backup (consider removing localStorage fallback if IndexedDB is primary)
        localStorage.setItem(`legalReports_${userKey}`, JSON.stringify(reports));
      } catch (error) {
        console.error('Failed to save reports:', error);
        // Fallback to localStorage
        localStorage.setItem(`legalReports_${userKey}`, JSON.stringify(reports));
      }
    };

    // Delay saving slightly to avoid too frequent writes if state changes rapidly
    const handler = setTimeout(() => {
      saveReports();
    }, 500); // Save after 500ms of inactivity

    return () => clearTimeout(handler); // Cleanup timeout on unmount or re-render
  }, [reports, userKey, isLoading, isDBInitialized]);

  const addReport = (reportData: ReportFormData) => {
    const newReport: Report = {
      id: Date.now().toString(), // Đảm bảo ID là duy nhất
      ...reportData,
      stage: 'Đang xử lý',
      createdAt: getCurrentDate()
    };
    setReports(prev => [...prev, newReport]);
  };

  const updateReport = (updatedReport: Report) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
  };

  const deleteReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const transferReportStage = (reportId: string, newStage: Report['stage']) => {
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        const updated = { ...r, stage: newStage };
        
        // Auto-update dates based on stage
        if (newStage === 'Khởi tố' && !r.prosecutionDate) {
          updated.prosecutionDate = getCurrentDate();
        } else if ((newStage === 'Không khởi tố' || newStage === 'Tạm đình chỉ' || newStage === 'Chuyển đi') && !r.resolutionDate) {
          updated.resolutionDate = getCurrentDate();
        }
        
        return updated;
      }
      return r;
    }));
  };

  const getReportsByStage = (stage: Report['stage']) => {
    return reports.filter(r => r.stage === stage);
  };

  const getExpiringSoonReports = () => {
    return reports.filter(r => {
      if (r.stage !== 'Đang xử lý') return false;
      
      const today = new Date();
      const deadlineDate = new Date(r.resolutionDeadline.split('/').reverse().join('-'));
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Cảnh báo nếu tin báo sắp hết hạn giải quyết (còn <= 15 ngày)
      return diffDays <= 15;
    });
  };

  /**
   * Ghi đè toàn bộ dữ liệu tin báo trong IndexedDB và state.
   * Được sử dụng khi khôi phục dữ liệu từ Supabase.
   * @param newReports Mảng các tin báo mới để ghi đè.
   */
  const overwriteAllReports = async (newReports: Report[]) => {
    if (!isDBInitialized) {
      console.warn('IndexedDB chưa được khởi tạo, không thể ghi đè dữ liệu tin báo.');
      return;
    }
    setIsLoading(true); // Đặt loading để tránh lưu tự động trong quá trình ghi đè
    try {
      await dbManager.clear('reports'); // Xóa tất cả dữ liệu cũ trong IndexedDB
      // Thêm từng tin báo mới vào IndexedDB
      for (const reportItem of newReports) {
        await dbManager.add('reports', reportItem); 
      }
      setReports(newReports); // Cập nhật state React
      localStorage.setItem(`legalReports_${userKey}`, JSON.stringify(newReports)); // Cập nhật localStorage
      console.log('Đã ghi đè tất cả tin báo từ backup thành công.');
    } catch (error) {
      console.error('Lỗi khi ghi đè tin báo từ backup:', error);
    } finally {
      setIsLoading(false); // Kết thúc loading
    }
  };

  return {
    reports,
    addReport,
    updateReport,
    deleteReport,
    transferReportStage,
    getReportsByStage,
    getExpiringSoonReports,
    isLoading,
    overwriteAllReports, // <--- ĐÃ THÊM: Trả về hàm ghi đè
  };
};
