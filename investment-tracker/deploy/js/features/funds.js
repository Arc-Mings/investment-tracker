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
import { saveToLocalStorage } from '../data/storage.js';
import { updateAllTablesAndSummary } from './summary.js';
import { calculateFundHoldings } from './portfolio.js';

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
export function addFundRecord() {
    const type = document.getElementById('fundType')?.value || '買入';
    const name = document.getElementById('fundName')?.value;
    const date = document.getElementById('fundDate')?.value;
    const amount = parseFloat(document.getElementById('fundAmount')?.value);
    const nav = parseFloat(document.getElementById('fundNav')?.value);
    const units = parseFloat(document.getElementById('fundUnits')?.value);
    const fee = parseFloat(document.getElementById('fundFee')?.value) || 0;

    if (!name || !date || isNaN(amount) || isNaN(nav) || isNaN(units)) {
        alert('請填寫所有必要欄位');
        return;
    }
    
    // 檢查數值不能為負數
    if (amount < 0 || nav < 0 || units < 0 || fee < 0) {
        alert('所有金額和數量都不能為負數');
        return;
    }

    // 如果是贖回，檢查是否有足夠單位數
    if (type === '贖回') {
        const holdings = calculateFundHoldings();
        const holding = holdings.find(h => h.name === name);
        
        if (!holding || holding.totalUnits < units) {
            alert(`持有單位數不足！目前持有 ${holding ? holding.totalUnits.toFixed(4) : 0} 單位`);
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
        
        if (!confirm(message + '\n\n確定要執行贖回嗎？')) {
            return;
        }
    }

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
    saveToLocalStorage();
    
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
    
    tableBody.innerHTML = holdings.map(holding => {
        const totalValue = holding.totalUnits * holding.averageNav;
        
        return `
            <tr>
                <td>${holding.name}</td>
                <td>${holding.totalUnits.toFixed(4)}</td>
                <td>${holding.averageNav.toFixed(4)}</td>
                <td>${totalValue.toLocaleString()}</td>
                <td>
                    <button class="outlined-button" onclick="quickRedeem('${holding.name}', ${holding.totalUnits})">
                        <span class="material-icons">sell</span>
                        快速贖回
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * 快速贖回功能
 * @param {string} name - 基金名稱
 * @param {number} maxUnits - 最大可贖回單位數
 */
window.quickRedeem = function(name, maxUnits) {
    // 填入表單
    document.getElementById('fundType').value = '贖回';
    document.getElementById('fundName').value = name;
    document.getElementById('fundUnits').value = maxUnits.toFixed(4);
    
    // 滾動到表單位置
    document.getElementById('fundName').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('fundNav').focus();
};

/**
 * 根據 ID 刪除一筆基金紀錄。
 * @param {number} id - 要刪除的紀錄 ID。
 */
export function deleteFundRecord(id) {
    if (confirm('確定要刪除這筆紀錄嗎？')) {
        const index = fundRecords.findIndex(r => r.id === id);
        if (index > -1) {
            fundRecords.splice(index, 1);
            updateAllTablesAndSummary();
            updateFundHoldingsTable();
            saveToLocalStorage();
        }
    }
} 