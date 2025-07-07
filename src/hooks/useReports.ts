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
        // Fallback to localStorage
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
    if (!isDBInitialized || isLoading || reports.length < 0) return;

    const saveReports = async () => {
      try {
        await dbManager.saveData('reports', reports);
        // Also save to localStorage as backup
        localStorage.setItem(`legalReports_${userKey}`, JSON.stringify(reports));
      } catch (error) {
        console.error('Failed to save reports:', error);
        // Fallback to localStorage
        localStorage.setItem(`legalReports_${userKey}`, JSON.stringify(reports));
      }
    };

    saveReports();
  }, [reports, userKey, isLoading, isDBInitialized]);

  const addReport = (reportData: ReportFormData) => {
    const newReport: Report = {
      id: Date.now().toString(),
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

  return {
    reports,
    addReport,
    updateReport,
    deleteReport,
    transferReportStage,
    getReportsByStage,
    getExpiringSoonReports,
    isLoading
  };
};