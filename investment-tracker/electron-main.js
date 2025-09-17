/**
 * Electron 主程序
 * 投資紀錄表 - 阿嬤級用戶友善版本
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 資料庫服務相關
let sequelize, Stock, Fund, Crypto, Property, Payment;

try {
    sequelize = require('./database-connection');
    const defineModels = require('./database-models');
    const models = defineModels(sequelize);
    
    Stock = models.Stock;
    Fund = models.Fund;
    Crypto = models.Crypto;
    Property = models.Property;
    Payment = models.Payment;
    
    console.log('✅ 資料庫連線和模型載入成功');
} catch (error) {
    console.error('❌ 資料庫服務載入失敗:', error.message);
    console.log('⚠️ 將以前端模式運行');
}

let mainWindow;
let backendServer;
const BACKEND_PORT = 3001; // 內部端口，用戶看不到

/**
 * 獲取用戶資料目錄
 */
function getUserDataPath() {
    const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', '投資紀錄表');
    
    // 確保目錄存在
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    return userDataPath;
}

/**
 * 啟動內嵌後端服務
 */
async function startBackendServer() {
    // 檢查後端模組是否正確載入
    if (!sequelize) {
        console.log('⚠️ 後端模組未載入，跳過後端服務啟動');
        return false;
    }
    
    try {
        console.log('🚀 啟動內嵌後端服務...');
        
        // 設置資料庫路徑到用戶資料夾
        const dbPath = path.join(getUserDataPath(), 'investment_tracker.db');
        process.env.DATABASE_PATH = dbPath;
        
        const server = express();
        server.use(cors());
        server.use(express.json());
        
        // 基本路由
        server.get('/api/health', (req, res) => {
            res.json({ status: 'ok', message: '後端服務運行正常' });
        });
        
        // 獲取所有紀錄
        server.get('/api/records', async (req, res) => {
            try {
                const stocks = await Stock.findAll();
                const funds = await Fund.findAll();
                const cryptos = await Crypto.findAll();
                const properties = await Property.findAll();
                const payments = await Payment.findAll();
                res.json({ stocks, funds, cryptos, properties, payments });
            } catch (error) {
                res.status(500).json({ error: '獲取紀錄失敗', details: error.message });
            }
        });
        
        // 新增股票紀錄
        server.post('/api/stocks', async (req, res) => {
            try {
                const stock = await Stock.create(req.body);
                res.status(201).json(stock);
            } catch (error) {
                res.status(400).json({ error: '新增股票紀錄失敗', details: error.message });
            }
        });
        
        // 刪除股票紀錄
        server.delete('/api/stocks/:id', async (req, res) => {
            try {
                const deleted = await Stock.destroy({ where: { id: req.params.id } });
                if (deleted) {
                    res.status(204).send();
                } else {
                    res.status(404).json({ error: '找不到指定的股票紀錄' });
                }
            } catch (error) {
                res.status(500).json({ error: '刪除股票紀錄失敗', details: error.message });
            }
        });
        
        // 新增基金紀錄
        server.post('/api/funds', async (req, res) => {
            try {
                const fund = await Fund.create(req.body);
                res.status(201).json(fund);
            } catch (error) {
                res.status(400).json({ error: '新增基金紀錄失敗', details: error.message });
            }
        });
        
        // 刪除基金紀錄
        server.delete('/api/funds/:id', async (req, res) => {
            try {
                const deleted = await Fund.destroy({ where: { id: req.params.id } });
                if (deleted) res.status(204).send();
                else res.status(404).json({ error: '找不到指定的基金紀錄' });
            } catch (error) {
                res.status(500).json({ error: '刪除基金紀錄失敗', details: error.message });
            }
        });
        
        // 新增加密貨幣紀錄
        server.post('/api/cryptos', async (req, res) => {
            try {
                const crypto = await Crypto.create(req.body);
                res.status(201).json(crypto);
            } catch (error) {
                res.status(400).json({ error: '新增加密貨幣紀錄失敗', details: error.message });
            }
        });
        
        // 刪除加密貨幣紀錄
        server.delete('/api/cryptos/:id', async (req, res) => {
            try {
                const deleted = await Crypto.destroy({ where: { id: req.params.id } });
                if (deleted) res.status(204).send();
                else res.status(404).json({ error: '找不到指定的加密貨幣紀錄' });
            } catch (error) {
                res.status(500).json({ error: '刪除加密貨幣紀錄失敗', details: error.message });
            }
        });
        
        // 新增房產紀錄
        server.post('/api/properties', async (req, res) => {
            try {
                const property = await Property.create(req.body);
                res.status(201).json(property);
            } catch (error) {
                res.status(400).json({ error: '新增房產紀錄失敗', details: error.message });
            }
        });
        
        // 刪除房產紀錄
        server.delete('/api/properties/:id', async (req, res) => {
            try {
                const deleted = await Property.destroy({ where: { id: req.params.id } });
                if (deleted) res.status(204).send();
                else res.status(404).json({ error: '找不到指定的房產紀錄' });
            } catch (error) {
                res.status(500).json({ error: '刪除房產紀錄失敗', details: error.message });
            }
        });
        
        // 新增繳款紀錄
        server.post('/api/payments', async (req, res) => {
            try {
                const payment = await Payment.create(req.body);
                res.status(201).json(payment);
            } catch (error) {
                res.status(400).json({ error: '新增繳款紀錄失敗', details: error.message });
            }
        });
        
        // 刪除繳款紀錄
        server.delete('/api/payments/:id', async (req, res) => {
            try {
                const deleted = await Payment.destroy({ where: { id: req.params.id } });
                if (deleted) res.status(204).send();
                else res.status(404).json({ error: '找不到指定的繳款紀錄' });
            } catch (error) {
                res.status(500).json({ error: '刪除繳款紀錄失敗', details: error.message });
            }
        });
        
        // 同步資料庫並啟動伺服器
        console.log('🔄 開始同步資料庫...');
        await sequelize.sync({ alter: true });
        console.log('✅ 資料庫同步成功！');
        
        console.log(`🌐 啟動後端伺服器在端口 ${BACKEND_PORT}...`);
        backendServer = server.listen(BACKEND_PORT, 'localhost', () => {
            console.log(`✅ 內嵌後端服務運行在 http://localhost:${BACKEND_PORT}`);
        });
        
        // 測試 API 端點
        setTimeout(async () => {
            try {
                const response = await fetch(`http://localhost:${BACKEND_PORT}/api/health`);
                const result = await response.json();
                console.log('✅ API 健康檢查成功:', result);
            } catch (error) {
                console.error('❌ API 健康檢查失敗:', error);
            }
        }, 1000);
        
        return true;
    } catch (error) {
        console.error('❌ 後端服務啟動失敗:', error);
        return false;
    }
}

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
        // icon: path.join(__dirname, 'assets', 'icon.png'), // 暫時註解圖示
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'default', // Windows 標準標題列
        autoHideMenuBar: true // 隱藏選單列，避免阿嬤迷路
    });
    
    // 載入主頁面
    mainWindow.loadFile('door.html');
    
    // 頁面載入完成後立即顯示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('✅ 主視窗已顯示');
    });
    
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
                    detail: '您的資料會自動儲存。要完全退出程式，請使用右上角的選單。',
                    buttons: ['知道了']
                });
            }
        }
    });
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    
    // 開發環境下開啟開發者工具
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

