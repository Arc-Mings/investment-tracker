/**
 * 測試腳本：檢查 Electron 應用程式的基本功能
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createTestWindow() {
    const testWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 載入一個簡單的測試頁面
    testWindow.loadFile('door.html');
    
    // 顯示開發者工具
    testWindow.webContents.openDevTools();
    
    testWindow.webContents.on('did-finish-load', () => {
        console.log('✅ 頁面載入完成');
    });
    
    testWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ 頁面載入失敗:', errorCode, errorDescription);
    });
}

app.whenReady().then(() => {
    console.log('🧪 Electron 測試應用程式啟動');
    createTestWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createTestWindow();
    }
});
