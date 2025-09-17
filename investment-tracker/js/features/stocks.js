/**
 * @file stocks.js
 * @description 股票頁面功能
 * 
 * 這個模組負責所有與股票頁籤相關的操作，包括：
 * 1. 從表單讀取資料並新增一筆股票紀錄。
 * 2. 更新股票表格的顯示內容。
 * 3. 刪除指定的股票紀錄。
 * 4. 計算持倉和獲利狀況。
 */

import { stockRecords } from '../core/state.js';
import { saveToLocalStorage } from '../data/storage.js';
import { updateAllTablesAndSummary } from './summary.js';
import { calculateStockHoldings, calculateProfitLoss } from './portfolio.js';
import { queryStockName } from '../services/stockApiService.js';

// 台股代碼對照表
const taiwanStocks = {
    '2330': '台積電',
    '2317': '鴻海',
    '2454': '聯發科',
    '2412': '中華電',
    '2882': '國泰金',
    '2308': '台達電',
    '2303': '聯電',
    '2891': '中信金',
    '6505': '台塑化',
    '2002': '中鋼',
    '2886': '兆豐金',
    '2881': '富邦金',
    '3008': '大立光',
    '2892': '第一金',
    '2379': '瑞昱',
    '2357': '華碩',
    '2382': '廣達',
    '2395': '研華',
    '2474': '可成',
    '2408': '南亞科',
    '0050': '台灣50',
    '0056': '高股息',
    '00878': '國泰永續高股息',
    '00692': '富邦公司治理',
    '006208': '富邦台50',
    '1301': '台塑',
    '1326': '台化',
    '1303': '南亞',
    '2207': '和泰車',
    '2105': '正新',
    '2227': '裕日車',
    '2915': '潤泰全',
    '2801': '彰銀',
    '2880': '華南金',
    '2885': '元大金',
    '2890': '永豐金',
    '2912': '統一超',
    '2609': '陽明',
    '2618': '長榮航'
};

// 美股代碼對照表
const usStocks = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'BRK.B': 'Berkshire Hathaway Inc.',
    'UNH': 'UnitedHealth Group Inc.',
    'JNJ': 'Johnson & Johnson',
    'V': 'Visa Inc.',
    'PG': 'Procter & Gamble Co.',
    'MA': 'Mastercard Inc.',
    'HD': 'Home Depot Inc.',
    'JPM': 'JPMorgan Chase & Co.',
    'XOM': 'Exxon Mobil Corporation',
    'CVX': 'Chevron Corporation',
    'ABBV': 'AbbVie Inc.',
    'PFE': 'Pfizer Inc.',
    'KO': 'Coca-Cola Co.',
    'AVGO': 'Broadcom Inc.',
    'PEP': 'PepsiCo Inc.',
    'COST': 'Costco Wholesale Corp.',
    'TMO': 'Thermo Fisher Scientific Inc.',
    'DIS': 'Walt Disney Co.',
    'ABT': 'Abbott Laboratories',
    'ACN': 'Accenture plc',
    'VZ': 'Verizon Communications Inc.',
    'ADBE': 'Adobe Inc.',
    'CRM': 'Salesforce Inc.',
    'NFLX': 'Netflix Inc.',
    'MCD': "McDonald's Corp.",
    'CSCO': 'Cisco Systems Inc.',
    'WMT': 'Walmart Inc.',
    'BAC': 'Bank of America Corp.',
    'NKE': 'Nike Inc.',
    'COP': 'ConocoPhillips',
    'BMY': 'Bristol-Myers Squibb Co.',
    'QQQ': 'Invesco QQQ Trust',
    'SPY': 'SPDR S&P 500 ETF Trust',
    'VOO': 'Vanguard S&P 500 ETF',
    'VTI': 'Vanguard Total Stock Market ETF'
};

/**
 * 根據市場和代碼獲取股票名稱 (同步版本 - 僅靜態清單)
 * @param {string} market - 市場類型 ('台股' 或 '美股')
 * @param {string} code - 股票代碼
 * @returns {string} 格式化的代碼和名稱
 */
function getStockDisplayName(market, code) {
    const upperCode = code.toUpperCase();
    let companyName = '';
    
    if (market === '台股') {
        companyName = taiwanStocks[code] || taiwanStocks[upperCode];
    } else if (market === '美股') {
        companyName = usStocks[upperCode];
    }
    
    return companyName ? `${code} ${companyName}` : code;
}

