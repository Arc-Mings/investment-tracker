/**
 * @file uiManager.js
 * @description UI 介面管理
 * 
 * 這個模組負責管理應用程式中非特定頁面的通用 UI 互動，例如：
 * 1. 導覽頁籤的切換邏輯。
 * 2. 更新最後儲存時間的顯示。
 * 3. 應用程式初始化。
 */

// 功能頁面初始化已移至 main.js，減少重複導入
import { updateAllTablesAndSummary } from '../features/summary.js';

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
 * @param {Date} time - 可選的時間物件，如果未提供則使用當前時間
 */
export function updateLastSaveTime(time = new Date()) {
    const element = document.getElementById('lastSaveTime');
    if (!element) return;
    
    try {
        element.textContent = time.toLocaleString('zh-TW');
    } catch (error) {
        console.error("Failed to update last save time:", error);
        element.textContent = '時間格式錯誤';
    }
}

/**
 * 初始化應用程式，綁定所有必要的事件監聽器。
 */
export async function initializeApp() {
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

    // 資料載入和功能頁面初始化由 main.js 處理，這裡不重複載入

    // 頁面載入後，預設顯示第一個頁籤並更新所有UI
    showTab('stocks');
    updateAllTablesAndSummary();
    updateLastSaveTime();

    // 初始化狀態徽章：若仍為 connecting，先隱藏，待有明確狀態再顯示
    const statusElementBoot = document.getElementById('databaseStatus');
    if (statusElementBoot && statusElementBoot.classList.contains('connecting')) {
        statusElementBoot.style.display = 'none';
    }

    // 如果 5 秒後狀態仍然是連線中，強制更新為離線模式
    setTimeout(() => {
        const statusElement = document.getElementById('databaseStatus');
        if (statusElement && statusElement.classList.contains('connecting')) {
            console.warn('⚠️ 資料庫狀態仍為連線中，強制設定為離線模式');
            updateDatabaseStatus('disconnected', '離線模式 - 初始化超時');
        }
    }, 5000);

    console.log("UI Manager initialized.");
}

/**
 * 更新資料庫連線狀態指示器
 * @param {string} status - 狀態：'connecting', 'connected', 'disconnected'
 * @param {string} message - 顯示訊息
 */
export function updateDatabaseStatus(status, message) {
    const statusElement = document.getElementById('databaseStatus');
    if (!statusElement) return;
    
    const textElement = statusElement.querySelector('.status-text');
    const iconElement = statusElement.querySelector('.material-icons');
    
    // 清除所有狀態類別
    statusElement.classList.remove('connected', 'disconnected', 'connecting');
    
    // 設定狀態
    switch (status) {
        case 'connected':
            // 正常情況不打擾：已連線時隱藏徽章
            statusElement.style.display = 'none';
            statusElement.classList.add('connected');
            iconElement.textContent = 'cloud_done';
            textElement.textContent = message || 'electron-store 已就緒';
            statusElement.title = 'electron-store 資料持久化已就緒';
            break;
        case 'disconnected':
        case 'error':
            statusElement.style.display = '';
            statusElement.classList.add('disconnected');
            iconElement.textContent = 'cloud_off';
            textElement.textContent = message || '存儲不可用';
            statusElement.title = 'electron-store 不可用，可能影響資料持久化';
            break;
        case 'connecting':
        default:
            // 初始化期間隱藏徽章，避免長時間顯示「初始化中」
            statusElement.classList.add('connecting');
            statusElement.style.display = 'none';
            iconElement.textContent = 'storage';
            textElement.textContent = message || '初始化中...';
            statusElement.title = '正在初始化 electron-store';
            break;
    }
} 