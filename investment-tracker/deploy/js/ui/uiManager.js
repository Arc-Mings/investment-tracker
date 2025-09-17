/**
 * @file uiManager.js
 * @description UI 介面管理
 * 
 * 這個模組負責管理應用程式中非特定頁面的通用 UI 互動，例如：
 * 1. 導覽頁籤的切換邏輯。
 * 2. 更新最後儲存時間的顯示。
 * 3. 應用程式初始化。
 */

import { loadFromLocalStorage } from '../data/storage.js';
import { updateAllTablesAndSummary } from '../features/summary.js';
import { initializeStockPage } from '../features/stocks.js';
import { initializeFundPage } from '../features/funds.js';
import { initializeCryptoPage } from '../features/crypto.js';
import { initializePropertyPage } from '../features/property.js';

/**
 * 處理導覽頁籤的點擊事件，切換顯示的內容區塊。
 * @param {string} tabName - 要切換到的頁籤名稱 (例如 'stocks', 'funds' 等)。
 */
export function showTab(tabName) {
    if (!tabName) return;

    console.log(`Switching to tab: ${tabName}`);
    
    // 隱藏所有頁籤內容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // 移除所有頁籤的 'active' class
    document.querySelectorAll('.navigation-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // 顯示目標頁籤的內容
    const activeContent = document.getElementById(tabName);
    if (activeContent) {
        activeContent.classList.add('active');
    }

    // 將目標頁籤設為 'active'
    const activeTab = document.querySelector(`.navigation-tab[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // 如果是總覽頁面，強制更新統計數據
    if (tabName === 'summary') {
        updateAllTablesAndSummary();
    }
}

/**
 * 更新頁面上顯示的「最後儲存時間」。
 */
export function updateLastSaveTime() {
    const element = document.getElementById('lastSaveTime');
    if (!element) return;
    
    try {
        const saved = localStorage.getItem('investmentTracker');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.lastSave) {
                const time = new Date(data.lastSave);
                element.textContent = time.toLocaleString('zh-TW');
                return;
            }
        }
        element.textContent = '從未保存';
    } catch (error) {
        console.error("Failed to update last save time:", error);
        element.textContent = '讀取錯誤';
    }
}

/**
 * 初始化應用程式，綁定所有必要的事件監聽器。
 */
export function initializeApp() {
    console.log("Initializing UI Manager...");

    // 設定頁籤切換事件監聽 (使用 addEventListener)
    const tabs = document.querySelectorAll('.navigation-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            showTab(targetTab);
        });
    });

    // 設定今天日期
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (input) input.value = today;
    });

    // 載入已儲存的資料
    loadFromLocalStorage();
    
    // 初始化各功能頁面
    initializeStockPage();
    initializeFundPage();
    initializeCryptoPage();
    initializePropertyPage();

    // 頁面載入後，預設顯示第一個頁籤並更新所有UI
    showTab('stocks');
    updateAllTablesAndSummary();
    updateLastSaveTime();

    console.log("UI Manager initialized.");
} 