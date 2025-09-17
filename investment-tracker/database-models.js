/**
 * 簡化的資料庫模型定義
 */
const { DataTypes } = require('sequelize');

function defineModels(sequelize) {
    // 股票交易記錄
    const Stock = sequelize.define('Stock', {
        market: DataTypes.STRING,
        assetType: DataTypes.STRING,
        code: DataTypes.STRING,
        name: DataTypes.STRING,
        type: DataTypes.STRING,
        date: DataTypes.DATEONLY,
        shares: DataTypes.DECIMAL(15, 6),
        price: DataTypes.DECIMAL(15, 4),
        fee: DataTypes.DECIMAL(10, 2),
        total: DataTypes.DECIMAL(15, 2)
    });

    // 基金交易記錄
    const Fund = sequelize.define('Fund', {
        name: DataTypes.STRING,
        date: DataTypes.DATEONLY,
        amount: DataTypes.DECIMAL(15, 2),
        nav: DataTypes.DECIMAL(15, 4),
        units: DataTypes.DECIMAL(15, 6),
        fee: DataTypes.DECIMAL(10, 2)
    });

    // 加密貨幣交易記錄
    const Crypto = sequelize.define('Crypto', {
        symbol: DataTypes.STRING,
        type: DataTypes.STRING,
        date: DataTypes.DATEONLY,
        amount: DataTypes.DECIMAL(20, 8),
        price: DataTypes.DECIMAL(15, 4),
        fee: DataTypes.DECIMAL(15, 8),
        total: DataTypes.DECIMAL(15, 2)
    });

    // 房產記錄
    const Property = sequelize.define('Property', {
        name: DataTypes.STRING,
        type: DataTypes.STRING,
        date: DataTypes.DATEONLY,
        amount: DataTypes.DECIMAL(15, 2),
        description: DataTypes.TEXT
    });

    // 繳款記錄
    const Payment = sequelize.define('Payment', {
        propertyId: DataTypes.INTEGER,
        date: DataTypes.DATEONLY,
        amount: DataTypes.DECIMAL(10, 2),
        principal: DataTypes.DECIMAL(10, 2),
        interest: DataTypes.DECIMAL(10, 2)
    });

    return { Stock, Fund, Crypto, Property, Payment };
}

module.exports = defineModels;
