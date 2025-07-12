// src/utils/indexedDB.ts
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { Case, Report, CriminalCodeItem, Prosecutor } from '../types'; // Đảm bảo import đúng các kiểu dữ liệu của bạn

// Định nghĩa schema cho IndexedDB
interface MyDB extends DBSchema {
  cases: {
    key: string;
    value: Case;
  };
  reports: {
    key: string;
    value: Report;
  };
  criminalCode: {
    key: string; // KeyPath là 'article'
    value: CriminalCodeItem;
  };
  prosecutors: {
    key: string;
    value: Prosecutor;
  };
  userData: {
    key: string;
    value: any; // Giá trị có thể là bất kỳ kiểu dữ liệu nào
  };
}

const DB_NAME = 'LegalCaseManagement'; // Giữ nguyên tên DB của bạn
const DB_VERSION = 2; // Tăng version nếu bạn thay đổi schema (thêm/sửa object store)

class IndexedDBManager {
  private db: IDBPDatabase<MyDB> | null = null;
  private _isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Khởi tạo DB ngay khi tạo instance
    this.initializeDB();
  }

  // Khởi tạo cơ sở dữ liệu
  private async initializeDB(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('IndexedDBManager: Attempting to open database...');
        this.db = await openDB<MyDB>(DB_NAME, DB_VERSION, {
          upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`IndexedDBManager: Upgrading DB from version ${oldVersion} to ${newVersion}`);

            // Tạo/cập nhật object store 'cases'
            if (!db.objectStoreNames.contains('cases')) {
              db.createObjectStore('cases', { keyPath: 'id' });
              console.log('IndexedDBManager: Created object store "cases"');
            }

            // Tạo/cập nhật object store 'reports'
            if (!db.objectStoreNames.contains('reports')) {
              db.createObjectStore('reports', { keyPath: 'id' });
              console.log('IndexedDBManager: Created object store "reports"');
            }

            // Tạo/cập nhật object store 'criminalCode'
            if (!db.objectStoreNames.contains('criminalCode')) {
              // Sử dụng 'article' làm keyPath như trong schema của bạn
              db.createObjectStore('criminalCode', { keyPath: 'article' });
              console.log('IndexedDBManager: Created object store "criminalCode" with keyPath "article"');
            } else if (oldVersion < 2 && db.objectStoreNames.contains('criminalCode')) {
              // Ví dụ: Nếu criminalCode có keyPath khác ở version cũ và cần thay đổi
              // Đây là một ví dụ phức tạp hơn, thường cần xóa và tạo lại store
              // Nếu bạn thay đổi keyPath, bạn cần xử lý di chuyển dữ liệu hoặc xóa store cũ
              // Đối với trường hợp này, tôi sẽ giữ keyPath là 'article' như bạn đã định nghĩa
              console.log('IndexedDBManager: "criminalCode" store already exists. No keyPath change needed for upgrade to V2.');
            }

            // Tạo/cập nhật object store 'prosecutors'
            if (!db.objectStoreNames.contains('prosecutors')) {
              db.createObjectStore('prosecutors', { keyPath: 'id' });
              console.log('IndexedDBManager: Created object store "prosecutors"');
            }

            // Tạo/cập nhật object store 'userData'
            if (!db.objectStoreNames.contains('userData')) {
              db.createObjectStore('userData', { keyPath: 'key' });
              console.log('IndexedDBManager: Created object store "userData"');
            }
          },
          blocked() {
            console.warn('IndexedDBManager: Database upgrade is blocked. Close other tabs using this database.');
            reject(new Error('Database upgrade blocked.'));
          },
          blocking() {
            console.warn('IndexedDBManager: Another tab is blocking database upgrade.');
          }
        });
        this.isInitialized = true;
        console.log('IndexedDBManager: Database opened and initialized successfully.');
        resolve();
      } catch (error) {
        console.error('IndexedDBManager: Failed to open or initialize database:', error);
        this.isInitialized = false;
        this.db = null;
        reject(error);
      } finally {
        this.initializationPromise = null; // Reset promise after completion
      }
    });
    return this.initializationPromise;
  }

  // Phương thức để kiểm tra xem DB đã sẵn sàng chưa (public)
  public async ensureDbReady(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }
    await this.initializeDB();
  }

  // Thêm dữ liệu mới vào một object store
  public async add<T>(storeName: keyof MyDB, data: T): Promise<T> {
    await this.ensureDbReady();
    if (!this.db) throw new Error('Database not ready.');

    console.log(`dbManager: Attempting to add data to ${String(storeName)}:`, data);
    try {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.add(data);
      await tx.done; // Đảm bảo transaction hoàn tất
      console.log(`dbManager: Data successfully added to ${String(storeName)}.`);
      return data;
    } catch (error: any) {
      console.error(`dbManager: Error adding data to ${String(storeName)}:`, error);
      throw new Error(`IndexedDB Error (add): ${error.message || 'Unknown error'}`);
    }
  }

  // Cập nhật dữ liệu trong một object store (hoặc thêm nếu chưa tồn tại)
  public async put<T>(storeName: keyof MyDB, data: T): Promise<T> {
    await this.ensureDbReady();
    if (!this.db) throw new Error('Database not ready.');

    console.log(`dbManager: Attempting to put data in ${String(storeName)}:`, data);
    try {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.put(data); // `put` sẽ thêm nếu không tồn tại, hoặc cập nhật nếu tồn tại
      await tx.done;
      console.log(`dbManager: Data successfully put in ${String(storeName)}.`);
      return data;
    } catch (error: any) {
      console.error(`dbManager: Error putting data in ${String(storeName)}:`, error);
      throw new Error(`IndexedDB Error (put): ${error.message || 'Unknown error'}`);
    }
  }

  // Xóa dữ liệu khỏi một object store bằng key
  public async delete(storeName: keyof MyDB, id: string): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) throw new Error('Database not ready.');

    console.log(`dbManager: Attempting to delete data from ${String(storeName)} with ID ${id}.`);
    try {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.delete(id);
      await tx.done;
      console.log(`dbManager: Data successfully deleted from ${String(storeName)}.`);
    } catch (error: any) {
      console.error(`dbManager: Error deleting data from ${String(storeName)}:`, error);
      throw new Error(`IndexedDB Error (delete): ${error.message || 'Unknown error'}`);
    }
  }

  // Tải tất cả dữ liệu từ một object store
  public async loadData<T>(storeName: keyof MyDB): Promise<T[]> {
    await this.ensureDbReady();
    if (!this.db) throw new Error('Database not ready.');

    console.log(`dbManager: Attempting to load all data from ${String(storeName)}.`);
    try {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const data = await store.getAll();
      await tx.done;
      console.log(`dbManager: Successfully loaded ${data.length} items from ${String(storeName)}.`);
      return data as T[];
    } catch (error: any) {
      console.error(`dbManager: Error loading data from ${String(storeName)}:`, error);
      throw new Error(`IndexedDB Error (load): ${error.message || 'Unknown error'}`);
    }
  }

  // Ghi đè toàn bộ dữ liệu trong một object store (ví dụ: khi khôi phục backup)
  public async saveData<T>(storeName: keyof MyDB, data: T[]): Promise<void> {
    await this.ensureDbReady();
    if (!this.db) throw new Error('Database not ready.');

    console.log(`dbManager: Attempting to overwrite all data in ${String(storeName)} with ${data.length} items.`);
    try {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.clear(); // Xóa tất cả dữ liệu cũ
      for (const item of data) {
        await store.add(item); // Thêm từng item mới
      }
      await tx.done;
      console.log(`dbManager: Successfully overwrote all data in ${String(storeName)}.`);
    } catch (error: any) {
      console.error(`dbManager: Error overwriting data in ${String(storeName)}:`, error);
      throw new Error(`IndexedDB Error (save/overwrite): ${error.message || 'Unknown error'}`);
    }
  }

  // Phương thức để kiểm tra xem DB đã sẵn sàng chưa (public)
  public isInitializedPublic(): boolean {
    return this.isInitialized;
  }
}

export const dbManager = new IndexedDBManager();