/**
 * 根據市場和代碼獲取股票名稱 (異步版本 - API + 靜態清單)
 * @param {string} market - 市場類型 ('台股' 或 '美股')
 * @param {string} code - 股票代碼
 * @param {boolean} useApi - 是否使用API查詢
 * @returns {Promise<string>} 格式化的代碼和名稱
 */
async function getStockDisplayNameAsync(market, code, useApi = true) {
    const upperCode = code.toUpperCase();
    
    // 1. 先檢查靜態清單 (快速)
    let companyName = '';
    if (market === '台股') {
        companyName = taiwanStocks[code] || taiwanStocks[upperCode];
    } else if (market === '美股') {
        companyName = usStocks[upperCode];
    }
    
    // 如果靜態清單有結果，直接返回
    if (companyName) {
        return `${code} ${companyName}`;
    }
    
    // 2. 如果啟用API且靜態清單沒有，嘗試API查詢
    if (useApi) {
        try {
            const apiName = await queryStockName(market, code);
            if (apiName) {
                return `${code} ${apiName}`;
            }
        } catch (error) {
            console.warn(`API查詢股票名稱失敗 (${market}:${code}):`, error.message);
        }
    }
    
    // 3. 如果都沒有結果，只返回代碼
    return code;
}

/**
 * 初始化股票頁面
 */
export function initializeStockPage() {
    // 設置預設日期為今天
    const today = new Date().toISOString().split('T')[0];
    const buyDateInput = document.getElementById('buyStockDate');
    const sellDateInput = document.getElementById('sellStockDate');
    
    if (buyDateInput) buyDateInput.value = today;
    if (sellDateInput) sellDateInput.value = today;
    
    // 初始化表單狀態
    updateBuyStockForm();
    updateSellStockForm();
    
    // 為所有數字輸入欄位添加長度限制
    const numberInputs = [
        'buyStockShares', 'buyStockPrice', 'buyStockFee',
        'sellStockShares', 'sellStockPrice', 'sellStockFee', 'sellStockTax'
    ];
    
    numberInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // 限制輸入長度為10字元
            input.addEventListener('input', function(e) {
                const originalValue = e.target.value;
                const cursorPosition = e.target.selectionStart;
                
                let value = originalValue;
                // 移除所有非數字和小數點的字符
                value = value.replace(/[^0-9.]/g, '');
                // 限制長度為10
                if (value.length > 10) {
                    value = value.substring(0, 10);
                }
                // 確保只有一個小數點
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                
                // 特別處理股數欄位的小數點位數限制
                if (inputId.includes('Shares') && parts.length === 2) {
                    // 獲取當前市場設定
                    const marketSelect = inputId.includes('buy') ? 
                        document.getElementById('buyStockMarket') : 
                        document.getElementById('sellStockMarket');
                    const market = marketSelect?.value;
                    
                    // 根據市場限制小數點位數
                    if (market === '台股') {
                        // 台股不允許小數點
                        value = parts[0];
                    } else if (market === '美股') {
                        // 美股最多5位小數
                        if (parts[1].length > 5) {
                            value = parts[0] + '.' + parts[1].substring(0, 5);
                        }
                    }
                }
                
                // 只有當值真的改變時才更新，避免游標跳動
                if (value !== originalValue) {
                    e.target.value = value;
                    // 保持游標位置，但要考慮值的變化
                    const lengthDiff = originalValue.length - value.length;
                    const newCursorPosition = Math.max(0, cursorPosition - lengthDiff);
                    e.target.setSelectionRange(newCursorPosition, newCursorPosition);
                }
            });
            
            // 防止貼上超過10字元的內容
            input.addEventListener('paste', function(e) {
                setTimeout(() => {
                    let value = e.target.value;
                    value = value.replace(/[^0-9.]/g, '');
                    if (value.length > 10) {
                        e.target.value = value.substring(0, 10);
                    }
                }, 10);
            });
        }
    });
    
    // 為股票代碼輸入欄位添加自動完成功能
    const buyCodeInput = document.getElementById('buyStockCode');
    const sellCodeInput = document.getElementById('sellStockCode');
    
    [buyCodeInput, sellCodeInput].forEach(input => {
        if (input) {
            // 美股代號自動轉大寫
            input.addEventListener('input', function(e) {
                const market = e.target.closest('.card').querySelector('select').value;
                if (market === '美股') {
                    const cursorPosition = e.target.selectionStart;
                    const originalValue = e.target.value;
                    const upperValue = originalValue.toUpperCase();
                    
                    if (originalValue !== upperValue) {
                        e.target.value = upperValue;
                        e.target.setSelectionRange(cursorPosition, cursorPosition);
                    }
                }
            });
            
            // 當失焦時自動顯示公司名稱
            input.addEventListener('blur', async function(e) {
                const code = e.target.value.trim();
                if (code) {
                    const market = e.target.closest('.card').querySelector('select').value;
                    
                    // 顯示載入狀態
                    const originalValue = e.target.value;
                    e.target.value = `${code} (查詢中...)`;
                    e.target.disabled = true;
                    
                    try {
                        // 使用異步版本獲取股票名稱
                        const displayName = await getStockDisplayNameAsync(market, code, true);
                        e.target.value = displayName;
                    } catch (error) {
                        console.warn('股票名稱查詢失敗:', error);
                        // 失敗時使用同步版本 (靜態清單)
                        const fallbackName = getStockDisplayName(market, code);
                        e.target.value = fallbackName;
                    } finally {
                        e.target.disabled = false;
                    }
                }
            });
            
            // 當聚焦時只顯示代碼
            input.addEventListener('focus', function(e) {
                const value = e.target.value;
                if (value.includes(' ')) {
                    const code = value.split(' ')[0];
                    e.target.value = code;
                }
            });
        }
    });
}

