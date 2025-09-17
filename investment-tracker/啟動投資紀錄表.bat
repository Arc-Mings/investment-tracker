@echo off
chcp 65001 >nul
title 投資紀錄表啟動器

echo 🚀 啟動投資紀錄表...
echo.

REM 檢查 Node.js 是否安裝
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未檢測到 Node.js
    echo 📥 請先安裝 Node.js：https://nodejs.org
    echo.
    echo 請按任意鍵關閉視窗...
    pause >nul
    exit /b 1
)

echo ✅ Node.js 已安裝

REM 檢查 npm 依賴
if not exist "node_modules" (
    echo 📦 正在安裝依賴...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依賴安裝失敗
        echo 請按任意鍵關閉視窗...
        pause >nul
        exit /b 1
    )
)

echo 🌟 正在啟動投資紀錄表...
echo 📱 應用程式將在瀏覽器中開啟
echo 🔄 此視窗將在 3 秒後自動關閉...

REM 在後台啟動服務並開啟瀏覽器
start /min cmd /c "npm start"

REM 等待 3 秒讓服務啟動
timeout /t 3 /nobreak >nul

REM 開啟瀏覽器
start http://localhost:3000

REM 自動關閉此視窗
exit
