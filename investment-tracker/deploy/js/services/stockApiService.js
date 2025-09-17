/**
 * @file stockApiService.js
 * @description 股票API查詢服務
 * 
 * 提供動態股票名稱查詢功能，包括：
 * 1. Yahoo Finance API 查詢
 * 2. 本地快取機制
 * 3. 錯誤處理和重試
 * 4. 靜態清單備援
 */

// 快取設定
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24小時
const stockNameCache = new Map();

// API 設定
const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com/v1/finance/search';
const REQUEST_DELAY = 200; // 避免請求太頻繁
let lastRequestTime = 0;

/**
 * 股票名稱快取項目
 */
class CacheItem {
    constructor(name) {
        this.name = name;
        this.timestamp = Date.now();
        this.isValid = true;
    }
    
    isExpired() {
        return Date.now() - this.timestamp > CACHE_EXPIRY_TIME;
    }
}

/**
 * 延遲函數
 * @param {number} ms - 延遲毫秒數
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 格式化股票代號為Yahoo Finance格式
 * @param {string} market - 市場類型
 * @param {string} code - 股票代號
 * @returns {string} 格式化後的代號
 */
function formatStockSymbol(market, code) {
    if (market === '台股') {
        return `${code}.TW`;
    } else if (market === '美股') {
        return code.toUpperCase();
    }
    return code;
}

/**
 * 從Yahoo Finance API查詢股票名稱
 * @param {string} symbol - 格式化後的股票代號
 * @returns {Promise<string|null>} 股票名稱或null
 */
async function queryYahooFinance(symbol) {
    try {
        // 控制請求頻率
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        if (timeSinceLastRequest < REQUEST_DELAY) {
            await delay(REQUEST_DELAY - timeSinceLastRequest);
        }
        lastRequestTime = Date.now();

        const url = `${YAHOO_FINANCE_BASE_URL}?q=${encodeURIComponent(symbol)}&lang=zh-TW&region=TW&quotesCount=1&newsCount=0`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`API請求失敗: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.quotes && data.quotes.length > 0) {
            const quote = data.quotes[0];
            // 優先使用 longName，其次 shortName，最後 symbol
            return quote.longName || quote.shortName || quote.symbol || null;
        }

        return null;
    } catch (error) {
        console.warn(`Yahoo Finance API 查詢失敗 (${symbol}):`, error.message);
        return null;
    }
}

/**
 * 重試機制的API查詢
 * @param {string} symbol - 股票代號
 * @param {number} maxRetries - 最大重試次數
 * @returns {Promise<string|null>} 股票名稱或null
 */
async function queryWithRetry(symbol, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await queryYahooFinance(symbol);
            if (result) {
                return result;
            }
        } catch (error) {
            console.warn(`API查詢第${attempt}次嘗試失敗:`, error.message);
            if (attempt < maxRetries) {
                // 指數退避延遲
                await delay(Math.pow(2, attempt) * 1000);
            }
        }
    }
    return null;
}

/**
 * 從快取獲取股票名稱
 * @param {string} cacheKey - 快取鍵值
 * @returns {string|null} 快取的股票名稱或null
 */
function getFromCache(cacheKey) {
    const cached = stockNameCache.get(cacheKey);
    if (cached && !cached.isExpired()) {
        return cached.name;
    }
    // 清除過期快取
    if (cached && cached.isExpired()) {
        stockNameCache.delete(cacheKey);
    }
    return null;
}

/**
 * 將股票名稱存入快取
 * @param {string} cacheKey - 快取鍵值
 * @param {string} name - 股票名稱
 */
function setCache(cacheKey, name) {
    stockNameCache.set(cacheKey, new CacheItem(name));
}

/**
 * 動態查詢股票名稱 (主要API)
 * @param {string} market - 市場類型 ('台股' 或 '美股')
 * @param {string} code - 股票代號
 * @returns {Promise<string|null>} 股票名稱或null
 */
export async function queryStockName(market, code) {
    const cacheKey = `${market}:${code.toUpperCase()}`;
    
    // 1. 先檢查快取
    const cached = getFromCache(cacheKey);
    if (cached) {
        return cached;
    }

    // 2. 使用API查詢
    const symbol = formatStockSymbol(market, code);
    const apiResult = await queryWithRetry(symbol);
    
    if (apiResult) {
        // 存入快取
        setCache(cacheKey, apiResult);
        return apiResult;
    }

    return null;
}

/**
 * 批量查詢股票名稱
 * @param {Array} stockList - 股票清單 [{market, code}, ...]
 * @returns {Promise<Map>} 查詢結果 Map
 */
export async function batchQueryStockNames(stockList) {
    const results = new Map();
    const concurrentLimit = 5; // 限制併發數量
    
    for (let i = 0; i < stockList.length; i += concurrentLimit) {
        const batch = stockList.slice(i, i + concurrentLimit);
        const promises = batch.map(async ({ market, code }) => {
            const name = await queryStockName(market, code);
            return { market, code, name };
        });
        
        const batchResults = await Promise.all(promises);
        batchResults.forEach(({ market, code, name }) => {
            if (name) {
                results.set(`${market}:${code}`, name);
            }
        });
        
        // 批次間延遲
        if (i + concurrentLimit < stockList.length) {
            await delay(500);
        }
    }
    
    return results;
}

/**
 * 清除快取
 * @param {string} market - 市場類型 (可選)
 */
export function clearCache(market = null) {
    if (market) {
        // 清除特定市場的快取
        for (const [key] of stockNameCache) {
            if (key.startsWith(`${market}:`)) {
                stockNameCache.delete(key);
            }
        }
    } else {
        // 清除所有快取
        stockNameCache.clear();
    }
}

/**
 * 獲取快取統計
 * @returns {Object} 快取統計信息
 */
export function getCacheStats() {
    let totalEntries = stockNameCache.size;
    let expiredEntries = 0;
    
    for (const [, cached] of stockNameCache) {
        if (cached.isExpired()) {
            expiredEntries++;
        }
    }
    
    return {
        total: totalEntries,
        expired: expiredEntries,
        valid: totalEntries - expiredEntries
    };
} 