/**
 * 更新買進表單的標籤和驗證
 */
export function updateBuyStockForm() {
    const market = document.getElementById('buyStockMarket')?.value;
    const priceLabel = document.getElementById('buyStockPriceLabel');
    const feeLabel = document.getElementById('buyStockFeeLabel');
    const feeInput = document.getElementById('buyStockFee');
    const sharesInput = document.getElementById('buyStockShares');
    
    // 清空表單欄位
    document.getElementById('buyStockCode').value = '';
    document.getElementById('buyStockName').value = '';
    document.getElementById('buyStockShares').value = '';
    document.getElementById('buyStockPrice').value = '';
    document.getElementById('buyStockFee').value = '';
    
    if (market === '台股') {
        if (priceLabel) priceLabel.textContent = '價格 (TWD)';
        if (feeLabel) feeLabel.textContent = '手續費 (台股整數)';
        if (feeInput) feeInput.step = '1';
        if (sharesInput) sharesInput.step = '1'; // 台股股數為整數
    } else {
        if (priceLabel) priceLabel.textContent = '價格 (USD)';
        if (feeLabel) feeLabel.textContent = '手續費 (USD)';
        if (feeInput) feeInput.step = '0.01';
        if (sharesInput) sharesInput.step = '0.00001'; // 美股支援小數點5位碎股
    }
}

/**
 * 更新賣出表單的標籤和驗證
 */
export function updateSellStockForm() {
    const market = document.getElementById('sellStockMarket')?.value;
    const priceLabel = document.getElementById('sellStockPriceLabel');
    const feeLabel = document.getElementById('sellStockFeeLabel');
    const feeInput = document.getElementById('sellStockFee');
    const sharesInput = document.getElementById('sellStockShares');
    const taxField = document.getElementById('sellStockTaxField');
    
    // 清空表單欄位
    document.getElementById('sellStockCode').value = '';
    document.getElementById('sellStockName').value = '';
    document.getElementById('sellStockShares').value = '';
    document.getElementById('sellStockPrice').value = '';
    document.getElementById('sellStockFee').value = '';
    document.getElementById('sellStockTax').value = '';
    
    if (market === '台股') {
        if (priceLabel) priceLabel.textContent = '價格 (TWD)';
        if (feeLabel) feeLabel.textContent = '手續費 (台股整數)';
        if (feeInput) feeInput.step = '1';
        if (sharesInput) sharesInput.step = '1'; // 台股股數為整數
        if (taxField) taxField.style.display = 'block';
    } else {
        if (priceLabel) priceLabel.textContent = '價格 (USD)';
        if (feeLabel) feeLabel.textContent = '手續費 (USD)';
        if (feeInput) feeInput.step = '0.01';
        if (sharesInput) sharesInput.step = '0.00001'; // 美股支援小數點5位碎股
        if (taxField) taxField.style.display = 'none';
    }
}

