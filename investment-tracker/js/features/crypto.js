/**
 * @file crypto.js
 * @description 加密貨幣頁面功能
 * 
 * 這個模組負責所有與加密貨幣頁籤相關的操作，包括：
 * 1. 從表單讀取資料並新增一筆加密貨幣紀錄。
 * 2. 更新加密貨幣表格的顯示內容。
 * 3. 刪除指定的加密貨幣紀錄。
 * 4. 計算持倉和獲利狀況。
 */

import { cryptoRecords } from '../core/state.js';
import { saveToLocalStorage } from '../data/storage.js';
import { updateAllTablesAndSummary } from './summary.js';
import { calculateCryptoHoldings } from './portfolio.js';

/**
 * 格式化加密貨幣數量顯示（最多8位小數，去除尾隨零）
 * @param {number} amount - 數量
 * @returns {string} 格式化後的數量字串
 */
function formatCryptoAmount(amount) {
    if (amount === 0) return '0';
    
    // 使用8位小數，然後移除尾隨的零
    const formatted = amount.toFixed(8);
    return formatted.replace(/\.?0+$/, '');
}

/**
 * 更新加密貨幣符號的 datalist
 */
function updateCryptoSymbolDatalist() {
    const datalist = document.getElementById('cryptoSymbolList');
    if (!datalist) return;
    
    // 獲取所有已使用的加密貨幣符號
    const existingSymbols = [...new Set(cryptoRecords.map(record => record.symbol))];
    
    // 預設選項
    const defaultOptions = [
        { value: 'BTC', label: 'BTC (Bitcoin)' },
        { value: 'ETH', label: 'ETH (Ethereum)' },
        { value: 'BNB', label: 'BNB (Binance Coin)' },
        { value: 'ADA', label: 'ADA (Cardano)' },
        { value: 'SOL', label: 'SOL (Solana)' },
        { value: 'DOT', label: 'DOT (Polkadot)' },
        { value: 'MATIC', label: 'MATIC (Polygon)' },
        { value: 'AVAX', label: 'AVAX (Avalanche)' },
        { value: 'UNI', label: 'UNI (Uniswap)' },
        { value: 'LINK', label: 'LINK (Chainlink)' }
    ];
    
    // 合併預設選項和已使用的符號
    const allSymbols = new Set([
        ...defaultOptions.map(opt => opt.value),
        ...existingSymbols
    ]);
    
    // 清空並重新填充 datalist
    datalist.innerHTML = '';
    
    allSymbols.forEach(symbol => {
        const option = document.createElement('option');
        option.value = symbol;
        
        // 找到對應的標籤
        const defaultOption = defaultOptions.find(opt => opt.value === symbol);
        option.textContent = defaultOption ? defaultOption.label : symbol;
        
        datalist.appendChild(option);
    });
}

/**
 * 初始化加密貨幣頁面的事件監聽器
 */
export function initializeCryptoPage() {
    // 初始化時更新下拉選單
    updateCryptoSymbolDatalist();
    
    const amountInput = document.getElementById('cryptoAmount');
    const priceInput = document.getElementById('cryptoPrice');
    const feeInput = document.getElementById('cryptoFee');
    
    // 為所有數字輸入欄位添加長度限制
    const numberInputs = [
        { element: amountInput, maxLength: 10 },
        { element: priceInput, maxLength: 10 },
        { element: feeInput, maxLength: 10 }
    ];
    
    numberInputs.forEach(({ element, maxLength }) => {
        if (element) {
            // 限制輸入長度和格式
            element.addEventListener('input', function(e) {
                let value = e.target.value;
                // 移除所有非數字和小數點的字符
                value = value.replace(/[^0-9.]/g, '');
                // 限制長度
                if (value.length > maxLength) {
                    value = value.substring(0, maxLength);
                }
                // 確保只有一個小數點
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                e.target.value = value;
            });
            
            // 防止貼上超過限制長度的內容
            element.addEventListener('paste', function(e) {
                setTimeout(() => {
                    let value = e.target.value;
                    value = value.replace(/[^0-9.]/g, '');
                    if (value.length > maxLength) {
                        e.target.value = value.substring(0, maxLength);
                    }
                }, 10);
            });
        }
    });
    
    // 特別為數量欄位添加格式化功能
    if (amountInput) {
        // 添加失焦時的格式化
        amountInput.addEventListener('blur', function(e) {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value > 0) {
                e.target.value = formatCryptoAmount(value);
            }
        });
    }
}

/**
 * 從表單獲取輸入，新增一筆加密貨幣紀錄。
 */
