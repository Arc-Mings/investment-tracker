const express = require('express');
const cors = require('cors');
const sequelize = require('./database/connection');

// 引入模型
const Stock = require('./database/models/Stock');
const Fund = require('./database/models/Fund');
const Crypto = require('./database/models/Crypto');
const Property = require('./database/models/Property');
const Payment = require('./database/models/Payment');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // 允許跨域請求
app.use(express.json()); // 解析 JSON 格式的請求主體

// 基本路由
app.get('/', (req, res) => {
    res.send('投資紀錄表後端伺服器已啟動！');
});

// --- API 路由 ---

// 獲取所有紀錄
app.get('/api/records', async (req, res) => {
    try {
        const stocks = await Stock.findAll();
        const funds = await Fund.findAll();
        const cryptos = await Crypto.findAll();
        const properties = await Property.findAll();
        const payments = await Payment.findAll();
        res.json({ stocks, funds, cryptos, properties, payments });
    } catch (error) {
        res.status(500).json({ error: '獲取紀錄失敗', details: error });
    }
});

// 新增股票紀錄
app.post('/api/stocks', async (req, res) => {
    try {
        const stock = await Stock.create(req.body);
        res.status(201).json(stock);
    } catch (error) {
        res.status(400).json({ error: '新增股票紀錄失敗', details: error });
    }
});

// 刪除股票紀錄
app.delete('/api/stocks/:id', async (req, res) => {
    try {
        const deleted = await Stock.destroy({ where: { id: req.params.id } });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: '找不到指定的股票紀錄' });
        }
    } catch (error) {
        res.status(500).json({ error: '刪除股票紀錄失敗', details: error });
    }
});

// 新增基金紀錄
app.post('/api/funds', async (req, res) => {
    try {
        const fund = await Fund.create(req.body);
        res.status(201).json(fund);
    } catch (error) {
        res.status(400).json({ error: '新增基金紀錄失敗', details: error });
    }
});

// 刪除基金紀錄
app.delete('/api/funds/:id', async (req, res) => {
    try {
        const deleted = await Fund.destroy({ where: { id: req.params.id } });
        if (deleted) res.status(204).send();
        else res.status(404).json({ error: '找不到指定的基金紀錄' });
    } catch (error) {
        res.status(500).json({ error: '刪除基金紀錄失敗', details: error });
    }
});

// 新增加密貨幣紀錄
app.post('/api/cryptos', async (req, res) => {
    try {
        const crypto = await Crypto.create(req.body);
        res.status(201).json(crypto);
    } catch (error) {
        res.status(400).json({ error: '新增加密貨幣紀錄失敗', details: error });
    }
});

// 刪除加密貨幣紀錄
app.delete('/api/cryptos/:id', async (req, res) => {
    try {
        const deleted = await Crypto.destroy({ where: { id: req.params.id } });
        if (deleted) res.status(204).send();
        else res.status(404).json({ error: '找不到指定的加密貨幣紀錄' });
    } catch (error) {
        res.status(500).json({ error: '刪除加密貨幣紀錄失敗', details: error });
    }
});

// 新增房產紀錄
app.post('/api/properties', async (req, res) => {
    try {
        const property = await Property.create(req.body);
        res.status(201).json(property);
    } catch (error) {
        res.status(400).json({ error: '新增房產紀錄失敗', details: error });
    }
});

// 刪除房產紀錄
app.delete('/api/properties/:id', async (req, res) => {
    try {
        const deleted = await Property.destroy({ where: { id: req.params.id } });
        if (deleted) res.status(204).send();
        else res.status(404).json({ error: '找不到指定的房產紀錄' });
    } catch (error) {
        res.status(500).json({ error: '刪除房產紀錄失敗', details: error });
    }
});

// 新增繳款紀錄
app.post('/api/payments', async (req, res) => {
    try {
        const payment = await Payment.create(req.body);
        res.status(201).json(payment);
    } catch (error) {
        res.status(400).json({ error: '新增繳款紀錄失敗', details: error });
    }
});

// 刪除繳款紀錄
app.delete('/api/payments/:id', async (req, res) => {
    try {
        const deleted = await Payment.destroy({ where: { id: req.params.id } });
        if (deleted) res.status(204).send();
        else res.status(404).json({ error: '找不到指定的繳款紀錄' });
    } catch (error) {
        res.status(500).json({ error: '刪除繳款紀錄失敗', details: error });
    }
});

// 同步資料庫並啟動伺服器
const startServer = async () => {
    try {
        await sequelize.sync({ alter: true }); // alter: true 會在模型變更時嘗試更新表格
        console.log('資料庫同步成功！');
        app.listen(PORT, () => {
            console.log(`伺服器正在 http://localhost:${PORT} 上運行`);
        });
    } catch (error) {
        console.error('無法連接到資料庫:', error);
    }
};

startServer(); 