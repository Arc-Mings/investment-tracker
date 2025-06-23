const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Stock = sequelize.define('Stock', {
    // 模型屬性會被定義在這裡
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    market: {
        type: DataTypes.STRING,
        allowNull: false
    },
    assetType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    shares: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    fee: {
        type: DataTypes.FLOAT
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    // 其他模型選項
    tableName: 'stocks',
    timestamps: false // 我們不需要 Sequelize 自動建立 createdAt 和 updatedAt 欄位
});

module.exports = Stock; 