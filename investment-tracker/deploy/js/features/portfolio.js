/**
 * @file portfolio.js
 * @description 持倉管理模組
 * 
 * 這個模組負責計算和管理投資組合的持倉狀況，包括：
 * 1. 計算每個標的的持有數量和平均成本
 * 2. 計算獲利/虧損狀況
 * 3. 計算投資報酬率
 */

import { stockRecords, cryptoRecords, fundRecords } from '../core/state.js';

/**
 * 計算股票持倉狀況
 * @returns {Array} 股票持倉陣列
 */
export function calculateStockHoldings() {
    const holdings = {};
    
    // 按股票代號分組計算
    stockRecords.forEach(record => {
        const key = `${record.market}-${record.code}`;
        
        if (!holdings[key]) {
            holdings[key] = {
                market: record.market,
                assetType: record.assetType,
                code: record.code,
                name: record.name || record.code, // 向下相容舊資料
                totalShares: 0,
                totalCost: 0,
                totalFees: 0,
                averagePrice: 0,
                transactions: []
            };
        }
        
        const holding = holdings[key];
        holding.transactions.push(record);
        
        if (record.type === '買入') {
            holding.totalShares += record.shares;
            holding.totalCost += record.total;
            holding.totalFees += record.fee;
        } else if (record.type === '賣出') {
            holding.totalShares -= record.shares;
            holding.totalCost -= record.total;
            holding.totalFees += record.fee;
            // 加入證交稅（如果有的話）
            if (record.tax) {
                holding.totalFees += record.tax;
            }
        }
    });
    
    // 計算平均成本
    Object.values(holdings).forEach(holding => {
        if (holding.totalShares > 0) {
            holding.averagePrice = (holding.totalCost - holding.totalFees) / holding.totalShares;
        }
    });
    
    // 只返回仍有持股的標的
    return Object.values(holdings).filter(holding => holding.totalShares > 0);
}

/**
 * 計算加密貨幣持倉狀況
 * @returns {Array} 加密貨幣持倉陣列
 */
export function calculateCryptoHoldings() {
    const holdings = {};
    
    cryptoRecords.forEach(record => {
        const key = record.symbol;
        
        if (!holdings[key]) {
            holdings[key] = {
                symbol: record.symbol,
                totalAmount: 0,
                totalCost: 0,
                totalFees: 0,
                averagePrice: 0,
                transactions: []
            };
        }
        
        const holding = holdings[key];
        holding.transactions.push(record);
        
        if (record.type === '買入') {
            holding.totalAmount += record.amount;
            holding.totalCost += record.total;
            holding.totalFees += record.fee;
        } else if (record.type === '賣出') {
            holding.totalAmount -= record.amount;
            holding.totalCost -= record.total;
            holding.totalFees += record.fee;
        }
    });
    
    // 計算平均成本
    Object.values(holdings).forEach(holding => {
        if (holding.totalAmount > 0) {
            holding.averagePrice = (holding.totalCost - holding.totalFees) / holding.totalAmount;
        }
    });
    
    return Object.values(holdings).filter(holding => holding.totalAmount > 0);
}

/**
 * 計算基金持倉狀況
 * @returns {Array} 基金持倉陣列
 */
export function calculateFundHoldings() {
    const holdings = {};
    
    fundRecords.forEach(record => {
        const key = record.name;
        
        if (!holdings[key]) {
            holdings[key] = {
                name: record.name,
                totalUnits: 0,
                totalCost: 0,
                totalFees: 0,
                averageNav: 0,
                transactions: []
            };
        }
        
        const holding = holdings[key];
        holding.transactions.push(record);
        
        // 基金目前只有買入，未來會加入贖回功能
        if (record.type === '買入' || !record.type) {
            holding.totalUnits += record.units;
            holding.totalCost += record.amount;
            holding.totalFees += record.fee;
        } else if (record.type === '贖回') {
            holding.totalUnits -= record.units;
            holding.totalCost -= record.amount;
            holding.totalFees += record.fee;
        }
    });
    
    // 計算平均淨值
    Object.values(holdings).forEach(holding => {
        if (holding.totalUnits > 0) {
            holding.averageNav = (holding.totalCost - holding.totalFees) / holding.totalUnits;
        }
    });
    
    return Object.values(holdings).filter(holding => holding.totalUnits > 0);
}

/**
 * 計算獲利/虧損
 * @param {Object} holding - 持倉物件
 * @param {number} currentPrice - 目前價格
 * @returns {Object} 獲利計算結果
 */
export function calculateProfitLoss(holding, currentPrice) {
    let totalValue, totalCost, profitLoss, profitLossPercentage;
    
    if (holding.totalShares !== undefined) {
        // 股票
        totalValue = holding.totalShares * currentPrice;
        totalCost = holding.totalCost - holding.totalFees;
    } else if (holding.totalAmount !== undefined) {
        // 加密貨幣
        totalValue = holding.totalAmount * currentPrice;
        totalCost = holding.totalCost - holding.totalFees;
    } else if (holding.totalUnits !== undefined) {
        // 基金
        totalValue = holding.totalUnits * currentPrice;
        totalCost = holding.totalCost - holding.totalFees;
    }
    
    profitLoss = totalValue - totalCost;
    profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
    
    return {
        totalValue,
        totalCost,
        profitLoss,
        profitLossPercentage,
        isProfit: profitLoss >= 0
    };
} 