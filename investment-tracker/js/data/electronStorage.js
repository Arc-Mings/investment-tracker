/**
 * @file electronStorage.js
 * @description 純 SQLite 資料儲存管理 - Electron 版本
 * 
 * 這個模組負責處理所有資料的儲存和載入，包括：
 * 1. SQLite 資料庫的讀寫操作 (移除 localStorage)
 * 2. 資料匯出和匯入功能
 * 3. 清空所有資料的功能
 */

import { stockRecords, fundRecords, cryptoRecords, propertyRecords, paymentRecords } from '../core/state.js';
import { updateAllTablesAndSummary } from '../features/summary.js';
import { updateLastSaveTime } from '../ui/uiManager.js';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * 通用 API 請求函數
 */
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 處理無內容響應 (204 No Content)
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`API 請求失敗 [${url}]:`, error);
        throw error;
    }
}

/**
 * 將所有紀錄儲存到 SQLite 資料庫
 */
export async function saveToDatabase() {
    try {
        console.log("💾 開始儲存資料到 SQLite 資料庫...");

        // 清空現有資料 (可選，或者實現增量更新)
        // await clearDatabaseRecords();

        // 批量儲存股票紀錄
        for (const stock of stockRecords) {
            await apiRequest('/stocks', {
                method: 'POST',
                body: JSON.stringify(stock)
            });
        }

        // 批量儲存基金紀錄
        for (const fund of fundRecords) {
            await apiRequest('/funds', {
                method: 'POST',
                body: JSON.stringify(fund)
            });
        }

        // 批量儲存加密貨幣紀錄
        for (const crypto of cryptoRecords) {
            await apiRequest('/cryptos', {
                method: 'POST',
                body: JSON.stringify(crypto)
            });
        }

        // 批量儲存房產紀錄
        for (const property of propertyRecords) {
            await apiRequest('/properties', {
                method: 'POST',
                body: JSON.stringify(property)
            });
        }

        // 批量儲存繳款紀錄
        for (const payment of paymentRecords) {
            await apiRequest('/payments', {
                method: 'POST',
                body: JSON.stringify(payment)
            });
        }

        console.log("✅ 資料已成功儲存到 SQLite 資料庫");
        updateLastSaveTime();
    } catch (error) {
        console.error('儲存資料到資料庫失敗:', error);
        
        // 顯示用戶友善的錯誤訊息
        const errorMsg = error.message.includes('fetch') 
            ? '無法連接到資料庫服務，請重新啟動程式'
            : '儲存資料失敗，請稍後再試';
        
        alert(`${errorMsg}\n\n技術詳情：${error.message}`);
        throw error;
    }
}

/**
 * 從 SQLite 資料庫載入所有紀錄，失敗時自動使用 localStorage
 */
export async function loadFromDatabase() {
    console.log("📂 開始從 SQLite 資料庫載入資料...");
    
    try {
        // 從 API 獲取所有資料
        const data = await apiRequest('/records');
        
        if (!data) {
            console.log("📭 資料庫無資料，嘗試從 localStorage 載入...");
            loadFromLocalStorageBackup();
            return;
        }

        // 使用 splice 來更新陣列，以保持引用不變
        stockRecords.splice(0, stockRecords.length, ...(data.stocks || []));
        fundRecords.splice(0, fundRecords.length, ...(data.funds || []));
        cryptoRecords.splice(0, cryptoRecords.length, ...(data.cryptos || []));
        propertyRecords.splice(0, propertyRecords.length, ...(data.properties || []));
        paymentRecords.splice(0, paymentRecords.length, ...(data.payments || []));

        console.log(`✅ 成功載入資料：
            股票: ${stockRecords.length} 筆
            基金: ${fundRecords.length} 筆  
            加密貨幣: ${cryptoRecords.length} 筆
            房產: ${propertyRecords.length} 筆
            繳款: ${paymentRecords.length} 筆`);

        updateAllTablesAndSummary();
        updateLastSaveTime();
    } catch (error) {
        console.error('從資料庫載入資料失敗:', error);
        console.log('🔄 嘗試從 localStorage 載入備援資料...');
        
        // 使用 localStorage 作為備援
        loadFromLocalStorageBackup();
        throw error;
    }
}

