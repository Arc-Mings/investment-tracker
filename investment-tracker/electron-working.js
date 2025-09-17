/**
 * 可工作的 Electron 主程序
 * 先確保基本功能運行，後續再整合資料庫
 */

const { app, BrowserWindow, ipcMain } = require('electron');
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
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // 暫時關閉以避免跨域問題
            preload: path.join(__dirname, 'preload.js')
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
    
    // 視窗關閉事件 - 改為最小化到系統托盤而非關閉程式
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
            console.log('📦 應用程式已最小化到背景');
            
            // 顯示提示訊息（僅第一次）
            if (!global.hasShownHideMessage) {
                global.hasShownHideMessage = true;
                const { dialog } = require('electron');
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: '應用程式運行中',
                    message: '投資紀錄表已最小化到背景運行',
                    detail: '您的資料會自動儲存。要完全退出程式，請使用右上角的檔案選單。',
                    buttons: ['知道了']
                });
            }
        }
    });
    
    mainWindow.on('closed', () => {
        mainWindow = null;
        console.log('🚪 主視窗已關閉');
    });
}

/**
 * IPC 事件處理
 */
ipcMain.on('quit-app', () => {
    console.log('📤 收到退出應用程式請求');
    app.isQuiting = true;
    app.quit();
});

/**
 * 應用程式初始化
 */
app.whenReady().then(() => {
    console.log('🚀 Electron 投資紀錄表啟動中...');
    createMainWindow();
});

/**
 * 所有視窗關閉時的處理 - 修改為不自動退出
 */
app.on('window-all-closed', () => {
    console.log('🛑 所有視窗已關閉，但程式繼續在背景運行');
    // 移除自動退出，讓程式在背景運行
    // Windows 和 Linux 用戶可以透過其他方式退出程式
});

/**
 * macOS 重新激活處理 + Windows/Linux 重新顯示處理
 */
app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    } else if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
        console.log('📖 從背景恢復顯示視窗');
    }
});

/**
 * 雙擊應用程式圖標時重新顯示視窗 (Windows/Linux)
 */
app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        if (!mainWindow.isVisible()) mainWindow.show();
        mainWindow.focus();
        console.log('🔍 應用程式已從背景恢復');
    }
});

/**
 * 應用程式退出前的清理
 */
app.on('before-quit', () => {
    console.log('👋 應用程式即將退出');
    app.isQuiting = true;
});

console.log('📱 投資紀錄表 Electron 應用程式已初始化');
