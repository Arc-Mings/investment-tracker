/**
 * @file portfolio-analysis.js
 * @description 持倉分析頁面功能
 * 
 * 這個模組負責持倉分析頁面的所有功能，包括：
 * 1. 計算各類資產的持倉價值和損益
 * 2. 更新持倉分析卡片
 * 3. 更新整體持倉概覽表格
 */

import { calculateStockHoldings, calculateFundHoldings, calculateCryptoHoldings } from './portfolio.js';
import { showTab } from '../ui/uiManager.js';

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
 * 更新持倉分析頁面的所有內容
 */
export function updatePortfolioAnalysis() {
    updatePortfolioCards();
    updatePortfolioOverviewTable();
}

/**
 * 更新持倉分析卡片
 */
function updatePortfolioCards() {
    const stockHoldings = calculateStockHoldings();
    const fundHoldings = calculateFundHoldings();
    const cryptoHoldings = calculateCryptoHoldings();

    // 計算股票持倉
    let stockTotalValue = 0;
    stockHoldings.forEach(holding => {
        stockTotalValue += holding.totalShares * holding.averagePrice;
    });

    // 計算基金持倉
    let fundTotalValue = 0;
    fundHoldings.forEach(holding => {
        fundTotalValue += holding.totalUnits * holding.averageNav;
    });

    // 計算加密貨幣持倉
    let cryptoTotalValue = 0;
    cryptoHoldings.forEach(holding => {
        cryptoTotalValue += holding.totalAmount * holding.averagePrice;
    });

    const totalPortfolioValue = stockTotalValue + fundTotalValue + cryptoTotalValue;

    // 更新股票卡片
    updatePortfolioCard('stock', stockTotalValue, 0, totalPortfolioValue);
    
    // 更新基金卡片
    updatePortfolioCard('fund', fundTotalValue, 0, totalPortfolioValue);
    
    // 更新加密貨幣卡片
    updatePortfolioCard('crypto', cryptoTotalValue, 0, totalPortfolioValue);
}

/**
 * 更新單個持倉卡片
 * @param {string} type - 資產類型 (stock, fund, crypto)
 * @param {number} value - 持倉價值
 * @param {number} unrealizedPL - 未實現損益
 * @param {number} totalValue - 總投資組合價值
 */
function updatePortfolioCard(type, value, unrealizedPL, totalValue) {
    const percentage = totalValue > 0 ? (value / totalValue * 100) : 0;
    
    // 更新持倉價值
    const valueElement = document.getElementById(`${type}PortfolioValue`);
    if (valueElement) {
        const currency = type === 'stock' ? 'TWD/USD' : 'TWD';
        valueElement.textContent = `${currency} ${value.toLocaleString()}`;
    }
    
    // 更新未實現損益
    const plElement = document.getElementById(`${type}UnrealizedPL`);
    if (plElement) {
        plElement.textContent = `${unrealizedPL >= 0 ? '+' : ''}${unrealizedPL.toLocaleString()}`;
        plElement.className = `portfolio-metric-value ${unrealizedPL >= 0 ? 'profit' : 'loss'}`;
    }
    
    // 更新佔比
    const percentageElement = document.getElementById(`${type}PortfolioPercentage`);
    if (percentageElement) {
        percentageElement.textContent = `${percentage.toFixed(1)}%`;
    }
    
    // 更新進度條
    const progressFill = document.getElementById(`${type}ProgressFill`);
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
}

/**
 * 更新整體持倉概覽表格
 */
