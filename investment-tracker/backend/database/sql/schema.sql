-- ================================================
-- 投資追蹤器 SQLite 資料庫架構設計
-- ================================================
-- 版本: 1.0
-- 設計目標: 支援多種投資類型記錄與報表分析
-- 更新日期: 2025/01/21

-- ================================================
-- 1. 使用者基本資料表
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL DEFAULT 'default_user',
    email VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- ================================================
-- 2. 投資組合表（用戶可建立多個投資組合）
-- ================================================
CREATE TABLE IF NOT EXISTS portfolios (
    portfolio_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    portfolio_name VARCHAR(100) NOT NULL DEFAULT '主要投資組合',
    description TEXT,
    base_currency VARCHAR(3) DEFAULT 'TWD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ================================================
-- 3. 股票交易記錄表
-- ================================================
CREATE TABLE IF NOT EXISTS stock_transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL DEFAULT 1,
    
    -- 基本資訊
    market VARCHAR(10) NOT NULL, -- '台股', '美股', '港股'
    asset_type VARCHAR(10) NOT NULL, -- '股票', 'ETF'
    stock_code VARCHAR(20) NOT NULL,
    stock_name VARCHAR(100) NOT NULL,
    
    -- 交易詳情
    transaction_type VARCHAR(10) NOT NULL, -- 'BUY', 'SELL'
    transaction_date DATE NOT NULL,
    shares DECIMAL(15,6) NOT NULL, -- 支援零股交易
    price_per_share DECIMAL(15,4) NOT NULL,
    
    -- 費用計算
    commission_fee DECIMAL(10,2) DEFAULT 0, -- 手續費
    transaction_tax DECIMAL(10,2) DEFAULT 0, -- 證交稅（賣出時）
    other_fees DECIMAL(10,2) DEFAULT 0, -- 其他費用
    
    -- 計算欄位
    gross_amount DECIMAL(15,2) GENERATED ALWAYS AS (shares * price_per_share) STORED,
    total_fees DECIMAL(15,2) GENERATED ALWAYS AS (commission_fee + transaction_tax + other_fees) STORED,
    net_amount DECIMAL(15,2) GENERATED ALWAYS AS (
        CASE 
            WHEN transaction_type = 'BUY' THEN (shares * price_per_share) + commission_fee + transaction_tax + other_fees
            WHEN transaction_type = 'SELL' THEN (shares * price_per_share) - commission_fee - transaction_tax - other_fees
        END
    ) STORED,
    
    -- 原始記錄ID（用於與LocalStorage同步）
    original_id VARCHAR(50),
    
    -- 元資料
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

-- ================================================
-- 4. 基金交易記錄表
-- ================================================
CREATE TABLE IF NOT EXISTS fund_transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL DEFAULT 1,
    
    -- 基本資訊
    fund_name VARCHAR(100) NOT NULL,
    fund_code VARCHAR(20), -- 基金代碼（選填）
    fund_company VARCHAR(100), -- 基金公司
    
    -- 交易詳情
    transaction_type VARCHAR(10) NOT NULL, -- 'BUY', 'SELL', 'DIVIDEND'
    transaction_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL, -- 交易金額
    nav DECIMAL(15,4) NOT NULL, -- 淨值 (Net Asset Value)
    units DECIMAL(15,6) NOT NULL, -- 單位數
    
    -- 費用計算
    management_fee DECIMAL(10,2) DEFAULT 0, -- 管理費
    subscription_fee DECIMAL(10,2) DEFAULT 0, -- 申購費
    redemption_fee DECIMAL(10,2) DEFAULT 0, -- 贖回費
    other_fees DECIMAL(10,2) DEFAULT 0,
    
    -- 計算欄位
    gross_amount DECIMAL(15,2) GENERATED ALWAYS AS (units * nav) STORED,
    total_fees DECIMAL(15,2) GENERATED ALWAYS AS (management_fee + subscription_fee + redemption_fee + other_fees) STORED,
    net_amount DECIMAL(15,2) GENERATED ALWAYS AS (
        CASE 
            WHEN transaction_type = 'BUY' THEN amount + total_fees
            WHEN transaction_type = 'SELL' THEN amount - total_fees
            WHEN transaction_type = 'DIVIDEND' THEN amount
        END
    ) STORED,
    
    -- 原始記錄ID
    original_id VARCHAR(50),
    
    -- 元資料
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

-- ================================================
-- 5. 加密貨幣交易記錄表
-- ================================================
CREATE TABLE IF NOT EXISTS crypto_transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL DEFAULT 1,
    
    -- 基本資訊
    symbol VARCHAR(20) NOT NULL, -- 'BTC', 'ETH', 'ADA'
    crypto_name VARCHAR(100), -- 'Bitcoin', 'Ethereum'
    exchange_platform VARCHAR(50), -- 'Binance', 'Coinbase'
    
    -- 交易詳情
    transaction_type VARCHAR(10) NOT NULL, -- 'BUY', 'SELL', 'TRANSFER', 'MINING'
    transaction_date DATE NOT NULL,
    quantity DECIMAL(20,8) NOT NULL, -- 數量（支援小數點8位）
    price_per_unit DECIMAL(15,4) NOT NULL, -- 單價 (以TWD計算)
    
    -- 費用計算
    exchange_fee DECIMAL(15,8) DEFAULT 0, -- 交易所手續費（以加密貨幣計）
    network_fee DECIMAL(15,8) DEFAULT 0, -- 網路費用
    exchange_fee_twd DECIMAL(10,2) DEFAULT 0, -- 手續費TWD等值
    network_fee_twd DECIMAL(10,2) DEFAULT 0, -- 網路費用TWD等值
    
    -- 計算欄位
    gross_amount_twd DECIMAL(15,2) GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
    total_fees_twd DECIMAL(15,2) GENERATED ALWAYS AS (exchange_fee_twd + network_fee_twd) STORED,
    net_amount_twd DECIMAL(15,2) GENERATED ALWAYS AS (
        CASE 
            WHEN transaction_type = 'BUY' THEN (quantity * price_per_unit) + exchange_fee_twd + network_fee_twd
            WHEN transaction_type = 'SELL' THEN (quantity * price_per_unit) - exchange_fee_twd - network_fee_twd
            ELSE (quantity * price_per_unit)
        END
    ) STORED,
    
    -- 區塊鏈資訊
    transaction_hash VARCHAR(100), -- 交易雜湊值
    wallet_address VARCHAR(100), -- 錢包地址
    
    -- 原始記錄ID
    original_id VARCHAR(50),
    
    -- 元資料
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

-- ================================================
-- 6. 房地產投資記錄表
-- ================================================
CREATE TABLE IF NOT EXISTS property_records (
    property_id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL DEFAULT 1,
    
    -- 物件基本資料
    property_name VARCHAR(100) NOT NULL,
    property_type VARCHAR(20) NOT NULL DEFAULT '預售屋', -- '預售屋', '中古屋', '土地', '商用不動產'
    address TEXT,
    area_size DECIMAL(10,2), -- 坪數
    
    -- 財務資訊
    total_price DECIMAL(15,2) NOT NULL, -- 總價
    down_payment DECIMAL(15,2) NOT NULL, -- 頭期款
    loan_amount DECIMAL(15,2) NOT NULL, -- 貸款金額
    interest_rate DECIMAL(5,4), -- 利率
    loan_term_years INTEGER, -- 貸款年限
    
    -- 時間資訊
    purchase_date DATE,
    completion_date DATE, -- 交屋日期（預售屋）
    
    -- 原始記錄ID
    original_id VARCHAR(50),
    
    -- 元資料
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

-- ================================================
-- 7. 房貸繳款記錄表
-- ================================================
CREATE TABLE IF NOT EXISTS mortgage_payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    
    -- 繳款詳情
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL, -- 總繳款金額
    principal_amount DECIMAL(10,2) NOT NULL, -- 本金
    interest_amount DECIMAL(10,2) NOT NULL, -- 利息
    
    -- 計算驗證
    calculated_total DECIMAL(10,2) GENERATED ALWAYS AS (principal_amount + interest_amount) STORED,
    
    -- 原始記錄ID
    original_id VARCHAR(50),
    
    -- 元資料
    payment_method VARCHAR(20), -- '銀行轉帳', '支票', '現金'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES property_records(property_id)
);

-- ================================================
-- 8. 投資目標設定表
-- ================================================
CREATE TABLE IF NOT EXISTS investment_goals (
    goal_id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL DEFAULT 1,
    
    -- 目標資訊
    goal_name VARCHAR(100) NOT NULL,
    goal_type VARCHAR(20) NOT NULL DEFAULT '其他', -- '退休規劃', '買房基金', '子女教育', '其他'
    target_amount DECIMAL(15,2) NOT NULL,
    target_date DATE,
    
    -- 進度追蹤
    current_amount DECIMAL(15,2) DEFAULT 0,
    monthly_contribution DECIMAL(10,2) DEFAULT 0,
    
    -- 狀態
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'PAUSED'
    
    -- 元資料
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id)
);

