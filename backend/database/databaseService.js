/**
 * ================================================
 * 投資追蹤器 - 資料庫服務核心模組
 * ================================================
 * 功能：提供SQLite資料庫操作的核心服務
 * 設計原則：零影響現有功能，提供回退機制
 * 更新日期：2025/01/21
 */

class DatabaseService {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.isAvailable = false;
        this.errorCallback = null;
        this.syncQueue = [];
        this.config = {
            dbName: 'investment_tracker.db',
            maxRetries: 3,
            retryDelay: 1000,
            syncInterval: 5000,
            enableAutoSync: true
        };
        
        console.log('📊 DatabaseService 初始化中...');
        this.init();
    }

    /**
     * 初始化資料庫連線
     */
    async init() {
        try {
            // 檢查瀏覽器支援
            if (!this.checkBrowserSupport()) {
                console.warn('⚠️ 瀏覽器不支援SQLite，將使用LocalStorage模式');
                this.fallbackToLocalStorage();
                return;
            }

            // 初始化SQL.js
            await this.initSQLJS();
            
            // 載入或創建資料庫
            await this.loadOrCreateDatabase();
            
            // 驗證資料庫架構
            await this.validateSchema();
            
            this.isInitialized = true;
            this.isAvailable = true;
            
            console.log('✅ 資料庫服務初始化成功');
            
            // 啟動自動同步（如果啟用）
            if (this.config.enableAutoSync) {
                this.startAutoSync();
            }
            
        } catch (error) {
            console.error('❌ 資料庫初始化失敗:', error);
            this.fallbackToLocalStorage();
        }
    }

    /**
     * 檢查瀏覽器支援
     */
    checkBrowserSupport() {
        // 檢查必要的API支援
        return (
            typeof window !== 'undefined' &&
            'indexedDB' in window &&
            typeof WebAssembly !== 'undefined'
        );
    }

    /**
     * 初始化SQL.js
     */
    async initSQLJS() {
        try {
            // 動態載入SQL.js（如果尚未載入）
            if (typeof window.initSqlJs === 'undefined') {
                await this.loadSQLJSLibrary();
            }

            // 初始化SQL.js
            const SQL = await window.initSqlJs({
                locateFile: file => `/investment-tracker/lib/sql-wasm.wasm`
            });

            this.SQL = SQL;
            console.log('✅ SQL.js 載入成功');
            
        } catch (error) {
            console.error('❌ SQL.js 載入失敗:', error);
            throw new Error('SQL.js載入失敗');
        }
    }

    /**
     * 動態載入SQL.js函式庫
     */
    async loadSQLJSLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/investment-tracker/lib/sql.js';
            script.onload = () => {
                console.log('✅ SQL.js 腳本載入完成');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('SQL.js腳本載入失敗'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * 載入或創建資料庫
     */
    async loadOrCreateDatabase() {
        try {
            // 嘗試從IndexedDB載入現有資料庫
            const existingDb = await this.loadFromIndexedDB();
            
            if (existingDb) {
                this.db = new this.SQL.Database(existingDb);
                console.log('✅ 從 IndexedDB 載入現有資料庫');
            } else {
                // 創建新資料庫
                this.db = new this.SQL.Database();
                console.log('✅ 創建新資料庫');
                
                // 執行架構初始化
                await this.initializeSchema();
                
                // 儲存到IndexedDB
                await this.saveToIndexedDB();
            }
            
        } catch (error) {
            console.error('❌ 資料庫載入/創建失敗:', error);
            throw error;
        }
    }

    /**
     * 從IndexedDB載入資料庫
     */
    async loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('InvestmentTrackerDB', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['database'], 'readonly');
                const store = transaction.objectStore('database');
                const getRequest = store.get('main');
                
                getRequest.onsuccess = () => {
                    const result = getRequest.result;
                    resolve(result ? result.data : null);
                };
                
                getRequest.onerror = () => reject(getRequest.error);
            };
            
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('database')) {
                    db.createObjectStore('database');
                }
            };
        });
    }

    /**
     * 儲存資料庫到IndexedDB
     */
    async saveToIndexedDB() {
        if (!this.db) return;
        
        const data = this.db.export();
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('InvestmentTrackerDB', 1);
            
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['database'], 'readwrite');
                const store = transaction.objectStore('database');
                
                store.put({ data: data }, 'main');
                
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 初始化資料庫架構
     */
    async initializeSchema() {
        try {
            // 讀取schema.sql內容（模擬）
            const schemaSQL = await this.getSchemaSQL();
            
            // 執行架構創建
            this.db.exec(schemaSQL);
            
            console.log('✅ 資料庫架構初始化完成');
            
        } catch (error) {
            console.error('❌ 架構初始化失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取資料庫架構SQL
     */
    async getSchemaSQL() {
        // 實際實作中應該從schema.sql讀取
        // 這裡先返回基本架構
        return `
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL DEFAULT 'default_user',
                email VARCHAR(100),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            );
            
            CREATE TABLE IF NOT EXISTS portfolios (
                portfolio_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL DEFAULT 1,
                portfolio_name VARCHAR(100) NOT NULL DEFAULT '主要投資組合',
                description TEXT,
                base_currency VARCHAR(3) DEFAULT 'TWD',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );
            
            INSERT OR IGNORE INTO users (user_id, username, email) 
            VALUES (1, 'default_user', 'user@investment-tracker.local');
            
            INSERT OR IGNORE INTO portfolios (portfolio_id, user_id, portfolio_name, description) 
            VALUES (1, 1, '主要投資組合', '個人主要投資帳戶');
        `;
    }

    /**
     * 驗證資料庫架構
     */
    async validateSchema() {
        try {
            // 檢查必要的表是否存在
            const tables = this.executeQuery(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name IN ('users', 'portfolios')
            `);
            
            if (tables.length < 2) {
                throw new Error('資料庫架構驗證失敗：缺少必要的表');
            }
            
            console.log('✅ 資料庫架構驗證通過');
            
        } catch (error) {
            console.error('❌ 資料庫架構驗證失敗:', error);
            throw error;
        }
    }

    /**
     * 執行SQL查詢
     */
    executeQuery(sql, params = []) {
        if (!this.isAvailable) {
            throw new Error('資料庫服務不可用');
        }

        try {
            const stmt = this.db.prepare(sql);
            const results = [];
            
            if (params.length > 0) {
                stmt.bind(params);
            }
            
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            
            stmt.free();
            return results;
            
        } catch (error) {
            console.error('❌ SQL執行失敗:', error, { sql, params });
            throw error;
        }
    }

    /**
     * 執行SQL更新（INSERT, UPDATE, DELETE）
     */
    executeUpdate(sql, params = []) {
        if (!this.isAvailable) {
            throw new Error('資料庫服務不可用');
        }

        try {
            const stmt = this.db.prepare(sql);
            
            if (params.length > 0) {
                stmt.bind(params);
            }
            
            stmt.step();
            const changes = this.db.getRowsModified();
            stmt.free();
            
            // 自動儲存到IndexedDB
            this.saveToIndexedDB().catch(err => {
                console.warn('⚠️ 自動儲存失敗:', err);
            });
            
            return changes;
            
        } catch (error) {
            console.error('❌ SQL更新失敗:', error, { sql, params });
            throw error;
        }
    }

    /**
     * 開始事務
     */
    beginTransaction() {
        if (!this.isAvailable) return false;
        
        try {
            this.db.exec('BEGIN TRANSACTION');
            return true;
        } catch (error) {
            console.error('❌ 開始事務失敗:', error);
            return false;
        }
    }

    /**
     * 提交事務
     */
    commitTransaction() {
        if (!this.isAvailable) return false;
        
        try {
            this.db.exec('COMMIT');
            this.saveToIndexedDB().catch(err => {
                console.warn('⚠️ 提交後儲存失敗:', err);
            });
            return true;
        } catch (error) {
            console.error('❌ 提交事務失敗:', error);
            return false;
        }
    }

    /**
     * 回滾事務
     */
    rollbackTransaction() {
        if (!this.isAvailable) return false;
        
        try {
            this.db.exec('ROLLBACK');
            return true;
        } catch (error) {
            console.error('❌ 回滾事務失敗:', error);
            return false;
        }
    }

    /**
     * 回退到LocalStorage模式
     */
    fallbackToLocalStorage() {
        this.isAvailable = false;
        this.isInitialized = false;
        
        console.log('🔄 切換到 LocalStorage 模式');
        
        // 通知應用使用LocalStorage
        if (this.errorCallback) {
            this.errorCallback('database_unavailable');
        }
    }

    /**
     * 啟動自動同步
     */
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            this.processAutoSync();
        }, this.config.syncInterval);
        
        console.log('🔄 自動同步已啟動');
    }

    /**
     * 處理自動同步
     */
    async processAutoSync() {
        try {
            // 定期儲存到IndexedDB
            await this.saveToIndexedDB();
            
            // 處理同步佇列（如果有）
            if (this.syncQueue.length > 0) {
                await this.processSyncQueue();
            }
            
        } catch (error) {
            console.warn('⚠️ 自動同步失敗:', error);
        }
    }

    /**
     * 處理同步佇列
     */
    async processSyncQueue() {
        const batch = this.syncQueue.splice(0, 10); // 每次處理10筆
        
        for (const operation of batch) {
            try {
                await this.executeUpdate(operation.sql, operation.params);
            } catch (error) {
                console.warn('⚠️ 同步操作失敗:', error, operation);
                // 失敗的操作重新加入佇列末尾
                this.syncQueue.push(operation);
            }
        }
    }

    /**
     * 設定錯誤回調
     */
    setErrorCallback(callback) {
        this.errorCallback = callback;
    }

    /**
     * 獲取資料庫狀態
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isAvailable: this.isAvailable,
            queueLength: this.syncQueue.length,
            config: this.config
        };
    }

    /**
     * 手動備份資料庫
     */
    async backup() {
        if (!this.isAvailable) {
            throw new Error('資料庫不可用，無法備份');
        }

        try {
            const data = this.db.export();
            const blob = new Blob([data], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `investment_tracker_backup_${new Date().toISOString().slice(0, 10)}.db`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ 資料庫備份完成');
            
        } catch (error) {
            console.error('❌ 資料庫備份失敗:', error);
            throw error;
        }
    }

    /**
     * 關閉資料庫連線
     */
    close() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        
        this.isInitialized = false;
        this.isAvailable = false;
        
        console.log('🔒 資料庫連線已關閉');
    }
}

// 創建全域資料庫服務實例
window.DatabaseService = DatabaseService;

// 匯出供模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseService;
}

console.log('📊 DatabaseService 模組載入完成'); 