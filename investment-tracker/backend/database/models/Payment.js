const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    principal: {
        type: DataTypes.FLOAT
    },
    interest: {
        type: DataTypes.FLOAT
    }
}, {
    tableName: 'payments',
    timestamps: false
});

module.exports = Payment; 