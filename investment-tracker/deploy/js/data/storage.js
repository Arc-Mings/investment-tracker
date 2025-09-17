/**
 * @file storage.js
 * @description 資料儲存管理
 * 
 * 這個模組負責處理所有資料的儲存和載入，包括：
 * 1. 本地儲存 (localStorage) 的讀寫操作
 * 2. 資料匯出和匯入功能
 * 3. 清空所有資料的功能
 */

import { stockRecords, fundRecords, cryptoRecords, propertyRecords, paymentRecords } from '../core/state.js';
import { updateAllTablesAndSummary } from '../features/summary.js';
import { updateLastSaveTime } from '../ui/uiManager.js';

const STORAGE_KEY = 'investmentTracker';

/**
 * 將所有紀錄儲存到 localStorage。
 */
export function saveToLocalStorage() {
    try {
        const data = {
            stocks: stockRecords,
            funds: fundRecords,
            crypto: cryptoRecords,
            property: propertyRecords,
            payments: paymentRecords,
            lastSave: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log("Data saved to localStorage successfully.");
        updateLastSaveTime();
    } catch (error) {
        console.error('儲存資料到本地失敗:', error);
        alert('儲存資料失敗！');
    }
}

/**
 * 從 localStorage 載入所有紀錄。
 */
export function loadFromLocalStorage() {
    console.log("Loading data from localStorage...");
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            console.log("No saved data found in localStorage.");
            return;
        }
        
        const data = JSON.parse(saved);
        
        // 使用 splice 來更新陣列，以保持引用不變
        stockRecords.splice(0, stockRecords.length, ...(data.stocks || []));
        fundRecords.splice(0, fundRecords.length, ...(data.funds || []));
        cryptoRecords.splice(0, cryptoRecords.length, ...(data.crypto || []));
        propertyRecords.splice(0, propertyRecords.length, ...(data.property || []));
        paymentRecords.splice(0, paymentRecords.length, ...(data.payments || []));

        console.log("Data loaded successfully from localStorage.");
        updateAllTablesAndSummary();
        updateLastSaveTime();
    } catch (error) {
        console.error('從本地載入資料失敗:', error);
        alert('載入資料失敗！');
    }
}

/**
 * 將所有紀錄匯出成一個 JSON 檔案。
 */
export function exportData() {
    const data = {
        stocks: stockRecords,
        funds: fundRecords,
        crypto: cryptoRecords,
        property: propertyRecords,
        payments: paymentRecords,
        exportTime: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `投資紀錄備份_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("Data exported successfully.");
}

/**
 * 處理檔案選擇事件，從 JSON 檔案匯入資料。
 * @param {Event} event - 檔案輸入框的 change 事件。
 */
export function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // 簡單驗證檔案格式
            if (data.stocks && Array.isArray(data.stocks)) {
                if (confirm('確定要匯入備份資料嗎？這將覆蓋目前的所有記錄！')) {
                    // 先清空現有陣列
                    stockRecords.length = 0;
                    fundRecords.length = 0;
                    cryptoRecords.length = 0;
                    propertyRecords.length = 0;
                    paymentRecords.length = 0;
                    
                    // 再將新資料載入
                    stockRecords.push(...(data.stocks || []));
                    fundRecords.push(...(data.funds || []));
                    cryptoRecords.push(...(data.crypto || []));
                    propertyRecords.push(...(data.property || []));
                    paymentRecords.push(...(data.payments || []));
                    
                    updateAllTablesAndSummary(); // 更新 UI
                    saveToLocalStorage(); // 儲存到本地
                    alert('資料匯入成功！');
                }
            } else {
                alert('檔案格式不正確，無法匯入。');
            }
        } catch (error) {
            alert('讀取檔案失敗，請確認檔案格式是否為正確的 JSON。');
            console.error(error);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // 清空 input value，確保下次選擇同檔案仍能觸發 change 事件
}

/**
 * 清空所有投資紀錄。
 */
export function clearAllData() {
    if (confirm('⚠️ 警告：這將刪除所有投資記錄！此操作無法復原。確定要繼續嗎？')) {
        if (confirm('再次確認：真的要刪除所有資料嗎？')) {
            stockRecords.length = 0;
            fundRecords.length = 0;
            cryptoRecords.length = 0;
            propertyRecords.length = 0;
            paymentRecords.length = 0;
            
            updateAllTablesAndSummary();
            saveToLocalStorage();
            alert('所有資料已清空。');
        }
    }
} 