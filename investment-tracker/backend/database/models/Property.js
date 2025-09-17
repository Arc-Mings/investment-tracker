const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Property = sequelize.define('Property', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    down: {
        type: DataTypes.FLOAT
    },
    loan: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    rate: {
        type: DataTypes.FLOAT
    },
    years: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'properties',
    timestamps: false
});

module.exports = Property; 