# 投資追蹤器開發規範 (Development Rules)

## 📋 核心原則 (Core Principles)

### 1. 🔒 功能完整性原則 (Functional Integrity)
- **絕對禁止破壞現有功能**
- 任何新增或修改都必須保持所有原有功能正常運作
- 修改前必須識別並保護關鍵依賴關係

### 2. 🧪 測試驗證原則 (Testing Validation)
- 每次修改後必須立即測試所有相關功能
- 修改UI/CSS時必須測試JavaScript功能
- 修改JavaScript時必須測試UI交互

---

## ⚠️ 嚴格禁止事項 (Strict Prohibitions)

### 🚫 JavaScript功能破壞
1. **禁止移除或修改HTML中的script標籤**
2. **禁止刪除既有的JavaScript函數引用**
3. **禁止修改事件監聽器的綁定方式而不驗證功能**
4. **禁止更改DOM結構而不考慮JavaScript依賴**

### 🚫 CSS佈局破壞
1. **禁止修改關鍵CSS類名而不更新相關JavaScript**
2. **禁止改變響應式斷點而不測試所有螢幕尺寸**
3. **禁止修改表單結構而不確認驗證邏輯**

### 🚫 HTML結構破壞
1. **禁止刪除或修改data-tab屬性**
2. **禁止更改導覽元素的類名或ID**
3. **禁止移除必要的HTML元素而不檢查JavaScript依賴**

---

## ✅ 強制執行流程 (Mandatory Procedures)

### 步驟1: 修改前檢查 (Pre-Modification Check)
```markdown
□ 識別要修改的組件及其依賴關係
□ 檢查相關的JavaScript檔案
□ 確認CSS類名和ID的使用情況
□ 記錄所有可能受影響的功能
```

### 步驟2: 修改執行 (Modification Execution)
```markdown
□ 進行最小化修改
□ 保持所有關鍵屬性和類名
□ 維護HTML結構的完整性
□ 確保JavaScript引用路徑正確
```

### 步驟3: 修改後驗證 (Post-Modification Validation)
```markdown
□ 測試所有頁籤切換功能
□ 驗證所有表單提交功能
□ 檢查響應式佈局在不同尺寸下的表現
□ 確認所有按鈕和交互元素正常工作
□ 驗證數據儲存和讀取功能
```

---

## 📝 具體操作規範 (Specific Operation Rules)

### A. HTML修改規範
```html
<!-- ✅ 正確：保持關鍵屬性 -->
<button class="navigation-tab" data-tab="stocks">

<!-- ❌ 錯誤：移除關鍵屬性 -->
<button class="navigation-tab">
```

### B. CSS修改規範
```css
/* ✅ 正確：新增CSS而不破壞既有功能 */
.form-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr); /* 新的佈局 */
    /* 保持其他重要屬性 */
}

/* ❌ 錯誤：完全覆蓋而忽略依賴 */
.form-row {
    display: flex; /* 可能破壞響應式邏輯 */
}
```

### C. JavaScript修改規範
```javascript
// ✅ 正確：添加功能而不影響現有邏輯
window.showTab = function(tabName) {
    // 實現邏輯
};

// ❌ 錯誤：移除或覆蓋現有函數
// 不要刪除或替換已有的showTab函數
```

---

## 🔍 檢查清單 (Checklist)

### 每次修改前必須確認：
- [ ] 是否會影響頁籤切換功能？
- [ ] 是否會影響表單驗證功能？
- [ ] 是否會影響數據儲存功能？
- [ ] 是否會影響響應式佈局？
- [ ] 是否需要更新JavaScript引用？

### 每次修改後必須測試：
- [ ] 所有6個頁籤都能正常切換
- [ ] 所有表單都能正常提交
- [ ] 所有按鈕都有正確的交互反饋
- [ ] 響應式佈局在手機/平板/桌面都正常
- [ ] 沒有JavaScript錯誤出現在控制台

---

## 🚨 緊急修復流程 (Emergency Fix Procedure)

### 當功能被破壞時：
1. **立即停止進一步修改**
2. **識別最後一次正常運作的版本**
3. **還原到該版本**
4. **重新按照規範進行修改**

---

## 📚 依賴關係映射 (Dependency Mapping)

### 頁籤切換功能依賴：
- HTML: `data-tab` 屬性、`.navigation-tab` 類名
- CSS: `.active` 狀態樣式
- JavaScript: `showTab()` 函數、事件監聽器

### 表單功能依賴：
- HTML: 表單元素的ID、必要屬性
- CSS: `.form-row`、`.text-field` 類名
- JavaScript: 表單驗證、提交函數

### 響應式佈局依賴：
- CSS: 媒體查詢、grid佈局規則
- HTML: 容器結構完整性

---

## ⚡ 最佳實踐 (Best Practices)

1. **增量修改**：一次只修改一個組件
2. **功能隔離**：新功能不應影響現有功能
3. **向後兼容**：保持API和介面的一致性
4. **文檔更新**：修改後及時更新相關文檔

---

## 🎯 責任歸屬 (Accountability)

- **開發者責任**：確保修改不破壞現有功能
- **測試責任**：每次修改都必須完整測試
- **文檔責任**：維護規範文檔的更新

---

*最後更新：2025年1月*
*適用版本：投資追蹤器 v2.0+* 