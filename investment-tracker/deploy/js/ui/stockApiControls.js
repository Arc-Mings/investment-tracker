/**
 * @file stockApiControls.js
 * @description 股票API控制界面
 * 
 * 提供API狀態監控、快取管理、設定等功能
 */

import { clearCache, getCacheStats } from '../services/stockApiService.js';

/**
 * 初始化股票API控制界面
 */
export function initializeStockApiControls() {
    // 在頁面中添加API狀態區塊
    addApiStatusSection();
    
    // 綁定控制按鈕事件
    bindApiControlEvents();
    
    // 定期更新狀態
    updateApiStatus();
    setInterval(updateApiStatus, 30000); // 每30秒更新一次
}

/**
 * 在設定區域添加API狀態區塊
 */
function addApiStatusSection() {
    // 尋找合適的容器來插入API狀態區塊
    const summarySection = document.querySelector('#summary .card');
    if (!summarySection) return;
    
    const apiStatusHTML = `
        <div class="api-status-section" style="margin-top: 20px; padding: 15px; background: var(--md-sys-color-surface-variant); border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: var(--md-sys-color-on-surface);">
                <span class="material-icons" style="vertical-align: middle; margin-right: 5px;">api</span>
                股票API狀態
            </h4>
            
            <div class="api-status-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div class="status-item">
                    <span class="status-label">快取狀態:</span>
                    <span id="cacheStatus" class="status-value">載入中...</span>
                </div>
                <div class="status-item">
                    <span class="status-label">API服務:</span>
                    <span id="apiStatus" class="status-value">檢測中...</span>
                </div>
            </div>
            
            <div class="api-controls" style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="clearCacheBtn" class="outlined-button" style="font-size: 12px; padding: 6px 12px;">
                    <span class="material-icons" style="font-size: 16px;">clear_all</span>
                    清除快取
                </button>
                <button id="testApiBtn" class="outlined-button" style="font-size: 12px; padding: 6px 12px;">
                    <span class="material-icons" style="font-size: 16px;">network_check</span>
                    測試API
                </button>
                <button id="refreshStatusBtn" class="outlined-button" style="font-size: 12px; padding: 6px 12px;">
                    <span class="material-icons" style="font-size: 16px;">refresh</span>
                    重新整理
                </button>
            </div>
            
            <div id="apiStatusDetails" class="status-details" style="margin-top: 10px; font-size: 12px; color: var(--md-sys-color-outline);">
                <div>快取項目: <span id="cacheItemCount">-</span></div>
                <div>有效項目: <span id="validItemCount">-</span></div>
                <div>過期項目: <span id="expiredItemCount">-</span></div>
            </div>
        </div>
    `;
    
    summarySection.insertAdjacentHTML('beforeend', apiStatusHTML);
}

/**
 * 綁定API控制按鈕事件
 */
function bindApiControlEvents() {
    // 清除快取按鈕
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            if (confirm('確定要清除所有股票名稱快取嗎？')) {
                clearCache();
                updateApiStatus();
                showStatusMessage('快取已清除', 'success');
            }
        });
    }
    
    // 測試API按鈕
    const testApiBtn = document.getElementById('testApiBtn');
    if (testApiBtn) {
        testApiBtn.addEventListener('click', testApiConnection);
    }
    
    // 重新整理按鈕
    const refreshStatusBtn = document.getElementById('refreshStatusBtn');
    if (refreshStatusBtn) {
        refreshStatusBtn.addEventListener('click', updateApiStatus);
    }
}

/**
 * 更新API狀態顯示
 */
function updateApiStatus() {
    try {
        // 更新快取狀態
        const stats = getCacheStats();
        
        const cacheStatus = document.getElementById('cacheStatus');
        const cacheItemCount = document.getElementById('cacheItemCount');
        const validItemCount = document.getElementById('validItemCount');
        const expiredItemCount = document.getElementById('expiredItemCount');
        
        if (cacheStatus) {
            if (stats.total > 0) {
                cacheStatus.textContent = `${stats.valid} 項有效`;
                cacheStatus.style.color = 'var(--md-sys-color-primary)';
            } else {
                cacheStatus.textContent = '無快取';
                cacheStatus.style.color = 'var(--md-sys-color-outline)';
            }
        }
        
        if (cacheItemCount) cacheItemCount.textContent = stats.total;
        if (validItemCount) validItemCount.textContent = stats.valid;
        if (expiredItemCount) expiredItemCount.textContent = stats.expired;
        
    } catch (error) {
        console.warn('更新API狀態時發生錯誤:', error);
    }
}

/**
 * 測試API連接
 */
async function testApiConnection() {
    const testApiBtn = document.getElementById('testApiBtn');
    const apiStatus = document.getElementById('apiStatus');
    
    if (testApiBtn) testApiBtn.disabled = true;
    if (apiStatus) {
        apiStatus.textContent = '測試中...';
        apiStatus.style.color = 'var(--md-sys-color-outline)';
    }
    
    try {
        // 測試台股代碼
        const testUrl = 'https://query1.finance.yahoo.com/v1/finance/search?q=2330.TW&quotesCount=1&newsCount=0';
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.quotes && data.quotes.length > 0) {
                if (apiStatus) {
                    apiStatus.textContent = '正常';
                    apiStatus.style.color = 'var(--md-sys-color-primary)';
                }
                showStatusMessage('API連接正常', 'success');
            } else {
                throw new Error('API返回數據異常');
            }
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
        
    } catch (error) {
        console.warn('API測試失敗:', error);
        if (apiStatus) {
            apiStatus.textContent = '異常';
            apiStatus.style.color = 'var(--md-sys-color-error)';
        }
        showStatusMessage(`API連接失敗: ${error.message}`, 'error');
    } finally {
        if (testApiBtn) testApiBtn.disabled = false;
    }
}

/**
 * 顯示狀態消息
 * @param {string} message - 消息內容
 * @param {string} type - 消息類型 ('success', 'error', 'info')
 */
function showStatusMessage(message, type = 'info') {
    // 創建臨時消息元素
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    // 根據類型設置顏色
    switch (type) {
        case 'success':
            messageDiv.style.background = 'var(--md-sys-color-primary-container)';
            messageDiv.style.color = 'var(--md-sys-color-on-primary-container)';
            break;
        case 'error':
            messageDiv.style.background = 'var(--md-sys-color-error-container)';
            messageDiv.style.color = 'var(--md-sys-color-on-error-container)';
            break;
        default:
            messageDiv.style.background = 'var(--md-sys-color-surface-variant)';
            messageDiv.style.color = 'var(--md-sys-color-on-surface-variant)';
    }
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // 3秒後自動移除
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }
    }, 3000);
}

// 添加必要的CSS動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .status-label {
        font-size: 12px;
        color: var(--md-sys-color-outline);
    }
    
    .status-value {
        font-size: 12px;
        font-weight: 500;
    }
`;
document.head.appendChild(style); 