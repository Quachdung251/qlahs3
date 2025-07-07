import { useState, useEffect } from 'react';
import { dbManager } from '../utils/indexedDB';

export const useIndexedDB = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        await dbManager.init();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };

    initDB();
  }, []);

  const exportData = async () => {
    try {
      const data = await dbManager.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `legal-system-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    }
  };

  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await dbManager.importAllData(data);
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  };

  return {
    isInitialized,
    exportData,
    importData
  };
};