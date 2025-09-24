/**
 * @file state.js
 * @description 全域狀態管理
 * 
 * 這個檔案定義了應用程式中所有共享的狀態（資料）。
 * 將狀態集中管理可以避免模組間的循環依賴問題，
 * 並讓資料流動更清晰。
 */

// 股票交易紀錄陣列
export let stockRecords = [];

// 基金投資紀錄陣列
export let fundRecords = [];

// 加密貨幣交易紀錄陣列
export let cryptoRecords = [];

// 房地產資訊紀錄陣列
export let propertyRecords = [];

// 房貸繳款紀錄陣列
export let paymentRecords = [];

/**
 * 更新所有狀態變數
 * @param {Object} data - 新的資料
 */
export function updateAllRecords(data) {
    stockRecords.length = 0;
    fundRecords.length = 0;
    cryptoRecords.length = 0;
    propertyRecords.length = 0;
    paymentRecords.length = 0;
    
    if (data.stocks) stockRecords.push(...data.stocks);
    if (data.funds) fundRecords.push(...data.funds);
    if (data.crypto) cryptoRecords.push(...data.crypto);
    if (data.property) propertyRecords.push(...data.property);
    if (data.payments) paymentRecords.push(...data.payments);
    
    console.log('✅ 狀態變數已更新:', {
        stocks: stockRecords.length,
        funds: fundRecords.length,
        crypto: cryptoRecords.length,
        property: propertyRecords.length,
        payments: paymentRecords.length
    });
} 