/**
 * 從 localStorage 載入備援資料
 */
function loadFromLocalStorageBackup() {
    try {
        const saved = localStorage.getItem('investmentTracker');
        if (saved) {
            const data = JSON.parse(saved);
            
            stockRecords.splice(0, stockRecords.length, ...(data.stocks || []));
            fundRecords.splice(0, fundRecords.length, ...(data.funds || []));
            cryptoRecords.splice(0, cryptoRecords.length, ...(data.crypto || []));
            propertyRecords.splice(0, propertyRecords.length, ...(data.property || []));
            paymentRecords.splice(0, paymentRecords.length, ...(data.payments || []));
            
            console.log('✅ 已從 localStorage 載入備援資料');
            updateAllTablesAndSummary();
            updateLastSaveTime();
        } else {
            console.log('📝 無備援資料，使用空白狀態');
        }
    } catch (error) {
        console.error('載入 localStorage 備援失敗:', error);
    }
}

/**
 * 新增單筆股票紀錄到資料庫
 */
export async function addStockToDatabase(stockData) {
    try {
        const result = await apiRequest('/stocks', {
            method: 'POST',
            body: JSON.stringify(stockData)
        });
        
        console.log("✅ 股票紀錄已新增到資料庫");
        return result;
    } catch (error) {
        console.error('新增股票紀錄失敗:', error);
        throw error;
    }
}

/**
 * 刪除股票紀錄從資料庫
 */
export async function deleteStockFromDatabase(stockId) {
    try {
        await apiRequest(`/stocks/${stockId}`, {
            method: 'DELETE'
        });
        
        console.log("✅ 股票紀錄已從資料庫刪除");
    } catch (error) {
        console.error('刪除股票紀錄失敗:', error);
        throw error;
    }
}

/**
 * 新增單筆基金紀錄到資料庫
 */
export async function addFundToDatabase(fundData) {
    try {
        const result = await apiRequest('/funds', {
            method: 'POST',
            body: JSON.stringify(fundData)
        });
        
        console.log("✅ 基金紀錄已新增到資料庫");
        return result;
    } catch (error) {
        console.error('新增基金紀錄失敗:', error);
        throw error;
    }
}

/**
 * 刪除基金紀錄從資料庫
 */
export async function deleteFundFromDatabase(fundId) {
    try {
        await apiRequest(`/funds/${fundId}`, {
            method: 'DELETE'
        });
        
        console.log("✅ 基金紀錄已從資料庫刪除");
    } catch (error) {
        console.error('刪除基金紀錄失敗:', error);
        throw error;
    }
}

/**
 * 新增單筆加密貨幣紀錄到資料庫
 */
export async function addCryptoToDatabase(cryptoData) {
    try {
        const result = await apiRequest('/cryptos', {
            method: 'POST',
            body: JSON.stringify(cryptoData)
        });
        
        console.log("✅ 加密貨幣紀錄已新增到資料庫");
        return result;
    } catch (error) {
        console.error('新增加密貨幣紀錄失敗:', error);
        throw error;
    }
}

/**
 * 刪除加密貨幣紀錄從資料庫
 */
export async function deleteCryptoFromDatabase(cryptoId) {
    try {
        await apiRequest(`/cryptos/${cryptoId}`, {
            method: 'DELETE'
        });
        
        console.log("✅ 加密貨幣紀錄已從資料庫刪除");
    } catch (error) {
        console.error('刪除加密貨幣紀錄失敗:', error);
        throw error;
    }
}

/**
 * 將所有紀錄匯出成一個 JSON 檔案
 */
