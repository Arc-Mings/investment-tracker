const { Sequelize } = require('sequelize');
const path = require('path');

// 初始化 Sequelize，連接到 SQLite 資料庫
// 資料庫檔案將被建立在 backend 資料夾的根目錄，名為 investment.db
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../investment.db'), // 使用 path.join 來確保路徑的正確性
    logging: false // 關閉日誌記錄，除非需要偵錯
});

module.exports = sequelize; 