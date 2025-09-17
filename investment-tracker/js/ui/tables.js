/**
 * @file tables.js
 * @description 負責所有表格的渲染與操作
 */

import { stockRecords, fundRecords, cryptoRecords, propertyRecords, paymentRecords } from '../core/state.js';
import { deleteRecord } from '../data/storage.js';

/**
 * 更新股票表格
 */
export function updateStockTable() {
    const tbody = document.getElementById('stock-table-body');
    if (!tbody) return;
    tbody.innerHTML = stockRecords.map(record => `
        <tr>
            <td>${record.market}</td>
            <td>${record.assetType}</td>
            <td>${record.code}</td>
            <td>${record.type}</td>
            <td>${record.date}</td>
            <td>${record.shares}</td>
            <td>${record.price}</td>
            <td>${record.fee}</td>
            <td>${record.total}</td>
            <td><button class="btn btn-danger" onclick="deleteStock(${record.id})">刪除</button></td>
        </tr>
    `).join('');
}

/**
 * 更新基金表格
 */
export function updateFundTable() {
    const tbody = document.getElementById('fund-table-body');
    if (!tbody) return;
    tbody.innerHTML = fundRecords.map(record => `
        <tr>
            <td>${record.name}</td>
            <td>${record.date}</td>
            <td>${record.amount}</td>
            <td>${record.nav}</td>
            <td>${record.units}</td>
            <td>${record.fee}</td>
            <td><button class="btn btn-danger" onclick="deleteFund(${record.id})">刪除</button></td>
        </tr>
    `).join('');
}

/**
 * 更新加密貨幣表格
 */
export function updateCryptoTable() {
    const tbody = document.getElementById('crypto-table-body');
    if (!tbody) return;
    tbody.innerHTML = cryptoRecords.map(record => `
        <tr>
            <td>${record.symbol}</td>
            <td>${record.type}</td>
            <td>${record.date}</td>
            <td>${record.amount}</td>
            <td>${record.price}</td>
            <td>${record.fee}</td>
            <td>${record.total}</td>
            <td><button class="btn btn-danger" onclick="deleteCrypto(${record.id})">刪除</button></td>
        </tr>
    `).join('');
}

/**
 * 更新房產表格
 */
export function updatePropertyTable() {
    const tbody = document.getElementById('property-table-body');
    if (!tbody) return;
    tbody.innerHTML = propertyRecords.map(record => `
        <tr>
            <td>${record.name}</td>
            <td>${record.total}</td>
            <td>${record.down}</td>
            <td>${record.loan}</td>
            <td>${record.rate}%</td>
            <td>${record.years}</td>
            <td><button class="btn btn-danger" onclick="deleteProperty(${record.id})">刪除</button></td>
        </tr>
    `).join('');
}

/**
 * 更新繳款表格
 */
export function updatePaymentTable() {
    const tbody = document.getElementById('payment-table-body');
    if (!tbody) return;
    tbody.innerHTML = paymentRecords.map(record => `
        <tr>
            <td>${record.date}</td>
            <td>${record.amount}</td>
            <td>${record.principal}</td>
            <td>${record.interest}</td>
            <td><button class="btn btn-danger" onclick="deletePayment(${record.id})">刪除</button></td>
        </tr>
    `).join('');
}

/**
 * 刪除股票紀錄
 * @param {number} id - 紀錄在資料庫中的 ID
 */
window.deleteStock = async function(id) {
    const confirmed = await window.showCustomDialog({
        icon: 'delete',
        title: '刪除股票紀錄',
        message: '確定要刪除這筆股票紀錄嗎？',
        confirmText: '刪除',
        cancelText: '取消',
        type: 'danger'
    });
    
    if (confirmed) {
        deleteRecord('stocks', id);
    }
};

/**
 * 刪除基金紀錄
 * @param {number} id - 紀錄在資料庫中的 ID
 */
window.deleteFund = function(id) {
    if (confirm('確定要刪除這筆基金紀錄嗎？')) {
        deleteRecord('funds', id);
    }
};

/**
 * 刪除加密貨幣紀錄
 * @param {number} id - 紀錄在資料庫中的 ID
 */
window.deleteCrypto = function(id) {
    if (confirm('確定要刪除這筆加密貨幣紀錄嗎？')) {
        deleteRecord('cryptos', id);
    }
};

/**
 * 刪除房產紀錄
 * @param {number} id - 紀錄在資料庫中的 ID
 */
window.deleteProperty = function(id) {
    if (confirm('確定要刪除這筆房產紀錄嗎？')) {
        deleteRecord('properties', id);
    }
};

/**
 * 刪除繳款紀錄
 * @param {number} id - 紀錄在資料庫中的 ID
 */
window.deletePayment = function(id) {
    if (confirm('確定要刪除這筆繳款紀錄嗎？')) {
        deleteRecord('payments', id);
    }
};