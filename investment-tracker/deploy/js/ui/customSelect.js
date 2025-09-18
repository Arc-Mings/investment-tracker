/**
 * 自定義下拉選單組件
 * 實現完美的 MD3 圓角效果，解決原生 select 的樣式限制
 */

// 全局選單管理器 - 處理互斥邏輯
class CustomSelectManager {
    constructor() {
        this.openSelect = null; // 當前打開的選單
        this.allSelects = new Set(); // 所有選單實例
    }
    
    register(selectInstance) {
        this.allSelects.add(selectInstance);
    }
    
    unregister(selectInstance) {
        this.allSelects.delete(selectInstance);
        if (this.openSelect === selectInstance) {
            this.openSelect = null;
        }
    }
    
    setOpen(selectInstance) {
        // 關閉之前打開的選單
        if (this.openSelect && this.openSelect !== selectInstance) {
            this.openSelect.close();
        }
        this.openSelect = selectInstance;
    }
    
    setClosed(selectInstance) {
        if (this.openSelect === selectInstance) {
            this.openSelect = null;
        }
    }
    
    closeAll() {
        this.allSelects.forEach(select => {
            if (select.isOpen) {
                select.close();
            }
        });
        this.openSelect = null;
    }
}

// 創建全局管理器實例
const selectManager = new CustomSelectManager();

// 全局點擊外部關閉邏輯 - 統一管理
document.addEventListener('click', (e) => {
    // 檢查點擊是否在任何自定義選單內
    let clickedInsideSelect = false;
    
    selectManager.allSelects.forEach(select => {
        if (select.element.contains(e.target)) {
            clickedInsideSelect = true;
        }
    });
    
    // 如果點擊在選單外，關閉所有選單
    if (!clickedInsideSelect) {
        selectManager.closeAll();
    }
});

class CustomSelect {
    constructor(element, options = {}) {
        this.element = element;
        this.options = options;
        this.isOpen = false;
        this.selectedOption = null;
        
        // 註冊到全局管理器
        selectManager.register(this);
        
        this.init();
        this.bindEvents();
    }
    
    init() {
        // 隱藏原生 select
        const nativeSelect = this.element.querySelector('select');
        if (nativeSelect) {
            nativeSelect.style.display = 'none';
            this.nativeSelect = nativeSelect;
            
            // 從原生 select 獲取選項
            this.populateFromNativeSelect();
        }
        
        // 添加自定義下拉選單的 CSS 類
        this.element.classList.add('custom-select');
        
        // 創建觸發按鈕
        this.createTrigger();
        
        // 創建選項容器
        this.createOptions();
        
        // 設置初始選中項
        this.setInitialSelection();
    }
    
    populateFromNativeSelect() {
        this.selectOptions = Array.from(this.nativeSelect.options).map(option => ({
            value: option.value,
            text: option.textContent,
            selected: option.selected
        }));
    }
    
    createTrigger() {
        this.trigger = document.createElement('div');
        this.trigger.className = 'select-trigger';
        this.trigger.setAttribute('tabindex', '0');
        this.trigger.setAttribute('role', 'button');
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');
        
        this.selectedText = document.createElement('span');
        this.selectedText.className = 'selected-text';
        this.selectedText.textContent = this.options.placeholder || '請選擇';
        
        this.trigger.appendChild(this.selectedText);
        this.element.appendChild(this.trigger);
    }
    
