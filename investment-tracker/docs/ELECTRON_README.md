# 投資紀錄表 - Electron 桌面應用程式

## 🎯 專業桌面投資追蹤系統

Electron 桌面應用程式版本，提供原生桌面體驗，專為個人投資者設計。

### ✨ 版本重點

#### 🖥️ 桌面體驗
1. 一鍵啟動：雙擊 `start.bat` 或執行 `npm start`
2. 直觀退出：點擊 X 按鈕直接關閉程式
3. 原生視窗：真正的桌面應用程式體驗
4. 簡潔設計：乾淨介面與一致的 MD3 風格

#### 🔧 架構要點
1. 安全通信：`preload.js` + `contextBridge`
2. 資料持久化：`electron-store`（IPC 介面：`window.electronAPI.store.*`）
3. 嚴格 CSP：允許 Yahoo API `connect-src`
4. 快捷鍵：F5/Ctrl+R 重新整理、F12/Ctrl+Shift+I DevTools

### 🚀 使用方式

#### 開發模式
```bash
npm install
npm start
```

#### 打包應用程式
```bash
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

### 📁 檔案結構
```
investment-tracker/
├── electron-main.js        # Electron 主進程（建立視窗、IPC、快捷鍵）
├── preload.js              # contextBridge 暴露安全 API
├── door.html               # 前端介面
├── js/
│   ├── api/                # 股票 API 與快取
│   ├── core/               # 狀態與事件
│   ├── data/               # storeManager（electron-store）
│   ├── features/           # 股票/基金/加密/房產/總覽
│   └── ui/                 # UI 管理與表格
├── css/
│   ├── components/
│   ├── design-system/
│   └── responsive/responsive.css
└── assets/
```

### 🔧 技術架構

#### Electron 主進程（`electron-main.js`）
- 建立視窗與載入 `door.html`
- 設定 CSP、按鍵快捷鍵（F5/Ctrl+R、F12/Ctrl+Shift+I）
- IPC 處理 `electron-store` 取用（get/set/clear/export/import）
- `electron-store` 路徑已設定 `cwd: 'E:/InvestmentData'`

#### 資料儲存
- 主要存儲：`electron-store`
- Windows 路徑：`E:/InvestmentData/config.json`
- 匯出/匯入：透過 `storeManager` 的對應方法

#### 前端界面
- Material Design 3
- 股票代碼即時查詢（2 字以上、300ms 節流）
- 股票 API 控制面板（測試、清快取、統計）

### 🎯 用戶體驗

#### 啟動流程
```
雙擊 start.bat → 進入主畫面（支援重新整理與 DevTools）
```

#### 錯誤處理
- 友善訊息與降級（快取/靜態清單）
- electron-store 狀態指示：已連線 / 初始化中 / 離線模式

### 📦 打包配置
- Windows：`投資紀錄表.exe`
- macOS：`投資紀錄表.dmg`
- Linux：`投資紀錄表.AppImage`

### 🔄 舊版本遷移
- 舊資料可透過 JSON 匯出/匯入
- 不再使用 SQLite 或後端模組

### 🛠️ 開發說明

#### 主要模組
- `js/main.js`：初始化與頁面組件
- `js/data/storeManager.js`：封裝 electron-store 存取
- `js/api/stockApiService.js`：Yahoo API + 快取/重試/節流/併發

### 🚨 注意事項
1. Windows 資料位置：`E:/InvestmentData/config.json`
2. CSP 已允許 Yahoo API 連線
3. 響應式參數只能在 `css/responsive/responsive.css`
