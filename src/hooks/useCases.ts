// ./hooks/useCases.ts
import { useState, useEffect } from 'react';
import { Case, CaseFormData } from '../types';
import { getCurrentDate } from '../utils/dateUtils';
import { dbManager } from '../utils/indexedDB';

// Hàm helper để tính số ngày còn lại (để tránh lặp lại code)
const getDaysRemaining = (dateString: string): number => {
  if (!dateString) return Infinity; // Trả về vô cùng nếu không có ngày
  const today = new Date();
  const [day, month, year] = dateString.split('/').map(Number);
  const targetDate = new Date(year, month - 1, day); // Month is 0-indexed
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const useCases = (userKey: string, isDBInitialized: boolean) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm sắp xếp vụ án
  const sortCases = (casesToSort: Case[]): Case[] => {
    return [...casesToSort].sort((a, b) => {
      // 1. Ưu tiên vụ án quan trọng (isImportant = true lên đầu)
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;

      // Chỉ sắp xếp theo thời hạn nếu vụ án đang ở giai đoạn "Điều tra"
      if (a.stage === 'Điều tra' && b.stage === 'Điều tra') {
        // 2. Ưu tiên hạn tạm giam ngắn nhất
        const aShortestDetentionDays = a.defendants
          .filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline)
          .map(d => getDaysRemaining(d.detentionDeadline!));
        const bShortestDetentionDays = b.defendants
          .filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline)
          .map(d => getDaysRemaining(d.detentionDeadline!));

        const aMinDetention = aShortestDetentionDays.length > 0 ? Math.min(...aShortestDetentionDays) : Infinity;
        const bMinDetention = bShortestDetentionDays.length > 0 ? Math.min(...bShortestDetentionDays) : Infinity;

        if (aMinDetention !== bMinDetention) {
          return aMinDetention - bMinDetention;
        }

        // 3. Sau đó đến hạn điều tra ngắn nhất
        const aInvestigationDays = getDaysRemaining(a.investigationDeadline);
        const bInvestigationDays = getDaysRemaining(b.investigationDeadline);
        return aInvestigationDays - bInvestigationDays;
      }

      // Nếu không ở giai đoạn điều tra, hoặc các tiêu chí trên bằng nhau, giữ nguyên thứ tự tương đối
      // hoặc có thể thêm các tiêu chí sắp xếp khác nếu cần (ví dụ: theo createdAt)
      return 0; // Giữ nguyên thứ tự nếu không có tiêu chí sắp xếp cụ thể
    });
  };

  // Load cases from IndexedDB on mount
  useEffect(() => {
    if (!isDBInitialized) return;

    const loadCases = async () => {
      try {
        const savedCases = await dbManager.loadData<Case>('cases');
        // Sắp xếp các vụ án ngay sau khi tải
        setCases(sortCases(savedCases));
      } catch (error) {
        console.error('Failed to load cases:', error);
        // Fallback to localStorage (consider removing localStorage fallback if IndexedDB is primary)
        const fallbackCases = localStorage.getItem(`legalCases_${userKey}`);
        if (fallbackCases) {
          setCases(sortCases(JSON.parse(fallbackCases))); // Sắp xếp cả dữ liệu từ localStorage
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCases();
  }, [userKey, isDBInitialized]);

  // Save cases to IndexedDB whenever cases change
  useEffect(() => {
    // Chỉ lưu khi DB đã khởi tạo và không trong trạng thái loading ban đầu
    if (!isDBInitialized || isLoading) return;

    const saveCases = async () => {
      try {
        await dbManager.saveData('cases', cases);
        // Also save to localStorage as backup (consider removing localStorage fallback if IndexedDB is primary)
        localStorage.setItem(`legalCases_${userKey}`, JSON.stringify(cases));
      } catch (error) {
        console.error('Failed to save cases:', error);
        // Fallback to localStorage
        localStorage.setItem(`legalCases_${userKey}`, JSON.stringify(cases));
      }
    };

    // Delay saving slightly to avoid too frequent writes if state changes rapidly
    const handler = setTimeout(() => {
      saveCases();
    }, 500); // Save after 500ms of inactivity

    return () => clearTimeout(handler); // Cleanup timeout on unmount or re-render
  }, [cases, userKey, isLoading, isDBInitialized]);

  const addCase = (caseData: CaseFormData) => {
    const newCase: Case = {
      id: Date.now().toString(), // Đảm bảo ID là duy nhất
      ...caseData,
      stage: 'Điều tra',
      defendants: caseData.defendants.map(defendant => ({
        ...defendant,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // ID duy nhất cho bị can
      })),
      createdAt: getCurrentDate(),
      isImportant: false // THÊM DÒNG NÀY: Mặc định là không quan trọng
    };
    setCases(prev => sortCases([...prev, newCase])); // Sắp xếp lại sau khi thêm
  };

  const updateCase = (updatedCase: Case) => {
    setCases(prev => sortCases(prev.map(c => c.id === updatedCase.id ? updatedCase : c))); // Sắp xếp lại sau khi cập nhật
  };

  const deleteCase = (caseId: string) => {
    setCases(prev => sortCases(prev.filter(c => c.id !== caseId))); // Sắp xếp lại sau khi xóa
  };

  const transferStage = (caseId: string, newStage: Case['stage']) => {
    setCases(prev => sortCases(prev.map(c => { // Sắp xếp lại sau khi chuyển giai đoạn
      if (c.id === caseId) {
        const updated = { ...c, stage: newStage };

        // Auto-update transfer dates
        if (newStage === 'Truy tố' && !c.prosecutionTransferDate) {
          updated.prosecutionTransferDate = getCurrentDate();
        } else if (newStage === 'Xét xử' && !c.trialTransferDate) {
          updated.trialTransferDate = getCurrentDate();
        }

        return updated;
      }
      return c;
    })));
  };

  // THÊM DÒNG NÀY: Hàm để bật/tắt trạng thái quan trọng
  const toggleImportant = (caseId: string) => {
    setCases(prev => sortCases(prev.map(c =>
      c.id === caseId ? { ...c, isImportant: !c.isImportant } : c
    )));
  };


  const getCasesByStage = (stage: Case['stage']) => {
    // Luôn trả về dữ liệu đã được sắp xếp
    return cases.filter(c => c.stage === stage);
  };

  const getExpiringSoonCases = () => {
    return cases.filter(c => {
      if (c.stage !== 'Điều tra') {
        return false;
      }

      const today = new Date();
      const [day, month, year] = c.investigationDeadline.split('/').map(Number);
      const deadline = new Date(year, month - 1, day);
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 15) return true;

      const detainedDefendants = c.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline);
      return detainedDefendants.some(d => {
        const [dDay, dMonth, dYear] = d.detentionDeadline!.split('/').map(Number);
        const detentionDeadline = new Date(dYear, dMonth - 1, dDay);
        const detentionDiffTime = detentionDeadline.getTime() - today.getTime();
        const detentionDiffDays = Math.ceil(detentionDiffTime / (1000 * 60 * 60 * 24));
        return detentionDiffDays <= 15;
      });
    });
  };

  /**
   * Ghi đè toàn bộ dữ liệu vụ án trong IndexedDB và state.
   * Được sử dụng khi khôi phục dữ liệu từ Supabase.
   * @param newCases Mảng các vụ án mới để ghi đè.
   */
  const overwriteAllCases = async (newCases: Case[]) => {
    if (!isDBInitialized) {
      console.warn('IndexedDB chưa được khởi tạo, không thể ghi đè dữ liệu vụ án.');
      return;
    }
    setIsLoading(true); // Đặt loading để tránh lưu tự động trong quá trình ghi đè
    try {
      await dbManager.saveData('cases', newCases); // Ghi đè tất cả dữ liệu vụ án
      setCases(sortCases(newCases)); // Cập nhật state React và sắp xếp
      localStorage.setItem(`legalCases_${userKey}`, JSON.stringify(newCases)); // Cập nhật localStorage
      console.log('Đã ghi đè tất cả vụ án từ backup thành công.');
    } catch (error) {
      console.error('Lỗi khi ghi đè vụ án từ backup:', error);
    } finally {
      setIsLoading(false); // Kết thúc loading
    }
  };

  return {
    cases,
    addCase,
    updateCase,
    deleteCase,
    transferStage,
    toggleImportant, // THÊM DÒNG NÀY: Trả về hàm toggleImportant
    getCasesByStage,
    getExpiringSoonCases,
    isLoading,
    overwriteAllCases,
  };
};
