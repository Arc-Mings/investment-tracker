/**
 * @file 全域事件橋接
 * @description 這個模組的唯一職責是導入所有需要被 HTML 的 on-click 屬性
 *              直接呼叫的函式，並將它們掛載到全域的 window 物件上。
 *              這是一個必要的步驟，用以橋接 ES6 模組作用域與傳統的 HTML 事件處理。
 */

// 從各個功能模組導入需要公開的函式
import { addStockBuyRecord, addStockSellRecord, deleteStockRecord, updateStockHoldingsTable, updateBuyStockForm, updateSellStockForm, preloadPopularStocks } from '../features/stocks.js';
import { addFundRecord, deleteFundRecord, updateFundHoldingsTable } from '../features/funds.js';
import { addCryptoRecord, deleteCryptoRecord, updateCryptoHoldingsTable, initializeCryptoPage } from '../features/crypto.js';
import { addPropertyRecord, deletePropertyRecord, addPaymentRecord, deletePaymentRecord } from '../features/property.js';
import { updateSummary, exportData, importData, clearAllData } from '../features/summary.js';
import { showTab } from '../ui/uiManager.js';

/**
 * 初始化所有 on-click 事件所需的函式，將它們掛載到 window。
 */
export function initializeEventListeners() {
    console.log("Initializing global event listeners for on-click attributes.");
    
    // UI 管理
    window.showTab = showTab;
    
    // 股票
    window.addStockBuyRecord = addStockBuyRecord;
    window.addStockSellRecord = addStockSellRecord;
    window.deleteStockRecord = deleteStockRecord;
    window.updateStockHoldingsTable = updateStockHoldingsTable;
    window.updateBuyStockForm = updateBuyStockForm;
    window.updateSellStockForm = updateSellStockForm;

    // 基金
    window.addFundRecord = addFundRecord;
    window.deleteFundRecord = deleteFundRecord;
    window.updateFundHoldingsTable = updateFundHoldingsTable;

    // 加密貨幣
    window.addCryptoRecord = addCryptoRecord;
    window.deleteCryptoRecord = deleteCryptoRecord;
    window.updateCryptoHoldingsTable = updateCryptoHoldingsTable;

    // 房產
    window.addPropertyRecord = addPropertyRecord;
    window.deletePropertyRecord = deletePropertyRecord;
    window.addPaymentRecord = addPaymentRecord;
    window.deletePaymentRecord = deletePaymentRecord;

    // 總覽與資料管理
    window.updateSummary = updateSummary;
    window.exportData = exportData;
    window.importData = importData;
    window.clearAllData = clearAllData;
    
    // 讓匯入按鈕能觸發隱藏的 file input
    window.triggerImport = () => document.getElementById('importFile').click();
    
    // 初始化加密貨幣頁面的特殊輸入處理
    initializeCryptoPage();
} 