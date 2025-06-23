const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Fund = sequelize.define('Fund', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    nav: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    units: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    fee: {
        type: DataTypes.FLOAT
    }
}, {
    tableName: 'funds',
    timestamps: false
});

module.exports = Fund; 