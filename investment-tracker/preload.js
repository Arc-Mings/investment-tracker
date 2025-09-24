/**
 * Electron Preload Script
 * 安全地暴露 Electron API 給渲染進程
 */

const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 給前端
contextBridge.exposeInMainWorld('electronAPI', {
    // 退出應用程式
    quit: () => {
        ipcRenderer.send('quit-app');
    },
    
    // 檢查是否在 Electron 環境中
    isElectron: () => {
        return true;
    },
    
    // 獲取版本資訊
    getVersions: () => {
        return {
            node: process.versions.node,
            chrome: process.versions.chrome,
            electron: process.versions.electron
        };
    },
    
    // electron-store API - 修正這部分以匹配前端期望
    store: {
        get: (key) => ipcRenderer.invoke('store-get', key),
        set: (key, value) => ipcRenderer.invoke('store-set', key, value),
        delete: (key) => ipcRenderer.invoke('store-delete', key),
        clear: () => ipcRenderer.invoke('store-clear')  // 添加這個
    },
    
    // 文件操作 API - 添加這些給匯入/匯出功能使用
    showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
    showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
    writeFile: (filepath, data) => ipcRenderer.invoke('write-file', filepath, data),
    readFile: (filepath) => ipcRenderer.invoke('read-file', filepath),
    
    // 投資記錄 API - 保留這些作為額外功能
    records: {
        getAll: () => ipcRenderer.invoke('get-all-records'),
        save: (records) => ipcRenderer.invoke('save-records', records),
        export: () => ipcRenderer.invoke('export-data'),
        import: (data) => ipcRenderer.invoke('import-data', data),
        clearAll: () => ipcRenderer.invoke('clear-all-data')
    }
});

console.log('🔧 Preload script loaded - Electron API ready');