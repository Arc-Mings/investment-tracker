@echo off

REM ===================================================
REM 投資紀錄表啟動腳本 (Electron 桌面版)
REM 完全隱藏命令提示字元，程式獨立運行
REM ===================================================

REM 檢查 Node.js 是否已安裝
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ 錯誤：未找到 Node.js
    echo.
    echo 📥 請先安裝 Node.js：https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM 檢查並安裝依賴項目
if not exist "node_modules" (
    echo.
    echo 📦 首次運行，正在安裝相依套件...
    echo ⏳ 請稍候，這可能需要幾分鐘時間...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo ❌ 套件安裝失敗，請檢查網路連線
        pause
        exit /b 1
    )
    echo.
    echo ✅ 套件安裝完成！
    echo.
)

REM 使用 Windows VBScript 完全隱藏啟動 Electron 應用程式
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\invisible.vbs"
echo WshShell.Run "cmd /c cd /d ""%~dp0"" && npm start", 0 >> "%TEMP%\invisible.vbs"
echo WScript.Quit >> "%TEMP%\invisible.vbs"

REM 顯示啟動訊息
echo.
echo 🚀 正在啟動投資紀錄表...
echo 📱 Electron 桌面應用程式將在幾秒後開啟
echo.

REM 使用 VBScript 完全隱藏執行
cscript //nologo "%TEMP%\invisible.vbs"

REM 清理臨時檔案
del "%TEMP%\invisible.vbs" >nul 2>&1

REM 等待 2 秒後關閉此命令視窗
timeout /t 2 >nul

echo ✅ 投資紀錄表已成功啟動！
echo 💡 程式現在在背景運行，您可以關閉此視窗
echo.

REM 結束啟動腳本
exit /b 0
