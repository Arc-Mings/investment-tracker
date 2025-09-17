/**
 * @file forms.js
 * @description 處理所有表單的提交邏輯
 */

import { addRecord } from '../data/storage.js';

/**
 * 新增股票交易紀錄
 */
export function addStock() {
    const market = document.getElementById('stock-market').value;
    const assetType = document.getElementById('stock-asset-type').value;
    const code = document.getElementById('stock-code').value;
    const type = document.getElementById('stock-type').value;
    const date = document.getElementById('stock-date').value;
    const shares = parseFloat(document.getElementById('stock-shares').value);
    const price = parseFloat(document.getElementById('stock-price').value);
    const fee = parseFloat(document.getElementById('stock-fee').value) || 0;
    const total = parseFloat(document.getElementById('stock-total').value);

    if (code && type && date && shares > 0 && price > 0) {
        addRecord('stocks', { market, assetType, code, type, date, shares, price, fee, total });
        document.getElementById('stock-form').reset();
    } else {
        alert('請填寫所有必填欄位！');
    }
}

/**
 * 新增基金交易紀錄
 */
export function addFund() {
    const name = document.getElementById('fund-name').value;
    const date = document.getElementById('fund-date').value;
    const amount = parseFloat(document.getElementById('fund-amount').value);
    const nav = parseFloat(document.getElementById('fund-nav').value);
    const units = parseFloat(document.getElementById('fund-units').value);
    const fee = parseFloat(document.getElementById('fund-fee').value) || 0;

    if (name && date && amount > 0 && nav > 0) {
        addRecord('funds', { name, date, amount, nav, units, fee });
        document.getElementById('fund-form').reset();
    } else {
        alert('請填寫所有必填欄位！');
    }
}

/**
 * 新增加密貨幣交易紀錄
 */
export function addCrypto() {
    const symbol = document.getElementById('crypto-symbol').value;
    const type = document.getElementById('crypto-type').value;
    const date = document.getElementById('crypto-date').value;
    const amount = parseFloat(document.getElementById('crypto-amount').value);
    const price = parseFloat(document.getElementById('crypto-price').value);
    const fee = parseFloat(document.getElementById('crypto-fee').value) || 0;
    const total = parseFloat(document.getElementById('crypto-total').value);

    if (symbol && type && date && amount > 0 && price > 0) {
        addRecord('cryptos', { symbol, type, date, amount, price, fee, total });
        document.getElementById('crypto-form').reset();
    } else {
        alert('請填寫所有必填欄位！');
    }
}

/**
 * 新增房產紀錄
 */
export function addProperty() {
    const name = document.getElementById('property-name').value;
    const total = parseFloat(document.getElementById('property-total-price').value);
    const down = parseFloat(document.getElementById('property-down-payment').value);
    const loan = parseFloat(document.getElementById('property-loan-amount').value);
    const rate = parseFloat(document.getElementById('property-loan-rate').value);
    const years = parseInt(document.getElementById('property-loan-years').value);

    if (name && total > 0 && loan > 0) {
        addRecord('properties', { name, total, down, loan, rate, years });
        document.getElementById('property-form').reset();
    } else {
        alert('請填寫所有必填欄位！');
    }
}

/**
 * 新增房貸繳款紀錄
 */
export function addPayment() {
    const date = document.getElementById('payment-date').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const principal = parseFloat(document.getElementById('payment-principal').value) || 0;
    const interest = parseFloat(document.getElementById('payment-interest').value) || 0;

    if (date && amount > 0) {
        addRecord('payments', { date, amount, principal, interest });
        document.getElementById('payment-form').reset();
    } else {
        alert('請填寫所有必填欄位！');
    }
}