/**
 * @file property.js
 * @description 房產頁面功能
 * 
 * 這個模組負責所有與房產頁籤相關的操作，分為兩大部分：
 * 1. 房產資料管理：新增、更新、刪除房產物件。
 * 2. 房貸繳款紀錄管理：新增、更新、刪除單筆繳款紀錄。
 */

import { propertyRecords, paymentRecords } from '../core/state.js';
import { saveToLocalStorage } from '../data/storage.js';
import { updateAllTablesAndSummary } from './summary.js';

/**
 * 初始化房產頁面
 */
export function initializePropertyPage() {
    // 設置預設日期為今天
    const today = new Date().toISOString().split('T')[0];
    const paymentDateInput = document.getElementById('paymentDate');
    if (paymentDateInput) paymentDateInput.value = today;
    
    // 為所有數字輸入欄位添加長度限制
    const numberInputs = [
        'propertyTotal', 'propertyDown', 'propertyLoan', 'propertyRate', 'propertyYears',
        'paymentAmount', 'principalAmount', 'interestAmount'
    ];
    
    numberInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // 限制輸入長度為10字元
            input.addEventListener('input', function(e) {
                let value = e.target.value;
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
                e.target.value = value;
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
}

// --- 房產管理 ---

/**
 * 從表單獲取輸入，新增一筆房產紀錄。
 */
export function addPropertyRecord() {
    const name = document.getElementById('propertyName')?.value;
    const total = parseFloat(document.getElementById('propertyTotal')?.value);
    const down = parseFloat(document.getElementById('propertyDown')?.value);
    const loan = parseFloat(document.getElementById('propertyLoan')?.value);
    const rate = parseFloat(document.getElementById('propertyRate')?.value);
    const years = parseInt(document.getElementById('propertyYears')?.value, 10);

    if (!name || isNaN(total) || isNaN(loan)) {
        alert('請填寫物件名稱、總價和貸款金額');
        return;
    }
    
    // 檢查數值不能為負數
    if (total < 0 || loan < 0 || down < 0 || rate < 0 || years < 0) {
        alert('所有金額和年限都不能為負數');
        return;
    }

    propertyRecords.push({ id: Date.now(), name, total, down, loan, rate, years });
    updateAllTablesAndSummary();
    saveToLocalStorage();
    
    // 清空表單
    ['propertyName', 'propertyTotal', 'propertyDown', 'propertyLoan', 'propertyRate', 'propertyYears'].forEach(id => document.getElementById(id).value = '');
}

/**
 * 更新房產資訊表格的 HTML 內容。
 */
export function updatePropertyTable() {
    const tableBody = document.getElementById('propertyTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = propertyRecords.map(record => `
        <tr>
            <td>${record.name}</td>
            <td>${record.total.toLocaleString()}</td>
            <td>${record.down?.toLocaleString()}</td>
            <td>${record.loan.toLocaleString()}</td>
            <td>${record.rate?.toString() ?? ''}%</td>
            <td>${record.years?.toString() ?? ''}</td>
            <td>
                <button class="icon-button" onclick="deletePropertyRecord(${record.id})">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * 根據 ID 刪除一筆房產紀錄。
 * @param {number} id - 要刪除的房產紀錄 ID。
 */
export function deletePropertyRecord(id) {
    if (confirm('確定要刪除這筆房產資訊嗎？')) {
        const index = propertyRecords.findIndex(r => r.id === id);
        if (index > -1) {
            propertyRecords.splice(index, 1);
            updateAllTablesAndSummary();
            saveToLocalStorage();
        }
    }
}


// --- 房貸繳款管理 ---

/**
 * 從表單獲取輸入，新增一筆房貸繳款紀錄。
 */
export function addPaymentRecord() {
    const date = document.getElementById('paymentDate')?.value;
    const amount = parseFloat(document.getElementById('paymentAmount')?.value);
    const principal = parseFloat(document.getElementById('principalAmount')?.value);
    const interest = parseFloat(document.getElementById('interestAmount')?.value);

    if (!date || isNaN(amount)) {
        alert('請填寫繳款日期和金額');
        return;
    }
    
    // 檢查數值不能為負數
    if (amount < 0 || principal < 0 || interest < 0) {
        alert('所有金額都不能為負數');
        return;
    }

    paymentRecords.push({ id: Date.now(), date, amount, principal, interest });
    updateAllTablesAndSummary();
    saveToLocalStorage();
    
    ['paymentDate', 'paymentAmount', 'principalAmount', 'interestAmount'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const dateEl = document.getElementById('paymentDate');
    if(dateEl) dateEl.value = new Date().toISOString().split('T')[0];
}

/**
 * 更新房貸繳款表格的 HTML 內容。
 */
export function updatePaymentTable() {
    const tableBody = document.getElementById('paymentTableBody');
    if (!tableBody) return;
    paymentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    tableBody.innerHTML = paymentRecords.map(record => `
        <tr>
            <td>${record.date}</td>
            <td>${record.amount.toLocaleString()}</td>
            <td>${record.principal?.toLocaleString()}</td>
            <td>${record.interest?.toLocaleString()}</td>
            <td>
                <button class="icon-button" onclick="deletePaymentRecord(${record.id})">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * 根據 ID 刪除一筆房貸繳款紀錄。
 * @param {number} id - 要刪除的繳款紀錄 ID。
 */
export function deletePaymentRecord(id) {
    if (confirm('確定要刪除這筆繳款紀錄嗎？')) {
        const index = paymentRecords.findIndex(r => r.id === id);
        if (index > -1) {
            paymentRecords.splice(index, 1);
            updateAllTablesAndSummary();
            saveToLocalStorage();
        }
    }
} 