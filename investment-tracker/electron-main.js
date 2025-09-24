const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const Store = require('electron-store');
const path = require('path');
const os = require('os');
const fs = require('fs');

// 初始化 electron-store
// 初始化 electron-store - 存到 E 槽
const store = new Store({
    cwd: 'E:/InvestmentData',
    schema: {
        portfolio: {
            type: 'object',
            default: {
                stocks: [],
                crypto: [],
                funds: [],
                property: [],
                payments: []
            }
        },
        settings: {
            type: 'object',
            default: {
                theme: 'light',
                autoSave: true
            }
        }
    }
});

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true
        },
        icon: path.join(__dirname, 'assets/money_icon.ico'),
        show: false,
        titleBarStyle: 'default'
    });

    // 載入你的 HTML 檔案
    mainWindow.loadFile('door.html');

    // 視窗準備好後顯示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 開發模式下開啟 DevTools
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // 全域快捷鍵：F12 或 Ctrl+Shift+I 切換 DevTools（非破壞性，方便除錯）
    mainWindow.webContents.on('before-input-event', (event, input) => {
        const isToggleDevtools =
            input.type === 'keyDown' && (
                (input.key === 'I' && input.control && input.shift) ||
                input.key === 'F12'
            );
        if (isToggleDevtools) {
            if (mainWindow.webContents.isDevToolsOpened()) {
                mainWindow.webContents.closeDevTools();
            } else {
                mainWindow.webContents.openDevTools({ mode: 'detach' });
            }
            event.preventDefault();
        }

        // 重新整理：F5 或 Ctrl+R
        const isReload = input.type === 'keyDown' && (
            input.key === 'F5' || (input.key === 'R' && input.control)
        );
        if (isReload) {
            mainWindow.webContents.reloadIgnoringCache();
            event.preventDefault();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 應用程式事件
app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC 處理器 - electron-store 操作
ipcMain.handle('store-get', (event, key) => {
    try {
        return store.get(key);
    } catch (error) {
        console.error('Store get error:', error);
        return null;
    }
});

ipcMain.handle('store-set', (event, key, value) => {
    try {
        store.set(key, value);
        return true;
    } catch (error) {
        console.error('Store set error:', error);
        return false;
    }
});

ipcMain.handle('store-delete', (event, key) => {
    try {
        store.delete(key);
        return true;
    } catch (error) {
        console.error('Store delete error:', error);
        return false;
    }
});

ipcMain.handle('store-clear', () => {
    try {
        store.clear();
        return true;
    } catch (error) {
        console.error('Store clear error:', error);
        return false;
    }
});

// 檔案操作
ipcMain.handle('show-save-dialog', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
        filters: [
            { name: 'JSON 檔案', extensions: ['json'] },
            { name: '所有檔案', extensions: ['*'] }
        ],
        defaultPath: 'investment-backup.json'
    });
    return result;
});

ipcMain.handle('show-open-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        filters: [
            { name: 'JSON 檔案', extensions: ['json'] },
            { name: '所有檔案', extensions: ['*'] }
        ],
        properties: ['openFile']
    });
    return result;
});

// 檔案讀寫
ipcMain.handle('write-file', async (event, filepath, data) => {
    try {
        fs.writeFileSync(filepath, data, 'utf8');
        return true;
    } catch (error) {
        console.error('Write file error:', error);
        return false;
    }
});

ipcMain.handle('read-file', async (event, filepath) => {
    try {
        return fs.readFileSync(filepath, 'utf8');
    } catch (error) {
        console.error('Read file error:', error);
        return null;
    }
});

// IPC 處理器
ipcMain.handle('get-all-records', () => {
    try {
        return store.get('portfolio', {
            stocks: [],
            crypto: [],
            funds: [],
            property: [],
            payments: []
        });
    } catch (error) {
        console.error('Get all records error:', error);
        return {
            stocks: [],
            crypto: [],
            funds: [],
            property: [],
            payments: []
        };
    }
});

ipcMain.handle('save-records', (event, data) => {
    try {
        store.set('portfolio', data);
        return true;
    } catch (error) {
        console.error('Save records error:', error);
        return false;
    }
});

ipcMain.on('quit-app', () => {
    app.quit();
});