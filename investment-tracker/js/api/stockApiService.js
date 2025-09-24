/**
 * @file stockApiService.js
 * @description Yahoo Finance 名稱查詢與本地快取
 */

const CACHE_NAMESPACE = 'stockNameCacheV1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 小時

// 請求節流與並發限制
const MIN_INTERVAL_MS = 200; // 每 200ms 最多發出一筆
const MAX_CONCURRENT = 5;   // 最多 5 併發
let lastRequestStartedAt = 0;
let activeCount = 0;
const pendingQueue = [];

function scheduleRequest(taskFn) {
    return new Promise((resolve, reject) => {
        pendingQueue.push({ taskFn, resolve, reject });
        processQueue();
    });
}

function processQueue() {
    if (activeCount >= MAX_CONCURRENT) return;
    if (pendingQueue.length === 0) return;

    const now = Date.now();
    const waitMs = Math.max(0, MIN_INTERVAL_MS - (now - lastRequestStartedAt));
    const { taskFn, resolve, reject } = pendingQueue.shift();

    activeCount++;
    setTimeout(async () => {
        lastRequestStartedAt = Date.now();
        try {
            const result = await taskFn();
            resolve(result);
        } catch (err) {
            reject(err);
        } finally {
            activeCount--;
            // 連續處理下一批
            processQueue();
            // 若尚有容量，嘗試再啟動一次（避免邊界狀況）
            setTimeout(processQueue, 0);
        }
    }, waitMs);
}

function getCacheStore() {
    try {
        const raw = localStorage.getItem(CACHE_NAMESPACE);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function setCacheStore(store) {
    try {
        localStorage.setItem(CACHE_NAMESPACE, JSON.stringify(store));
    } catch (e) {
        // ignore quota errors
    }
}

function getCacheKey(market, code) {
    return `${market}:${code}`;
}

function readFromCache(market, code) {
    const store = getCacheStore();
    const key = getCacheKey(market, code);
    const entry = store[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return entry.name || null;
}

function writeToCache(market, code, name) {
    const store = getCacheStore();
    const key = getCacheKey(market, code);
    store[key] = { name, timestamp: Date.now() };
    setCacheStore(store);
}

function toYahooQuerySymbol(market, code) {
    const clean = String(code || '').trim();
    if (!clean) return '';
    if (market === '台股') return `${clean}.TW`;
    return clean.toUpperCase();
}

async function fetchWithRetry(url, options = {}, retries = 3) {
    let attempt = 0;
    let lastErr = null;
    while (attempt < retries) {
        try {
            const res = await fetch(url, {
                ...options,
                cache: 'no-store',
                headers: {
                    'Accept': 'application/json, text/plain, */*'
                }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            lastErr = err;
            attempt++;
            const delay = Math.pow(2, attempt - 1) * 500; // 0.5s,1s,2s
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw lastErr || new Error('Unknown fetch error');
}

/**
 * 以 Yahoo Finance API 查詢公司名稱
 * @param {string} market '台股' | '美股'
 * @param {string} code 例如 2330 或 AAPL
 * @returns {Promise<string|null>} 公司名稱，查無則回傳 null
 */
export async function queryStockName(market, code) {
    const execute = async () => {
        try {
            console.debug('[StockAPI] queryStockName start', { market, code });
            const cached = readFromCache(market, code);
            if (cached) {
                console.debug('[StockAPI] cache hit', { market, code, cached });
                return cached;
            }

            const symbol = toYahooQuerySymbol(market, code);
            if (!symbol) {
                console.warn('[StockAPI] invalid symbol after transform', { market, code });
                return null;
            }

            const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=1&newsCount=0`;
            const data = await fetchWithRetry(url, {}, 3);

            if (!data || !Array.isArray(data.quotes)) {
                console.warn('[StockAPI] unexpected response structure', data);
                return null;
            }

            const quote = data.quotes[0] || null;
            const name = quote?.shortname || quote?.longname || quote?.name || null;
            console.debug('[StockAPI] search result', { symbol, name, quote });
            if (name) writeToCache(market, code, name);
            return name;
        } catch (err) {
            console.error('[StockAPI] queryStockName error', err);
            return null;
        }
    };

    // 經由排程器執行，套用節流與併發限制
    return await scheduleRequest(execute);
}

/**
 * 快取控制（可供日後控制面板使用）
 */
export function clearStockNameCache() {
    try { localStorage.removeItem(CACHE_NAMESPACE); } catch (e) { /* ignore */ }
}

/**
 * 取得快取統計
 */
export function getCacheStats() {
    const store = getCacheStore();
    const keys = Object.keys(store);
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    keys.forEach(k => {
        const ts = store[k]?.timestamp || 0;
        if (now - ts > CACHE_TTL_MS) expired++; else valid++;
    });
    return { total: keys.length, valid, expired };
}


