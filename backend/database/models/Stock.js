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
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 20]
        }
    },
    assetType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 20]
        }
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 30]
        }
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['買入', '賣出']]
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    shares: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    fee: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        }
    }
}, {
    // 其他模型選項
    tableName: 'stocks',
    timestamps: false // 我們不需要 Sequelize 自動建立 createdAt 和 updatedAt 欄位
});

module.exports = Stock; 