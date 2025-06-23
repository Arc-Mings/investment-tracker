/**
 * @file state.js
 * @description 全域狀態管理
 * 
 * 這個檔案定義了應用程式中所有共享的狀態（資料）。
 * 將狀態集中管理可以避免模組間的循環依賴問題，
 * 並讓資料流動更清晰。
 */

// 股票交易紀錄陣列
export let stockRecords = [];

// 基金投資紀錄陣列
export let fundRecords = [];

// 加密貨幣交易紀錄陣列
export let cryptoRecords = [];

// 房地產資訊紀錄陣列
export let propertyRecords = [];

// 房貸繳款紀錄陣列
export let paymentRecords = []; 