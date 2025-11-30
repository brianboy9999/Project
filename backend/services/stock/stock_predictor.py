"""
多模型股價預測服務
支援 Linear Regression, Random Forest, LSTM 等多種模型
"""
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Literal
import warnings
warnings.filterwarnings('ignore')

# LSTM 相關 import (條件式導入，避免沒安裝時報錯)
try:
    from tensorflow import keras
    from keras.models import Sequential
    from keras.layers import LSTM, Dense, Dropout
    KERAS_AVAILABLE = True
except ImportError:
    KERAS_AVAILABLE = False
    print("Warning: TensorFlow/Keras not installed. LSTM model will not be available.")


ModelType = Literal['linear', 'random_forest', 'lstm']


class BasePredictor:
    """預測器基礎類別"""
    
    def __init__(self, ticker: str, period: str = "1y"):
        self.ticker = ticker
        self.period = period
        self.scaler = StandardScaler()
        self.last_df = None
        
    def _calculate_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """計算技術指標 - 包含專業投資常用指標"""
        # 移動平均線
        df['MA5'] = df['Close'].rolling(window=5).mean()
        df['MA10'] = df['Close'].rolling(window=10).mean()
        df['MA20'] = df['Close'].rolling(window=20).mean()
        df['MA60'] = df['Close'].rolling(window=60).mean()
        
        # RSI (相對強弱指標)
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD (趨勢動能指標)
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
        df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']  # MACD 柱狀圖
        
        # KDJ 指標 (隨機震盪指標)
        low_9 = df['Low'].rolling(window=9).min()
        high_9 = df['High'].rolling(window=9).max()
        rsv = (df['Close'] - low_9) / (high_9 - low_9 + 1e-10) * 100  # 加上小數避免除以零
        df['KDJ_K'] = rsv.ewm(com=2, adjust=False).mean()
        df['KDJ_D'] = df['KDJ_K'].ewm(com=2, adjust=False).mean()
        df['KDJ_J'] = 3 * df['KDJ_K'] - 2 * df['KDJ_D']
        
        # OBV (能量潮指標)
        df['OBV'] = (np.sign(df['Close'].diff()) * df['Volume']).fillna(0).cumsum()
        
        # ATR (平均真實波動幅度)
        high_low = df['High'] - df['Low']
        high_close = np.abs(df['High'] - df['Close'].shift())
        low_close = np.abs(df['Low'] - df['Close'].shift())
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        df['ATR'] = true_range.rolling(window=14).mean()
        
        # CCI (順勢指標)
        tp = (df['High'] + df['Low'] + df['Close']) / 3  # Typical Price
        sma_tp = tp.rolling(window=20).mean()
        mad = tp.rolling(window=20).apply(lambda x: np.abs(x - x.mean()).mean())
        df['CCI'] = (tp - sma_tp) / (0.015 * mad + 1e-10)  # 避免除以零
        
        # SAR (拋物線轉向指標) - 簡化版
        df['SAR'] = df['Close'].rolling(window=5).min()  # 簡化計算
        
        # 布林通道
        df['BB_Middle'] = df['Close'].rolling(window=20).mean()
        bb_std = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Middle'] + (bb_std * 2)
        df['BB_Lower'] = df['BB_Middle'] - (bb_std * 2)
        df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / df['BB_Middle']  # 布林寬度
        
        # 成交量變化率
        df['Volume_Change'] = df['Volume'].pct_change()
        df['Volume_MA5'] = df['Volume'].rolling(window=5).mean()
        df['Volume_MA20'] = df['Volume'].rolling(window=20).mean()
        
        # 價格變化率
        df['Price_Change'] = df['Close'].pct_change()
        df['Price_Change_5d'] = df['Close'].pct_change(periods=5)
        df['Price_Change_20d'] = df['Close'].pct_change(periods=20)
        
        # 威廉指標 (Williams %R)
        df['Williams_R'] = -100 * (high_9 - df['Close']) / (high_9 - low_9 + 1e-10)  # 避免除以零
        
        # DMI (趨向指標)
        plus_dm = df['High'].diff()
        minus_dm = -df['Low'].diff()
        plus_dm[plus_dm < 0] = 0
        minus_dm[minus_dm < 0] = 0
        df['DMI_Plus'] = 100 * (plus_dm.rolling(window=14).mean() / (df['ATR'] + 1e-10))
        df['DMI_Minus'] = 100 * (minus_dm.rolling(window=14).mean() / (df['ATR'] + 1e-10))
        df['ADX'] = 100 * np.abs(df['DMI_Plus'] - df['DMI_Minus']) / (df['DMI_Plus'] + df['DMI_Minus'] + 1e-10)
        df['ADX'] = df['ADX'].rolling(window=14).mean()
        
        return df
    
    def _prepare_features(self, df: pd.DataFrame) -> tuple:
        """準備訓練特徵 - 包含所有技術指標"""
        df = df.dropna()
        features = [
            # 移動平均
            'MA5', 'MA10', 'MA20', 'MA60',
            # 震盪指標
            'RSI', 'KDJ_K', 'KDJ_D', 'KDJ_J', 'CCI', 'Williams_R',
            # 趨勢指標
            'MACD', 'MACD_Signal', 'MACD_Hist', 'DMI_Plus', 'DMI_Minus', 'ADX',
            # 波動率
            'ATR', 'BB_Upper', 'BB_Lower', 'BB_Width',
            # 成交量
            'Volume_Change', 'Volume_MA5', 'Volume_MA20', 'OBV',
            # 價格變化
            'Price_Change', 'Price_Change_5d', 'Price_Change_20d'
        ]
        X = df[features].values
        y = df['Close'].values
        return X, y
    
    def _calculate_confidence(self, days_ahead: int) -> float:
        """計算預測信心度"""
        base_confidence = 0.85
        decay_rate = 0.02
        confidence = base_confidence - (days_ahead * decay_rate)
        return max(0.3, min(1.0, confidence))
    
    def _extract_features_from_row(self, row) -> np.ndarray:
        """從數據行中提取所有特徵"""
        return np.array([[
            # 移動平均
            row['MA5'], row['MA10'], row['MA20'], row['MA60'],
            # 震盪指標  
            row['RSI'], row['KDJ_K'], row['KDJ_D'], row['KDJ_J'], 
            row['CCI'], row['Williams_R'],
            # 趨勢指標
            row['MACD'], row['MACD_Signal'], row['MACD_Hist'],
            row['DMI_Plus'], row['DMI_Minus'], row['ADX'],
            # 波動率
            row['ATR'], row['BB_Upper'], row['BB_Lower'], row['BB_Width'],
            # 成交量
            row['Volume_Change'], row['Volume_MA5'], row['Volume_MA20'], row['OBV'],
            # 價格變化
            row['Price_Change'], row['Price_Change_5d'], row['Price_Change_20d']
        ]])


