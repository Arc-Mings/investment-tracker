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
const STORAGE_VERSION = '1.1';

function toNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function toText(value) {
    return String(value ?? '').trim();
}

function sanitizeStocks(records) {
    if (!Array.isArray(records)) return [];
    return records.map(record => ({
        id: toNumber(record?.id, Date.now()),
        market: toText(record?.market),
        assetType: toText(record?.assetType),
        code: toText(record?.code),
        name: toText(record?.name),
        type: toText(record?.type),
        date: toText(record?.date),
        shares: toNumber(record?.shares),
        price: toNumber(record?.price),
        fee: toNumber(record?.fee),
        tax: toNumber(record?.tax),
        total: toNumber(record?.total)
    }));
}

function sanitizeFunds(records) {
    if (!Array.isArray(records)) return [];
    return records.map(record => ({
        id: toNumber(record?.id, Date.now()),
        type: toText(record?.type),
        name: toText(record?.name),
        date: toText(record?.date),
        amount: toNumber(record?.amount),
        nav: toNumber(record?.nav),
        units: toNumber(record?.units),
        fee: toNumber(record?.fee)
    }));
}

function sanitizeCrypto(records) {
    if (!Array.isArray(records)) return [];
    return records.map(record => ({
        id: toNumber(record?.id, Date.now()),
        symbol: toText(record?.symbol),
        type: toText(record?.type),
        date: toText(record?.date),
        exchange: toText(record?.exchange),
        amount: toNumber(record?.amount),
        price: toNumber(record?.price),
        fee: toNumber(record?.fee),
        total: toNumber(record?.total)
    }));
}

function sanitizeProperty(records) {
    if (!Array.isArray(records)) return [];
    return records.map(record => ({
        id: toNumber(record?.id, Date.now()),
        name: toText(record?.name),
        total: toNumber(record?.total),
        down: toNumber(record?.down),
        loan: toNumber(record?.loan),
        rate: toNumber(record?.rate),
        years: toNumber(record?.years)
    }));
}

function sanitizePayments(records) {
    if (!Array.isArray(records)) return [];
    return records.map(record => ({
        id: toNumber(record?.id, Date.now()),
        date: toText(record?.date),
        amount: toNumber(record?.amount),
        principal: toNumber(record?.principal),
        interest: toNumber(record?.interest)
    }));
}

function sanitizePortfolioData(rawData = {}) {
    return {
        stocks: sanitizeStocks(rawData.stocks),
        funds: sanitizeFunds(rawData.funds),
        crypto: sanitizeCrypto(rawData.crypto),
        property: sanitizeProperty(rawData.property),
        payments: sanitizePayments(rawData.payments)
    };
}

/**
 * 將所有紀錄儲存到 localStorage。
 */
export function saveToLocalStorage() {
    try {
        const sanitized = sanitizePortfolioData({
            stocks: stockRecords,
            funds: fundRecords,
            crypto: cryptoRecords,
            property: propertyRecords,
            payments: paymentRecords
        });
        const data = {
            ...sanitized,
            lastSave: new Date().toISOString(),
            version: STORAGE_VERSION
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
        const sanitized = sanitizePortfolioData(data);
        
        // 使用 splice 來更新陣列，以保持引用不變
        stockRecords.splice(0, stockRecords.length, ...sanitized.stocks);
        fundRecords.splice(0, fundRecords.length, ...sanitized.funds);
        cryptoRecords.splice(0, cryptoRecords.length, ...sanitized.crypto);
        propertyRecords.splice(0, propertyRecords.length, ...sanitized.property);
        paymentRecords.splice(0, paymentRecords.length, ...sanitized.payments);

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
        ...sanitizePortfolioData({
            stocks: stockRecords,
            funds: fundRecords,
            crypto: cryptoRecords,
            property: propertyRecords,
            payments: paymentRecords
        }),
        exportTime: new Date().toISOString(),
        version: STORAGE_VERSION
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
                const sanitized = sanitizePortfolioData(data);
                if (confirm('確定要匯入備份資料嗎？這將覆蓋目前的所有記錄！')) {
                    // 先清空現有陣列
                    stockRecords.length = 0;
                    fundRecords.length = 0;
                    cryptoRecords.length = 0;
                    propertyRecords.length = 0;
                    paymentRecords.length = 0;
                    
                    // 再將新資料載入
                    stockRecords.push(...sanitized.stocks);
                    fundRecords.push(...sanitized.funds);
                    cryptoRecords.push(...sanitized.crypto);
                    propertyRecords.push(...sanitized.property);
                    paymentRecords.push(...sanitized.payments);
                    
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