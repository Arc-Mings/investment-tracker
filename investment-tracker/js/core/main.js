import { initializeApp } from '../ui/uiManager.js';
import { initializeEventListeners } from './events.js';

/**
 * @file 主程式進入點
 * @description 這個檔案是整個應用程式的起點。它負責在 DOM 載入完成後，
 *              初始化事件監聽器和應用程式的核心功能。
 */

// 主程式進入點
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded. Initializing application.");
    
    // 初始化所有需要從 HTML on-click 呼叫的事件監聽器
    initializeEventListeners();
    
    // 初始化應用程式 UI 和核心邏輯
    initializeApp();
}); 