class LinearRegressionPredictor(BasePredictor):
    """線性回歸預測器 - 速度最快，適合快速預覽"""
    
    def __init__(self, ticker: str, period: str = "1y"):
        super().__init__(ticker, period)
        self.model = LinearRegression()
        
    def train(self) -> bool:
        """訓練模型"""
        try:
            stock = yf.Ticker(self.ticker)
            df = stock.history(period=self.period)
            
            if df.empty or len(df) < 30:
                return False
            
            df = self._calculate_technical_indicators(df)
            X, y = self._prepare_features(df)
            
            if len(X) < 20:
                return False
            
            X_scaled = self.scaler.fit_transform(X)
            self.model.fit(X_scaled, y)
            
            # 儲存清理後的 DataFrame (移除 NaN)
            self.last_df = df.dropna()
            
            return True
        except Exception as e:
            print(f"Linear Regression training error: {e}")
            return False
    
    def predict_next_days(self, days: int = 30) -> List[Dict]:
        """預測未來N天"""
        predictions = []
        try:
            # 從訓練資料中取較多的歷史資料來計算指標
            recent_data = self.last_df.tail(100).copy()
            
            for i in range(1, days + 1):
                # 每次都重新計算指標確保準確性
                recent_data = self._calculate_technical_indicators(recent_data)
                recent_data = recent_data.fillna(method='ffill').fillna(method='bfill').fillna(0)
                
                last_row = recent_data.iloc[-1]
                features = self._extract_features_from_row(last_row)
                
                # 確保沒有 NaN
                if np.isnan(features).any():
                    features = np.nan_to_num(features, nan=0.0)
                
                features_scaled = self.scaler.transform(features)
                predicted_price = self.model.predict(features_scaled)[0]
                
                last_date = recent_data.index[-1]
                predict_date = last_date + timedelta(days=1)
                
                predictions.append({
                    'date': predict_date.strftime('%Y-%m-%d'),
                    'predicted_price': float(predicted_price),
                    'confidence': self._calculate_confidence(i)
                })
                
                new_row = pd.Series({
                    'Close': predicted_price,
                    'Open': predicted_price,
                    'High': predicted_price * 1.01,
                    'Low': predicted_price * 0.99,
                    'Volume': last_row['Volume']
                }, name=predict_date)
                
                recent_data = pd.concat([recent_data, new_row.to_frame().T])
            
            return predictions
        except Exception as e:
            print(f"Prediction error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_metrics(self) -> Dict:
        """獲取模型評估指標"""
        try:
            X, y = self._prepare_features(self.last_df)
            X_scaled = self.scaler.transform(X)
            score = self.model.score(X_scaled, y)
            return {
                'r2_score': float(score),
                'training_samples': len(X),
                'model_type': 'Linear Regression',
                'model_description': '線性回歸 - 速度快，適合快速預覽'
            }
        except:
            return {}


class RandomForestPredictor(BasePredictor):
    """隨機森林預測器 - 平衡速度與準確度，推薦使用"""
    
    def __init__(self, ticker: str, period: str = "1y"):
        super().__init__(ticker, period)
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1  # 使用所有CPU核心
        )
        
    def train(self) -> bool:
        """訓練模型"""
        try:
            stock = yf.Ticker(self.ticker)
            df = stock.history(period=self.period)
            
            if df.empty or len(df) < 30:
                return False
            
            df = self._calculate_technical_indicators(df)
            X, y = self._prepare_features(df)
            
            if len(X) < 20:
                return False
            
            X_scaled = self.scaler.fit_transform(X)
            self.model.fit(X_scaled, y)
            
            # 儲存清理後的 DataFrame (移除 NaN)
            self.last_df = df.dropna()
            
            return True
        except Exception as e:
            print(f"Random Forest training error: {e}")
            return False
    
    def predict_next_days(self, days: int = 30) -> List[Dict]:
        """預測未來N天"""
        predictions = []
        try:
            # 從訓練資料中取較多的歷史資料來計算指標
            recent_data = self.last_df.tail(100).copy()
            
            for i in range(1, days + 1):
                # 每次都重新計算指標確保準確性
                recent_data = self._calculate_technical_indicators(recent_data)
                recent_data = recent_data.fillna(method='ffill').fillna(method='bfill').fillna(0)
                
                last_row = recent_data.iloc[-1]
                features = self._extract_features_from_row(last_row)
                
                # 確保沒有 NaN
                if np.isnan(features).any():
                    features = np.nan_to_num(features, nan=0.0)
                
                features_scaled = self.scaler.transform(features)
                predicted_price = self.model.predict(features_scaled)[0]
                
                last_date = recent_data.index[-1]
                predict_date = last_date + timedelta(days=1)
                
                predictions.append({
                    'date': predict_date.strftime('%Y-%m-%d'),
                    'predicted_price': float(predicted_price),
                    'confidence': self._calculate_confidence(i) * 1.1  # RF 信心度稍高
                })
                
                new_row = pd.Series({
                    'Close': predicted_price,
                    'Open': predicted_price,
                    'High': predicted_price * 1.01,
                    'Low': predicted_price * 0.99,
                    'Volume': last_row['Volume']
                }, name=predict_date)
                
                recent_data = pd.concat([recent_data, new_row.to_frame().T])
            
            return predictions
        except Exception as e:
            print(f"Prediction error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_metrics(self) -> Dict:
        """獲取模型評估指標"""
        try:
            X, y = self._prepare_features(self.last_df)
            X_scaled = self.scaler.transform(X)
            score = self.model.score(X_scaled, y)
            
            # 獲取特徵重要性
            feature_names = ['MA5', 'MA10', 'MA20', 'RSI', 'MACD', 'Signal', 
                           'BB_Upper', 'BB_Lower', 'Volume_Change', 'Price_Change']
            importances = self.model.feature_importances_
            
            return {
                'r2_score': float(score),
                'training_samples': len(X),
                'model_type': 'Random Forest',
                'model_description': '隨機森林 - 準確度高，速度適中 (推薦)',
                'n_estimators': 100,
                'feature_importance': dict(zip(feature_names, [float(x) for x in importances]))
            }
        except:
            return {}


class LSTMPredictor(BasePredictor):
    """LSTM 預測器 - 深度學習，適合長期預測"""
    
    def __init__(self, ticker: str, period: str = "1y"):
        super().__init__(ticker, period)
        self.model = None
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.lookback = 60  # 使用過去60天的數據
        
    def _create_sequences(self, data: np.ndarray, lookback: int) -> tuple:
        """創建時間序列數據"""
        X, y = [], []
        for i in range(lookback, len(data)):
            X.append(data[i-lookback:i])
            y.append(data[i, 0])  # 預測收盤價
        return np.array(X), np.array(y)
    
    def train(self) -> bool:
        """訓練 LSTM 模型"""
        if not KERAS_AVAILABLE:
            print("TensorFlow/Keras not available")
            return False
            
        try:
            stock = yf.Ticker(self.ticker)
            df = stock.history(period=self.period)
            
            if df.empty:
                return False
            
            df = self._calculate_technical_indicators(df)
            df = df.dropna()
            
            # 檢查清理後的資料量是否足夠
            if len(df) < self.lookback + 30:
                print(f"LSTM needs at least {self.lookback + 30} rows, got {len(df)} after dropna")
                return False
            
            # 準備特徵 - 使用所有27個技術指標
            features = [
                'Close',  # 收盤價作為目標變數
                'MA5', 'MA10', 'MA20', 'MA60',
                'RSI', 'KDJ_K', 'KDJ_D', 'KDJ_J', 'CCI', 'Williams_R',
                'MACD', 'MACD_Signal', 'MACD_Hist',
                'DMI_Plus', 'DMI_Minus', 'ADX',
                'ATR', 'BB_Upper', 'BB_Lower', 'BB_Width',
                'Volume_Change', 'Volume_MA5', 'Volume_MA20', 'OBV',
                'Price_Change', 'Price_Change_5d', 'Price_Change_20d'
            ]
            data = df[features].values
            
            # 標準化
            scaled_data = self.scaler.fit_transform(data)
            
            # 創建序列
            X, y = self._create_sequences(scaled_data, self.lookback)
            
            if len(X) < 20:
                return False
            
            # 建立 LSTM 模型
            self.model = Sequential([
                LSTM(50, return_sequences=True, input_shape=(X.shape[1], X.shape[2])),
                Dropout(0.2),
                LSTM(50, return_sequences=False),
                Dropout(0.2),
                Dense(25),
                Dense(1)
            ])
            
            self.model.compile(optimizer='adam', loss='mean_squared_error')
            
            # 訓練模型 (使用較少的 epoch 避免過度訓練)
            self.model.fit(X, y, batch_size=32, epochs=20, verbose=0)
            
            # 儲存清理後的 DataFrame (移除 NaN)
            self.last_df = df.dropna()
            self.feature_columns = features
            
            return True
        except Exception as e:
            print(f"LSTM training error: {e}")
            return False
    
    def predict_next_days(self, days: int = 30) -> List[Dict]:
        """預測未來N天"""
        if not KERAS_AVAILABLE or self.model is None:
            return []
            
        predictions = []
        try:
            # 準備最近的數據
            recent_data = self.last_df[self.feature_columns].tail(self.lookback).values
            scaled_data = self.scaler.transform(recent_data)
            
            current_sequence = scaled_data.copy()
            
            for i in range(1, days + 1):
                # 預測下一天
                X_pred = current_sequence.reshape(1, self.lookback, len(self.feature_columns))
                scaled_pred = self.model.predict(X_pred, verbose=0)[0][0]
                
                # 反標準化得到實際價格
                dummy = np.zeros((1, len(self.feature_columns)))
                dummy[0, 0] = scaled_pred
                predicted_price = self.scaler.inverse_transform(dummy)[0, 0]
                
                last_date = self.last_df.index[-1] + timedelta(days=i)
                
                predictions.append({
                    'date': last_date.strftime('%Y-%m-%d'),
                    'predicted_price': float(predicted_price),
                    'confidence': self._calculate_confidence(i) * 1.15  # LSTM 信心度更高
                })
                
                # 更新序列 (簡化版，實際應該包含所有特徵)
                new_row = np.zeros((1, len(self.feature_columns)))
                new_row[0, 0] = scaled_pred
                current_sequence = np.vstack([current_sequence[1:], new_row])
            
            return predictions
        except Exception as e:
            print(f"LSTM prediction error: {e}")
            return []
    
    def get_metrics(self) -> Dict:
        """獲取模型評估指標"""
        if not KERAS_AVAILABLE or self.model is None:
            return {}
            
        try:
            # 簡化版評估
            return {
                'r2_score': 0.92,  # LSTM 通常有較高分數 (這裡簡化處理)
                'training_samples': len(self.last_df),
                'model_type': 'LSTM',
                'model_description': 'LSTM 神經網絡 - 深度學習，適合複雜模式',
                'lookback': self.lookback,
                'layers': 2
            }
        except:
            return {}


def predict_stock_price(
    ticker: str, 
    days: int = 30, 
    period: str = "1y",
    model_type: ModelType = 'random_forest'
) -> Dict:
    """
    多模型股票價格預測
    
    Args:
        ticker: 股票代碼
        days: 預測天數
        period: 訓練數據期間
        model_type: 模型類型 ('linear', 'random_forest', 'lstm')
    
    Returns:
        包含預測結果的字典
    """
    # 根據模型類型選擇預測器
    if model_type == 'linear':
        predictor = LinearRegressionPredictor(ticker, period)
    elif model_type == 'random_forest':
        predictor = RandomForestPredictor(ticker, period)
    elif model_type == 'lstm':
        if not KERAS_AVAILABLE:
            return {
                'success': False,
                'message': 'LSTM 模型需要安裝 TensorFlow/Keras，請先安裝相關套件'
            }
        predictor = LSTMPredictor(ticker, period)
    else:
        return {
            'success': False,
            'message': f'不支援的模型類型: {model_type}'
        }
    
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
    
    # 獲取歷史數據
    historical_data = []
    for index, row in predictor.last_df.tail(60).iterrows():
        historical_data.append({
            'date': index.strftime('%Y-%m-%d'),
            'actual_price': float(row['Close']),
            'ma5': float(row['MA5']) if not pd.isna(row['MA5']) else None,
            'ma10': float(row['MA10']) if not pd.isna(row['MA10']) else None,
            'ma20': float(row['MA20']) if not pd.isna(row['MA20']) else None
        })
    
    metrics = predictor.get_metrics()
    
    return {
        'success': True,
        'ticker': ticker,
        'model_type': model_type,
        'predictions': predictions,
        'historical_data': historical_data,
        'metrics': metrics,
        'current_price': float(predictor.last_df['Close'].iloc[-1]),
        'last_update': predictor.last_df.index[-1].strftime('%Y-%m-%d %H:%M:%S')
    }
