/**
 * @file funds.js
 * @description 基金頁面功能
 * 
 * 這個模組負責所有與基金頁籤相關的操作，包括：
 * 1. 從表單讀取資料並新增一筆基金紀錄（買入/贖回）。
 * 2. 更新基金表格的顯示內容。
 * 3. 刪除指定的基金紀錄。
 * 4. 計算基金持倉和獲利狀況。
 */

import { fundRecords } from '../core/state.js';
import { storeManager } from '../data/storeManager.js';
import { validateData } from '../data/dataStructure.js';
import { updateAllTablesAndSummary } from './summary.js';
import { calculateFundHoldings } from './portfolio.js';

/**
 * 保存投資組合資料到 electron-store
 */
async function savePortfolioData() {
    try {
        const portfolioData = {
            stocks: window.stockRecords || [],
            crypto: window.cryptoRecords || [],
            funds: fundRecords,
            property: window.propertyRecords || [],
            payments: window.paymentRecords || []
        };
        
        const validatedData = validateData(portfolioData);
        await storeManager.save(validatedData);
        console.log('✅ 基金資料保存成功');
        
    } catch (error) {
        console.error('❌ 基金資料保存失敗:', error);
        if (typeof window.mdAlert === 'function') {
            window.mdAlert('資料保存失敗，請稍後重試');
        }
    }
}

/**
 * 初始化基金頁面的事件監聽器
 */
