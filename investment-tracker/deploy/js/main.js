/**
 * @file main.js
 * @description 應用程式主入口點
 */

import { initializeApp, showTab } from './ui/uiManager.js';
import { loadFromLocalStorage } from './data/storage.js';
import { updateAllTablesAndSummary } from './features/summary.js';
import { initializeStockPage, preloadPopularStocks } from './features/stocks.js';
import { initializeFundPage } from './features/funds.js';
import { initializeCryptoPage } from './features/crypto.js';
import { initializeStockApiControls } from './ui/stockApiControls.js';

/**
 * 應用程式初始化函數
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log("應用程式啟動");

    // 1. 初始化所有 UI 元件和事件監聽器
    initializeApp();

    // 2. 從本地儲存載入資料
    loadFromLocalStorage();
    
    // 3. 初始化各功能頁面
    initializeStockPage();
    initializeFundPage();
    initializeCryptoPage();
    
    // 4. 顯示預設頁籤並更新所有內容
    console.log("資料載入完成，顯示預設頁籤。");
    showTab('stocks'); 
    updateAllTablesAndSummary();
    
    // 5. 初始化API控制界面
    initializeStockApiControls();
    
    // 6. 預載熱門股票名稱 (背景執行，不阻塞UI)
    setTimeout(async () => {
        try {
            await preloadPopularStocks();
        } catch (error) {
            console.warn('預載股票名稱時發生錯誤:', error);
        }
    }, 2000); // 延遲2秒後開始預載，讓UI先完成載入
});