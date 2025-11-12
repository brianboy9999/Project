"""
股價預測服務
使用機器學習模型預測未來股價走勢
"""
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
from typing import List, Dict, Optional


class StockPredictor:
    """股價預測類別"""
    
    def __init__(self, ticker: str, period: str = "1y"):
        """
        初始化預測器
        
        Args:
            ticker: 股票代碼
            period: 歷史數據期間 (1mo, 3mo, 6mo, 1y, 2y, 5y, max)
        """
        self.ticker = ticker
        self.period = period
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        
    def _calculate_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        計算技術指標
        
        Args:
            df: 包含 OHLCV 數據的 DataFrame
            
        Returns:
            添加了技術指標的 DataFrame
        """
        # 移動平均線
        df['MA5'] = df['Close'].rolling(window=5).mean()
        df['MA10'] = df['Close'].rolling(window=10).mean()
        df['MA20'] = df['Close'].rolling(window=20).mean()
        
        # RSI (相對強弱指標)
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
        
        # 布林通道
        df['BB_Middle'] = df['Close'].rolling(window=20).mean()
        bb_std = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Middle'] + (bb_std * 2)
        df['BB_Lower'] = df['BB_Middle'] - (bb_std * 2)
        
        # 成交量變化率
        df['Volume_Change'] = df['Volume'].pct_change()
        
        # 價格變化率
        df['Price_Change'] = df['Close'].pct_change()
        
        return df
    
    def _prepare_features(self, df: pd.DataFrame) -> tuple:
        """
        準備訓練特徵
        
        Args:
            df: 包含技術指標的 DataFrame
            
        Returns:
            (X, y) 訓練數據和目標值
        """
        # 移除 NaN 值
        df = df.dropna()
        
        # 選擇特徵
        features = ['MA5', 'MA10', 'MA20', 'RSI', 'MACD', 'Signal', 
                   'BB_Upper', 'BB_Lower', 'Volume_Change', 'Price_Change']
        
        X = df[features].values
        y = df['Close'].values
        
        return X, y
    
    def train(self) -> bool:
        """
        訓練預測模型
        
        Returns:
            訓練是否成功
        """
        try:
            # 獲取歷史數據
            stock = yf.Ticker(self.ticker)
            df = stock.history(period=self.period)
            
            if df.empty:
                return False
            
            # 計算技術指標
            df = self._calculate_technical_indicators(df)
            
            # 準備訓練數據
            X, y = self._prepare_features(df)
            
            if len(X) < 20:  # 確保有足夠的數據
                return False
            
            # 標準化特徵
            X_scaled = self.scaler.fit_transform(X)
            
            # 訓練模型
            self.model.fit(X_scaled, y)
            
            # 保存最後的數據用於預測
            self.last_df = df
            
            return True
            
        except Exception as e:
            print(f"訓練模型時發生錯誤: {e}")
            return False
    
    def predict_next_days(self, days: int = 30) -> List[Dict]:
        """
        預測未來 N 天的股價（使用迭代預測方式）
        
        Args:
            days: 要預測的天數
            
        Returns:
            預測結果列表，每個元素包含日期和預測價格
        """
        predictions = []
        
        try:
            # 複製最後幾天的數據用於迭代預測
            # 我們需要足夠的歷史數據來計算移動平均
            recent_data = self.last_df.tail(30).copy()
            
            # 預測未來每一天
            for i in range(1, days + 1):
                # 獲取最近的數據
                last_row = recent_data.iloc[-1]
                
                # 使用當前的技術指標進行預測
                features = np.array([[
                    last_row['MA5'],
                    last_row['MA10'],
                    last_row['MA20'],
                    last_row['RSI'],
                    last_row['MACD'],
                    last_row['Signal'],
                    last_row['BB_Upper'],
                    last_row['BB_Lower'],
                    last_row['Volume_Change'],
                    last_row['Price_Change']
                ]])
                
                # 標準化並預測
                features_scaled = self.scaler.transform(features)
                predicted_price = self.model.predict(features_scaled)[0]
                
                # 計算預測日期
                last_date = recent_data.index[-1]
                predict_date = last_date + timedelta(days=1)
                
                # 將預測結果添加到列表
                predictions.append({
                    'date': predict_date.strftime('%Y-%m-%d'),
                    'predicted_price': float(predicted_price),
                    'confidence': self._calculate_confidence(i)
                })
                
                # 創建新的一行數據，加入預測價格
                # 這樣下一次預測會基於這個預測值更新技術指標
                new_row = pd.Series({
                    'Close': predicted_price,
                    'Open': predicted_price,
                    'High': predicted_price * 1.01,  # 假設小幅波動
                    'Low': predicted_price * 0.99,
                    'Volume': last_row['Volume']  # 假設成交量不變
                }, name=predict_date)
                
                # 將新行添加到數據中
                recent_data = pd.concat([recent_data, new_row.to_frame().T])
                
                # 重新計算技術指標（基於新加入的預測值）
                recent_data = self._calculate_technical_indicators(recent_data)
                
            return predictions
            
        except Exception as e:
            print(f"預測時發生錯誤: {e}")
            return []
    
    def _calculate_confidence(self, days_ahead: int) -> float:
        """
        計算預測信心度（越遠的預測信心度越低）
        
        Args:
            days_ahead: 距離現在的天數
            
        Returns:
            信心度 (0-1)
        """
        # 簡單的線性衰減模型
        base_confidence = 0.85
        decay_rate = 0.02
        confidence = base_confidence - (days_ahead * decay_rate)
        return max(0.3, min(1.0, confidence))
    
    def get_prediction_metrics(self) -> Dict:
        """
        獲取預測模型的評估指標
        
        Returns:
            包含 R² 分數等指標的字典
        """
        try:
            X, y = self._prepare_features(self.last_df)
            X_scaled = self.scaler.transform(X)
            score = self.model.score(X_scaled, y)
            
            return {
                'r2_score': float(score),
                'training_samples': len(X),
                'model_type': 'Linear Regression'
            }
        except:
            return {}


def predict_stock_price(ticker: str, days: int = 30, period: str = "1y") -> Dict:
    """
    預測股票未來價格
    
    Args:
        ticker: 股票代碼
        days: 預測天數
        period: 訓練數據期間
        
    Returns:
        包含預測結果和歷史數據的字典
    """
    predictor = StockPredictor(ticker, period)
    
    # 訓練模型
    if not predictor.train():
        return {
            'success': False,
            'message': '無法獲取足夠的歷史數據進行預測'
        }
    
    # 進行預測
    predictions = predictor.predict_next_days(days)
    
    if not predictions:
        return {
            'success': False,
            'message': '預測失敗'
        }
    
    # 獲取歷史數據用於圖表顯示
    historical_data = []
    for index, row in predictor.last_df.tail(60).iterrows():
        historical_data.append({
            'date': index.strftime('%Y-%m-%d'),
            'actual_price': float(row['Close']),
            'ma5': float(row['MA5']) if not pd.isna(row['MA5']) else None,
            'ma10': float(row['MA10']) if not pd.isna(row['MA10']) else None,
            'ma20': float(row['MA20']) if not pd.isna(row['MA20']) else None
        })
    
    # 獲取評估指標
    metrics = predictor.get_prediction_metrics()
    
    return {
        'success': True,
        'ticker': ticker,
        'predictions': predictions,
        'historical_data': historical_data,
        'metrics': metrics,
        'current_price': float(predictor.last_df['Close'].iloc[-1]),
        'last_update': predictor.last_df.index[-1].strftime('%Y-%m-%d %H:%M:%S')
    }
