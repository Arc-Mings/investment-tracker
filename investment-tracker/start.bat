@echo off
title 投資紀錄表啟動中...
echo 正在啟動投資紀錄表...
echo.

REM 檢查 node_modules 是否存在
if not exist "node_modules" (
    echo 首次執行，正在安裝相依套件...
    npm install
    if errorlevel 1 (
        echo 安裝失敗，請檢查網路連線
        pause
        exit /b 1
    )
)

REM 啟動 Electron 應用
echo 啟動應用程式...
npm start

REM 如果啟動失敗，顯示錯誤訊息
if errorlevel 1 (
    echo.
    echo 啟動失敗！可能的原因：
    echo 1. Node.js 未安裝
    echo 2. 專案檔案損壞
    echo 3. 相依套件問題
    echo.
    pause
)