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
    }
});

console.log('🔧 Preload script loaded - Electron API ready');