/**
 * 新增股票買進紀錄
 */
export function addStockBuyRecord() {
    // 從 DOM 讀取表單數值
    const market = document.getElementById('buyStockMarket')?.value;
    const assetType = document.getElementById('buyStockAssetType')?.value;
    const code = document.getElementById('buyStockCode')?.value.trim();
    const name = document.getElementById('buyStockName')?.value.trim();
    const date = document.getElementById('buyStockDate')?.value;
    const sharesStr = document.getElementById('buyStockShares')?.value.trim();
    const priceStr = document.getElementById('buyStockPrice')?.value.trim();
    const feeStr = document.getElementById('buyStockFee')?.value.trim();

    // 必填欄位驗證
    if (!market) {
        alert('請選擇市場');
        return;
    }
    if (!assetType) {
        alert('請選擇資產類型');
        return;
    }
    if (!code) {
        alert('請輸入股票代號');
        document.getElementById('buyStockCode').focus();
        return;
    }
    if (!name) {
        alert('請輸入公司名稱');
        document.getElementById('buyStockName').focus();
        return;
    }
    if (!date) {
        alert('請選擇交易日期');
        document.getElementById('buyStockDate').focus();
        return;
    }
    if (!sharesStr) {
        alert('請輸入股數');
        document.getElementById('buyStockShares').focus();
        return;
    }
    if (!priceStr) {
        alert('請輸入價格');
        document.getElementById('buyStockPrice').focus();
        return;
    }
    if (!feeStr) {
        alert('請輸入手續費（可填0）');
        document.getElementById('buyStockFee').focus();
        return;
    }

    const shares = parseFloat(sharesStr);
    const price = parseFloat(priceStr);
    const fee = parseFloat(feeStr) || 0;

    // 數值驗證
    if (isNaN(shares) || shares <= 0) {
        alert('股數必須是正數');
        document.getElementById('buyStockShares').focus();
        return;
    }
    if (isNaN(price) || price <= 0) {
        alert('價格必須是正數');
        document.getElementById('buyStockPrice').focus();
        return;
    }
    if (isNaN(fee) || fee < 0) {
        alert('手續費不能為負數');
        document.getElementById('buyStockFee').focus();
        return;
    }

    const total = (shares * price) + fee;

    // 建立新的紀錄物件
    const newRecord = {
        id: Date.now(),
        market, assetType, code, name, 
        type: '買入', 
        date, shares, price, fee, 
        tax: 0, // 買進無證交稅
        total
    };

    // 將新紀錄加入到全域狀態陣列
    stockRecords.push(newRecord);

    // 更新 UI 並儲存資料
    updateAllTablesAndSummary();
    updateStockHoldingsTable();
    saveToLocalStorage();

    // 清空部分表單以便下次輸入
    document.getElementById('buyStockCode').value = '';
    document.getElementById('buyStockName').value = '';
    document.getElementById('buyStockShares').value = '';
    document.getElementById('buyStockPrice').value = '';
    document.getElementById('buyStockFee').value = '';
    
    alert('買進紀錄新增成功！');
}

/**
 * 新增股票賣出紀錄
 */
