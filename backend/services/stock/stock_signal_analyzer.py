"""
專業交易訊號分析系統
基於多個技術指標產生買賣訊號，並提供詳細的分析報告
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Literal
from datetime import datetime
import yfinance as yf

SignalType = Literal['strong_buy', 'buy', 'hold', 'sell', 'strong_sell']


class TradingSignalAnalyzer:
    """交易訊號分析器 - 綜合多個技術指標產生專業交易建議"""
    
    def __init__(self, ticker: str):
        self.ticker = ticker
        self.signal_weights = {
            'trend': 0.30,      # 趨勢指標權重 30%
            'momentum': 0.25,   # 動能指標權重 25%
            'volume': 0.20,     # 成交量指標權重 20%
            'volatility': 0.15, # 波動率指標權重 15%
            'ai_prediction': 0.10  # AI 預測權重 10%
        }
    
    def analyze_signal(self, df: pd.DataFrame, prediction_data: Dict = None) -> Dict:
        """
        綜合分析產生交易訊號
        
        Args:
            df: 包含所有技術指標的 DataFrame
            prediction_data: AI 預測資料 (可選)
        
        Returns:
            完整的交易訊號分析報告
        """
        if df.empty or len(df) < 2:
            return self._empty_signal()
        
        latest = df.iloc[-1]
        previous = df.iloc[-2]
        
        # 1. 趨勢分析
        trend_score, trend_signals = self._analyze_trend(latest, previous, df)
        
        # 2. 動能分析
        momentum_score, momentum_signals = self._analyze_momentum(latest, previous)
        
        # 3. 成交量分析
        volume_score, volume_signals = self._analyze_volume(latest, previous)
        
        # 4. 波動率分析
        volatility_score, volatility_signals = self._analyze_volatility(latest, previous)
        
        # 5. AI 預測分析
        ai_score, ai_signals = self._analyze_ai_prediction(prediction_data)
        
        # 計算綜合評分 (0-100)
        total_score = (
            trend_score * self.signal_weights['trend'] +
            momentum_score * self.signal_weights['momentum'] +
            volume_score * self.signal_weights['volume'] +
            volatility_score * self.signal_weights['volatility'] +
            ai_score * self.signal_weights['ai_prediction']
        )
        
        # 判定訊號類型
        signal_type = self._determine_signal_type(total_score)
        
        # 計算信心度
        confidence = self._calculate_confidence(
            trend_score, momentum_score, volume_score, 
            volatility_score, ai_score
        )
        
        # 生成建議文字
        recommendation = self._generate_recommendation(
            signal_type, total_score, confidence, 
            trend_signals, momentum_signals, volume_signals
        )
        
        return {
            'ticker': self.ticker,
            'timestamp': datetime.now().isoformat(),
            'signal': signal_type,
            'score': round(total_score, 2),
            'confidence': round(confidence, 2),
            'recommendation': recommendation,
            'category_scores': {
                'trend': round(trend_score, 2),
                'momentum': round(momentum_score, 2),
                'volume': round(volume_score, 2),
                'volatility': round(volatility_score, 2),
                'ai_prediction': round(ai_score, 2)
            },
            'detailed_signals': {
                'trend': trend_signals,
                'momentum': momentum_signals,
                'volume': volume_signals,
                'volatility': volatility_signals,
                'ai': ai_signals
            },
            'key_levels': {
                'current_price': float(latest['Close']),
                'support': self._calculate_support(df),
                'resistance': self._calculate_resistance(df),
                'stop_loss': self._calculate_stop_loss(latest, signal_type),
                'take_profit': self._calculate_take_profit(latest, signal_type)
            },
            'risk_reward_ratio': self._calculate_risk_reward(latest, signal_type)
        }
    
    def _analyze_trend(self, latest: pd.Series, previous: pd.Series, df: pd.DataFrame) -> tuple:
        """趨勢指標分析"""
        score = 50  # 中性起點
        signals = []
        
        # MACD 分析 (權重高)
        if latest['MACD'] > latest['MACD_Signal']:
            if previous['MACD'] <= previous['MACD_Signal']:
                score += 25  # 金叉
                signals.append({
                    'indicator': 'MACD',
                    'signal': 'golden_cross',
                    'description': 'MACD 金叉，強烈買入訊號',
                    'strength': 'strong',
                    'impact': 25
                })
            else:
                score += 15  # 維持多頭
                signals.append({
                    'indicator': 'MACD',
                    'signal': 'bullish',
                    'description': 'MACD 維持多頭排列',
                    'strength': 'medium',
                    'impact': 15
                })
        else:
            if previous['MACD'] >= previous['MACD_Signal']:
                score -= 25  # 死叉
                signals.append({
                    'indicator': 'MACD',
                    'signal': 'death_cross',
                    'description': 'MACD 死叉，強烈賣出訊號',
                    'strength': 'strong',
                    'impact': -25
                })
            else:
                score -= 15  # 維持空頭
                signals.append({
                    'indicator': 'MACD',
                    'signal': 'bearish',
                    'description': 'MACD 維持空頭排列',
                    'strength': 'medium',
                    'impact': -15
                })
        
        # MACD 柱狀圖趨勢
        if latest['MACD_Hist'] > 0 and latest['MACD_Hist'] > previous['MACD_Hist']:
            score += 10
            signals.append({
                'indicator': 'MACD_Histogram',
                'signal': 'increasing',
                'description': 'MACD 柱狀圖擴大，動能增強',
                'strength': 'medium',
                'impact': 10
            })
        elif latest['MACD_Hist'] < 0 and latest['MACD_Hist'] < previous['MACD_Hist']:
            score -= 10
            signals.append({
                'indicator': 'MACD_Histogram',
                'signal': 'decreasing',
                'description': 'MACD 柱狀圖縮小，動能減弱',
                'strength': 'medium',
                'impact': -10
            })
        
        # DMI/ADX 趨勢強度分析
        if latest['ADX'] > 25:  # 有明顯趨勢
            if latest['DMI_Plus'] > latest['DMI_Minus']:
                score += 15
                signals.append({
                    'indicator': 'DMI/ADX',
                    'signal': 'strong_uptrend',
                    'description': f'ADX {latest["ADX"]:.1f} 顯示強勁上升趨勢',
                    'strength': 'strong' if latest['ADX'] > 40 else 'medium',
                    'impact': 15
                })
            else:
                score -= 15
                signals.append({
                    'indicator': 'DMI/ADX',
                    'signal': 'strong_downtrend',
                    'description': f'ADX {latest["ADX"]:.1f} 顯示強勁下降趨勢',
                    'strength': 'strong' if latest['ADX'] > 40 else 'medium',
                    'impact': -15
                })
        else:
            signals.append({
                'indicator': 'DMI/ADX',
                'signal': 'no_trend',
                'description': f'ADX {latest["ADX"]:.1f} 趨勢不明顯，建議觀望',
                'strength': 'weak',
                'impact': 0
            })
        
        # 移動平均線排列
        ma_alignment = self._check_ma_alignment(latest)
        if ma_alignment == 'bullish':
            score += 10
            signals.append({
                'indicator': 'MA_Alignment',
                'signal': 'bullish',
                'description': '均線多頭排列 (MA5 > MA10 > MA20 > MA60)',
                'strength': 'medium',
                'impact': 10
            })
        elif ma_alignment == 'bearish':
            score -= 10
            signals.append({
                'indicator': 'MA_Alignment',
                'signal': 'bearish',
                'description': '均線空頭排列 (MA5 < MA10 < MA20 < MA60)',
                'strength': 'medium',
                'impact': -10
            })
        
        # 價格與 MA60 關係 (長期趨勢)
        if latest['Close'] > latest['MA60']:
            score += 5
            signals.append({
                'indicator': 'Price_vs_MA60',
                'signal': 'above',
                'description': '價格站上 MA60，長期趨勢向上',
                'strength': 'weak',
                'impact': 5
            })
        else:
            score -= 5
            signals.append({
                'indicator': 'Price_vs_MA60',
                'signal': 'below',
                'description': '價格跌破 MA60，長期趨勢向下',
                'strength': 'weak',
                'impact': -5
            })
        
        return max(0, min(100, score)), signals
    
    def _analyze_momentum(self, latest: pd.Series, previous: pd.Series) -> tuple:
        """動能指標分析"""
        score = 50
        signals = []
        
        # RSI 分析
        rsi = latest['RSI']
        if rsi < 30:
            score += 20
            signals.append({
                'indicator': 'RSI',
                'signal': 'oversold',
                'description': f'RSI {rsi:.1f} 超賣，可能反彈',
                'strength': 'strong' if rsi < 20 else 'medium',
                'impact': 20
            })
        elif rsi > 70:
            score -= 20
            signals.append({
                'indicator': 'RSI',
                'signal': 'overbought',
                'description': f'RSI {rsi:.1f} 超買，可能回調',
                'strength': 'strong' if rsi > 80 else 'medium',
                'impact': -20
            })
        elif 40 <= rsi <= 60:
            signals.append({
                'indicator': 'RSI',
                'signal': 'neutral',
                'description': f'RSI {rsi:.1f} 中性區間',
                'strength': 'weak',
                'impact': 0
            })
        elif rsi > 60:
            score += 10
            signals.append({
                'indicator': 'RSI',
                'signal': 'strong',
                'description': f'RSI {rsi:.1f} 強勢區間',
                'strength': 'medium',
                'impact': 10
            })
        else:
            score -= 10
            signals.append({
                'indicator': 'RSI',
                'signal': 'weak',
                'description': f'RSI {rsi:.1f} 弱勢區間',
                'strength': 'medium',
                'impact': -10
            })
        
        # KDJ 分析
        kdj_k = latest['KDJ_K']
        kdj_d = latest['KDJ_D']
        kdj_j = latest['KDJ_J']
        
        if kdj_k > kdj_d and previous['KDJ_K'] <= previous['KDJ_D']:
            score += 15
            signals.append({
                'indicator': 'KDJ',
                'signal': 'golden_cross',
                'description': f'KDJ 金叉 (K:{kdj_k:.1f} > D:{kdj_d:.1f})',
                'strength': 'strong',
                'impact': 15
            })
        elif kdj_k < kdj_d and previous['KDJ_K'] >= previous['KDJ_D']:
            score -= 15
            signals.append({
                'indicator': 'KDJ',
                'signal': 'death_cross',
                'description': f'KDJ 死叉 (K:{kdj_k:.1f} < D:{kdj_d:.1f})',
                'strength': 'strong',
                'impact': -15
            })
        
        # KDJ 超買超賣
        if kdj_j < 20:
            score += 10
            signals.append({
                'indicator': 'KDJ_J',
                'signal': 'oversold',
                'description': f'KDJ_J {kdj_j:.1f} 超賣',
                'strength': 'medium',
                'impact': 10
            })
        elif kdj_j > 80:
            score -= 10
            signals.append({
                'indicator': 'KDJ_J',
                'signal': 'overbought',
                'description': f'KDJ_J {kdj_j:.1f} 超買',
                'strength': 'medium',
                'impact': -10
            })
        
        # CCI 分析
        cci = latest['CCI']
        if cci > 100:
            score -= 10
            signals.append({
                'indicator': 'CCI',
                'signal': 'overbought',
                'description': f'CCI {cci:.1f} 超買',
                'strength': 'medium',
                'impact': -10
            })
        elif cci < -100:
            score += 10
            signals.append({
                'indicator': 'CCI',
                'signal': 'oversold',
                'description': f'CCI {cci:.1f} 超賣',
                'strength': 'medium',
                'impact': 10
            })
        
        # Williams %R 分析
        williams_r = latest['Williams_R']
        if williams_r > -20:
            score -= 10
            signals.append({
                'indicator': 'Williams_R',
                'signal': 'overbought',
                'description': f'Williams %R {williams_r:.1f} 超買',
                'strength': 'medium',
                'impact': -10
            })
        elif williams_r < -80:
            score += 10
            signals.append({
                'indicator': 'Williams_R',
                'signal': 'oversold',
                'description': f'Williams %R {williams_r:.1f} 超賣',
                'strength': 'medium',
                'impact': 10
            })
        
        return max(0, min(100, score)), signals
    
    def _analyze_volume(self, latest: pd.Series, previous: pd.Series) -> tuple:
        """成交量分析"""
        score = 50
        signals = []
        
        # 成交量變化
        volume_change = latest['Volume_Change']
        if volume_change > 50:  # 成交量暴增 50%+
            if latest['Close'] > previous['Close']:
                score += 20
                signals.append({
                    'indicator': 'Volume',
                    'signal': 'surge_bullish',
                    'description': f'成交量暴增 {volume_change:.1f}% 且上漲，資金進場',
                    'strength': 'strong',
                    'impact': 20
                })
            else:
                score -= 15
                signals.append({
                    'indicator': 'Volume',
                    'signal': 'surge_bearish',
                    'description': f'成交量暴增 {volume_change:.1f}% 且下跌，恐慌賣壓',
                    'strength': 'strong',
                    'impact': -15
                })
        elif volume_change > 20:
            score += 10
            signals.append({
                'indicator': 'Volume',
                'signal': 'increasing',
                'description': f'成交量放大 {volume_change:.1f}%',
                'strength': 'medium',
                'impact': 10
            })
        elif volume_change < -30:
            score -= 10
            signals.append({
                'indicator': 'Volume',
                'signal': 'shrinking',
                'description': f'成交量萎縮 {abs(volume_change):.1f}%，觀望氣氛濃',
                'strength': 'medium',
                'impact': -10
            })
        
        # OBV 趨勢分析
        obv_ma = latest['Volume_MA20'] * latest['Close']  # 簡化的 OBV MA
        if latest['OBV'] > obv_ma:
            score += 15
            signals.append({
                'indicator': 'OBV',
                'signal': 'bullish',
                'description': 'OBV 趨勢向上，資金持續流入',
                'strength': 'medium',
                'impact': 15
            })
        else:
            score -= 10
            signals.append({
                'indicator': 'OBV',
                'signal': 'bearish',
                'description': 'OBV 趨勢向下，資金流出',
                'strength': 'medium',
                'impact': -10
            })
        
        # 成交量與均量比較
        if latest['Volume'] > latest['Volume_MA5'] * 1.5:
            score += 10
            signals.append({
                'indicator': 'Volume_vs_MA5',
                'signal': 'above',
                'description': '成交量遠高於 5 日均量',
                'strength': 'medium',
                'impact': 10
            })
        elif latest['Volume'] < latest['Volume_MA5'] * 0.7:
            score -= 5
            signals.append({
                'indicator': 'Volume_vs_MA5',
                'signal': 'below',
                'description': '成交量低於 5 日均量',
                'strength': 'weak',
                'impact': -5
            })
        
        return max(0, min(100, score)), signals
    
    def _analyze_volatility(self, latest: pd.Series, previous: pd.Series) -> tuple:
        """波動率分析"""
        score = 50
        signals = []
        
        # ATR 分析
        atr = latest['ATR']
        atr_pct = (atr / latest['Close']) * 100
        
        if atr_pct > 3:
            score -= 15
            signals.append({
                'indicator': 'ATR',
                'signal': 'high_volatility',
                'description': f'ATR {atr_pct:.2f}% 波動率高，風險較大',
                'strength': 'strong' if atr_pct > 5 else 'medium',
                'impact': -15
            })
        elif atr_pct < 1.5:
            score += 10
            signals.append({
                'indicator': 'ATR',
                'signal': 'low_volatility',
                'description': f'ATR {atr_pct:.2f}% 波動率低，相對穩定',
                'strength': 'medium',
                'impact': 10
            })
        else:
            signals.append({
                'indicator': 'ATR',
                'signal': 'normal',
                'description': f'ATR {atr_pct:.2f}% 波動率正常',
                'strength': 'weak',
                'impact': 0
            })
        
        # 布林帶分析
        bb_position = self._calculate_bb_position(latest)
        if bb_position > 0.8:
            score -= 15
            signals.append({
                'indicator': 'Bollinger_Bands',
                'signal': 'upper_band',
                'description': '價格接近布林帶上軌，可能回調',
                'strength': 'medium',
                'impact': -15
            })
        elif bb_position < 0.2:
            score += 15
            signals.append({
                'indicator': 'Bollinger_Bands',
                'signal': 'lower_band',
                'description': '價格接近布林帶下軌，可能反彈',
                'strength': 'medium',
                'impact': 15
            })
        
        # 布林帶寬度
        bb_width = latest['BB_Width']
        bb_width_pct = (bb_width / latest['Close']) * 100
        if bb_width_pct < 2:
            score += 5
            signals.append({
                'indicator': 'BB_Width',
                'signal': 'squeeze',
                'description': '布林帶收斂，可能醞釀突破',
                'strength': 'weak',
                'impact': 5
            })
        elif bb_width_pct > 6:
            score -= 5
            signals.append({
                'indicator': 'BB_Width',
                'signal': 'expansion',
                'description': '布林帶擴張，波動加劇',
                'strength': 'weak',
                'impact': -5
            })
        
        return max(0, min(100, score)), signals
    
    def _analyze_ai_prediction(self, prediction_data: Dict = None) -> tuple:
        """AI 預測分析"""
        score = 50
        signals = []
        
        if not prediction_data:
            signals.append({
                'indicator': 'AI_Prediction',
                'signal': 'unavailable',
                'description': 'AI 預測資料不可用',
                'strength': 'weak',
                'impact': 0
            })
            return score, signals
        
        # 假設 prediction_data 包含預測漲跌幅
        if 'predictions' in prediction_data and len(prediction_data['predictions']) > 0:
            first_pred = prediction_data['predictions'][0]
            current_price = prediction_data.get('current_price', 0)
            
            if current_price > 0:
                predicted_price = first_pred.get('predicted_price', current_price)
                change_pct = ((predicted_price - current_price) / current_price) * 100
                
                if change_pct > 5:
                    score += 30
                    signals.append({
                        'indicator': 'AI_Prediction',
                        'signal': 'strong_bullish',
                        'description': f'AI 預測未來 7 天上漲 {change_pct:.1f}%',
                        'strength': 'strong',
                        'impact': 30
                    })
                elif change_pct > 2:
                    score += 20
                    signals.append({
                        'indicator': 'AI_Prediction',
                        'signal': 'bullish',
                        'description': f'AI 預測未來 7 天上漲 {change_pct:.1f}%',
                        'strength': 'medium',
                        'impact': 20
                    })
                elif change_pct < -5:
                    score -= 30
                    signals.append({
                        'indicator': 'AI_Prediction',
                        'signal': 'strong_bearish',
                        'description': f'AI 預測未來 7 天下跌 {abs(change_pct):.1f}%',
                        'strength': 'strong',
                        'impact': -30
                    })
                elif change_pct < -2:
                    score -= 20
                    signals.append({
                        'indicator': 'AI_Prediction',
                        'signal': 'bearish',
                        'description': f'AI 預測未來 7 天下跌 {abs(change_pct):.1f}%',
                        'strength': 'medium',
                        'impact': -20
                    })
                else:
                    signals.append({
                        'indicator': 'AI_Prediction',
                        'signal': 'neutral',
                        'description': f'AI 預測未來 7 天變化 {change_pct:+.1f}%',
                        'strength': 'weak',
                        'impact': 0
                    })
        
        return max(0, min(100, score)), signals
    
    def _determine_signal_type(self, score: float) -> SignalType:
        """根據評分判定訊號類型"""
        if score >= 75:
            return 'strong_buy'
        elif score >= 60:
            return 'buy'
        elif score >= 40:
            return 'hold'
        elif score >= 25:
            return 'sell'
        else:
            return 'strong_sell'
    
    def _calculate_confidence(self, *scores) -> float:
        """計算信心度 - 基於各指標的一致性"""
        scores_list = list(scores)
        # 計算標準差，標準差越小表示越一致
        std = np.std(scores_list)
        # 轉換為信心度 (0-1)
        confidence = 1 - (std / 50)  # 假設最大標準差為 50
        return max(0.3, min(1.0, confidence))
    
    def _generate_recommendation(self, signal: SignalType, score: float, 
                                confidence: float, trend_signals: List, 
                                momentum_signals: List, volume_signals: List) -> str:
        """生成交易建議文字"""
        recommendations = {
            'strong_buy': f'強烈建議買入 (評分: {score:.0f}/100, 信心度: {confidence*100:.0f}%)',
            'buy': f'建議買入 (評分: {score:.0f}/100, 信心度: {confidence*100:.0f}%)',
            'hold': f'建議持有或觀望 (評分: {score:.0f}/100, 信心度: {confidence*100:.0f}%)',
            'sell': f'建議賣出 (評分: {score:.0f}/100, 信心度: {confidence*100:.0f}%)',
            'strong_sell': f'強烈建議賣出 (評分: {score:.0f}/100, 信心度: {confidence*100:.0f}%)'
        }
        
        base_rec = recommendations.get(signal, '建議觀望')
        
        # 找出最強的訊號
        all_signals = trend_signals + momentum_signals + volume_signals
        strong_signals = [s for s in all_signals if s.get('strength') == 'strong']
        
        if strong_signals:
            reasons = ', '.join([s['description'] for s in strong_signals[:2]])
            return f"{base_rec}\n主要原因: {reasons}"
        
        return base_rec
    
    def _check_ma_alignment(self, latest: pd.Series) -> str:
        """檢查均線排列"""
        if (latest['MA5'] > latest['MA10'] > latest['MA20'] > latest['MA60']):
            return 'bullish'
        elif (latest['MA5'] < latest['MA10'] < latest['MA20'] < latest['MA60']):
            return 'bearish'
        else:
            return 'mixed'
    
    def _calculate_bb_position(self, latest: pd.Series) -> float:
        """計算價格在布林帶中的位置 (0-1)"""
        bb_range = latest['BB_Upper'] - latest['BB_Lower']
        if bb_range == 0:
            return 0.5
        position = (latest['Close'] - latest['BB_Lower']) / bb_range
        return max(0, min(1, position))
    
    def _calculate_support(self, df: pd.DataFrame) -> float:
        """計算支撐位 - 近期低點"""
        recent = df.tail(20)
        return float(recent['Low'].min())
    
    def _calculate_resistance(self, df: pd.DataFrame) -> float:
        """計算壓力位 - 近期高點"""
        recent = df.tail(20)
        return float(recent['High'].max())
    
    def _calculate_stop_loss(self, latest: pd.Series, signal: SignalType) -> float:
        """計算停損位"""
        atr = latest['ATR']
        current_price = latest['Close']
        
        if signal in ['strong_buy', 'buy']:
            # 買入訊號，停損在下方 1.5 ATR
            return float(current_price - (atr * 1.5))
        elif signal in ['strong_sell', 'sell']:
            # 賣出訊號，停損在上方 1.5 ATR
            return float(current_price + (atr * 1.5))
        else:
            return float(current_price - (atr * 1.0))
    
    def _calculate_take_profit(self, latest: pd.Series, signal: SignalType) -> float:
        """計算停利位"""
        atr = latest['ATR']
        current_price = latest['Close']
        
        if signal in ['strong_buy', 'buy']:
            # 買入訊號，停利在上方 3 ATR
            return float(current_price + (atr * 3))
        elif signal in ['strong_sell', 'sell']:
            # 賣出訊號，停利在下方 3 ATR
            return float(current_price - (atr * 3))
        else:
            return float(current_price + (atr * 2))
    
    def _calculate_risk_reward(self, latest: pd.Series, signal: SignalType) -> float:
        """計算風險報酬比"""
        stop_loss = self._calculate_stop_loss(latest, signal)
        take_profit = self._calculate_take_profit(latest, signal)
        current_price = latest['Close']
        
        risk = abs(current_price - stop_loss)
        reward = abs(take_profit - current_price)
        
        if risk == 0:
            return 0
        
        return round(reward / risk, 2)
    
    def _empty_signal(self) -> Dict:
        """返回空訊號 (資料不足時)"""
        return {
            'ticker': self.ticker,
            'timestamp': datetime.now().isoformat(),
            'signal': 'hold',
            'score': 50,
            'confidence': 0,
            'recommendation': '資料不足，無法產生訊號',
            'category_scores': {},
            'detailed_signals': {},
            'key_levels': {},
            'risk_reward_ratio': 0
        }
