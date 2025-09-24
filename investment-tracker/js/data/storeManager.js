/**
 * StoreManager - 統一的 electron-store 管理器
 * 提供標準化的資料存取介面
 */
class StoreManager {
    constructor() {
        this.initialized = false;
        this.isElectron = false;
    }

    /**
     * 初始化存儲管理器
     */
    async init() {
        try {
            // 檢查 electronAPI 是否可用
            if (!window.electronAPI) {
                console.warn('⚠️ electronAPI 不可用，使用離線模式');
                this.isElectron = false;
            } else {
                console.log('✅ electronAPI 已就緒');
                this.isElectron = true;
                
                // 測試 electronAPI 是否真正可用
                try {
                    await window.electronAPI.store.get('test');
                    console.log('✅ electronAPI 功能測試成功');
                } catch (testError) {
                    console.warn('⚠️ electronAPI 功能測試失敗:', testError);
                    this.isElectron = false;
                }
            }
            
            this.initialized = true;
            return this.isElectron;
        } catch (error) {
            console.error('❌ StoreManager 初始化失敗:', error);
            this.isElectron = false;
            this.initialized = true; // 即使失敗也標記為已初始化
            return false;
        }
    }

    /**
     * 確保已初始化
     */
    async ensureInitialized() {
        if (!this.initialized) {
            await this.init();
        }
    }

    /**
     * 保存資料到 electron-store
     */
    async save(data) {
        await this.ensureInitialized();
        
        if (!this.isElectron) {
            console.warn('⚠️ 離線模式：無法保存資料');
            return false;
        }

        try {
            console.log('💾 保存資料到 electron-store...');
            const result = await window.electronAPI.store.set('portfolio', data);
            console.log('✅ 資料保存成功');
            return result;
        } catch (error) {
            console.error('❌ 資料保存失敗:', error);
            throw error;
        }
    }

    /**
     * 從 electron-store 載入資料
     */
    async load() {
        await this.ensureInitialized();
        
        if (!this.isElectron) {
            console.warn('⚠️ 離線模式：返回空資料');
            return {
                stocks: [],
                crypto: [],
                funds: [],
                property: [],
                payments: []
            };
        }
    
        try {
            console.log('📖 從 electron-store 載入資料...');
            const data = await window.electronAPI.store.get('portfolio');
            console.log('✅ 資料載入成功');
            return data || {
                stocks: [],
                crypto: [],
                funds: [],
                property: [],
                payments: []
            };
        } catch (error) {
            console.error('❌ 資料載入失敗:', error);
            return {
                stocks: [],
                crypto: [],
                funds: [],
                property: [],
                payments: []
            };
        }
    }

    /**
     * 匯出所有資料到 JSON 檔案
     */
    async exportData() {
        await this.ensureInitialized();
        if (!this.isElectron) {
            throw new Error('離線模式無法匯出資料');
        }
        const data = await this.load();
        const result = await window.electronAPI.showSaveDialog();
        if (result?.canceled) {
            return false;
        }
        const filepath = result.filePath || result.filepath;
        if (!filepath) return false;
        const ok = await window.electronAPI.writeFile(filepath, JSON.stringify(data, null, 2));
        if (!ok) throw new Error('寫入檔案失敗');
        return true;
    }

    /**
     * 匯入 JSON 檔案資料並覆蓋現有資料
     */
    async importData(data) {
        await this.ensureInitialized();
        if (!this.isElectron) {
            throw new Error('離線模式無法匯入資料');
        }
        return await this.save(data);
    }

    /**
     * 清空所有資料
     */
    async clearAll() {
        await this.ensureInitialized();
        if (!this.isElectron) {
            throw new Error('離線模式無法清空資料');
        }
        await window.electronAPI.store.clear();
        return true;
    }

    /**
     * 獲取存儲狀態
     */
    getStatus() {
        return {
            initialized: this.initialized,
            isElectron: this.isElectron,
            available: this.initialized && this.isElectron
        };
    }
}

// 創建單一實例
export const storeManager = new StoreManager();