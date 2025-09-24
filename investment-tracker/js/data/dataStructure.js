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
        stocks: Array.isArray(data.stocks) ? data.stocks : [],
        crypto: Array.isArray(data.crypto) ? data.crypto : [],
        funds: Array.isArray(data.funds) ? data.funds : [],
        property: Array.isArray(data.property) ? data.property : [],
        payments: Array.isArray(data.payments) ? data.payments : []
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
