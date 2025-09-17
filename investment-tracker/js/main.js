/**
 * @file main.js
 * @description 應用程式主入口點
 */

import { initializeApp, showTab, updateDatabaseStatus } from './ui/uiManager.js';
import { loadFromDatabase, checkDatabaseConnection } from './data/electronStorage.js';
import { updateAllTablesAndSummary } from './features/summary.js';
import { initializeStockPage, preloadPopularStocks } from './features/stocks.js';
import { initializeFundPage } from './features/funds.js';
import { initializeCryptoPage } from './features/crypto.js';
import { initializeStockApiControls } from './ui/stockApiControls.js';

/**
 * 應用程式初始化函數
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Electron 投資紀錄表啟動");

    // 1. 初始化所有 UI 元件和事件監聽器
    await initializeApp();
    
    // 2. 檢查資料庫連線狀態
    updateDatabaseStatus('connecting', '正在連線...');
    
    try {
        // 等待後端服務準備就緒 - 減少重試次數和等待時間
        let retries = 0;
        const maxRetries = 2; // 大幅減少重試次數
        
        while (retries < maxRetries) {
            const isConnected = await checkDatabaseConnection();
            if (isConnected) {
                updateDatabaseStatus('connected', 'SQLite 已連線');
                console.log("✅ SQLite 資料庫連線成功");
                break;
            } else {
                retries++;
                if (retries < maxRetries) {
                    console.log(`⏳ 等待資料庫服務啟動... (${retries}/${maxRetries})`);
                    updateDatabaseStatus('connecting', `連線中... (${retries}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 減少到 1 秒
                } else {
                    throw new Error('無法連接到資料庫服務');
                }
            }
        }
        
        // 3. 從 SQLite 資料庫載入資料
        await loadFromDatabase();
        
    } catch (error) {
        console.error('資料庫連線失敗:', error);
        updateDatabaseStatus('disconnected', '離線模式');
        
        // 顯示友善的通知訊息，但不阻擋使用
        const errorMsg = `🔄 資料庫服務尚未就緒，目前以離線模式運行\n\n✅ 您仍可以正常使用所有功能\n💾 資料會儲存在本地，下次啟動時自動同步\n\n如需立即連接資料庫，請稍後重新啟動程式`;
        
        // 延遲顯示通知，避免影響啟動體驗
        setTimeout(() => {
            console.log('📢 顯示離線模式通知');
            // 使用非阻塞式通知，改善用戶體驗
            if (window.electronAPI) {
                // 在 Electron 環境中使用更簡潔的通知
                console.log(errorMsg);
            } else {
                alert(errorMsg);
            }
        }, 3000); // 延遲3秒後顯示
    }
    
    // 5. 初始化各功能頁面
    initializeStockPage();
    initializeFundPage();
    initializeCryptoPage();
    
    // 6. 顯示預設頁籤並更新所有內容
    console.log("資料載入完成，顯示預設頁籤。");
    showTab('stocks'); 
    updateAllTablesAndSummary();
    
    // 7. 初始化API控制界面
    initializeStockApiControls();
    
    // 8. 預載熱門股票名稱 (背景執行，不阻塞UI)
    setTimeout(async () => {
        try {
            await preloadPopularStocks();
        } catch (error) {
            console.warn('預載股票名稱時發生錯誤:', error);
        }
    }, 2000); // 延遲2秒後開始預載，讓UI先完成載入
});