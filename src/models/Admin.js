const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcrypt');

const Admin = sequelize.define('Admin', {
    adminId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    emailId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'admins',
    timestamps: true,
    indexes: [
        {
            fields: ['emailId']
        },
        {
            fields: ['isActive']
        }
    ]
});

Admin.prototype.checkPassword = function(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = Admin;
