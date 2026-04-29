const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Crypto = sequelize.define('Crypto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    symbol: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 20]
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
    amount: {
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
    tableName: 'cryptos',
    timestamps: false
});

module.exports = Crypto; 