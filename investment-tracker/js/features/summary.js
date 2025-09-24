/**
 * @file summary.js
 * @description 總覽分析頁面功能與資料管理
 */

import { stockRecords, fundRecords, cryptoRecords, propertyRecords, paymentRecords } from '../core/state.js';
import { storeManager } from '../data/storeManager.js';
import { validateData } from '../data/dataStructure.js';
import { updateStockTable, updateStockHoldingsTable } from './stocks.js';
import { updateFundTable, updateFundHoldingsTable } from './funds.js';
import { updateCryptoTable, updateCryptoHoldingsTable } from './crypto.js';
import { updatePropertyTable, updatePaymentTable } from './property.js';
import { updatePortfolioAnalysis } from './portfolio-analysis.js';
import { updateLastSaveTime } from '../ui/uiManager.js';

/**
 * 更新所有資料表格的顯示。
 */
function updateAllTables() {
    updateStockTable();
    updateStockHoldingsTable();
    updateFundTable();
    updateFundHoldingsTable();
    updateCryptoTable();
    updateCryptoHoldingsTable();
    updatePropertyTable();
    updatePaymentTable();
    updatePortfolioAnalysis();
}

/**
 * 計算並更新總覽頁面的所有統計數據。
 */
export function updateSummary() {
    // 台股
    const twStockTotal = stockRecords.filter(r => r.market === '台股').reduce((sum, r) => sum + r.total, 0);
    const twStockElement = document.getElementById('twStockTotalInvest');
    if (twStockElement) twStockElement.textContent = `TWD ${twStockTotal.toLocaleString()}`;
    
    const twStockCountElement = document.getElementById('twStockCount');
    if (twStockCountElement) twStockCountElement.textContent = `${stockRecords.filter(r => r.market === '台股' && r.assetType === '股票').length} 檔`;
    
    const twEtfCountElement = document.getElementById('twEtfCount');
    if (twEtfCountElement) twEtfCountElement.textContent = `${stockRecords.filter(r => r.market === '台股' && r.assetType === 'ETF').length} 檔`;
    
    // 美股
    const usStockTotal = stockRecords.filter(r => r.market === '美股').reduce((sum, r) => sum + r.total, 0);
    const usStockElement = document.getElementById('usStockTotalInvest');
    if (usStockElement) usStockElement.textContent = `USD ${usStockTotal.toLocaleString()}`;
    
    const usStockCountElement = document.getElementById('usStockCount');
    if (usStockCountElement) usStockCountElement.textContent = `${stockRecords.filter(r => r.market === '美股' && r.assetType === '股票').length} 檔`;
    
    const usEtfCountElement = document.getElementById('usEtfCount');
    if (usEtfCountElement) usEtfCountElement.textContent = `${stockRecords.filter(r => r.market === '美股' && r.assetType === 'ETF').length} 檔`;

    // 基金
    const fundTotal = fundRecords.reduce((sum, r) => sum + r.amount, 0);
    const fundElement = document.getElementById('fundTotalInvest');
    if (fundElement) fundElement.textContent = `$${fundTotal.toLocaleString()}`;

    // 加密貨幣
    const cryptoTotal = cryptoRecords.reduce((sum, r) => sum + r.total, 0);
    const cryptoElement = document.getElementById('cryptoTotalInvest');
    if (cryptoElement) cryptoElement.textContent = `USD ${cryptoTotal.toLocaleString()}`;

    // 房貸
    const propertyPaid = paymentRecords.reduce((sum, r) => sum + (r.principal || 0), 0);
    const propertyElement = document.getElementById('propertyPaidPrincipal');
    if (propertyElement) propertyElement.textContent = `$${propertyPaid.toLocaleString()}`;
}

/**
 * 匯出所有資料為 JSON 檔案。
 */
export async function exportData() {
    try {
        await storeManager.exportData();
    } catch (error) {
        console.error('❌ 資料匯出失敗:', error);
        if (typeof window.mdAlert === 'function') {
            window.mdAlert('資料匯出失敗，請稍後重試');
        }
    }
}

/**
 * 從 JSON 檔案匯入資料。
 */
export async function importData(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;
        
        const text = await file.text();
        const data = JSON.parse(text);
        const validatedData = validateData(data);
        
        await storeManager.importData(validatedData);
        
        // 重新載入頁面以更新所有介面
        location.reload();
    } catch (error) {
        console.error('❌ 資料匯入失敗:', error);
        if (typeof window.mdAlert === 'function') {
            window.mdAlert('資料匯入失敗，請檢查檔案格式');
        }
    }
}

/**
 * 清空所有資料。
 */
export async function clearAllData() {
    try {
        await storeManager.clearAll();
        
        // 重新載入頁面以更新所有介面
        location.reload();
    } catch (error) {
        console.error('❌ 清空資料失敗:', error);
        if (typeof window.mdAlert === 'function') {
            window.mdAlert('清空資料失敗，請稍後重試');
        }
    }
}

/**
 * 更新所有表格和總覽統計的中心函式。
 */
export function updateAllTablesAndSummary() {
    updateAllTables();
    updateSummary();
} 