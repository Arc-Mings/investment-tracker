/**
 * ================================================
 * 投資追蹤器 - 資料庫整合測試腳本
 * ================================================
 * 使用方法：在瀏覽器控制台中執行此腳本
 * 
 * 使用說明：
 * 1. 開啟 investment-tracker/door.html
 * 2. 按 F12 開啟開發者工具
 * 3. 在 Console 中貼上此腳本並執行
 * 4. 查看資料庫整合測試結果
 */

(function() {
    'use strict';
    
    console.log('🔍 開始資料庫整合測試...\n');
    
    let passCount = 0;
    let failCount = 0;
    let warnCount = 0;
    
    function pass(message) {
        console.log(`✅ PASS: ${message}`);
        passCount++;
    }
    
    function fail(message) {
        console.log(`❌ FAIL: ${message}`);
        failCount++;
    }
    
    function warn(message) {
        console.log(`⚠️  WARN: ${message}`);
        warnCount++;
    }
    
    function info(message) {
        console.log(`ℹ️  INFO: ${message}`);
    }
    
    // 測試1: 檢查資料庫模組載入
    console.log('\n📦 檢查資料庫模組載入狀態...');
    
    if (typeof window.DatabaseService === 'function') {
        pass('DatabaseService 類別已載入');
    } else {
        fail('DatabaseService 類別未載入');
    }
    
    if (typeof window.DatabaseAdapter === 'function') {
        pass('DatabaseAdapter 類別已載入');
    } else {
        fail('DatabaseAdapter 類別未載入');
    }
    
    if (typeof window.DatabaseIntegration === 'object') {
        pass('DatabaseIntegration 物件已載入');
    } else {
        fail('DatabaseIntegration 物件未載入');
    }
    
    // 測試2: 檢查全域實例
    console.log('\n🔧 檢查全域實例狀態...');
    
    if (window.databaseService) {
        pass('databaseService 全域實例存在');
        
        const dbStatus = window.databaseService.getStatus();
        info(`資料庫初始化狀態: ${dbStatus.isInitialized}`);
        info(`資料庫可用狀態: ${dbStatus.isAvailable}`);
        
        if (dbStatus.isInitialized) {
            pass('資料庫服務已初始化');
        } else {
            warn('資料庫服務尚未初始化（可能仍在初始化中）');
        }
        
        if (dbStatus.isAvailable) {
            pass('資料庫功能可用');
        } else {
            warn('資料庫功能不可用（將使用LocalStorage模式）');
        }
    } else {
        fail('databaseService 全域實例不存在');
    }
    
    if (window.databaseAdapter) {
        pass('databaseAdapter 全域實例存在');
        
        const adapterStatus = window.databaseAdapter.getStatus();
        info(`適配器就緒狀態: ${adapterStatus.isReady}`);
        info(`使用LocalStorage: ${adapterStatus.useLocalStorage}`);
        
        if (adapterStatus.isReady) {
            pass('資料庫適配器已就緒');
        } else {
            warn('資料庫適配器尚未就緒');
        }
    } else {
        fail('databaseAdapter 全域實例不存在');
    }
    
    // 測試3: 檢查功能函數增強
    console.log('\n⚡ 檢查功能函數增強狀態...');
    
    const functionsList = [
        'addStockBuyRecord',
        'addStockSellRecord',
        'addFundRecord',
        'addCryptoRecord',
        'addPropertyRecord'
    ];
    
    functionsList.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            pass(`函數 ${funcName} 存在且可調用`);
        } else {
            fail(`函數 ${funcName} 不存在或不可調用`);
        }
    });
    
    // 測試4: 檢查資料庫專用功能
    console.log('\n🛠️ 檢查資料庫專用功能...');
    
    const dbFunctions = [
        'exportDatabaseBackup',
        'syncLocalStorageToDatabase',
        'getDatabaseStatus'
    ];
    
    dbFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            pass(`資料庫功能 ${funcName} 已添加`);
        } else {
            fail(`資料庫功能 ${funcName} 未添加`);
        }
    });
    
    // 測試5: 執行狀態檢查功能
    if (typeof window.getDatabaseStatus === 'function') {
        console.log('\n📊 執行完整狀態檢查...');
        
        try {
            const fullStatus = window.getDatabaseStatus();
            info('完整狀態檢查結果:');
            console.log(fullStatus);
            pass('狀態檢查功能運作正常');
        } catch (error) {
            fail(`狀態檢查功能錯誤: ${error.message}`);
        }
    }
    
    // 測試6: 檢查SQL.js載入狀態
    console.log('\n🔬 檢查SQL.js載入狀態...');
    
    if (typeof window.initSqlJs === 'function') {
        pass('SQL.js 已載入');
    } else {
        warn('SQL.js 未載入（這是正常的，系統會使用LocalStorage模式）');
    }
    
    // 測試7: 檢查瀏覽器支援
    console.log('\n🌐 檢查瀏覽器支援...');
    
    if ('indexedDB' in window) {
        pass('瀏覽器支援 IndexedDB');
    } else {
        warn('瀏覽器不支援 IndexedDB');
    }
    
    if (typeof WebAssembly !== 'undefined') {
        pass('瀏覽器支援 WebAssembly');
    } else {
        warn('瀏覽器不支援 WebAssembly');
    }
    
    // 測試8: 檢查原始功能完整性
    console.log('\n🧪 檢查原始功能完整性...');
    
    const coreElements = [
        { id: 'buyStockCode', name: '股票買入表單' },
        { id: 'sellStockCode', name: '股票賣出表單' },
        { id: 'fundName', name: '基金表單' },
        { id: 'cryptoSymbol', name: '加密貨幣表單' }
    ];
    
    coreElements.forEach(({ id, name }) => {
        const element = document.getElementById(id);
        if (element) {
            pass(`${name} 元素存在`);
        } else {
            fail(`${name} 元素缺失`);
        }
    });
    
    // 測試9: 模擬資料庫操作測試
    console.log('\n🧬 模擬資料庫操作測試...');
    
    if (window.databaseAdapter && window.databaseAdapter.isReady) {
        try {
            // 測試ID生成功能
            const testId = window.databaseAdapter.generateId();
            if (testId && typeof testId === 'string') {
                pass('ID生成功能正常');
            } else {
                fail('ID生成功能異常');
            }
        } catch (error) {
            warn(`ID生成測試失敗: ${error.message}`);
        }
    } else {
        warn('資料庫適配器未就緒，跳過模擬操作測試');
    }
    
    // 最終報告
    console.log('\n' + '='.repeat(60));
    console.log('🎯 資料庫整合測試結果總結:');
    console.log(`✅ 通過: ${passCount} 項`);
    console.log(`❌ 失敗: ${failCount} 項`);
    console.log(`⚠️  警告: ${warnCount} 項`);
    
    if (failCount === 0) {
        console.log('\n🎉 太棒了！資料庫整合測試完全通過！');
        console.log('🚀 系統已就緒，您可以開始使用增強版的投資追蹤器了！');
    } else if (failCount <= 2) {
        console.log('\n😊 不錯！大部分測試通過，有少量問題需要關注');
        console.log('💡 請檢查上述失敗項目，但基本功能應該能正常使用');
    } else {
        console.log('\n🔧 需要注意！發現多個問題，建議檢查整合狀態');
        console.log('📋 請根據上述失敗項目進行排查');
    }
    
    console.log('\n🎯 測試建議:');
    console.log('1. 嘗試新增一筆股票投資記錄');
    console.log('2. 檢查瀏覽器控制台是否有額外的成功訊息');
    console.log('3. 重新整理頁面確認資料持久化');
    
    if (warnCount > 0) {
        console.log('\n📝 關於警告訊息:');
        console.log('- SQL.js未載入是正常的，系統會自動使用LocalStorage');
        console.log('- 瀏覽器不支援某些功能也是正常的，有自動回退機制');
        console.log('- 這些警告不會影響應用程式的正常使用');
    }
    
    return {
        passed: passCount,
        failed: failCount,
        warnings: warnCount,
        success: failCount === 0,
        summary: `${passCount} 通過, ${failCount} 失敗, ${warnCount} 警告`
    };
})(); 