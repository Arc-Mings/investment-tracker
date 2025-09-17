/**
 * ================================================
 * 投資追蹤器 - 資料庫整合腳本
 * ================================================
 * 功能：無縫整合資料庫功能到現有UI中
 * 設計原則：零影響現有功能，增強體驗
 * 更新日期：2025/01/21
 */

(function() {
    'use strict';
    
    console.log('🔧 DatabaseIntegration 開始初始化...');
    
    // 全域變數
    let databaseService = null;
    let databaseAdapter = null;
    let isIntegrationReady = false;
    
    // 原始函數的備份
    const originalFunctions = {};
    
    /**
     * 初始化資料庫整合
     */
    function initializeDatabaseIntegration() {
        console.log('🚀 開始資料庫整合初始化...');
        
        try {
            // 創建資料庫服務實例
            databaseService = new DatabaseService();
            window.databaseService = databaseService;
            
            // 創建適配器實例
            databaseAdapter = new DatabaseAdapter();
            window.databaseAdapter = databaseAdapter;
            
            // 等待初始化完成
            waitForInitialization().then(() => {
                enhanceExistingFunctions();
                addDatabaseFeatures();
                isIntegrationReady = true;
                console.log('✅ 資料庫整合初始化完成');
                
                // 觸發自定義事件，通知其他模組
                window.dispatchEvent(new CustomEvent('databaseIntegrationReady', {
                    detail: { 
                        databaseService, 
                        databaseAdapter,
                        isAvailable: databaseService.isAvailable 
                    }
                }));
            });
            
        } catch (error) {
            console.error('❌ 資料庫整合初始化失敗:', error);
            // 確保不影響現有功能
            isIntegrationReady = true; // 設為true，讓現有函數正常運作
        }
    }
    
    /**
     * 等待所有服務初始化完成
     */
    async function waitForInitialization() {
        let retries = 0;
        const maxRetries = 50; // 5秒
        
        while (retries < maxRetries) {
            if (databaseAdapter && databaseAdapter.isReady) {
                console.log('✅ 資料庫服務就緒');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        console.warn('⚠️ 資料庫服務初始化超時，將使用LocalStorage模式');
    }
    
    /**
     * 增強現有函數，添加資料庫支援
     */
    function enhanceExistingFunctions() {
        console.log('🔧 正在增強現有函數...');
        
        // 增強股票買入函數
        enhanceFunction('addStockBuyRecord', async function(originalFunc) {
            const recordData = extractStockBuyFormData();
            if (!recordData) return false;
            
            try {
                // 儲存到資料庫
                await databaseAdapter.addStockBuyRecord(recordData);
                
                // 調用原始函數（儲存到LocalStorage和更新UI）
                const result = originalFunc.call(this);
                
                console.log('✅ 股票買入記錄已同步到資料庫');
                return result;
                
            } catch (error) {
                console.error('❌ 資料庫同步失敗，將繼續使用LocalStorage:', error);
                return originalFunc.call(this);
            }
        });
        
        // 增強股票賣出函數
        enhanceFunction('addStockSellRecord', async function(originalFunc) {
            const recordData = extractStockSellFormData();
            if (!recordData) return false;
            
            try {
                await databaseAdapter.addStockSellRecord(recordData);
                const result = originalFunc.call(this);
                console.log('✅ 股票賣出記錄已同步到資料庫');
                return result;
                
            } catch (error) {
                console.error('❌ 資料庫同步失敗:', error);
                return originalFunc.call(this);
            }
        });
        
        // 增強基金函數
        enhanceFunction('addFundRecord', async function(originalFunc) {
            const recordData = extractFundFormData();
            if (!recordData) return false;
            
            try {
                await databaseAdapter.addFundRecord(recordData);
                const result = originalFunc.call(this);
                console.log('✅ 基金記錄已同步到資料庫');
                return result;
                
            } catch (error) {
                console.error('❌ 資料庫同步失敗:', error);
                return originalFunc.call(this);
            }
        });
        
        // 增強加密貨幣函數
        enhanceFunction('addCryptoRecord', async function(originalFunc) {
            const recordData = extractCryptoFormData();
            if (!recordData) return false;
            
            try {
                await databaseAdapter.addCryptoRecord(recordData);
                const result = originalFunc.call(this);
                console.log('✅ 加密貨幣記錄已同步到資料庫');
                return result;
                
            } catch (error) {
                console.error('❌ 資料庫同步失敗:', error);
                return originalFunc.call(this);
            }
        });
        
        // 增強房地產函數
        enhanceFunction('addPropertyRecord', async function(originalFunc) {
            const recordData = extractPropertyFormData();
            if (!recordData) return false;
            
            try {
                await databaseAdapter.addPropertyRecord(recordData);
                const result = originalFunc.call(this);
                console.log('✅ 房地產記錄已同步到資料庫');
                return result;
                
            } catch (error) {
                console.error('❌ 資料庫同步失敗:', error);
                return originalFunc.call(this);
            }
        });
    }
    
    /**
     * 增強函數的通用方法
     */
    function enhanceFunction(functionName, enhancedFunction) {
        // 等待函數可用
        const checkFunction = () => {
            if (typeof window[functionName] === 'function') {
                // 備份原始函數
                originalFunctions[functionName] = window[functionName];
                
                // 替換為增強版本
                window[functionName] = function(...args) {
                    if (isIntegrationReady && databaseAdapter && databaseAdapter.isReady) {
                        return enhancedFunction.call(this, originalFunctions[functionName], ...args);
                    } else {
                        // 如果資料庫未就緒，使用原始函數
                        return originalFunctions[functionName].call(this, ...args);
                    }
                };
                
                console.log(`✅ 函數 ${functionName} 已增強`);
            } else {
                // 如果函數還不存在，稍後再試
                setTimeout(checkFunction, 100);
            }
        };
        
        checkFunction();
    }
    
    /**
     * 從表單提取股票買入資料
     */
    function extractStockBuyFormData() {
        try {
            return {
                date: document.getElementById('buyStockDate')?.value,
                market: document.getElementById('buyStockMarket')?.value,
                assetType: document.getElementById('buyStockAssetType')?.value,
                stockCode: document.getElementById('buyStockCode')?.value?.trim(),
                stockName: document.getElementById('buyStockName')?.value?.trim(),
                shares: document.getElementById('buyStockShares')?.value,
                price: document.getElementById('buyStockPrice')?.value,
                commissionFee: document.getElementById('buyStockFee')?.value,
                otherFees: 0 // 如果有其他費用欄位可以加入
            };
        } catch (error) {
            console.error('❌ 提取股票買入表單資料失敗:', error);
            return null;
        }
    }
    
    /**
     * 從表單提取股票賣出資料
     */
    function extractStockSellFormData() {
        try {
            return {
                date: document.getElementById('sellStockDate')?.value,
                market: document.getElementById('sellStockMarket')?.value,
                assetType: document.getElementById('sellStockAssetType')?.value,
                stockCode: document.getElementById('sellStockCode')?.value?.trim(),
                stockName: document.getElementById('sellStockName')?.value?.trim(),
                shares: document.getElementById('sellStockShares')?.value,
                price: document.getElementById('sellStockPrice')?.value,
                commissionFee: document.getElementById('sellStockFee')?.value,
                transactionTax: document.getElementById('sellStockTax')?.value,
                otherFees: 0
            };
        } catch (error) {
            console.error('❌ 提取股票賣出表單資料失敗:', error);
            return null;
        }
    }
    
    /**
     * 從表單提取基金資料
     */
    function extractFundFormData() {
        try {
            return {
                date: document.getElementById('fundDate')?.value,
                fundName: document.getElementById('fundName')?.value?.trim(),
                amount: document.getElementById('fundAmount')?.value,
                nav: document.getElementById('fundNAV')?.value,
                units: document.getElementById('fundUnits')?.value,
                managementFee: document.getElementById('fundManagementFee')?.value || 0,
                subscriptionFee: document.getElementById('fundSubscriptionFee')?.value || 0
            };
        } catch (error) {
            console.error('❌ 提取基金表單資料失敗:', error);
            return null;
        }
    }
    
    /**
     * 從表單提取加密貨幣資料
     */
    function extractCryptoFormData() {
        try {
            return {
                date: document.getElementById('cryptoDate')?.value,
                symbol: document.getElementById('cryptoSymbol')?.value?.trim(),
                quantity: document.getElementById('cryptoQuantity')?.value,
                price: document.getElementById('cryptoPrice')?.value,
                exchangeFee: document.getElementById('cryptoExchangeFee')?.value || 0,
                networkFee: document.getElementById('cryptoNetworkFee')?.value || 0
            };
        } catch (error) {
            console.error('❌ 提取加密貨幣表單資料失敗:', error);
            return null;
        }
    }
    
    /**
     * 從表單提取房地產資料
     */
    function extractPropertyFormData() {
        try {
            return {
                propertyName: document.getElementById('propertyName')?.value?.trim(),
                totalPrice: document.getElementById('totalPrice')?.value,
                downPayment: document.getElementById('downPayment')?.value,
                loanAmount: document.getElementById('loanAmount')?.value,
                interestRate: document.getElementById('interestRate')?.value,
                loanTermYears: document.getElementById('loanTermYears')?.value
            };
        } catch (error) {
            console.error('❌ 提取房地產表單資料失敗:', error);
            return null;
        }
    }
    
    /**
     * 添加資料庫專用功能
     */
    function addDatabaseFeatures() {
        // 添加備份功能
        window.exportDatabaseBackup = async function() {
            try {
                if (databaseService && databaseService.isAvailable) {
                    await databaseService.backup();
                    alert('✅ 資料庫備份完成');
                } else {
                    alert('⚠️ 資料庫不可用，無法執行備份');
                }
            } catch (error) {
                console.error('❌ 備份失敗:', error);
                alert('❌ 備份失敗: ' + error.message);
            }
        };
        
        // 添加同步功能
        window.syncLocalStorageToDatabase = async function() {
            try {
                if (databaseAdapter && databaseAdapter.isReady) {
                    await databaseAdapter.syncData();
                    alert('✅ 資料同步完成');
                } else {
                    alert('⚠️ 資料庫不可用，無法執行同步');
                }
            } catch (error) {
                console.error('❌ 同步失敗:', error);
                alert('❌ 同步失敗: ' + error.message);
            }
        };
        
        // 添加狀態檢查功能
        window.getDatabaseStatus = function() {
            return {
                databaseService: databaseService?.getStatus(),
                databaseAdapter: databaseAdapter?.getStatus(),
                integrationReady: isIntegrationReady
            };
        };
        
        console.log('✅ 資料庫專用功能已添加');
    }
    
    /**
     * 監聽DOMContentLoaded事件，在頁面載入完成後初始化
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDatabaseIntegration);
    } else {
        // 如果DOM已經載入完成，立即初始化
        initializeDatabaseIntegration();
    }
    
    // 匯出給其他模組使用
    window.DatabaseIntegration = {
        isReady: () => isIntegrationReady,
        getDatabaseService: () => databaseService,
        getDatabaseAdapter: () => databaseAdapter,
        getOriginalFunctions: () => originalFunctions
    };
    
    console.log('🔧 DatabaseIntegration 模組載入完成');
    
})(); 