    createOptions() {
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'select-options';
        this.optionsContainer.setAttribute('role', 'listbox');
        
        this.selectOptions.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.setAttribute('role', 'option');
            optionElement.setAttribute('data-value', option.value);
            optionElement.textContent = option.text;
            
            if (option.selected) {
                optionElement.classList.add('selected');
                this.selectedOption = optionElement;
            }
            
            this.optionsContainer.appendChild(optionElement);
        });
        
        this.element.appendChild(this.optionsContainer);
    }
    
    setInitialSelection() {
        if (this.selectedOption) {
            this.selectOption(this.selectedOption, false);
        }
    }
    
    bindEvents() {
        // 點擊觸發按鈕
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // 鍵盤事件
        this.trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.open();
                this.focusNextOption();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.open();
                this.focusPrevOption();
            }
        });
        
        // 選項點擊事件
        this.optionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('option')) {
                this.selectOption(e.target);
                this.close();
            }
        });
        
        // 選項鍵盤事件
        this.optionsContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (e.target.classList.contains('option')) {
                    this.selectOption(e.target);
                    this.close();
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.focusNextOption();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.focusPrevOption();
            } else if (e.key === 'Escape') {
                this.close();
                this.trigger.focus();
            }
        });
        
        // 點擊外部關閉邏輯已移至全局管理器統一處理
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        if (this.isOpen) return;
        
        // 通知管理器，關閉其他選單
        selectManager.setOpen(this);
        
        this.isOpen = true;
        this.element.classList.add('open');
        this.trigger.setAttribute('aria-expanded', 'true');
        
        // 聚焦到當前選中的選項
        if (this.selectedOption) {
            this.selectedOption.focus();
        } else {
            const firstOption = this.optionsContainer.querySelector('.option');
            if (firstOption) {
                firstOption.focus();
            }
        }
    }
    
    close() {
        if (!this.isOpen) return;
        
        // 通知管理器此選單已關閉
        selectManager.setClosed(this);
        
        this.isOpen = false;
        this.element.classList.remove('open');
        this.trigger.setAttribute('aria-expanded', 'false');
    }
    
    selectOption(optionElement, updateNative = true) {
        // 移除之前的選中狀態
        if (this.selectedOption) {
            this.selectedOption.classList.remove('selected');
        }
        
        // 設置新的選中狀態
        optionElement.classList.add('selected');
        this.selectedOption = optionElement;
        
        // 更新顯示文字
        this.selectedText.textContent = optionElement.textContent;
        
        // 更新原生 select 的值
        if (updateNative && this.nativeSelect) {
            const value = optionElement.getAttribute('data-value');
            this.nativeSelect.value = value;
            
            // 觸發 change 事件
            const changeEvent = new Event('change', { bubbles: true });
            this.nativeSelect.dispatchEvent(changeEvent);
        }
        
        // 觸發自定義事件
        const customEvent = new CustomEvent('customSelectChange', {
            detail: {
                value: optionElement.getAttribute('data-value'),
                text: optionElement.textContent
            }
        });
        this.element.dispatchEvent(customEvent);
    }
    
    focusNextOption() {
        const options = Array.from(this.optionsContainer.querySelectorAll('.option'));
        const currentIndex = options.findIndex(option => option === document.activeElement);
        const nextIndex = (currentIndex + 1) % options.length;
        options[nextIndex].focus();
    }
    
    focusPrevOption() {
        const options = Array.from(this.optionsContainer.querySelectorAll('.option'));
        const currentIndex = options.findIndex(option => option === document.activeElement);
        const prevIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
        options[prevIndex].focus();
    }
    
    // 公共方法：設置值
    setValue(value) {
        const option = this.optionsContainer.querySelector(`[data-value="${value}"]`);
        if (option) {
            this.selectOption(option);
        }
    }
    
    // 公共方法：獲取值
    getValue() {
        return this.selectedOption ? this.selectedOption.getAttribute('data-value') : null;
    }
    
    // 公共方法：銷毀
    destroy() {
        // 從管理器中註銷
        selectManager.unregister(this);
        
        this.element.classList.remove('custom-select', 'open');
        this.trigger.remove();
        this.optionsContainer.remove();
        
        if (this.nativeSelect) {
            this.nativeSelect.style.display = '';
        }
    }
}

// 自動初始化所有帶有 .text-field select 的元素
document.addEventListener('DOMContentLoaded', function() {
    initializeCustomSelects();
});

function initializeCustomSelects() {
    const selectContainers = document.querySelectorAll('.text-field');
    
    selectContainers.forEach(container => {
        const nativeSelect = container.querySelector('select');
        if (nativeSelect && !container.classList.contains('custom-select')) {
            new CustomSelect(container);
        }
    });
}

// 導出供其他模組使用
window.CustomSelect = CustomSelect;
window.initializeCustomSelects = initializeCustomSelects;
