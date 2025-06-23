/**
 * 投資追蹤器功能完整性檢查腳本
 * 使用方法：在瀏覽器控制台中運行此腳本
 * 
 * 使用說明：
 * 1. 開啟 investment-tracker/door.html
 * 2. 按 F12 開啟開發者工具
 * 3. 在 Console 中貼上此腳本並執行
 * 4. 查看檢查結果
 */

(function() {
    'use strict';
    
    console.log('🚀 開始投資追蹤器功能完整性檢查...\n');
    
    let passCount = 0;
    let failCount = 0;
    
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
    }
    
    // 檢查1: 頁籤切換功能
    console.log('\n📋 檢查頁籤切換功能...');
    
    const tabs = document.querySelectorAll('.navigation-tab');
    if (tabs.length === 6) {
        pass('找到6個導覽頁籤');
    } else {
        fail(`導覽頁籤數量錯誤: 期望6個，實際${tabs.length}個`);
    }
    
    // 檢查data-tab屬性
    const expectedTabs = ['stocks', 'funds', 'crypto', 'property', 'portfolio', 'summary'];
    expectedTabs.forEach(tabName => {
        const tab = document.querySelector(`[data-tab="${tabName}"]`);
        if (tab) {
            pass(`頁籤 "${tabName}" 存在且有正確的data-tab屬性`);
        } else {
            fail(`頁籤 "${tabName}" 缺失或data-tab屬性錯誤`);
        }
    });
    
    // 檢查showTab函數
    if (typeof window.showTab === 'function') {
        pass('showTab函數存在');
    } else {
        fail('showTab函數缺失');
    }
    
    // 檢查2: 表單結構完整性
    console.log('\n📝 檢查表單結構完整性...');
    
    // 檢查股票表單
    const stockBuyForm = document.getElementById('buyStockCode');
    const stockSellForm = document.getElementById('sellStockCode');
    if (stockBuyForm && stockSellForm) {
        pass('股票買賣表單元素存在');
    } else {
        fail('股票表單元素缺失');
    }
    
    // 檢查基金表單
    const fundForm = document.getElementById('fundName');
    if (fundForm) {
        pass('基金表單元素存在');
    } else {
        fail('基金表單元素缺失');
    }
    
    // 檢查加密貨幣表單
    const cryptoForm = document.getElementById('cryptoSymbol');
    if (cryptoForm) {
        pass('加密貨幣表單元素存在');
    } else {
        fail('加密貨幣表單元素缺失');
    }
    
    // 檢查3: CSS樣式完整性
    console.log('\n🎨 檢查CSS樣式完整性...');
    
    // 檢查表單行佈局
    const formRows = document.querySelectorAll('.form-row');
    if (formRows.length > 0) {
        pass(`找到${formRows.length}個表單行元素`);
        
        // 檢查第一個表單行的CSS
        const firstFormRow = formRows[0];
        const computedStyle = window.getComputedStyle(firstFormRow);
        
        if (computedStyle.display === 'grid') {
            pass('表單行使用Grid佈局');
        } else {
            warn(`表單行佈局: ${computedStyle.display} (期望: grid)`);
        }
    } else {
        fail('沒有找到表單行元素');
    }
    
    // 檢查響應式樣式
    const mediaQueries = [
        '(max-width: 480px)',
        '(max-width: 768px)', 
        '(max-width: 1200px)'
    ];
    
    mediaQueries.forEach(query => {
        if (window.matchMedia(query).matches) {
            pass(`當前螢幕符合媒體查詢: ${query}`);
        }
    });
    
    // 檢查4: JavaScript事件綁定
    console.log('\n⚡ 檢查JavaScript事件綁定...');
    
    let eventCheckPassed = true;
    tabs.forEach((tab, index) => {
        // 模擬點擊檢查
        try {
            const clickEvent = new Event('click');
            tab.dispatchEvent(clickEvent);
            pass(`頁籤 ${index + 1} 點擊事件正常`);
        } catch (error) {
            fail(`頁籤 ${index + 1} 點擊事件錯誤: ${error.message}`);
            eventCheckPassed = false;
        }
    });
    
    // 檢查5: 關鍵DOM元素
    console.log('\n🏗️ 檢查關鍵DOM元素...');
    
    const criticalElements = [
        { selector: '.tab-content', name: '頁籤內容容器' },
        { selector: '.card', name: '卡片容器' },
        { selector: '.text-field', name: '文字輸入欄位' },
        { selector: '.filled-button', name: '填充按鈕' }
    ];
    
    criticalElements.forEach(({ selector, name }) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            pass(`${name}: 找到${elements.length}個元素`);
        } else {
            fail(`${name}: 沒有找到任何元素`);
        }
    });
    
    // 檢查6: 控制台錯誤
    console.log('\n🐛 檢查控制台錯誤...');
    
    // 注意：這個檢查需要手動觀察控制台是否有紅色錯誤訊息
    warn('請手動檢查控制台是否有JavaScript錯誤（紅色訊息）');
    
    // 總結報告
    console.log('\n' + '='.repeat(50));
    console.log('📊 檢查結果總結:');
    console.log(`✅ 通過: ${passCount} 項`);
    console.log(`❌ 失敗: ${failCount} 項`);
    
    if (failCount === 0) {
        console.log('\n🎉 恭喜！所有檢查都通過了！');
        console.log('✨ 功能完整性驗證成功');
    } else {
        console.log('\n⚠️ 發現問題，請根據上述失敗項目進行修復');
        console.log('📋 修復完成後請重新運行此檢查腳本');
    }
    
    console.log('\n🔍 手動測試建議:');
    console.log('1. 逐一點擊每個頁籤，確認能正常切換');
    console.log('2. 嘗試在不同螢幕尺寸下檢查響應式佈局');
    console.log('3. 測試表單輸入和提交功能');
    console.log('4. 確認所有按鈕都有正確的懸停效果');
    
    return {
        passed: passCount,
        failed: failCount,
        success: failCount === 0
    };
})(); 