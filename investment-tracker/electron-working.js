/**
 * 可工作的 Electron 主程序
 * 先確保基本功能運行，後續再整合資料庫
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

/**
 * 創建主視窗
 */
function createMainWindow() {
    console.log('🔨 創建主視窗...');
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        show: false, // 先隱藏，載入完成後顯示
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false // 暫時關閉以避免跨域問題
        },
        titleBarStyle: 'default',
        autoHideMenuBar: true // 隱藏選單列，避免阿嬤迷路
    });
    
    // 載入主頁面
    const htmlPath = path.join(__dirname, 'door.html');
    console.log('📄 載入頁面:', htmlPath);
    
    mainWindow.loadFile('door.html');
    
    // 頁面載入完成後立即顯示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('✅ 主視窗已顯示 - 投資紀錄表已準備就緒！');
    });
    
    // 載入事件監聽
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('✅ 頁面載入完成');
    });
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ 頁面載入失敗:', errorCode, errorDescription);
    });
    
    // 開發環境下開啟開發者工具
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
    
    // 視窗關閉事件
    mainWindow.on('closed', () => {
        mainWindow = null;
        console.log('🚪 主視窗已關閉');
    });
}

/**
 * 應用程式初始化
 */
app.whenReady().then(() => {
    console.log('🚀 Electron 投資紀錄表啟動中...');
    createMainWindow();
});

/**
 * 所有視窗關閉時的處理
 */
app.on('window-all-closed', () => {
    console.log('🛑 所有視窗已關閉');
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

/**
 * 應用程式退出前的清理
 */
app.on('before-quit', () => {
    console.log('👋 應用程式即將退出');
});

console.log('📱 投資紀錄表 Electron 應用程式已初始化');
