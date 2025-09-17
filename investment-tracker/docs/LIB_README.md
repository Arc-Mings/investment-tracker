# 函式庫目錄

此目錄用於放置第三方JavaScript函式庫檔案。

## 需要下載的檔案

為了使用SQLite資料庫功能，需要下載以下檔案：

1. **sql.js** - SQLite在瀏覽器中的JavaScript實作
   - 下載位址：https://github.com/sql-js/sql.js/releases/latest
   - 檔案：`sql-wasm.js` 和 `sql-wasm.wasm`
   - 放置位置：`investment-tracker/lib/`

2. **下載步驟**：
   ```bash
   # 下載最新版本
   wget https://github.com/sql-js/sql.js/releases/download/v1.8.0/sqljs-wasm.zip
   
   # 解壓縮
   unzip sqljs-wasm.zip
   
   # 複製檔案到此目錄
   cp dist/sql-wasm.js investment-tracker/lib/sql.js
   cp dist/sql-wasm.wasm investment-tracker/lib/sql-wasm.wasm
   ```

## 檔案說明

- `sql.js` - 主要JavaScript檔案
- `sql-wasm.wasm` - WebAssembly二進位檔案
- 這些檔案總計約1.5MB

## 回退機制

如果無法載入這些檔案，系統會自動回退到LocalStorage模式，所有功能仍可正常使用。 