-- ================================================
-- 9. 匯率歷史記錄表（多幣別投資支援）
-- ================================================
CREATE TABLE IF NOT EXISTS exchange_rates (
    rate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 匯率資訊
    from_currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- 'USD', 'EUR', 'JPY'
    to_currency VARCHAR(3) NOT NULL DEFAULT 'TWD', -- 'TWD'
    rate DECIMAL(15,6) NOT NULL,
    rate_date DATE NOT NULL,
    
    -- 來源
    data_source VARCHAR(50) DEFAULT '手動輸入', -- '央行', 'Yahoo Finance', 'Alpha Vantage'
    
    -- 元資料
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(from_currency, to_currency, rate_date)
);

-- ================================================
-- 10. 系統設定表
-- ================================================
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    
    -- 設定項目
    setting_key VARCHAR(50) NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'STRING', -- 'STRING', 'NUMBER', 'BOOLEAN', 'JSON'
    
    -- 元資料
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE(user_id, setting_key)
);

-- ================================================
-- 索引建立（提升查詢效能）
-- ================================================

-- 股票交易索引
CREATE INDEX IF NOT EXISTS idx_stock_portfolio_date ON stock_transactions(portfolio_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_stock_code_date ON stock_transactions(stock_code, transaction_date);
CREATE INDEX IF NOT EXISTS idx_stock_market_type ON stock_transactions(market, asset_type);
CREATE INDEX IF NOT EXISTS idx_stock_original_id ON stock_transactions(original_id);

-- 基金交易索引
CREATE INDEX IF NOT EXISTS idx_fund_portfolio_date ON fund_transactions(portfolio_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_fund_name_date ON fund_transactions(fund_name, transaction_date);
CREATE INDEX IF NOT EXISTS idx_fund_original_id ON fund_transactions(original_id);

-- 加密貨幣交易索引
CREATE INDEX IF NOT EXISTS idx_crypto_portfolio_date ON crypto_transactions(portfolio_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_crypto_symbol_date ON crypto_transactions(symbol, transaction_date);
CREATE INDEX IF NOT EXISTS idx_crypto_original_id ON crypto_transactions(original_id);

-- 房貸繳款索引
CREATE INDEX IF NOT EXISTS idx_payment_property_date ON mortgage_payments(property_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_original_id ON mortgage_payments(original_id);

-- 匯率索引
CREATE INDEX IF NOT EXISTS idx_exchange_currency_date ON exchange_rates(from_currency, to_currency, rate_date);

-- ================================================
-- 觸發器（自動維護資料完整性）
-- ================================================

-- 更新 updated_at 時間戳記
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS update_portfolios_timestamp 
    AFTER UPDATE ON portfolios
BEGIN
    UPDATE portfolios SET updated_at = CURRENT_TIMESTAMP WHERE portfolio_id = NEW.portfolio_id;
END;

CREATE TRIGGER IF NOT EXISTS update_stock_transactions_timestamp 
    AFTER UPDATE ON stock_transactions
BEGIN
    UPDATE stock_transactions SET updated_at = CURRENT_TIMESTAMP WHERE transaction_id = NEW.transaction_id;
END;

CREATE TRIGGER IF NOT EXISTS update_fund_transactions_timestamp 
    AFTER UPDATE ON fund_transactions
BEGIN
    UPDATE fund_transactions SET updated_at = CURRENT_TIMESTAMP WHERE transaction_id = NEW.transaction_id;
END;

CREATE TRIGGER IF NOT EXISTS update_crypto_transactions_timestamp 
    AFTER UPDATE ON crypto_transactions
BEGIN
    UPDATE crypto_transactions SET updated_at = CURRENT_TIMESTAMP WHERE transaction_id = NEW.transaction_id;
END;

-- ================================================
-- 初始化資料
-- ================================================

-- 預設使用者
INSERT OR IGNORE INTO users (user_id, username, email) 
VALUES (1, 'default_user', 'user@investment-tracker.local');

-- 預設投資組合
INSERT OR IGNORE INTO portfolios (portfolio_id, user_id, portfolio_name, description) 
VALUES (1, 1, '主要投資組合', '個人主要投資帳戶');

-- 預設系統設定
INSERT OR IGNORE INTO system_settings (user_id, setting_key, setting_value, setting_type, description) VALUES
(1, 'default_currency', 'TWD', 'STRING', '預設貨幣'),
(1, 'decimal_places', '2', 'NUMBER', '金額顯示小數位數'),
(1, 'auto_backup', 'true', 'BOOLEAN', '自動備份設定'),
(1, 'theme', 'light', 'STRING', '介面主題'),
(1, 'language', 'zh-TW', 'STRING', '介面語言'),
(1, 'enable_database', 'true', 'BOOLEAN', '啟用資料庫功能'),
(1, 'sync_interval', '300', 'NUMBER', '同步間隔（秒）'); 