/**
 * 應用程式初始化
 */
app.whenReady().then(async () => {
    console.log('🚀 Electron 應用程式啟動...');
    
    // 先啟動後端服務
    const backendStarted = await startBackendServer();
    
    // 無論後端是否啟動成功，都要創建主視窗，以離線模式運行
    createMainWindow();
    
    if (!backendStarted) {
        console.log('⚠️ 後端服務啟動失敗，程式將以離線模式運行');
        // 不再顯示錯誤對話框，讓前端處理連線狀態顯示
    }
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
 * IPC 事件處理
 */
ipcMain.on('quit-app', () => {
    console.log('📤 收到退出應用程式請求');
    
    // 關閉後端服務
    if (backendServer) {
        backendServer.close(() => {
            console.log('✅ 後端服務已關閉');
        });
    }
    
    app.isQuiting = true;
    app.quit();
});

/**
 * 應用程式退出前的清理
 */
app.on('before-quit', () => {
    console.log('👋 應用程式即將退出');
    app.isQuiting = true;
});

/**
 * 安全設定：限制導航
 */
app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        // 只允許載入本地檔案和後端 API
        if (parsedUrl.origin !== `http://localhost:${BACKEND_PORT}` && 
            !navigationUrl.startsWith('file://')) {
            event.preventDefault();
        }
    });
});

console.log('📱 投資紀錄表 Electron 應用程式已準備就緒');