export function initializeFundPage() {
    const amountInput = document.getElementById('fundAmount');
    const navInput = document.getElementById('fundNav');
    const unitsInput = document.getElementById('fundUnits');
    const feeInput = document.getElementById('fundFee');
    
    // 自動計算單位數功能
    function calculateUnits() {
        const amount = parseFloat(amountInput?.value) || 0;
        const nav = parseFloat(navInput?.value) || 0;
        
        if (amount > 0 && nav > 0 && unitsInput) {
            const units = amount / nav;
            unitsInput.value = units.toFixed(4);
        }
    }
    
    // 添加事件監聽器
    if (amountInput) {
        amountInput.addEventListener('input', calculateUnits);
        amountInput.addEventListener('change', calculateUnits);
    }
    
    if (navInput) {
        navInput.addEventListener('input', calculateUnits);
        navInput.addEventListener('change', calculateUnits);
    }
    
    // 為所有數字輸入欄位添加長度限制
    const numberInputs = [
        { element: amountInput, maxLength: 10 },
        { element: navInput, maxLength: 10 },
        { element: unitsInput, maxLength: 10 },
        { element: feeInput, maxLength: 10 }
    ];
    
    numberInputs.forEach(({ element, maxLength }) => {
        if (element) {
            // 限制輸入長度
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
}

/**
 * 從表單獲取輸入，新增一筆基金紀錄。
 */
export async function addFundRecord() {
    const type = document.getElementById('fundType')?.value || '買入';
    const name = document.getElementById('fundName')?.value;
    const date = document.getElementById('fundDate')?.value;
    const amount = parseFloat(document.getElementById('fundAmount')?.value);
    const nav = parseFloat(document.getElementById('fundNav')?.value);
    const units = parseFloat(document.getElementById('fundUnits')?.value);
    const fee = parseFloat(document.getElementById('fundFee')?.value) || 0;

    if (!name || !date || isNaN(amount) || isNaN(nav) || isNaN(units)) {
        mdAlert('請填寫所有必要欄位', 'error');
        return;
    }
    
    // 檢查數值不能為負數
    if (amount < 0 || nav < 0 || units < 0 || fee < 0) {
        mdAlert('所有金額和數量都不能為負數', 'error');
        return;
    }

    // 如果是贖回，檢查是否有足夠單位數
    if (type === '贖回') {
        const holdings = calculateFundHoldings();
        const holding = holdings.find(h => h.name === name);
        
        if (!holding || holding.totalUnits < units) {
            mdAlert(`持有單位數不足！目前持有 ${holding ? holding.totalUnits.toFixed(4) : 0} 單位`, 'error');
            return;
        }
        
        // 計算獲利/虧損
        const profitLoss = (nav - holding.averageNav) * units - fee;
        const profitLossPercentage = ((nav - holding.averageNav) / holding.averageNav) * 100;
        
        // 顯示贖回資訊
        const message = `
贖回資訊：
• 贖回單位數：${units.toFixed(4)} 單位
• 贖回淨值：${nav.toFixed(4)}
• 平均成本淨值：${holding.averageNav.toFixed(4)}
• ${profitLoss >= 0 ? '獲利' : '虧損'}：${Math.abs(profitLoss).toLocaleString()}
• 報酬率：${profitLossPercentage >= 0 ? '+' : ''}${profitLossPercentage.toFixed(2)}%
        `;
        
        mdConfirm(message + '\n\n確定要執行贖回嗎？', (confirmed) => {
            if (confirmed) {
                // 執行贖回邏輯
                executeFundTrade(name, type, date, amount, nav, units, fee);
            }
        });
        return;
    }
    
    // 執行申購邏輯
    executeFundTrade(name, type, date, amount, nav, units, fee);
}

function executeFundTrade(name, type, date, amount, nav, units, fee) {
    fundRecords.push({ 
        id: Date.now(), 
        type, 
        name, 
        date, 
        amount, 
        nav, 
        units, 
        fee 
    });
    
    updateAllTablesAndSummary();
    updateFundHoldingsTable();
    savePortfolioData(); // 移除 await
    
    // 添加成功動畫
    if (typeof window.addButtonSuccessAnimation === 'function') {
        const button = document.querySelector('#funds .growth-action');
        const card = button?.closest('.card');
        if (button) window.addButtonSuccessAnimation(button);
        if (card) window.triggerSuccessAnimation(card);
    }
    
    // 清空表單
    document.getElementById('fundName').value = '';
    document.getElementById('fundAmount').value = '';
    document.getElementById('fundNav').value = '';
    document.getElementById('fundUnits').value = '';
    document.getElementById('fundFee').value = '';
}

/**
 * 更新基金交易紀錄表格的 HTML 內容。
 */
export function updateFundTable() {
    const tableBody = document.getElementById('fundTableBody');
    if (!tableBody) return;
    fundRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    tableBody.innerHTML = fundRecords.map(record => `
        <tr>
            <td>${record.date}</td>
            <td class="${(record.type === '贖回') ? 'negative' : 'positive'}">${record.type || '買入'}</td>
            <td>${record.name}</td>
            <td>${record.amount.toLocaleString()}</td>
            <td>${record.nav.toFixed(4)}</td>
            <td>${record.units.toFixed(4)}</td>
            <td>${record.fee.toLocaleString()}</td>
            <td>
                <button class="icon-button" onclick="deleteFundRecord(${record.id})">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * 更新基金持倉表格
 */
export function updateFundHoldingsTable() {
    const tableBody = document.getElementById('fundHoldingsTableBody');
    if (!tableBody) return;

    const holdings = calculateFundHoldings();
    
    // 按最後交易日期降序排列（最新的在最上面）
    holdings.sort((a, b) => {
        const lastDateA = Math.max(...a.transactions.map(t => new Date(t.date)));
        const lastDateB = Math.max(...b.transactions.map(t => new Date(t.date)));
        return lastDateB - lastDateA;
    });
    
    tableBody.innerHTML = holdings.map(holding => {
        const totalValue = holding.totalUnits * holding.averageNav;
        
        return `
            <tr>
                <td>${holding.name}</td>
                <td>${holding.totalUnits.toFixed(4)}</td>
                <td>${holding.averageNav.toFixed(4)}</td>
                <td>${totalValue.toLocaleString()}</td>
            </tr>
        `;
    }).join('');
}


/**
 * 根據 ID 刪除一筆基金紀錄。
 * @param {number} id - 要刪除的紀錄 ID。
 */
export function deleteFundRecord(id) {
    mdConfirm('確定要刪除這筆紀錄嗎？', async (confirmed) => {
        if (confirmed) {
            const index = fundRecords.findIndex(r => r.id === id);
            if (index > -1) {
                fundRecords.splice(index, 1);
                updateAllTablesAndSummary();
                updateFundHoldingsTable();
                await savePortfolioData();
            }
        }
    });
} 