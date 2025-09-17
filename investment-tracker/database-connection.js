/**
 * Electron 環境的資料庫連線
 */
const { Sequelize } = require('sequelize');
const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * 獲取資料庫檔案路徑
 */
function getDatabasePath() {
    // 使用用戶的 AppData 目錄
    const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', '投資紀錄表');
    
    // 確保目錄存在
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
        console.log('📁 創建用戶資料目錄:', userDataPath);
    }
    
    const dbPath = path.join(userDataPath, 'investment_tracker.db');
    console.log('🗄️ 資料庫檔案路徑:', dbPath);
    
    return dbPath;
}

// 創建 Sequelize 實例
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: getDatabasePath(),
    logging: console.log, // 開啟日誌以便除錯
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;
