/**
 * @file tables.js
 * @description 負責所有表格的渲染與操作
 */

import { stockRecords, fundRecords, cryptoRecords, propertyRecords, paymentRecords } from '../core/state.js';
import { deleteRecord } from '../data/storage.js';

function escapeHtml(value) {
    const text = String(value ?? '');
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeId(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * 更新股票表格
 */
export function updateStockTable() {
    const tbody = document.getElementById('stock-table-body');
    if (!tbody) return;
    tbody.innerHTML = stockRecords.map(record => `
        <tr>
            <td>${escapeHtml(record.market)}</td>
            <td>${escapeHtml(record.assetType)}</td>
            <td>${escapeHtml(record.code)}</td>
            <td>${escapeHtml(record.type)}</td>
            <td>${escapeHtml(record.date)}</td>
            <td>${escapeHtml(record.shares)}</td>
            <td>${escapeHtml(record.price)}</td>
            <td>${escapeHtml(record.fee)}</td>
            <td>${escapeHtml(record.total)}</td>
            <td><button class="btn btn-danger" onclick="deleteStock(${safeId(record.id)})">刪除</button></td>
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
            <td>${escapeHtml(record.name)}</td>
            <td>${escapeHtml(record.date)}</td>
            <td>${escapeHtml(record.amount)}</td>
            <td>${escapeHtml(record.nav)}</td>
            <td>${escapeHtml(record.units)}</td>
            <td>${escapeHtml(record.fee)}</td>
            <td><button class="btn btn-danger" onclick="deleteFund(${safeId(record.id)})">刪除</button></td>
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
            <td>${escapeHtml(record.symbol)}</td>
            <td>${escapeHtml(record.type)}</td>
            <td>${escapeHtml(record.date)}</td>
            <td>${escapeHtml(record.amount)}</td>
            <td>${escapeHtml(record.price)}</td>
            <td>${escapeHtml(record.fee)}</td>
            <td>${escapeHtml(record.total)}</td>
            <td><button class="btn btn-danger" onclick="deleteCrypto(${safeId(record.id)})">刪除</button></td>
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
            <td>${escapeHtml(record.name)}</td>
            <td>${escapeHtml(record.total)}</td>
            <td>${escapeHtml(record.down)}</td>
            <td>${escapeHtml(record.loan)}</td>
            <td>${escapeHtml(record.rate)}%</td>
            <td>${escapeHtml(record.years)}</td>
            <td><button class="btn btn-danger" onclick="deleteProperty(${safeId(record.id)})">刪除</button></td>
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
            <td>${escapeHtml(record.date)}</td>
            <td>${escapeHtml(record.amount)}</td>
            <td>${escapeHtml(record.principal)}</td>
            <td>${escapeHtml(record.interest)}</td>
            <td><button class="btn btn-danger" onclick="deletePayment(${safeId(record.id)})">刪除</button></td>
        </tr>
    `).join('');
}

/**
 * 刪除股票紀錄
 * @param {number} id - 紀錄在資料庫中的 ID
 */
window.deleteStock = function(id) {
    if (confirm('確定要刪除這筆股票紀錄嗎？')) {
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