"""
交易訊號 API 路由
提供專業的交易訊號分析服務
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import yfinance as yf
import pandas as pd

from services.stock.stock_signal_analyzer import TradingSignalAnalyzer
from services.stock.stock_predictor import predict_stock_price

router = APIRouter(prefix="/stock", tags=["Trading Signals"])


@router.get("/{ticker}/signal")
async def get_trading_signal(
    ticker: str,
    include_prediction: bool = Query(True, description="是否包含 AI 預測分析"),
    prediction_days: int = Query(7, ge=1, le=30, description="AI 預測天數")
):
    """
    獲取股票的交易訊號分析
    
    ## 功能說明
    - 綜合分析多個技術指標
    - 產生專業的買賣建議
    - 提供詳細的訊號解釋
    - 計算支撐壓力位、停損停利點
    
    ## 訊號類型
    - **strong_buy**: 強烈買入 (評分 75+)
    - **buy**: 買入 (評分 60-74)
    - **hold**: 持有/觀望 (評分 40-59)
    - **sell**: 賣出 (評分 25-39)
    - **strong_sell**: 強烈賣出 (評分 <25)
    
    ## 參數說明
    - `ticker`: 股票代碼 (例如: AAPL, TSLA)
    - `include_prediction`: 是否包含 AI 預測 (預設: True)
    - `prediction_days`: AI 預測天數 (預設: 7 天)
    
    ## 返回資料
    - 綜合評分 (0-100)
    - 訊號類型和信心度
    - 各類指標詳細分析
    - 支撐/壓力位
    - 停損/停利建議
    - 風險報酬比
    """
    try:
        # 獲取股票歷史資料
        stock = yf.Ticker(ticker)
        df = stock.history(period="6mo")
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"找不到股票代碼 {ticker} 的資料")
        
        # 計算技術指標 (使用與預測器相同的方法)
        from services.stock.stock_predictor import LinearRegressionPredictor
        predictor = LinearRegressionPredictor(ticker, period="6mo")
        df = predictor._calculate_technical_indicators(df)
        df = df.dropna()
        
        if len(df) < 20:
            raise HTTPException(
                status_code=400, 
                detail="歷史資料不足，無法產生可靠的訊號分析"
            )
        
        # 獲取 AI 預測 (如果需要)
        prediction_data = None
        if include_prediction:
            try:
                prediction_result = predict_stock_price(
                    ticker, 
                    days=prediction_days, 
                    period="6mo",
                    model_type='random_forest'  # 使用隨機森林作為預設模型
                )
                if prediction_result.get('success'):
                    prediction_data = prediction_result
            except Exception as e:
                print(f"AI prediction error: {e}")
                # 即使預測失敗，仍然繼續產生訊號
        
        # 分析交易訊號
        analyzer = TradingSignalAnalyzer(ticker)
        signal_result = analyzer.analyze_signal(df, prediction_data)
        
        # 添加額外的市場資訊
        latest = df.iloc[-1]
        signal_result['market_info'] = {
            'latest_close': float(latest['Close']),
            'latest_volume': float(latest['Volume']),
            'price_change_1d': float(latest['Price_Change']),
            'price_change_5d': float(latest['Price_Change_5d']),
            'price_change_20d': float(latest['Price_Change_20d']),
            'volume_vs_avg': float(latest['Volume_Change'])
        }
        
        return {
            'success': True,
            'data': signal_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"分析訊號時發生錯誤: {str(e)}"
        )


@router.get("/{ticker}/signal/history")
async def get_signal_history(
    ticker: str,
    days: int = Query(30, ge=7, le=90, description="歷史天數")
):
    """
    獲取股票的歷史訊號記錄
    
    ## 功能說明
    - 回顧過去的交易訊號
    - 驗證訊號的準確度
    - 分析訊號績效
    
    ## 參數說明
    - `ticker`: 股票代碼
    - `days`: 歷史天數 (預設: 30 天)
    
    ## 返回資料
    - 每日的訊號類型
    - 訊號觸發時的價格
    - 訊號後的實際表現
    - 訊號準確率統計
    """
    try:
        # 獲取歷史資料
        stock = yf.Ticker(ticker)
        df = stock.history(period=f"{days+90}d")  # 多取一些資料以計算指標
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"找不到股票代碼 {ticker} 的資料")
        
        # 計算技術指標
        from services.stock.stock_predictor import LinearRegressionPredictor
        predictor = LinearRegressionPredictor(ticker, period="6mo")
        df = predictor._calculate_technical_indicators(df)
        df = df.dropna()
        
        # 只取最近的天數
        df = df.tail(days)
        
        # 為每一天產生訊號
        analyzer = TradingSignalAnalyzer(ticker)
        history = []
        
        for i in range(len(df)):
            if i < 1:  # 至少需要 2 天資料才能計算
                continue
            
            # 使用截至當天的資料
            day_df = df.iloc[:i+1]
            signal = analyzer.analyze_signal(day_df, None)
            
            current_row = df.iloc[i]
            history.append({
                'date': df.index[i].strftime('%Y-%m-%d'),
                'signal': signal['signal'],
                'score': signal['score'],
                'confidence': signal['confidence'],
                'price': float(current_row['Close']),
                'volume': float(current_row['Volume'])
            })
        
        # 計算訊號準確率 (簡化版)
        correct_signals = 0
        total_signals = 0
        
        for i in range(len(history) - 1):
            current = history[i]
            next_day = history[i + 1]
            
            # 檢查訊號是否正確
            if current['signal'] in ['strong_buy', 'buy']:
                if next_day['price'] > current['price']:
                    correct_signals += 1
                total_signals += 1
            elif current['signal'] in ['strong_sell', 'sell']:
                if next_day['price'] < current['price']:
                    correct_signals += 1
                total_signals += 1
        
        accuracy = (correct_signals / total_signals * 100) if total_signals > 0 else 0
        
        return {
            'success': True,
            'ticker': ticker,
            'period': f'{days} days',
            'history': history,
            'statistics': {
                'total_signals': total_signals,
                'correct_signals': correct_signals,
                'accuracy': round(accuracy, 2),
                'buy_signals': len([h for h in history if h['signal'] in ['strong_buy', 'buy']]),
                'sell_signals': len([h for h in history if h['signal'] in ['strong_sell', 'sell']]),
                'hold_signals': len([h for h in history if h['signal'] == 'hold'])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"獲取訊號歷史時發生錯誤: {str(e)}"
        )
