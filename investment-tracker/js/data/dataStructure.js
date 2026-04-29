/**
 * DataStructure - 統一的資料結構定義和驗證
 */

/**
 * 預設的投資組合資料結構
 */
export const defaultPortfolioData = {
    stocks: [],      // 股票記錄
    crypto: [],      // 加密貨幣記錄  
    funds: [],       // 基金記錄
    property: [],    // 房地產記錄
    payments: []     // 收支記錄
};

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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

/**
 * 驗證並標準化資料格式
 * @param {Object} data - 原始資料
 * @returns {Object} 標準化後的資料
 */
export function validateData(data) {
    console.log('🔍 驗證資料格式...');
    
    // 如果資料無效，返回預設結構
    if (!data || typeof data !== 'object') {
        console.warn('⚠️ 資料無效，使用預設結構');
        return { ...defaultPortfolioData };
    }
    
    // 驗證並修正每個欄位
    const validatedData = {
        stocks: sanitizeStocks(data.stocks),
        crypto: sanitizeCrypto(data.crypto),
        funds: sanitizeFunds(data.funds),
        property: sanitizeProperty(data.property),
        payments: sanitizePayments(data.payments)
    };
    
    console.log('✅ 資料驗證完成:', {
        stocks: validatedData.stocks.length,
        crypto: validatedData.crypto.length,
        funds: validatedData.funds.length,
        property: validatedData.property.length,
        payments: validatedData.payments.length
    });
    
    return validatedData;
}

/**
 * 深度複製資料（避免引用問題）
 * @param {Object} data - 要複製的資料
 * @returns {Object} 複製後的資料
 */
export function cloneData(data) {
    try {
        return JSON.parse(JSON.stringify(data));
    } catch (error) {
        console.error('❌ 資料複製失敗:', error);
        return { ...defaultPortfolioData };
    }
}

/**
 * 檢查資料是否為空
 * @param {Object} data - 要檢查的資料
 * @returns {boolean} 是否為空
 */
export function isDataEmpty(data) {
    if (!data || typeof data !== 'object') {
        return true;
    }
    
    const validData = validateData(data);
    return (
        validData.stocks.length === 0 &&
        validData.crypto.length === 0 &&
        validData.funds.length === 0 &&
        validData.property.length === 0 &&
        validData.payments.length === 0
    );
}

/**
 * 獲取資料統計
 * @param {Object} data - 要統計的資料
 * @returns {Object} 統計結果
 */
export function getDataStats(data) {
    const validData = validateData(data);
    
    return {
        總記錄數: validData.stocks.length + validData.crypto.length + 
                validData.funds.length + validData.property.length + 
                validData.payments.length,
        股票記錄: validData.stocks.length,
        加密貨幣記錄: validData.crypto.length,
        基金記錄: validData.funds.length,
        房地產記錄: validData.property.length,
        收支記錄: validData.payments.length
    };
}
