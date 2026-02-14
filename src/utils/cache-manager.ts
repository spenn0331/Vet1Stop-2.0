/**
 * Advanced caching utility for Vet1Stop application
 * Implements multiple cache layers:
 * 1. In-memory cache for fastest access
 * 2. LocalStorage for persistence across page refreshes
 * 3. IndexedDB for larger data storage
 */

interface CacheOptions {
  expiresIn?: number; // Time in milliseconds until cache expiry
  storageType?: 'memory' | 'localStorage' | 'indexedDB' | 'all';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number | null;
}

// Default cache options
const DEFAULT_OPTIONS: CacheOptions = {
  expiresIn: 1000 * 60 * 30, // 30 minutes default
  storageType: 'all',
};

// In-memory cache storage
const memoryCache: Record<string, CacheEntry<any>> = {};

class CacheManager {
  /**
   * Set data in cache
   */
  static async set<T>(
    key: string, 
    data: T, 
    options: CacheOptions = DEFAULT_OPTIONS
  ): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const now = Date.now();
    const expiresAt = opts.expiresIn ? now + opts.expiresIn : null;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
    };
    
    // Store in memory cache
    if (opts.storageType === 'memory' || opts.storageType === 'all') {
      memoryCache[key] = entry;
    }
    
    // Store in localStorage
    if (
      (opts.storageType === 'localStorage' || opts.storageType === 'all') && 
      typeof window !== 'undefined'
    ) {
      try {
        localStorage.setItem(
          `vet1stop_cache_${key}`, 
          JSON.stringify(entry)
        );
      } catch (error) {
        console.warn('Failed to store in localStorage:', error);
      }
    }
    
    // Store in IndexedDB for larger data sets
    if (
      (opts.storageType === 'indexedDB' || opts.storageType === 'all') && 
      typeof window !== 'undefined' && 
      'indexedDB' in window
    ) {
      try {
        await this.setIndexedDB(key, entry);
      } catch (error) {
        console.warn('Failed to store in IndexedDB:', error);
      }
    }
  }
  
  /**
   * Get data from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (fastest)
    if (key in memoryCache) {
      const entry = memoryCache[key] as CacheEntry<T>;
      if (this.isValid(entry)) {
        return entry.data;
      }
      // Remove expired entry
      delete memoryCache[key];
    }
    
    // Try localStorage next
    if (typeof window !== 'undefined') {
      try {
        const storedEntry = localStorage.getItem(`vet1stop_cache_${key}`);
        if (storedEntry) {
          const entry = JSON.parse(storedEntry) as CacheEntry<T>;
          if (this.isValid(entry)) {
            // Update memory cache
            memoryCache[key] = entry;
            return entry.data;
          }
          // Remove expired entry
          localStorage.removeItem(`vet1stop_cache_${key}`);
        }
      } catch (error) {
        console.warn('Failed to retrieve from localStorage:', error);
      }
    }
    
    // Finally, try IndexedDB
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        const entry = await this.getIndexedDB<T>(key);
        if (entry && this.isValid(entry)) {
          // Update memory cache
          memoryCache[key] = entry;
          return entry.data;
        }
        // Remove expired entry
        await this.removeIndexedDB(key);
      } catch (error) {
        console.warn('Failed to retrieve from IndexedDB:', error);
      }
    }
    
    return null;
  }
  
  /**
   * Remove data from all caches
   */
  static async remove(key: string): Promise<void> {
    // Remove from memory cache
    delete memoryCache[key];
    
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`vet1stop_cache_${key}`);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    }
    
    // Remove from IndexedDB
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        await this.removeIndexedDB(key);
      } catch (error) {
        console.warn('Failed to remove from IndexedDB:', error);
      }
    }
  }
  
  /**
   * Clear all cached data
   */
  static async clear(): Promise<void> {
    // Clear memory cache
    Object.keys(memoryCache).forEach(key => {
      delete memoryCache[key];
    });
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('vet1stop_cache_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
    
    // Clear IndexedDB
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        await this.clearIndexedDB();
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error);
      }
    }
  }
  
  /**
   * Check if a cache entry is still valid
   */
  private static isValid<T>(entry: CacheEntry<T>): boolean {
    if (!entry.expiresAt) return true;
    return Date.now() < entry.expiresAt;
  }
  
  /**
   * IndexedDB helper methods
   */
  private static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('Vet1StopCache', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
      
      request.onerror = (event) => {
        reject(`Failed to open IndexedDB: ${(event.target as IDBOpenDBRequest).error}`);
      };
    });
  }
  
  private static async setIndexedDB<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      const request = store.put({ key, ...entry });
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject(`Failed to store in IndexedDB: ${(event.target as IDBRequest).error}`);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  private static async getIndexedDB<T>(key: string): Promise<CacheEntry<T> | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      
      const request = store.get(key);
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        if (result) {
          const { key: _key, ...entry } = result;
          resolve(entry as CacheEntry<T>);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        reject(`Failed to retrieve from IndexedDB: ${(event.target as IDBRequest).error}`);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  private static async removeIndexedDB(key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      const request = store.delete(key);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject(`Failed to remove from IndexedDB: ${(event.target as IDBRequest).error}`);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
  
  private static async clearIndexedDB(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject(`Failed to clear IndexedDB: ${(event.target as IDBRequest).error}`);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
}

export default CacheManager;
