// ./hooks/useCases.ts
import { useState, useEffect, useCallback } from 'react';
import { Case, CaseFormData } from '../types';
import { getCurrentDate } from '../utils/dateUtils';
import { dbManager } from '../utils/indexedDB';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique IDs

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
    if (!isDBInitialized) {
      console.log('IndexedDB not initialized yet, skipping case load.');
      return;
    }

    const loadCases = async () => {
      setIsLoading(true);
      console.log('Attempting to load cases from IndexedDB...');
      try {
        const savedCases = await dbManager.loadData<Case>('cases');
        console.log('Cases loaded from IndexedDB:', savedCases);
        // Sắp xếp các vụ án ngay sau khi tải
        setCases(sortCases(savedCases));
      } catch (error) {
        console.error('Failed to load cases from IndexedDB:', error);
        // Fallback to localStorage (consider removing localStorage fallback if IndexedDB is primary)
        const fallbackCases = localStorage.getItem(`legalCases_${userKey}`);
        if (fallbackCases) {
          console.warn('Falling back to localStorage for cases.');
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
    if (!isDBInitialized || isLoading) {
      console.log('Skipping case save: DB not initialized or still loading.');
      return;
    }

    const saveCases = async () => {
      console.log('Attempting to save cases to IndexedDB:', cases.length, 'cases.');
      try {
        await dbManager.saveData('cases', cases);
        console.log('Cases saved to IndexedDB successfully.');
        // Also save to localStorage as backup (consider removing localStorage fallback if IndexedDB is primary)
        localStorage.setItem(`legalCases_${userKey}`, JSON.stringify(cases));
      } catch (error) {
        console.error('Failed to save cases to IndexedDB:', error);
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

  const addCase = useCallback(async (caseData: CaseFormData): Promise<Case> => {
    if (!isDBInitialized) {
      console.error("IndexedDB not initialized when trying to add case.");
      throw new Error("Database not initialized.");
    }
    const newCase: Case = {
      id: uuidv4(), // Sử dụng uuidv4 để đảm bảo ID là duy nhất
      ...caseData,
      stage: 'Điều tra',
      defendants: caseData.defendants.map(defendant => ({
        ...defendant,
        id: uuidv4() // ID duy nhất cho bị can
      })),
      createdAt: getCurrentDate(),
      isImportant: false // Mặc định là không quan trọng
    };

    console.log("Attempting to add new case to dbManager:", newCase);
    try {
      await dbManager.addData('cases', newCase); // Sử dụng addData để thêm mới
      console.log("Case successfully added via dbManager.addData.");
      setCases(prev => sortCases([...prev, newCase])); // Sắp xếp lại sau khi thêm
      return newCase; // TRẢ VỀ ĐỐI TƯỢNG VỤ ÁN ĐÃ THÊM
    } catch (error: any) {
      console.error("Error adding case to IndexedDB via dbManager.addData:", error);
      throw new Error(`Failed to add case: ${error.message || 'Unknown error'}`);
    }
  }, [isDBInitialized]); // Thêm isDBInitialized vào dependencies

  const updateCase = useCallback(async (updatedCase: Case): Promise<Case> => {
    if (!isDBInitialized) {
      console.error("IndexedDB not initialized when trying to update case.");
      throw new Error("Database not initialized.");
    }
    console.log("Attempting to update case via dbManager:", updatedCase);
    try {
      await dbManager.updateData('cases', updatedCase.id, updatedCase); // Sử dụng updateData để cập nhật
      console.log("Case successfully updated via dbManager.updateData.");
      setCases(prev => sortCases(prev.map(c => c.id === updatedCase.id ? updatedCase : c))); // Sắp xếp lại sau khi cập nhật
      return updatedCase; // TRẢ VỀ ĐỐI TƯỢNG VỤ ÁN ĐÃ CẬP NHẬT
    } catch (error: any) {
      console.error("Error updating case in IndexedDB via dbManager.updateData:", error);
      throw new Error(`Failed to update case: ${error.message || 'Unknown error'}`);
    }
  }, [isDBInitialized]); // Thêm isDBInitialized vào dependencies

  const deleteCase = useCallback(async (caseId: string) => {
    if (!isDBInitialized) {
      throw new Error("Database not initialized.");
    }
    console.log("Attempting to delete case via dbManager:", caseId);
    try {
      await dbManager.deleteData('cases', caseId); // Sử dụng deleteData
      console.log("Case successfully deleted via dbManager.deleteData.");
      setCases(prev => sortCases(prev.filter(c => c.id !== caseId))); // Sắp xếp lại sau khi xóa
    } catch (error: any) {
      console.error("Error deleting case from IndexedDB via dbManager.deleteData:", error);
      throw new Error(`Failed to delete case: ${error.message || 'Unknown error'}`);
    }
  }, [isDBInitialized]);

  const transferStage = useCallback(async (caseId: string, newStage: Case['stage']) => {
    if (!isDBInitialized) {
      throw new Error("Database not initialized.");
    }
    console.log(`Attempting to transfer stage for case ${caseId} to ${newStage}.`);
    try {
      const caseToUpdate = cases.find(c => c.id === caseId);
      if (!caseToUpdate) {
        throw new Error("Case not found for stage transfer.");
      }
      const updated = { ...caseToUpdate, stage: newStage };

      // Auto-update transfer dates
      if (newStage === 'Truy tố' && !caseToUpdate.prosecutionTransferDate) {
        updated.prosecutionTransferDate = getCurrentDate();
      } else if (newStage === 'Xét xử' && !caseToUpdate.trialTransferDate) {
        updated.trialTransferDate = getCurrentDate();
      }

      await dbManager.updateData('cases', updated.id, updated);
      console.log("Case stage successfully transferred via dbManager.updateData.");
      setCases(prev => sortCases(prev.map(c => c.id === updated.id ? updated : c)));
    } catch (error: any) {
      console.error("Error transferring case stage in IndexedDB via dbManager.updateData:", error);
      throw new Error(`Failed to transfer stage: ${error.message || 'Unknown error'}`);
    }
  }, [cases, isDBInitialized]);

  const toggleImportant = useCallback(async (caseId: string) => {
    if (!isDBInitialized) {
      throw new Error("Database not initialized.");
    }
    console.log(`Attempting to toggle importance for case ${caseId}.`);
    try {
      const caseToUpdate = cases.find(c => c.id === caseId);
      if (!caseToUpdate) {
        throw new Error("Case not found for toggling importance.");
      }
      const updated = { ...caseToUpdate, isImportant: !caseToUpdate.isImportant };
      await dbManager.updateData('cases', updated.id, updated);
      console.log("Case importance successfully toggled via dbManager.updateData.");
      setCases(prev => sortCases(prev.map(c => c.id === updated.id ? updated : c)));
    } catch (error: any) {
      console.error("Error toggling important status in IndexedDB via dbManager.updateData:", error);
      throw new Error(`Failed to toggle importance: ${error.message || 'Unknown error'}`);
    }
  }, [cases, isDBInitialized]);

  const getCasesByStage = useCallback((stage: Case['stage']) => {
    return cases.filter(c => c.stage === stage);
  }, [cases]);

  const getExpiringSoonCases = useCallback(() => {
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
  }, [cases]);

  const overwriteAllCases = useCallback(async (newCases: Case[]) => {
    if (!isDBInitialized) {
      console.warn('IndexedDB chưa được khởi tạo, không thể ghi đè dữ liệu vụ án.');
      return;
    }
    setIsLoading(true);
    console.log('Attempting to overwrite all cases via dbManager.saveData.');
    try {
      await dbManager.saveData('cases', newCases);
      console.log('All cases successfully overwritten via dbManager.saveData.');
      setCases(sortCases(newCases));
      localStorage.setItem(`legalCases_${userKey}`, JSON.stringify(newCases));
      console.log('Đã ghi đè tất cả vụ án từ backup thành công.');
    } catch (error: any) {
      console.error('Lỗi khi ghi đè vụ án từ backup via dbManager.saveData:', error);
      throw new Error(`Failed to overwrite cases: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [isDBInitialized, userKey]);

  return {
    cases,
    addCase,
    updateCase,
    deleteCase,
    transferStage,
    toggleImportant,
    getCasesByStage,
    getExpiringSoonCases,
    isLoading,
    overwriteAllCases,
  };
};
