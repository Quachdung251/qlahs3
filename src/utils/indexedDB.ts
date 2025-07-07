// IndexedDB utilities for local data storage
export interface DatabaseSchema {
  cases: any[];
  reports: any[];
  criminalCode: any[];
  prosecutors: any[];
}

class IndexedDBManager {
  private dbName = 'LegalCaseManagement';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('cases')) {
          db.createObjectStore('cases', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('criminalCode')) {
          db.createObjectStore('criminalCode', { keyPath: 'article' });
        }
        if (!db.objectStoreNames.contains('prosecutors')) {
          db.createObjectStore('prosecutors', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('userData')) {
          db.createObjectStore('userData', { keyPath: 'key' });
        }
      };
    });
  }

  async saveData<T>(storeName: string, data: T[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Clear existing data
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Add new data
    for (const item of data) {
      await new Promise<void>((resolve, reject) => {
        const addRequest = store.add(item);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      });
    }
  }

  async loadData<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveUserData(key: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['userData'], 'readwrite');
    const store = transaction.objectStore('userData');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, data });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadUserData(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readonly');
      const store = transaction.objectStore('userData');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.data);
      request.onerror = () => reject(request.error);
    });
  }

  async exportAllData(): Promise<DatabaseSchema> {
    const [cases, reports, criminalCode, prosecutors] = await Promise.all([
      this.loadData('cases'),
      this.loadData('reports'),
      this.loadData('criminalCode'),
      this.loadData('prosecutors')
    ]);

    return { cases, reports, criminalCode, prosecutors };
  }

  async importAllData(data: DatabaseSchema): Promise<void> {
    await Promise.all([
      this.saveData('cases', data.cases || []),
      this.saveData('reports', data.reports || []),
      this.saveData('criminalCode', data.criminalCode || []),
      this.saveData('prosecutors', data.prosecutors || [])
    ]);
  }
}

export const dbManager = new IndexedDBManager();