export function addStockSellRecord() {
    // 從 DOM 讀取表單數值
    const market = document.getElementById('sellStockMarket')?.value;
    const assetType = document.getElementById('sellStockAssetType')?.value;
    const code = document.getElementById('sellStockCode')?.value.trim();
    const name = document.getElementById('sellStockName')?.value.trim();
    const date = document.getElementById('sellStockDate')?.value;
    const sharesStr = document.getElementById('sellStockShares')?.value.trim();
    const priceStr = document.getElementById('sellStockPrice')?.value.trim();
    const feeStr = document.getElementById('sellStockFee')?.value.trim();
    const taxStr = document.getElementById('sellStockTax')?.value.trim();

    // 必填欄位驗證
    if (!market) {
        alert('請選擇市場');
        return;
    }
    if (!assetType) {
        alert('請選擇資產類型');
        return;
    }
    if (!code) {
        alert('請輸入股票代號');
        document.getElementById('sellStockCode').focus();
        return;
    }
    if (!name) {
        alert('請輸入公司名稱');
        document.getElementById('sellStockName').focus();
        return;
    }
    if (!date) {
        alert('請選擇交易日期');
        document.getElementById('sellStockDate').focus();
        return;
    }
    if (!sharesStr) {
        alert('請輸入股數');
        document.getElementById('sellStockShares').focus();
        return;
    }
    if (!priceStr) {
        alert('請輸入價格');
        document.getElementById('sellStockPrice').focus();
        return;
    }
    if (!feeStr) {
        alert('請輸入手續費（可填0）');
        document.getElementById('sellStockFee').focus();
        return;
    }
    if (market === '台股' && !taxStr) {
        alert('台股需要輸入證交稅（可填0）');
        document.getElementById('sellStockTax').focus();
        return;
    }

    const shares = parseFloat(sharesStr);
    const price = parseFloat(priceStr);
    const fee = parseFloat(feeStr) || 0;
    const tax = parseFloat(taxStr) || 0;

    // 數值驗證
    if (isNaN(shares) || shares <= 0) {
        alert('股數必須是正數');
        document.getElementById('sellStockShares').focus();
        return;
    }
    if (isNaN(price) || price <= 0) {
        alert('價格必須是正數');
        document.getElementById('sellStockPrice').focus();
        return;
    }
    if (isNaN(fee) || fee < 0) {
        alert('手續費不能為負數');
        document.getElementById('sellStockFee').focus();
        return;
    }
    if (isNaN(tax) || tax < 0) {
        alert('證交稅不能為負數');
        document.getElementById('sellStockTax').focus();
        return;
    }

    // 檢查是否有足夠持股
    const holdings = calculateStockHoldings();
    const holding = holdings.find(h => h.market === market && h.code === code);
    
    if (!holding || holding.totalShares < shares) {
        alert(`持股不足！目前持有 ${holding ? holding.totalShares : 0} 股`);
        return;
    }
    
    // 計算獲利/虧損（需要扣除手續費和證交稅）
    const profitLoss = (price - holding.averagePrice) * shares - fee - tax;
    const profitLossPercentage = ((price - holding.averagePrice) / holding.averagePrice) * 100;
    
    // 顯示獲利資訊
    const message = `
賣出資訊：
• 賣出股數：${shares.toLocaleString()} 股
• 賣出價格：${price.toLocaleString()} ${market === '台股' ? 'TWD' : 'USD'}
• 平均成本：${holding.averagePrice.toFixed(2)} ${market === '台股' ? 'TWD' : 'USD'}
• 手續費：${fee.toLocaleString()} ${market === '台股' ? 'TWD' : 'USD'}
${market === '台股' ? `• 證交稅：${tax.toLocaleString()} TWD` : ''}
• ${profitLoss >= 0 ? '獲利' : '虧損'}：${Math.abs(profitLoss).toLocaleString()} ${market === '台股' ? 'TWD' : 'USD'}
• 報酬率：${profitLossPercentage >= 0 ? '+' : ''}${profitLossPercentage.toFixed(2)}%
    `;
    
    if (!confirm(message + '\n\n確定要執行賣出嗎？')) {
        return;
    }

    const total = (shares * price) - fee - tax;

    // 建立新的紀錄物件
    const newRecord = {
        id: Date.now(),
        market, assetType, code, name, 
        type: '賣出', 
        date, shares, price, fee, 
        tax: market === '台股' ? tax : 0, // 只有台股有證交稅
        total
    };

    // 將新紀錄加入到全域狀態陣列
    stockRecords.push(newRecord);

    // 更新 UI 並儲存資料
    updateAllTablesAndSummary();
    updateStockHoldingsTable();
    saveToLocalStorage();

    // 清空部分表單以便下次輸入
    document.getElementById('sellStockCode').value = '';
    document.getElementById('sellStockName').value = '';
    document.getElementById('sellStockShares').value = '';
    document.getElementById('sellStockPrice').value = '';
    document.getElementById('sellStockFee').value = '';
    document.getElementById('sellStockTax').value = '';
    
    alert('賣出紀錄新增成功！');
}

/**
 * 更新股票交易紀錄表格的 HTML 內容。
 */
