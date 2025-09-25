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
import { storeManager } from '../data/storeManager.js';
import { validateData } from '../data/dataStructure.js';
import { updateAllTablesAndSummary } from './summary.js';
import { calculateCryptoHoldings } from './portfolio.js';
import { CRYPTO_DEFAULT_SYMBOLS } from '../core/constants.js';

/**
 * 保存投資組合資料到 electron-store
 */
async function savePortfolioData() {
    try {
        const portfolioData = {
            stocks: window.stockRecords || [],
            crypto: cryptoRecords,
            funds: window.fundRecords || [],
            property: window.propertyRecords || [],
            payments: window.paymentRecords || []
        };
        
        const validatedData = validateData(portfolioData);
        await storeManager.save(validatedData);
        console.log('✅ 加密貨幣資料保存成功');
        
    } catch (error) {
        console.error('❌ 加密貨幣資料保存失敗:', error);
        if (typeof window.mdAlert === 'function') {
            window.mdAlert('資料保存失敗，請稍後重試');
        }
    }
}

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
    
    // 預設選項（改為引用共用常數）
    const defaultOptions = CRYPTO_DEFAULT_SYMBOLS;
    
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

    // 確保幣種 select 有選項（從共用常數填充）
    const symbolSelect = document.getElementById('cryptoSymbol');
    if (symbolSelect && symbolSelect.options.length === 0) {
        CRYPTO_DEFAULT_SYMBOLS.forEach(({ value, label }) => {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = label;
            symbolSelect.appendChild(opt);
        });
        // 刷新自定義選單 UI
        if (window.refreshCustomSelectFor) {
            window.refreshCustomSelectFor('cryptoSymbol');
        }
    }
    
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
export async function addCryptoRecord() {
    const symbol = document.getElementById('cryptoSymbol')?.value;
    const type = document.getElementById('cryptoType')?.value;
    const date = document.getElementById('cryptoDate')?.value;
    const amountStr = document.getElementById('cryptoAmount')?.value;
    const price = parseFloat(document.getElementById('cryptoPrice')?.value);
    const fee = parseFloat(document.getElementById('cryptoFee')?.value) || 0;

    // 1) 先檢查日期
    if (!date) {
        mdAlert('請選擇交易日期', 'error');
        document.getElementById('cryptoDate')?.focus();
        return;
    }

    // 2) 檢查幣種是否選擇
    if (!symbol) {
        mdAlert('請選擇幣種', 'error');
        document.getElementById('cryptoSymbol')?.focus();
        return;
    }

    // 3) 驗證數量格式和轉換
    if (!amountStr || !/^\d*\.?\d*$/.test(amountStr)) {
        mdAlert('請輸入有效的數量格式（例如：0.00000001）', 'error');
        document.getElementById('cryptoAmount')?.focus();
        return;
    }
    const amount = parseFloat(amountStr);

    // 4) 必填欄位檢查（價格）
    if (isNaN(amount) || isNaN(price)) {
        mdAlert('請填寫所有必要欄位', 'error');
        if (isNaN(price)) document.getElementById('cryptoPrice')?.focus();
        return;
    }

    // 檢查數量是否為正數
    if (amount <= 0) {
        mdAlert('數量必須大於0', 'error');
        document.getElementById('cryptoAmount')?.focus();
        return;
    }

    // 檢查價格是否為正數
    if (price <= 0) {
        mdAlert('價格必須大於0', 'error');
        document.getElementById('cryptoPrice')?.focus();
        return;
    }

    // 檢查手續費是否為負數
    if (fee < 0) {
        mdAlert('手續費不能為負數', 'error');
        document.getElementById('cryptoFee')?.focus();
        return;
    }

    // 如果是賣出，檢查是否有足夠數量
    if (type === '賣出') {
        const holdings = calculateCryptoHoldings();
        const holding = holdings.find(h => h.symbol === symbol);
        
        if (!holding || holding.totalAmount < amount) {
            mdAlert(`持有數量不足！目前持有 ${holding ? formatCryptoAmount(holding.totalAmount) : 0} ${symbol}`, 'error');
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
        
        mdConfirm(message + '\n\n確定要執行賣出嗎？', async (confirmed) => {
            if (confirmed) {
                // 執行賣出邏輯
                await executeCryptoSell(symbol, type, date, amount, price, fee);
            }
        });
        return; // 防止繼續執行下面的程式碼
    }
    
    // 執行買入邏輯
    await executeCryptoTrade(symbol, type, date, amount, price, fee);
}

async function executeCryptoSell(symbol, type, date, amount, price, fee) {
    const total = (amount * price) - fee;
    
    // 建立新的紀錄物件
    const newRecord = {
        id: Date.now(),
        symbol,
        type,
        date,
        amount,
        price,
        fee,
        total
    };

    // 將新紀錄加入到全域狀態陣列
    cryptoRecords.push(newRecord);

    // 更新 UI 並儲存資料
    updateAllTablesAndSummary();
    updateCryptoHoldingsTable();
    await savePortfolioData();

    // 清空表單
    document.getElementById('cryptoForm').reset();
    
    // 添加成功動畫
    if (typeof window.addButtonSuccessAnimation === 'function') {
        const button = document.querySelector('.crypto-section .filled-button');
        const card = button?.closest('.card');
        if (button) window.addButtonSuccessAnimation(button);
        if (card) window.triggerSuccessAnimation(card);
    }
}

async function executeCryptoTrade(symbol, type, date, amount, price, fee) {
    const total = (amount * price) + (type === '買入' ? fee : -fee);

    cryptoRecords.push({ id: Date.now(), symbol, type, date, amount, price, fee, total });
    updateAllTablesAndSummary();
    updateCryptoHoldingsTable();
    updateCryptoSymbolDatalist(); // 更新下拉選單
    await savePortfolioData();

    // 添加成功動畫
    if (typeof window.addButtonSuccessAnimation === 'function') {
        const button = document.querySelector('#crypto .action-theme .filled-button');
        const card = button?.closest('.card');
        if (button) window.addButtonSuccessAnimation(button);
        if (card) window.triggerSuccessAnimation(card);
    }

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
    
    // 按最後交易日期降序排列（最新的在最上面）
    holdings.sort((a, b) => {
        const lastDateA = Math.max(...a.transactions.map(t => new Date(t.date)));
        const lastDateB = Math.max(...b.transactions.map(t => new Date(t.date)));
        return lastDateB - lastDateA;
    });
    
    tableBody.innerHTML = holdings.map(holding => {
        const totalValue = holding.totalAmount * holding.averagePrice;
        
        return `
            <tr>
                <td>${holding.symbol}</td>
                <td>${formatCryptoAmount(holding.totalAmount)}</td>
                <td>TWD ${holding.averagePrice.toFixed(2)}</td>
                <td>TWD ${totalValue.toLocaleString()}</td>
            </tr>
        `;
    }).join('');
}

/**
 * 根據 ID 刪除一筆加密貨幣紀錄。
 * @param {number} id - 要刪除的紀錄 ID。
 */
export function deleteCryptoRecord(id) {
    mdConfirm('確定要刪除這筆紀錄嗎？', async (confirmed) => {
        if (confirmed) {
            const index = cryptoRecords.findIndex(r => r.id === id);
            if (index > -1) {
                cryptoRecords.splice(index, 1);
                updateAllTablesAndSummary();
                updateCryptoHoldingsTable();
                updateCryptoSymbolDatalist(); // 更新下拉選單
                await savePortfolioData();
            }
        }
    });
} 