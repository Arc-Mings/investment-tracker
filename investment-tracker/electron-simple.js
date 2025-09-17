/**
 * 簡化版 Electron 主程序
 * 用於測試基本功能
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

/**
 * 創建主視窗
 */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        show: false, // 先隱藏，載入完成後顯示
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        titleBarStyle: 'default',
        autoHideMenuBar: true // 隱藏選單列
    });
    
    // 載入主頁面
    mainWindow.loadFile('door.html');
    
    // 頁面載入完成後立即顯示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('✅ 主視窗已顯示');
    });
    
    // 開發環境下開啟開發者工具
    mainWindow.webContents.openDevTools();
    
    // 視窗關閉事件
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

/**
 * 應用程式初始化
 */
app.whenReady().then(() => {
    console.log('🚀 簡化版 Electron 應用程式啟動...');
    createMainWindow();
});

/**
 * 所有視窗關閉時的處理
 */
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/**
 * macOS 重新激活處理
 */
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

console.log('📱 簡化版投資紀錄表 Electron 應用程式已準備就緒');