export function addCryptoRecord() {
    const symbol = document.getElementById('cryptoSymbol')?.value;
    const type = document.getElementById('cryptoType')?.value;
    const date = document.getElementById('cryptoDate')?.value;
    const amountStr = document.getElementById('cryptoAmount')?.value;
    const price = parseFloat(document.getElementById('cryptoPrice')?.value);
    const fee = parseFloat(document.getElementById('cryptoFee')?.value) || 0;

    // 驗證數量格式和轉換
    if (!amountStr || !/^\d*\.?\d*$/.test(amountStr)) {
        alert('請輸入有效的數量格式（例如：0.00000001）');
        return;
    }
    
    const amount = parseFloat(amountStr);
    
    if (!symbol || !date || isNaN(amount) || isNaN(price)) {
        alert('請填寫所有必要欄位');
        return;
    }

    // 檢查數量是否為正數
    if (amount <= 0) {
        alert('數量必須大於0');
        return;
    }

    // 檢查價格是否為正數
    if (price <= 0) {
        alert('價格必須大於0');
        return;
    }

    // 檢查手續費是否為負數
    if (fee < 0) {
        alert('手續費不能為負數');
        return;
    }

    // 如果是賣出，檢查是否有足夠數量
    if (type === '賣出') {
        const holdings = calculateCryptoHoldings();
        const holding = holdings.find(h => h.symbol === symbol);
        
        if (!holding || holding.totalAmount < amount) {
            alert(`持有數量不足！目前持有 ${holding ? formatCryptoAmount(holding.totalAmount) : 0} ${symbol}`);
            return;
        }
        
        // 計算獲利/虧損
        const profitLoss = (price - holding.averagePrice) * amount - fee;
        const profitLossPercentage = ((price - holding.averagePrice) / holding.averagePrice) * 100;
        
        // 顯示賣出資訊
        const message = `
賣出資訊：
• 賣出數量：${formatCryptoAmount(amount)} ${symbol}
• 賣出價格：${price.toLocaleString()} TWD
• 平均成本：${holding.averagePrice.toFixed(2)} TWD
• ${profitLoss >= 0 ? '獲利' : '虧損'}：${Math.abs(profitLoss).toLocaleString()} TWD
• 報酬率：${profitLossPercentage >= 0 ? '+' : ''}${profitLossPercentage.toFixed(2)}%
        `;
        
        if (!confirm(message + '\n\n確定要執行賣出嗎？')) {
            return;
        }
    }

    const total = (amount * price) + (type === '買入' ? fee : -fee);

    cryptoRecords.push({ id: Date.now(), symbol, type, date, amount, price, fee, total });
    updateAllTablesAndSummary();
    updateCryptoHoldingsTable();
    updateCryptoSymbolDatalist(); // 更新下拉選單
    saveToLocalStorage();

    document.getElementById('cryptoSymbol').value = '';
    document.getElementById('cryptoAmount').value = '';
    document.getElementById('cryptoPrice').value = '';
    document.getElementById('cryptoFee').value = '';
}

/**
 * 更新加密貨幣交易紀錄表格的 HTML 內容。
 */
export function updateCryptoTable() {
    const tableBody = document.getElementById('cryptoTableBody');
    if (!tableBody) return;
    cryptoRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    tableBody.innerHTML = cryptoRecords.map(record => `
        <tr>
            <td>${record.date}</td>
            <td>${record.symbol}</td>
            <td class="${record.type === '買入' ? 'positive' : 'negative'}">${record.type}</td>
            <td>${formatCryptoAmount(record.amount)}</td>
            <td>TWD ${record.price.toLocaleString()}</td>
            <td>TWD ${record.fee.toLocaleString()}</td>
            <td>TWD ${Math.abs(record.total).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
            <td>
                <button class="icon-button" onclick="deleteCryptoRecord(${record.id})">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * 更新加密貨幣持倉表格
 */
export function updateCryptoHoldingsTable() {
    const tableBody = document.getElementById('cryptoHoldingsTableBody');
    if (!tableBody) return;

    const holdings = calculateCryptoHoldings();
    
    tableBody.innerHTML = holdings.map(holding => {
        const totalValue = holding.totalAmount * holding.averagePrice;
        
        return `
            <tr>
                <td>${holding.symbol}</td>
                <td>${formatCryptoAmount(holding.totalAmount)}</td>
                <td>TWD ${holding.averagePrice.toFixed(2)}</td>
                <td>TWD ${totalValue.toLocaleString()}</td>
                <td>
                    <button class="outlined-button" onclick="quickSellCrypto('${holding.symbol}', ${holding.totalAmount})">
                        <span class="material-icons">sell</span>
                        快速賣出
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * 快速賣出加密貨幣功能
 * @param {string} symbol - 幣種符號
 * @param {number} maxAmount - 最大可賣數量
 */
window.quickSellCrypto = function(symbol, maxAmount) {
    // 填入表單
    document.getElementById('cryptoSymbol').value = symbol;
    document.getElementById('cryptoType').value = '賣出';
    document.getElementById('cryptoAmount').value = formatCryptoAmount(maxAmount);
    
    // 滾動到表單位置
    document.getElementById('cryptoSymbol').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('cryptoPrice').focus();
};

/**
 * 根據 ID 刪除一筆加密貨幣紀錄。
 * @param {number} id - 要刪除的紀錄 ID。
 */
export function deleteCryptoRecord(id) {
    if (confirm('確定要刪除這筆紀錄嗎？')) {
        const index = cryptoRecords.findIndex(r => r.id === id);
        if (index > -1) {
            cryptoRecords.splice(index, 1);
            updateAllTablesAndSummary();
            updateCryptoHoldingsTable();
            updateCryptoSymbolDatalist(); // 更新下拉選單
            saveToLocalStorage();
        }
    }
} 