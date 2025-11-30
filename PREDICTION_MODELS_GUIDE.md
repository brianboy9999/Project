# 多模型股價預測系統 - 安裝與使用指南

## 🎯 新功能概覽

現在支援三種不同的預測模型，用戶可以根據需求選擇：

### 1. **線性回歸 (Linear Regression)** ⚡
- **速度**: 最快 (1-2秒)
- **準確度**: 基礎
- **適用場景**: 快速預覽、即時查看
- **特點**: 簡單穩定，適合初步分析

### 2. **隨機森林 (Random Forest)** 🌲 *推薦*
- **速度**: 中等 (3-5秒)
- **準確度**: 高
- **適用場景**: 一般預測、日常使用
- **特點**: 平衡速度與準確度，不易過擬合
- **推薦原因**: 性價比最高

### 3. **LSTM 神經網絡** 🧠
- **速度**: 較慢 (10-30秒)
- **準確度**: 最高
- **適用場景**: 深度分析、長期預測
- **特點**: 專為時間序列設計，能捕捉複雜模式

---

## 📦 安裝步驟

### 後端安裝

1. **進入後端目錄**
```powershell
cd backend
```

2. **激活虛擬環境**
```powershell
.\venv\Scripts\Activate.ps1
```

3. **安裝新套件**
```powershell
pip install tensorflow==2.18.0 keras==3.7.0
```

**或者安裝所有套件**:
```powershell
pip install -r requirements.txt
```

4. **啟動後端服務器**
```powershell
python -m uvicorn main:app --reload
```

### 前端已自動更新
前端代碼已經更新完成，無需額外安裝。

---

## 🚀 使用方法

### 1. 進入股票預測頁面
- 打開應用 → 股票儀表板 → **股票預測** 頁籤

### 2. 選擇股票
- 從左側列表選擇一支股票

### 3. 配置預測參數

#### **預測模型** (新增)
```
⚡ 線性回歸 (最快)      - 快速預覽
🌲 隨機森林 (推薦)      - 日常使用 ⭐
🧠 LSTM 神經網絡 (最準) - 深度分析
```

#### **訓練數據期間**
- 3個月 / 6個月 / 1年 / 2年 / 5年
- 建議: 1年 (平衡數據量與時效性)

#### **預測天數**
- 7天 / 14天 / 30天 / 60天 / 90天
- 建議: 30天

### 4. 開始預測
點擊 "🔮 開始預測" 按鈕

---

## 📊 模型比較

| 特性 | 線性回歸 | 隨機森林 | LSTM |
|------|---------|---------|------|
| 訓練時間 | 1-2秒 | 3-5秒 | 10-30秒 |
| 預測準確度 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 穩定性 | 高 | 很高 | 中 |
| 資源需求 | 低 | 中 | 高 |
| 推薦度 | 基礎用戶 | ⭐⭐⭐⭐⭐ | 專業用戶 |

---

## 🔧 技術細節

### 後端變更

#### 新文件
- `backend/services/stock/stock_predictor.py` - 多模型預測系統

#### 架構設計
```python
BasePredictor (基礎類別)
├── LinearRegressionPredictor
├── RandomForestPredictor  
└── LSTMPredictor
```

#### API 更新
```
GET /stock/{ticker}/predict
參數:
  - ticker: 股票代碼
  - days: 預測天數 (1-90)
  - period: 訓練期間
  - model: 模型類型 (linear | random_forest | lstm)  ← 新增
```

### 前端變更

#### 更新的文件
1. `frontend/src/services/stock/stockService.ts`
   - 加入 `ModelType` 類型
   - 更新 `getStockPrediction()` 支援模型參數

2. `frontend/src/pages/stock/StockPrediction/StockPrediction.tsx`
   - 加入模型選擇器 UI
   - 新增 `modelType` 狀態

3. `frontend/src/components/stock/PredictionChart/PredictionChart.tsx`
   - 顯示模型描述

---

## ⚠️ 注意事項

### LSTM 模型相關

1. **首次使用**
   - LSTM 需要安裝 TensorFlow (約 500MB)
   - 如果沒安裝，系統會自動降級使用 Random Forest

2. **性能考慮**
   - LSTM 在 CPU 上運行較慢
   - 如有 GPU，可大幅提升速度
   - 建議一般用戶使用 Random Forest

3. **記憶體需求**
   - LSTM 需要更多記憶體
   - 建議系統至少 8GB RAM

---

## 🎨 用戶體驗改進

### 視覺提示
- 模型選項帶有 emoji 圖標，直觀易懂
- 推薦模型 (Random Forest) 預設選中
- 載入時顯示進度提示

### 錯誤處理
- 如果 LSTM 不可用，會顯示友善提示
- 預測失敗時提供詳細錯誤訊息

---

## 🔍 故障排除

### Q: LSTM 模型無法使用？
**A**: 確認是否已安裝 TensorFlow:
```powershell
pip list | Select-String tensorflow
```
如未安裝:
```powershell
pip install tensorflow==2.18.0 keras==3.7.0
```

### Q: 預測速度很慢？
**A**: 
- 使用 Random Forest 代替 LSTM
- 減少訓練數據期間 (使用 3mo 或 6mo)
- 減少預測天數

### Q: 模型準確度不高？
**A**:
- 嘗試增加訓練數據期間 (使用 2y 或 5y)
- 使用 LSTM 模型進行深度分析
- 股市預測本質上具有不確定性，請結合其他分析工具

---

## 📈 未來改進方向

1. **模型快取**: 避免重複訓練
2. **批次預測**: 同時預測多支股票
3. **自動調參**: 根據股票特性自動選擇最佳參數
4. **預測區間**: 顯示置信區間帶狀圖
5. **模型比較**: 同時顯示多個模型的預測結果

---

## 💡 使用建議

### 新手用戶
1. 使用 **Random Forest** 模型
2. 選擇 **1年** 訓練期間
3. 預測 **30天**

### 進階用戶
1. 比較不同模型的結果
2. 調整訓練期間觀察差異
3. 結合技術指標分析

### 專業用戶
1. 使用 **LSTM** 進行深度分析
2. 使用 **5年** 長期數據訓練
3. 預測 **60-90天** 長期趨勢

---

## ⚖️ 免責聲明

本預測結果僅供參考，不構成投資建議。
股市投資有風險，請謹慎決策。
