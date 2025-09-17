/**
 * 測試資料庫連線
 */

async function testDatabase() {
    console.log('🧪 開始測試資料庫連線...');
    
    try {
        // 測試 sequelize 模組
        const { Sequelize } = require('sequelize');
        console.log('✅ Sequelize 模組載入成功');
        
        // 測試資料庫連線
        const sequelize = require('./database-connection');
        console.log('✅ 資料庫連線模組載入成功');
        
        // 測試連線
        await sequelize.authenticate();
        console.log('✅ 資料庫連線成功');
        
        // 測試模型
        const defineModels = require('./database-models');
        const models = defineModels(sequelize);
        console.log('✅ 資料庫模型載入成功');
        
        // 同步資料庫
        await sequelize.sync({ force: false });
        console.log('✅ 資料庫同步成功');
        
        console.log('🎉 所有資料庫測試通過！');
        
    } catch (error) {
        console.error('❌ 資料庫測試失敗:', error);
        console.error('錯誤詳情:', error.message);
        console.error('堆疊追蹤:', error.stack);
    }
    
    process.exit();
}

testDatabase();