export function exportData() {
    const data = {
        stocks: stockRecords,
        funds: fundRecords,
        crypto: cryptoRecords,
        property: propertyRecords,
        payments: paymentRecords,
        exportTime: new Date().toISOString(),
        version: '2.0-electron'
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
    
    console.log("✅ 資料匯出完成");
}

/**
 * 處理檔案選擇事件，從 JSON 檔案匯入資料
 * @param {Event} event - 檔案輸入框的 change 事件
 */
export function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // 簡單驗證檔案格式
            if (data.stocks && Array.isArray(data.stocks)) {
                if (confirm('確定要匯入備份資料嗎？這將覆蓋目前的所有記錄！')) {
                    // 先清空記憶體中的陣列
                    stockRecords.length = 0;
                    fundRecords.length = 0;
                    cryptoRecords.length = 0;
                    propertyRecords.length = 0;
                    paymentRecords.length = 0;
                    
                    // 再將新資料載入到記憶體
                    stockRecords.push(...(data.stocks || []));
                    fundRecords.push(...(data.funds || []));
                    cryptoRecords.push(...(data.crypto || []));
                    propertyRecords.push(...(data.property || []));
                    paymentRecords.push(...(data.payments || []));
                    
                    // 同步到資料庫
                    await saveToDatabase();
                    
                    updateAllTablesAndSummary(); // 更新 UI
                    alert('資料匯入成功！');
                }
            } else {
                alert('檔案格式不正確，無法匯入。');
            }
        } catch (error) {
            alert('讀取檔案失敗，請確認檔案格式是否為正確的 JSON。');
            console.error('匯入資料錯誤:', error);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // 清空 input value
}

/**
 * 清空所有投資紀錄
 */
export async function clearAllData() {
    if (confirm('確定要清空所有投資紀錄嗎？此操作無法復原！')) {
        try {
            // 清空記憶體中的陣列
            stockRecords.length = 0;
            fundRecords.length = 0;
            cryptoRecords.length = 0;
            propertyRecords.length = 0;
            paymentRecords.length = 0;
            
            // 這裡應該要清空資料庫，但需要後端提供清空 API
            // 暫時先重新載入空資料
            updateAllTablesAndSummary();
            updateLastSaveTime();
            
            console.log("✅ 所有資料已清空");
            alert('所有投資紀錄已清空。');
        } catch (error) {
            console.error('清空資料失敗:', error);
            alert('清空資料失敗！');
        }
    }
}

/**
 * 檢查資料庫連線狀態
 */
export async function checkDatabaseConnection() {
    try {
        await apiRequest('/health');
        return true;
    } catch (error) {
        console.error('資料庫連線檢查失敗:', error);
        return false;
    }
}

/**
 * 通用新增紀錄函數（與舊版 API 相容）
 * @param {string} type - 紀錄類型：'stocks', 'funds', 'crypto', 'properties', 'payments'
 * @param {Object} data - 紀錄資料
 */
export async function addRecord(type, data) {
    try {
        let result;
        
        switch (type) {
            case 'stocks':
                result = await addStockToDatabase(data);
                stockRecords.push(data);
                break;
            case 'funds':
                result = await addFundToDatabase(data);
                fundRecords.push(data);
                break;
            case 'crypto':
                result = await addCryptoToDatabase(data);
                cryptoRecords.push(data);
                break;
            case 'properties':
                // 需要實現 addPropertyToDatabase
                console.warn('房產紀錄新增功能待實現');
                propertyRecords.push(data);
                break;
            case 'payments':
                // 需要實現 addPaymentToDatabase
                console.warn('繳款紀錄新增功能待實現');
                paymentRecords.push(data);
                break;
            default:
                throw new Error(`不支援的紀錄類型: ${type}`);
        }
        
        // 更新 UI
        updateAllTablesAndSummary();
        
        return result;
    } catch (error) {
        console.error(`新增 ${type} 紀錄失敗:`, error);
        throw error;
    }
}

/**
 * 相容性函數：保持與原有代碼的相容性
 */
export const saveToLocalStorage = saveToDatabase;
export const loadFromLocalStorage = loadFromDatabase;

console.log("📊 Electron SQLite 儲存服務已載入");
