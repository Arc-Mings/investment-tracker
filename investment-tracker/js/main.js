/**
 * @file main.js
 * @description 應用程式主入口點 - 純 electron-store 架構
 */

import { storeManager } from './data/storeManager.js';
import { validateData, getDataStats } from './data/dataStructure.js';
import { updateAllRecords } from './core/state.js';
import { initializeApp, updateDatabaseStatus } from './ui/uiManager.js';
import { updateAllTablesAndSummary } from './features/summary.js';
import { initializeStockPage, preloadPopularStocks } from './features/stocks.js';
import { initializeFundPage } from './features/funds.js';
import { initializeCryptoPage } from './features/crypto.js';
import { initializePropertyPage } from './features/property.js';
// import { initializeStockApiControls } from './ui/stockApiControls.js'; // API 功能已暫時停用

/**
 * 載入並顯示資料
 */
async function loadAndDisplayData() {
    try {
        console.log('📖 開始載入資料...');
        
        // 從 electron-store 載入資料
        const rawData = await storeManager.load();
        
        // 驗證資料格式
        const portfolioData = validateData(rawData);
        
        // 顯示資料統計
        const stats = getDataStats(portfolioData);
        console.log('📊 資料統計:', stats);
        
        // 更新 state.js 中的狀態變數
        updateAllRecords(portfolioData);
        
        // 將資料設置到全局變數（保持現有介面相容性）
        window.stockRecords = portfolioData.stocks;
        window.cryptoRecords = portfolioData.crypto;
        window.fundRecords = portfolioData.funds;
        window.propertyRecords = portfolioData.property;
        window.paymentRecords = portfolioData.payments;
        
        // 更新所有表格和摘要
        await updateAllTablesAndSummary();
        
        // 只有在 electron-store 可用時才顯示已連線狀態
        const storeStatus = storeManager.getStatus();
        if (storeStatus.available) {
            updateDatabaseStatus('connected', `electron-store 資料載入成功 (${stats.總記錄數} 筆記錄)`);
        } else {
            updateDatabaseStatus('disconnected', `離線模式 - 已載入 ${stats.總記錄數} 筆記錄`);
        }
        console.log('✅ 資料載入和顯示完成');
        
    } catch (error) {
        console.error('❌ 資料載入失敗:', error);
        updateDatabaseStatus('error', '資料載入失敗');
        
        // 使用空資料繼續運行
        const emptyData = validateData(null);
        updateAllRecords(emptyData);
        
        window.stockRecords = emptyData.stocks;
        window.cryptoRecords = emptyData.crypto;
        window.fundRecords = emptyData.funds;
        window.propertyRecords = emptyData.property;
        window.paymentRecords = emptyData.payments;
    }
}

/**
 * 應用程式啟動函數
 */
