/**
 * ================================================
 * 投資追蹤器 - 資料庫適配器
 * ================================================
 * 功能：提供UI層與資料庫之間的介面適配層
 * 設計原則：保持與現有LocalStorage介面相容
 * 更新日期：2025/01/21
 */

class DatabaseAdapter {
    constructor() {
        this.databaseService = null;
        this.isReady = false;
        this.useLocalStorage = false;
        this.pendingOperations = [];
        
        console.log('🔌 DatabaseAdapter 初始化中...');
        this.init();
    }

    /**
     * 初始化適配器
     */
    async init() {
        try {
            // 等待DatabaseService初始化
            await this.waitForDatabaseService();
            
            // 設定錯誤回調
            this.databaseService.setErrorCallback((errorType) => {
                this.handleDatabaseError(errorType);
            });
            
            this.isReady = true;
            console.log('✅ DatabaseAdapter 初始化完成');
            
            // 處理pending操作
            await this.processPendingOperations();
            
        } catch (error) {
            console.error('❌ DatabaseAdapter 初始化失敗:', error);
            this.useLocalStorage = true;
            this.isReady = true;
        }
    }

    /**
     * 等待DatabaseService就緒
     */
    async waitForDatabaseService() {
        let retries = 0;
        const maxRetries = 30; // 3秒
        
        while (retries < maxRetries) {
            if (window.databaseService && window.databaseService.isInitialized) {
                this.databaseService = window.databaseService;
                this.useLocalStorage = !this.databaseService.isAvailable;
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        throw new Error('DatabaseService 初始化超時');
    }

    /**
     * 處理資料庫錯誤
     */
    handleDatabaseError(errorType) {
        console.warn(`⚠️ 資料庫錯誤: ${errorType}, 切換到LocalStorage模式`);
        this.useLocalStorage = true;
    }

    /**
     * 處理pending操作
     */
    async processPendingOperations() {
        if (this.pendingOperations.length === 0) return;
        
        console.log(`🔄 處理 ${this.pendingOperations.length} 個pending操作`);
        
        for (const operation of this.pendingOperations) {
            try {
                await operation();
            } catch (error) {
                console.warn('⚠️ Pending操作失敗:', error);
            }
        }
        
        this.pendingOperations = [];
    }

    /**
     * 檢查是否就緒
     */
    checkReady() {
        if (!this.isReady) {
            throw new Error('DatabaseAdapter 尚未就緒');
        }
    }

    // ================================================
    // 股票交易相關方法
    // ================================================

    /**
     * 新增股票買入記錄
     */
    async addStockBuyRecord(recordData) {
        this.checkReady();
        
        if (this.useLocalStorage) {
            return this.addStockBuyRecordLocal(recordData);
        }
        
        try {
            const sql = `
                INSERT INTO stock_transactions (
                    market, asset_type, stock_code, stock_name,
                    transaction_type, transaction_date, shares, price_per_share,
                    commission_fee, transaction_tax, other_fees,
                    original_id, notes
                ) VALUES (?, ?, ?, ?, 'BUY', ?, ?, ?, ?, 0, ?, ?, ?)
            `;
            
            const params = [
                recordData.market,
                recordData.assetType,
                recordData.stockCode,
                recordData.stockName,
                recordData.date,
                parseFloat(recordData.shares),
                parseFloat(recordData.price),
                parseFloat(recordData.commissionFee || 0),
                parseFloat(recordData.otherFees || 0),
                recordData.id || this.generateId(),
                recordData.notes || ''
            ];
            
            const result = this.databaseService.executeUpdate(sql, params);
            
            if (result > 0) {
                console.log('✅ 股票買入記錄已儲存到資料庫');
                // 同時保存到LocalStorage作為備份
                this.addStockBuyRecordLocal(recordData);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ 儲存股票買入記錄失敗:', error);
            // 回退到LocalStorage
            return this.addStockBuyRecordLocal(recordData);
        }
    }

    /**
     * LocalStorage版本的股票買入記錄
     */
    addStockBuyRecordLocal(recordData) {
        try {
            let records = JSON.parse(localStorage.getItem('stockBuyRecords') || '[]');
            
            const record = {
                id: recordData.id || this.generateId(),
                date: recordData.date,
                market: recordData.market,
                assetType: recordData.assetType,
                stockCode: recordData.stockCode,
                stockName: recordData.stockName,
                shares: parseFloat(recordData.shares),
                price: parseFloat(recordData.price),
                commissionFee: parseFloat(recordData.commissionFee || 0),
                otherFees: parseFloat(recordData.otherFees || 0),
                notes: recordData.notes || '',
                timestamp: new Date().toISOString()
            };
            
            records.push(record);
            localStorage.setItem('stockBuyRecords', JSON.stringify(records));
            
            console.log('✅ 股票買入記錄已儲存到LocalStorage');
            return true;
            
        } catch (error) {
            console.error('❌ LocalStorage儲存失敗:', error);
            return false;
        }
    }

    /**
     * 新增股票賣出記錄
     */
    async addStockSellRecord(recordData) {
        this.checkReady();
        
        if (this.useLocalStorage) {
            return this.addStockSellRecordLocal(recordData);
        }
        
        try {
            const sql = `
                INSERT INTO stock_transactions (
                    market, asset_type, stock_code, stock_name,
                    transaction_type, transaction_date, shares, price_per_share,
                    commission_fee, transaction_tax, other_fees,
                    original_id, notes
                ) VALUES (?, ?, ?, ?, 'SELL', ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                recordData.market,
                recordData.assetType,
                recordData.stockCode,
                recordData.stockName,
                recordData.date,
                parseFloat(recordData.shares),
                parseFloat(recordData.price),
                parseFloat(recordData.commissionFee || 0),
                parseFloat(recordData.transactionTax || 0),
                parseFloat(recordData.otherFees || 0),
                recordData.id || this.generateId(),
                recordData.notes || ''
            ];
            
            const result = this.databaseService.executeUpdate(sql, params);
            
            if (result > 0) {
                console.log('✅ 股票賣出記錄已儲存到資料庫');
                this.addStockSellRecordLocal(recordData);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ 儲存股票賣出記錄失敗:', error);
            return this.addStockSellRecordLocal(recordData);
        }
    }

    /**
     * LocalStorage版本的股票賣出記錄
     */
    addStockSellRecordLocal(recordData) {
        try {
            let records = JSON.parse(localStorage.getItem('stockSellRecords') || '[]');
            
            const record = {
                id: recordData.id || this.generateId(),
                date: recordData.date,
                market: recordData.market,
                assetType: recordData.assetType,
                stockCode: recordData.stockCode,
                stockName: recordData.stockName,
                shares: parseFloat(recordData.shares),
                price: parseFloat(recordData.price),
                commissionFee: parseFloat(recordData.commissionFee || 0),
                transactionTax: parseFloat(recordData.transactionTax || 0),
                otherFees: parseFloat(recordData.otherFees || 0),
                notes: recordData.notes || '',
                timestamp: new Date().toISOString()
            };
            
            records.push(record);
            localStorage.setItem('stockSellRecords', JSON.stringify(records));
            
            console.log('✅ 股票賣出記錄已儲存到LocalStorage');
            return true;
            
        } catch (error) {
            console.error('❌ LocalStorage儲存失敗:', error);
            return false;
        }
    }

    // ================================================
    // 基金交易相關方法
    // ================================================

    /**
     * 新增基金記錄
     */
    async addFundRecord(recordData) {
        this.checkReady();
        
        if (this.useLocalStorage) {
            return this.addFundRecordLocal(recordData);
        }
        
        try {
            const sql = `
                INSERT INTO fund_transactions (
                    fund_name, fund_code, fund_company,
                    transaction_type, transaction_date, amount, nav, units,
                    management_fee, subscription_fee, redemption_fee, other_fees,
                    original_id, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                recordData.fundName,
                recordData.fundCode || '',
                recordData.fundCompany || '',
                recordData.transactionType || 'BUY',
                recordData.date,
                parseFloat(recordData.amount),
                parseFloat(recordData.nav),
                parseFloat(recordData.units),
                parseFloat(recordData.managementFee || 0),
                parseFloat(recordData.subscriptionFee || 0),
                parseFloat(recordData.redemptionFee || 0),
                parseFloat(recordData.otherFees || 0),
                recordData.id || this.generateId(),
                recordData.notes || ''
            ];
            
            const result = this.databaseService.executeUpdate(sql, params);
            
            if (result > 0) {
                console.log('✅ 基金記錄已儲存到資料庫');
                this.addFundRecordLocal(recordData);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ 儲存基金記錄失敗:', error);
            return this.addFundRecordLocal(recordData);
        }
    }

    /**
     * LocalStorage版本的基金記錄
     */
    addFundRecordLocal(recordData) {
        try {
            let records = JSON.parse(localStorage.getItem('fundRecords') || '[]');
            
            const record = {
                id: recordData.id || this.generateId(),
                date: recordData.date,
                fundName: recordData.fundName,
                amount: parseFloat(recordData.amount),
                nav: parseFloat(recordData.nav),
                units: parseFloat(recordData.units),
                managementFee: parseFloat(recordData.managementFee || 0),
                subscriptionFee: parseFloat(recordData.subscriptionFee || 0),
                notes: recordData.notes || '',
                timestamp: new Date().toISOString()
            };
            
            records.push(record);
            localStorage.setItem('fundRecords', JSON.stringify(records));
            
            console.log('✅ 基金記錄已儲存到LocalStorage');
            return true;
            
        } catch (error) {
            console.error('❌ LocalStorage儲存失敗:', error);
            return false;
        }
    }

    // ================================================
    // 加密貨幣交易相關方法
    // ================================================

    /**
     * 新增加密貨幣記錄
     */
    async addCryptoRecord(recordData) {
        this.checkReady();
        
        if (this.useLocalStorage) {
            return this.addCryptoRecordLocal(recordData);
        }
        
        try {
            const sql = `
                INSERT INTO crypto_transactions (
                    symbol, crypto_name, exchange_platform,
                    transaction_type, transaction_date, quantity, price_per_unit,
                    exchange_fee_twd, network_fee_twd,
                    original_id, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                recordData.symbol,
                recordData.cryptoName || '',
                recordData.exchangePlatform || '',
                recordData.transactionType || 'BUY',
                recordData.date,
                parseFloat(recordData.quantity),
                parseFloat(recordData.price),
                parseFloat(recordData.exchangeFee || 0),
                parseFloat(recordData.networkFee || 0),
                recordData.id || this.generateId(),
                recordData.notes || ''
            ];
            
            const result = this.databaseService.executeUpdate(sql, params);
            
            if (result > 0) {
                console.log('✅ 加密貨幣記錄已儲存到資料庫');
                this.addCryptoRecordLocal(recordData);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ 儲存加密貨幣記錄失敗:', error);
            return this.addCryptoRecordLocal(recordData);
        }
    }

    /**
     * LocalStorage版本的加密貨幣記錄
     */
    addCryptoRecordLocal(recordData) {
        try {
            let records = JSON.parse(localStorage.getItem('cryptoRecords') || '[]');
            
            const record = {
                id: recordData.id || this.generateId(),
                date: recordData.date,
                symbol: recordData.symbol,
                quantity: parseFloat(recordData.quantity),
                price: parseFloat(recordData.price),
                exchangeFee: parseFloat(recordData.exchangeFee || 0),
                networkFee: parseFloat(recordData.networkFee || 0),
                notes: recordData.notes || '',
                timestamp: new Date().toISOString()
            };
            
            records.push(record);
            localStorage.setItem('cryptoRecords', JSON.stringify(records));
            
            console.log('✅ 加密貨幣記錄已儲存到LocalStorage');
            return true;
            
        } catch (error) {
            console.error('❌ LocalStorage儲存失敗:', error);
            return false;
        }
    }

    // ================================================
    // 房地產相關方法
    // ================================================

    /**
     * 新增房地產記錄
     */
    async addPropertyRecord(recordData) {
        this.checkReady();
        
        if (this.useLocalStorage) {
            return this.addPropertyRecordLocal(recordData);
        }
        
        try {
            const sql = `
                INSERT INTO property_records (
                    property_name, property_type, address, area_size,
                    total_price, down_payment, loan_amount, interest_rate, loan_term_years,
                    purchase_date, completion_date,
                    original_id, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                recordData.propertyName,
                recordData.propertyType || '預售屋',
                recordData.address || '',
                parseFloat(recordData.areaSize || 0),
                parseFloat(recordData.totalPrice),
                parseFloat(recordData.downPayment),
                parseFloat(recordData.loanAmount),
                parseFloat(recordData.interestRate || 0),
                parseInt(recordData.loanTermYears || 0),
                recordData.purchaseDate || null,
                recordData.completionDate || null,
                recordData.id || this.generateId(),
                recordData.notes || ''
            ];
            
            const result = this.databaseService.executeUpdate(sql, params);
            
            if (result > 0) {
                console.log('✅ 房地產記錄已儲存到資料庫');
                this.addPropertyRecordLocal(recordData);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ 儲存房地產記錄失敗:', error);
            return this.addPropertyRecordLocal(recordData);
        }
    }

    /**
     * LocalStorage版本的房地產記錄
     */
    addPropertyRecordLocal(recordData) {
        try {
            let records = JSON.parse(localStorage.getItem('propertyRecords') || '[]');
            
            const record = {
                id: recordData.id || this.generateId(),
                propertyName: recordData.propertyName,
                totalPrice: parseFloat(recordData.totalPrice),
                downPayment: parseFloat(recordData.downPayment),
                loanAmount: parseFloat(recordData.loanAmount),
                interestRate: parseFloat(recordData.interestRate || 0),
                loanTermYears: parseInt(recordData.loanTermYears || 0),
                notes: recordData.notes || '',
                timestamp: new Date().toISOString()
            };
            
            records.push(record);
            localStorage.setItem('propertyRecords', JSON.stringify(records));
            
            console.log('✅ 房地產記錄已儲存到LocalStorage');
            return true;
            
        } catch (error) {
            console.error('❌ LocalStorage儲存失敗:', error);
            return false;
        }
    }

    // ================================================
    // 查詢方法
    // ================================================

    /**
     * 查詢股票交易記錄
     */
    async getStockTransactions(filters = {}) {
        this.checkReady();
        
        if (this.useLocalStorage) {
            return this.getStockTransactionsLocal(filters);
        }
        
        try {
            let sql = `
                SELECT * FROM stock_transactions 
                WHERE 1=1
            `;
            
            const params = [];
            
            if (filters.market) {
                sql += ' AND market = ?';
                params.push(filters.market);
            }
            
            if (filters.stockCode) {
                sql += ' AND stock_code = ?';
                params.push(filters.stockCode);
            }
            
            if (filters.startDate) {
                sql += ' AND transaction_date >= ?';
                params.push(filters.startDate);
            }
            
            if (filters.endDate) {
                sql += ' AND transaction_date <= ?';
                params.push(filters.endDate);
            }
            
            sql += ' ORDER BY transaction_date DESC';
            
            const results = this.databaseService.executeQuery(sql, params);
            return results;
            
        } catch (error) {
            console.error('❌ 查詢股票交易記錄失敗:', error);
            return this.getStockTransactionsLocal(filters);
        }
    }

    /**
     * LocalStorage版本的股票交易查詢
     */
    getStockTransactionsLocal(filters = {}) {
        try {
            const buyRecords = JSON.parse(localStorage.getItem('stockBuyRecords') || '[]');
            const sellRecords = JSON.parse(localStorage.getItem('stockSellRecords') || '[]');
            
            // 合併並標記交易類型
            const allRecords = [
                ...buyRecords.map(r => ({ ...r, transaction_type: 'BUY' })),
                ...sellRecords.map(r => ({ ...r, transaction_type: 'SELL' }))
            ];
            
            // 應用篩選
            let filtered = allRecords;
            
            if (filters.market) {
                filtered = filtered.filter(r => r.market === filters.market);
            }
            
            if (filters.stockCode) {
                filtered = filtered.filter(r => r.stockCode === filters.stockCode);
            }
            
            // 按日期排序
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            return filtered;
            
        } catch (error) {
            console.error('❌ LocalStorage查詢失敗:', error);
            return [];
        }
    }

    // ================================================
    // 統計與報表方法
    // ================================================

    /**
     * 獲取投資統計數據
     */
    async getInvestmentStatistics() {
        this.checkReady();
        
        try {
            const stats = {};
            
            if (this.useLocalStorage) {
                // LocalStorage版本的統計
                stats.totalInvestment = this.calculateTotalInvestmentLocal();
                stats.recordCounts = this.getRecordCountsLocal();
            } else {
                // 資料庫版本的統計
                stats.totalInvestment = await this.calculateTotalInvestmentDB();
                stats.recordCounts = await this.getRecordCountsDB();
            }
            
            return stats;
            
        } catch (error) {
            console.error('❌ 統計數據計算失敗:', error);
            return {
                totalInvestment: 0,
                recordCounts: {
                    stocks: 0,
                    funds: 0,
                    crypto: 0,
                    property: 0
                }
            };
        }
    }

    // ================================================
    // 工具方法
    // ================================================

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 獲取適配器狀態
     */
    getStatus() {
        return {
            isReady: this.isReady,
            useLocalStorage: this.useLocalStorage,
            databaseAvailable: this.databaseService ? this.databaseService.isAvailable : false,
            pendingOperations: this.pendingOperations.length
        };
    }

    /**
     * 手動同步資料
     */
    async syncData() {
        if (!this.databaseService || !this.databaseService.isAvailable) {
            throw new Error('資料庫不可用，無法同步');
        }
        
        console.log('🔄 開始手動同步資料...');
        
        try {
            // 從LocalStorage讀取資料並同步到資料庫
            await this.syncLocalStorageToDatabase();
            console.log('✅ 資料同步完成');
            
        } catch (error) {
            console.error('❌ 資料同步失敗:', error);
            throw error;
        }
    }

    /**
     * 從LocalStorage同步到資料庫
     */
    async syncLocalStorageToDatabase() {
        // 同步股票記錄
        const stockBuyRecords = JSON.parse(localStorage.getItem('stockBuyRecords') || '[]');
        const stockSellRecords = JSON.parse(localStorage.getItem('stockSellRecords') || '[]');
        
        for (const record of stockBuyRecords) {
            await this.addStockBuyRecord(record);
        }
        
        for (const record of stockSellRecords) {
            await this.addStockSellRecord(record);
        }
        
        // 同步其他類型記錄...
        // (基金、加密貨幣、房地產)
    }
}

// 創建全域適配器實例
window.DatabaseAdapter = DatabaseAdapter;

// 匯出供模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseAdapter;
}

console.log('🔌 DatabaseAdapter 模組載入完成'); 