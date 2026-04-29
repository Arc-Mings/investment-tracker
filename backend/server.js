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
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_KEY = process.env.API_KEY || '';
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

// Middleware
app.use(cors({
    origin(origin, callback) {
        // 允許無 Origin 的請求（如 server-to-server 或桌面應用）
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS origin not allowed'));
    }
}));
app.use(express.json({ limit: '256kb' })); // 解析 JSON 格式的請求主體

function pickFields(source, allowedFields) {
    const output = {};
    if (!source || typeof source !== 'object') return output;
    allowedFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(source, field)) {
            output[field] = source[field];
        }
    });
    return output;
}

function requireWriteAuth(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    if (NODE_ENV === 'production' && !API_KEY) {
        return res.status(503).json({ error: '伺服器未完成安全設定，請設定 API_KEY' });
    }

    // 若設有 API_KEY，強制要求一致
    if (API_KEY) {
        const provided = req.header('x-api-key');
        if (provided !== API_KEY) {
            return res.status(401).json({ error: '未授權的請求' });
        }
        return next();
    }

    // 未設 API_KEY 時，僅允許 localhost 寫入，避免開放同網段濫用
    const remoteAddress = req.socket?.remoteAddress || '';
    const isLocalhost = ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(remoteAddress);
    if (!isLocalhost) {
        return res.status(403).json({ error: '僅允許本機寫入，請設定 API_KEY 以開放遠端寫入' });
    }
    return next();
}

app.use('/api', requireWriteAuth);

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
        res.status(500).json({ error: '獲取紀錄失敗' });
    }
});

// 新增股票紀錄
app.post('/api/stocks', async (req, res) => {
    try {
        const payload = pickFields(req.body, ['market', 'assetType', 'code', 'type', 'date', 'shares', 'price', 'fee', 'total']);
        const stock = await Stock.create(payload);
        res.status(201).json(stock);
    } catch (error) {
        res.status(400).json({ error: '新增股票紀錄失敗' });
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
        res.status(500).json({ error: '刪除股票紀錄失敗' });
    }
});

// 新增基金紀錄
app.post('/api/funds', async (req, res) => {
    try {
        const payload = pickFields(req.body, ['name', 'date', 'amount', 'nav', 'units', 'fee']);
        const fund = await Fund.create(payload);
        res.status(201).json(fund);
    } catch (error) {
        res.status(400).json({ error: '新增基金紀錄失敗' });
    }
});

// 刪除基金紀錄
app.delete('/api/funds/:id', async (req, res) => {
    try {
        const deleted = await Fund.destroy({ where: { id: req.params.id } });
        if (deleted) res.status(204).send();
        else res.status(404).json({ error: '找不到指定的基金紀錄' });
    } catch (error) {
        res.status(500).json({ error: '刪除基金紀錄失敗' });
    }
});

// 新增加密貨幣紀錄
app.post('/api/cryptos', async (req, res) => {
    try {
        const payload = pickFields(req.body, ['symbol', 'type', 'date', 'amount', 'price', 'fee', 'total']);
        const crypto = await Crypto.create(payload);
        res.status(201).json(crypto);
    } catch (error) {
        res.status(400).json({ error: '新增加密貨幣紀錄失敗' });
    }
});

// 刪除加密貨幣紀錄
app.delete('/api/cryptos/:id', async (req, res) => {
    try {
        const deleted = await Crypto.destroy({ where: { id: req.params.id } });
        if (deleted) res.status(204).send();
        else res.status(404).json({ error: '找不到指定的加密貨幣紀錄' });
    } catch (error) {
        res.status(500).json({ error: '刪除加密貨幣紀錄失敗' });
    }
});

// 新增房產紀錄
app.post('/api/properties', async (req, res) => {
    try {
        const payload = pickFields(req.body, ['name', 'total', 'down', 'loan', 'rate', 'years']);
        const property = await Property.create(payload);
        res.status(201).json(property);
    } catch (error) {
        res.status(400).json({ error: '新增房產紀錄失敗' });
    }
});

// 刪除房產紀錄
app.delete('/api/properties/:id', async (req, res) => {
    try {
        const deleted = await Property.destroy({ where: { id: req.params.id } });
        if (deleted) res.status(204).send();
        else res.status(404).json({ error: '找不到指定的房產紀錄' });
    } catch (error) {
        res.status(500).json({ error: '刪除房產紀錄失敗' });
    }
});

// 新增繳款紀錄
app.post('/api/payments', async (req, res) => {
    try {
        const payload = pickFields(req.body, ['date', 'amount', 'principal', 'interest']);
        const payment = await Payment.create(payload);
        res.status(201).json(payment);
    } catch (error) {
        res.status(400).json({ error: '新增繳款紀錄失敗' });
    }
});

// 刪除繳款紀錄
app.delete('/api/payments/:id', async (req, res) => {
    try {
        const deleted = await Payment.destroy({ where: { id: req.params.id } });
        if (deleted) res.status(204).send();
        else res.status(404).json({ error: '找不到指定的繳款紀錄' });
    } catch (error) {
        res.status(500).json({ error: '刪除繳款紀錄失敗' });
    }
});

// 同步資料庫並啟動伺服器
const startServer = async () => {
    try {
        const useAlterSync = NODE_ENV === 'development';
        await sequelize.sync(useAlterSync ? { alter: true } : undefined);
        console.log('資料庫同步成功！');
        console.log(`運行環境: ${NODE_ENV}`);
        console.log(`CORS 白名單: ${allowedOrigins.join(', ')}`);
        app.listen(PORT, () => {
            console.log(`伺服器正在 http://localhost:${PORT} 上運行`);
        });
    } catch (error) {
        console.error('無法連接到資料庫:', error);
    }
};

startServer(); 