async function startApp() {
    console.log("🚀 投資紀錄表啟動 - 純 electron-store 架構");

    try {
        // 1. 等待 electronAPI 準備就緒
        updateDatabaseStatus('connecting', '正在初始化 electronAPI...');
        let retries = 0;
        while (!window.electronAPI && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        if (!window.electronAPI) {
            console.warn('⚠️ electronAPI 在 5 秒後仍不可用，繼續啟動');
            updateDatabaseStatus('disconnected', 'electronAPI 不可用');
        } else {
            console.log('✅ electronAPI 已準備就緒');
        }

        // 2. 初始化存儲管理器
        updateDatabaseStatus('connecting', '正在初始化存儲管理器...');
        const initSuccess = await storeManager.init();
        const status = storeManager.getStatus();
        console.log('🔧 存儲管理器狀態:', status);
        
        // 根據初始化結果更新狀態
        if (initSuccess && status.available) {
            updateDatabaseStatus('connected', 'electron-store 已就緒');
        } else if (status.initialized && !status.isElectron) {
            updateDatabaseStatus('disconnected', '離線模式 - 資料無法持久化');
        } else {
            updateDatabaseStatus('error', '存儲初始化失敗');
        }

        // 3. 初始化 UI 組件
        await initializeApp();
        console.log('✅ UI 組件初始化完成');

        // 4. 載入和顯示資料
        await loadAndDisplayData();

        // 5. 初始化各個功能頁面
        try {
            initializeStockPage();
            initializeFundPage();  
            initializeCryptoPage();
            initializePropertyPage();
            console.log('✅ 功能頁面初始化完成');
        } catch (error) {
            console.warn('⚠️ 功能頁面初始化有問題:', error);
        }

        // 股票 API 功能已暫時停用
        console.log('ℹ️ 股票 API 功能已暫時停用');

        // 7. 預載熱門股票（如果可用）
        try {
            await preloadPopularStocks();
            console.log('✅ 熱門股票預載完成');
        } catch (error) {
            console.warn('⚠️ 熱門股票預載失敗:', error);
        }

        // 綁定 API 控制面板按鈕（若存在於頁面）
        const bindApiPanelControls = async () => {
            try {
                const { clearStockNameCache, getCacheStats, queryStockName } = await import('./api/stockApiService.js');
                const btnTest = document.getElementById('btnApiTest');
                const btnStats = document.getElementById('btnCacheStats');
                const btnClear = document.getElementById('btnClearCache');
                const input = document.getElementById('apiTestSymbol');
                const cacheCount = document.getElementById('cacheCount');
                const lastResult = document.getElementById('apiLastResult');

                if (!btnTest && !btnStats && !btnClear) {
                    console.debug('ℹ️ API 面板尚未出現在 DOM 中，稍後重試');
                    return false;
                }

                const refreshStats = () => {
                    const stats = getCacheStats();
                    if (cacheCount) cacheCount.textContent = String(stats.total);
                };

                if (btnTest && input) {
                    btnTest.addEventListener('click', async () => {
                        const code = input.value.trim();
                        if (!code) return;
                        const market = /[a-zA-Z]/.test(code) ? '美股' : '台股';
                        const name = await queryStockName(market, code);
                        if (lastResult) lastResult.textContent = name ? `${code} ${name}` : '(無結果)';
                        refreshStats();
                    });
                }

                if (btnStats) btnStats.addEventListener('click', refreshStats);

                if (btnClear) {
                    btnClear.addEventListener('click', () => {
                        clearStockNameCache();
                        refreshStats();
                        if (lastResult) lastResult.textContent = '無';
                    });
                }

                refreshStats();
                console.log('✅ API 控制面板事件已綁定');
                return true;
            } catch (err) {
                console.warn('⚠️ 綁定 API 面板事件失敗：', err);
                return false;
            }
        };

        // 先嘗試一次；若未成功，啟動重試輪詢最多 10 次，每次 300ms
        const firstBindOk = await bindApiPanelControls();
        if (!firstBindOk) {
            let attempts = 0;
            const timer = setInterval(async () => {
                attempts++;
                const ok = await bindApiPanelControls();
                if (ok || attempts >= 10) {
                    clearInterval(timer);
                    if (!ok) console.warn('⚠️ API 面板事件綁定逾時，請確認 DOM 是否存在');
                }
            }, 300);
        }

        // 最終保險：事件委派（即使上面綁定失敗，仍可運作）
        document.addEventListener('click', async (evt) => {
            const testBtn = evt.target.closest('#btnApiTest');
            const statBtn = evt.target.closest('#btnCacheStats');
            const clearBtn = evt.target.closest('#btnClearCache');
            if (!testBtn && !statBtn && !clearBtn) return;
            const { clearStockNameCache, getCacheStats, queryStockName } = await import('./api/stockApiService.js');
            const input = document.getElementById('apiTestSymbol');
            const cacheCount = document.getElementById('cacheCount');
            const lastResult = document.getElementById('apiLastResult');

            const refreshStats = () => {
                const stats = getCacheStats();
                if (cacheCount) cacheCount.textContent = String(stats.total);
            };

            if (testBtn && input) {
                const code = input.value.trim();
                if (!code) return;
                const market = /[a-zA-Z]/.test(code) ? '美股' : '台股';
                const name = await queryStockName(market, code);
                if (lastResult) lastResult.textContent = name ? `${code} ${name}` : '(無結果)';
                refreshStats();
                return;
            }

            if (statBtn) {
                refreshStats();
                return;
            }

            if (clearBtn) {
                clearStockNameCache();
                refreshStats();
                if (lastResult) lastResult.textContent = '無';
            }
        });

        console.log('🎉 應用程式啟動完成！');

    } catch (error) {
        console.error('❌ 應用程式啟動失敗:', error);
        updateDatabaseStatus('error', '應用程式啟動失敗');
        
        // 嘗試顯示錯誤訊息
        if (typeof window.mdAlert === 'function') {
            await window.mdAlert('應用程式啟動失敗，請重新載入頁面');
        } else {
            alert('應用程式啟動失敗，請重新載入頁面');
        }
    }
}

// 當 DOM 載入完成後啟動應用程式
document.addEventListener('DOMContentLoaded', startApp);