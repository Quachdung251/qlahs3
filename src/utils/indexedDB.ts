// IndexedDB utilities for local data storage

export const PROSECUTOR_STORE_NAME = 'prosecutors';

export interface DatabaseSchema {
  cases: any[];
  reports: any[];
  criminalCode: any[];
  prosecutors: any[];
}

class IndexedDBManager {
  private dbName = 'LegalCaseManagement';
  private version = 1; // Current version of the database schema
  private db: IDBDatabase | null = null;
  private _isInitialized: boolean = false; // Internal flag to track initialization

  /**
   * Initializes the IndexedDB database.
   * This method should be called once when the application starts.
   */
  async init(): Promise<void> {
    if (this._isInitialized && this.db) {
      console.log('IndexedDB already initialized.');
      return; // Already initialized
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB init error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this._isInitialized = true;
        console.log('IndexedDB initialized successfully.');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log(`IndexedDB upgrade from version ${event.oldVersion} to ${event.newVersion}`);

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('cases')) {
          db.createObjectStore('cases', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id' });
        }
        // criminalCode uses 'article' as keyPath
        if (!db.objectStoreNames.contains('criminalCode')) {
          db.createObjectStore('criminalCode', { keyPath: 'article' });
        }
        if (!db.objectStoreNames.contains('prosecutors')) {
          db.createObjectStore('prosecutors', { keyPath: 'id' });
        }
        // userData uses 'key' as keyPath
        if (!db.objectStoreNames.contains('userData')) {
          db.createObjectStore('userData', { keyPath: 'key' });
        }
        
        // Example of handling version upgrades:
        // if (event.oldVersion < 2) {
        //   // Add new store or modify existing one for version 2
        //   if (!db.objectStoreNames.contains('newStoreName')) {
        //     db.createObjectStore('newStoreName', { keyPath: 'id' });
        //   }
        // }
      };
      
      request.onblocked = () => {
        console.warn('IndexedDB upgrade is blocked. Please close other tabs with this application.');
      };
    });
  }

  /**
   * Checks if the IndexedDB is initialized.
   * @returns boolean True if initialized, false otherwise.
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Saves an array of data to a specific object store.
   * This method clears the store before adding new data.
   * @param storeName The name of the object store.
   * @param data An array of data objects to save.
   */
  async saveData<T>(storeName: string, data: T[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call init() first.');

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
    await new Promise<void>((resolve, reject) => { // Ensure transaction completes
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Loads all data from a specific object store.
   * @param storeName The name of the object store.
   * @returns A Promise that resolves to an array of data objects.
   */
  async loadData<T>(storeName: string): Promise<T[]> {
    if (!this.db) {
      // Attempt to initialize if not already, but don't block
      if (!this._isInitialized) {
        try {
          await this.init();
        } catch (e) {
          console.warn('Could not initialize DB before loading data. Returning empty array.', e);
          return [];
        }
      } else {
        throw new Error('Database not initialized after attempted init.');
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Adds a single item to a specific object store.
   * @param storeName The name of the object store.
   * @param data The data object to add.
   */
  async add<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call init() first.');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Puts (adds or updates) a single item in a specific object store.
   * @param storeName The name of the object store.
   * @param data The data object to put.
   */
  async put<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call init() first.');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletes an item from a specific object store by its key.
   * @param storeName The name of the object store.
   * @param key The key of the item to delete.
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call init() first.');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clears all data from a specific object store.
   * @param storeName The name of the object store.
   */
  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call init() first.');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Saves user-specific data (e.g., settings) to the 'userData' store.
   * @param key The key for the user data.
   * @param data The data to save.
   */
  async saveUserData(key: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized. Call init() first.');

    const transaction = this.db.transaction(['userData'], 'readwrite');
    const store = transaction.objectStore('userData');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, data }); // 'put' will add or update
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Loads user-specific data from the 'userData' store.
   * @param key The key of the user data to load.
   * @returns A Promise that resolves to the user data.
   */
  async loadUserData(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized. Call init() first.');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readonly');
      const store = transaction.objectStore('userData');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.data);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Exports all data from specified stores into a single object.
   * @returns A Promise that resolves to an object containing all exported data.
   */
  async exportAllData(): Promise<DatabaseSchema> {
    const [cases, reports, criminalCode, prosecutors] = await Promise.all([
      this.loadData('cases'),
      this.loadData('reports'),
      this.loadData('criminalCode'),
      this.loadData('prosecutors')
    ]);

    return { cases, reports, criminalCode, prosecutors };
  }

  /**
   * Imports data into specified stores, overwriting existing data.
   * @param data An object containing data for various stores.
   */
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