export function updateStockTable() {
    const tableBody = document.getElementById('stockTableBody');
    if (!tableBody) return;

    // 依日期降序排列紀錄
    stockRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    tableBody.innerHTML = stockRecords.map(record => {
        const currency = record.market === '台股' ? 'TWD' : 'USD';
        const total = record.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const tax = record.tax || 0; // 兼容舊資料
        const displayName = getStockDisplayName(record.market, record.code);
        
        return `
            <tr>
                <td>${record.date}</td>
                <td>${record.market}</td>
                <td>${record.assetType}</td>
                <td>${record.code}</td>
                <td>${record.name || record.code}</td>
                <td class="${record.type === '買入' ? 'positive' : 'negative'}">${record.type}</td>
                <td>${record.shares.toLocaleString()}</td>
                <td>${record.price.toLocaleString()}</td>
                <td>${record.fee.toLocaleString()}</td>
                <td>${tax > 0 ? tax.toLocaleString() : '-'}</td>
                <td>${currency} ${total}</td>
                <td>
                    <button class="icon-button" onclick="deleteStockRecord(${record.id})">
                        <span class="material-icons">delete</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * 更新股票持倉表格
 */
export function updateStockHoldingsTable() {
    const tableBody = document.getElementById('stockHoldingsTableBody');
    if (!tableBody) return;

    const holdings = calculateStockHoldings();
    
    tableBody.innerHTML = holdings.map(holding => {
        const currency = holding.market === '台股' ? 'TWD' : 'USD';
        const totalValue = holding.totalShares * holding.averagePrice;
        const displayName = getStockDisplayName(holding.market, holding.code);
        
        return `
            <tr>
                <td>${holding.market}</td>
                <td>${holding.assetType}</td>
                <td>${holding.code}</td>
                <td>${holding.name || holding.code}</td>
                <td>${holding.totalShares.toLocaleString()}</td>
                <td>${currency} ${holding.averagePrice.toFixed(2)}</td>
                <td>${currency} ${totalValue.toLocaleString()}</td>
                <td>
                    <button class="outlined-button" onclick="quickSell('${holding.market}', '${holding.code}', ${holding.totalShares})">
                        <span class="material-icons">sell</span>
                        快速賣出
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * 快速賣出功能
 * @param {string} market - 市場
 * @param {string} code - 股票代碼
 * @param {number} maxShares - 最大可賣股數
 */
export function quickSell(market, code, maxShares) {
    // 填入賣出表單
    document.getElementById('sellStockMarket').value = market;
    
    // 從持倉中找到對應的名稱
    const holdings = calculateStockHoldings();
    const holding = holdings.find(h => h.market === market && h.code === code);
    
    document.getElementById('sellStockCode').value = code;
    document.getElementById('sellStockName').value = holding ? (holding.name || code) : code;
    document.getElementById('sellStockShares').value = maxShares;
    
    // 更新表單狀態
    updateSellStockForm();
    
    // 滾動到賣出表單位置
    document.getElementById('sellStockCode').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('sellStockPrice').focus();
}

/**
 * 根據 ID 刪除一筆股票紀錄。
 * @param {number} id - 要刪除的紀錄 ID。
 */
export function deleteStockRecord(id) {
    if (confirm('確定要刪除這筆紀錄嗎？')) {
        const index = stockRecords.findIndex(r => r.id === id);
        if (index > -1) {
            stockRecords.splice(index, 1);
            updateAllTablesAndSummary();
            updateStockHoldingsTable();
            saveToLocalStorage();
        }
    }
}

/**
 * 預載熱門股票名稱到快取
 */
export async function preloadPopularStocks() {
    const popularStocks = [
        // 台股熱門股票
        { market: '台股', code: '2330' }, // 台積電
        { market: '台股', code: '2317' }, // 鴻海
        { market: '台股', code: '2454' }, // 聯發科
        { market: '台股', code: '0050' }, // 台灣50
        { market: '台股', code: '0056' }, // 高股息
        
        // 美股熱門股票
        { market: '美股', code: 'AAPL' }, // Apple
        { market: '美股', code: 'MSFT' }, // Microsoft
        { market: '美股', code: 'GOOGL' }, // Google
        { market: '美股', code: 'TSLA' }, // Tesla
        { market: '美股', code: 'SPY' }   // S&P 500 ETF
    ];
    
    console.log('開始預載熱門股票名稱...');
    
    for (const { market, code } of popularStocks) {
        try {
            await getStockDisplayNameAsync(market, code, true);
        } catch (error) {
            console.warn(`預載 ${market}:${code} 失敗:`, error.message);
        }
    }
    
    console.log('熱門股票名稱預載完成');
}

/**
 * 導出新的異步函數供其他模組使用
 */
export { getStockDisplayNameAsync }; 