function updatePortfolioOverviewTable() {
    const tableBody = document.getElementById('portfolioOverviewTableBody');
    if (!tableBody) return;

    const stockHoldings = calculateStockHoldings();
    const fundHoldings = calculateFundHoldings();
    const cryptoHoldings = calculateCryptoHoldings();

    let allHoldings = [];

    // 處理股票持倉
    stockHoldings.forEach(holding => {
        const currentValue = holding.totalShares * holding.averagePrice;
        const cost = holding.totalCost - holding.totalFees;
        const unrealizedPL = currentValue - cost;
        const returnRate = cost > 0 ? (unrealizedPL / cost * 100) : 0;

        allHoldings.push({
            type: '股票',
            name: `${holding.market} ${holding.code}`,
            quantity: `${holding.totalShares.toLocaleString()} 股`,
            avgCost: `${holding.averagePrice.toFixed(2)}`,
            currentValue: currentValue.toLocaleString(),
            unrealizedPL: unrealizedPL,
            returnRate: returnRate,
            currency: holding.market === '台股' ? 'TWD' : 'USD',
            action: `quickSell('${holding.market}', '${holding.code}', ${holding.totalShares})`
        });
    });

    // 處理基金持倉
    fundHoldings.forEach(holding => {
        const currentValue = holding.totalUnits * holding.averageNav;
        const cost = holding.totalCost - holding.totalFees;
        const unrealizedPL = currentValue - cost;
        const returnRate = cost > 0 ? (unrealizedPL / cost * 100) : 0;

        allHoldings.push({
            type: '基金',
            name: holding.name,
            quantity: `${holding.totalUnits.toFixed(4)} 單位`,
            avgCost: holding.averageNav.toFixed(4),
            currentValue: currentValue.toLocaleString(),
            unrealizedPL: unrealizedPL,
            returnRate: returnRate,
            currency: 'TWD',
            action: `quickRedeem('${holding.name}', ${holding.totalUnits})`
        });
    });

    // 處理加密貨幣持倉
    cryptoHoldings.forEach(holding => {
        const currentValue = holding.totalAmount * holding.averagePrice;
        const cost = holding.totalCost - holding.totalFees;
        const unrealizedPL = currentValue - cost;
        const returnRate = cost > 0 ? (unrealizedPL / cost * 100) : 0;

        allHoldings.push({
            type: '加密貨幣',
            name: holding.symbol,
            quantity: `${formatCryptoAmount(holding.totalAmount)} ${holding.symbol}`,
            avgCost: `${holding.averagePrice.toFixed(2)} TWD`,
            currentValue: `${currentValue.toLocaleString()} TWD`,
            unrealizedPL: unrealizedPL,
            returnRate: returnRate,
            currency: 'TWD',
            action: `quickSellCrypto('${holding.symbol}', ${holding.totalAmount})`,
            symbol: holding.symbol, // 新增這個欄位用於單獨統計
            individualValue: currentValue // 新增這個欄位用於單獨統計
        });
    });

    // 按未實現損益排序（由高到低）
    allHoldings.sort((a, b) => b.unrealizedPL - a.unrealizedPL);
    
    // 顯示個別統計資訊
    displayIndividualStatistics(allHoldings);

    tableBody.innerHTML = allHoldings.map(holding => `
        <tr>
            <td>${holding.type}</td>
            <td>${holding.name}</td>
            <td>${holding.quantity}</td>
            <td>${holding.currency} ${holding.avgCost}</td>
            <td>${holding.currentValue}</td>
            <td>
                <span class="profit-loss-badge ${holding.unrealizedPL >= 0 ? 'profit' : 'loss'}">
                    <span class="material-icons">${holding.unrealizedPL >= 0 ? 'trending_up' : 'trending_down'}</span>
                    ${holding.currency} ${Math.abs(holding.unrealizedPL).toLocaleString()}
                </span>
            </td>
            <td>
                <span class="profit-loss-badge ${holding.returnRate >= 0 ? 'profit' : 'loss'}">
                    ${holding.returnRate >= 0 ? '+' : ''}${holding.returnRate.toFixed(2)}%
                </span>
            </td>
            <td>
                <button class="portfolio-action-btn" onclick="${holding.action}">
                    <span class="material-icons">sell</span>
                    賣出
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * 顯示個別統計資訊
 * @param {Array} allHoldings - 所有持倉資料
 */
function displayIndividualStatistics(allHoldings) {
    // 按類型分組統計
    const cryptoHoldings = allHoldings.filter(h => h.type === '加密貨幣');
    const stockHoldings = allHoldings.filter(h => h.type === '股票');
    const fundHoldings = allHoldings.filter(h => h.type === '基金');
    
    console.log('個別統計資訊:');
    console.log('加密貨幣持倉:', cryptoHoldings.length, '項目');
    console.log('股票持倉:', stockHoldings.length, '項目');
    console.log('基金持倉:', fundHoldings.length, '項目');
    
    // 顯示加密貨幣詳細統計
    if (cryptoHoldings.length > 0) {
        console.log('\n=== 加密貨幣個別統計 ===');
        cryptoHoldings.forEach(holding => {
            console.log(`${holding.symbol}: ${holding.individualValue.toLocaleString()} TWD (損益: ${holding.unrealizedPL >= 0 ? '+' : ''}${holding.unrealizedPL.toLocaleString()})`);
        });
    }
    
    // 顯示股票詳細統計
    if (stockHoldings.length > 0) {
        console.log('\n=== 股票個別統計 ===');
        stockHoldings.forEach(holding => {
            console.log(`${holding.name}: ${holding.currentValue} (損益: ${holding.unrealizedPL >= 0 ? '+' : ''}${holding.unrealizedPL.toLocaleString()})`);
        });
    }
    
    // 顯示基金詳細統計
    if (fundHoldings.length > 0) {
        console.log('\n=== 基金個別統計 ===');
        fundHoldings.forEach(holding => {
            console.log(`${holding.name}: ${holding.currentValue} (損益: ${holding.unrealizedPL >= 0 ? '+' : ''}${holding.unrealizedPL.toLocaleString()})`);
        });
    }
} 