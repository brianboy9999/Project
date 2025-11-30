"""
股票預測回測路由
提供模型回測功能，用歷史數據驗證預測準確度
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from services.stock.stock_predictor import (
    LinearRegressionPredictor,
    RandomForestPredictor,
    LSTMPredictor,
    KERAS_AVAILABLE
)

router = APIRouter(prefix="/stock", tags=["Stock Backtest"])


@router.get("/{ticker}/backtest")
async def backtest_model(
    ticker: str,
    model: str = Query('random_forest', description="模型類型"),
    backtest_days: int = Query(30, description="回測天數", ge=7, le=90),
    training_period: str = Query('1y', description="訓練數據期間")
):
    """
    對指定模型進行回測
    
    使用過去的數據訓練模型，然後預測接下來的 N 天，
    並與實際發生的價格進行比較，計算準確度指標
    
    Args:
        ticker: 股票代碼
        model: 模型類型 ('linear', 'random_forest', 'lstm')
        backtest_days: 回測天數（預測多少天後與實際比較）
        training_period: 訓練數據期間
    
    Returns:
        回測結果包含預測 vs 實際價格對比和準確度指標
    """
    try:
        # 驗證模型類型
        valid_models = ['linear', 'random_forest', 'lstm']
        if model not in valid_models:
            raise HTTPException(
                status_code=400, 
                detail=f"不支援的模型類型: {model}。支援的類型: {valid_models}"
            )
        
        # LSTM 模型檢查
        if model == 'lstm' and not KERAS_AVAILABLE:
            raise HTTPException(
                status_code=400,
                detail="LSTM 模型需要安裝 TensorFlow/Keras"
            )
        
        # 執行回測
        result = await _run_backtest(ticker, model, backtest_days, training_period)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"回測失敗: {str(e)}")


@router.get("/{ticker}/backtest/compare")
async def compare_model_backtest(
    ticker: str,
    backtest_days: int = Query(30, description="回測天數", ge=7, le=90),
    training_period: str = Query('1y', description="訓練數據期間"),
    models: Optional[List[str]] = Query(None, description="要比較的模型列表")
):
    """
    比較多個模型的回測結果
    
    Args:
        ticker: 股票代碼
        backtest_days: 回測天數
        training_period: 訓練數據期間
        models: 模型列表，如果為 None 則比較所有模型
    
    Returns:
        所有模型的回測結果比較
    """
    try:
        if models is None:
            models = ['linear', 'random_forest', 'lstm']
        
        # 驗證所有模型
        valid_models = ['linear', 'random_forest', 'lstm']
        for m in models:
            if m not in valid_models:
                raise HTTPException(
                    status_code=400,
                    detail=f"不支援的模型類型: {m}"
                )
        
        # 執行所有模型的回測
        results = {}
        for model_name in models:
            if model_name == 'lstm' and not KERAS_AVAILABLE:
                results[model_name] = {
                    'success': False,
                    'error': 'LSTM 需要安裝 TensorFlow/Keras'
                }
                continue
            
            try:
                result = await _run_backtest(ticker, model_name, backtest_days, training_period)
                results[model_name] = result
            except Exception as e:
                results[model_name] = {
                    'success': False,
                    'error': str(e)
                }
        
        # 計算最佳模型
        best_model = _find_best_backtest_model(results)
        
        return {
            'success': True,
            'ticker': ticker,
            'backtest_days': backtest_days,
            'training_period': training_period,
            'results': results,
            'best_model': best_model
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"回測比較失敗: {str(e)}")


async def _run_backtest(
    ticker: str,
    model_type: str,
    backtest_days: int,
    training_period: str
) -> Dict:
    """
    執行單一模型的回測
    
    策略：
    1. 獲取完整歷史數據（包含回測期間）
    2. 截取回測開始日期之前的數據作為訓練集
    3. 用訓練好的模型預測接下來的 N 天
    4. 將預測結果與實際發生的價格比較
    5. 計算準確度指標
    """
    # 獲取完整歷史數據（需要包含回測期間 + 訓練期間）
    period_map = {
        '3mo': '6mo',   # 需要額外 3 個月做回測
        '6mo': '1y',
        '1y': '2y',
        '2y': '3y',
        '5y': 'max'
    }
    
    extended_period = period_map.get(training_period, '2y')
    stock = yf.Ticker(ticker)
    df = stock.history(period=extended_period)
    
    if df.empty or len(df) < 60:
        return {
            'success': False,
            'message': '歷史數據不足，無法進行回測'
        }
    
    # 計算回測開始日期（保留最後 backtest_days 作為驗證集）
    total_days = len(df)
    split_index = total_days - backtest_days
    
    if split_index < 60:
        return {
            'success': False,
            'message': '訓練數據不足'
        }
    
    # 分割數據：訓練集 + 驗證集
    train_df = df.iloc[:split_index].copy()
    actual_df = df.iloc[split_index:].copy()
    
    # 使用訓練集訓練模型
    if model_type == 'linear':
        predictor = LinearRegressionPredictor(ticker, training_period)
    elif model_type == 'random_forest':
        predictor = RandomForestPredictor(ticker, training_period)
    elif model_type == 'lstm':
        predictor = LSTMPredictor(ticker, training_period)
    else:
        return {
            'success': False,
            'message': f'不支援的模型類型: {model_type}'
        }
    
    # 手動設置訓練數據（而不是自動下載）
    predictor.last_df = train_df
    predictor.last_df = predictor._calculate_technical_indicators(train_df)
    
    # 訓練模型
    if not predictor.train():
        return {
            'success': False,
            'message': '模型訓練失敗'
        }
    
    # 進行預測
    actual_days = len(actual_df)
    predictions = predictor.predict_next_days(actual_days)
    
    if not predictions:
        return {
            'success': False,
            'message': '預測失敗'
        }
    
    # 準備對比數據
    comparison_data = []
    actual_prices = actual_df['Close'].values
    
    for i, pred in enumerate(predictions[:actual_days]):
        comparison_data.append({
            'date': pred['date'],
            'predicted_price': pred['predicted_price'],
            'actual_price': float(actual_prices[i]),
            'error': pred['predicted_price'] - float(actual_prices[i]),
            'error_percentage': ((pred['predicted_price'] - float(actual_prices[i])) / float(actual_prices[i])) * 100,
            'confidence': pred.get('confidence', 0)
        })
    
    # 計算回測指標
    metrics = _calculate_backtest_metrics(comparison_data, train_df['Close'].iloc[-1])
    
    return {
        'success': True,
        'ticker': ticker,
        'model_type': model_type,
        'backtest_days': actual_days,
        'training_period': training_period,
        'split_date': train_df.index[-1].strftime('%Y-%m-%d'),
        'comparison_data': comparison_data,
        'metrics': metrics,
        'training_end_price': float(train_df['Close'].iloc[-1]),
        'model_metrics': predictor.get_metrics()
    }


def _calculate_backtest_metrics(comparison_data: List[Dict], base_price: float) -> Dict:
    """
    計算回測指標
    
    Returns:
        - MAPE: 平均絕對百分比誤差
        - RMSE: 均方根誤差
        - MAE: 平均絕對誤差
        - 方向準確度: 預測方向正確的比例
        - 勝率: 誤差在 5% 以內的比例
    """
    if not comparison_data:
        return {}
    
    errors = [abs(d['error']) for d in comparison_data]
    error_percentages = [abs(d['error_percentage']) for d in comparison_data]
    
    # MAPE: Mean Absolute Percentage Error
    mape = np.mean(error_percentages)
    
    # RMSE: Root Mean Squared Error
    rmse = np.sqrt(np.mean([e**2 for e in errors]))
    
    # MAE: Mean Absolute Error
    mae = np.mean(errors)
    
    # 方向準確度（預測漲跌方向是否正確）
    correct_direction = 0
    for i in range(1, len(comparison_data)):
        prev_actual = comparison_data[i-1]['actual_price']
        curr_actual = comparison_data[i]['actual_price']
        prev_pred = comparison_data[i-1]['predicted_price']
        curr_pred = comparison_data[i]['predicted_price']
        
        actual_direction = curr_actual > prev_actual
        pred_direction = curr_pred > prev_pred
        
        if actual_direction == pred_direction:
            correct_direction += 1
    
    direction_accuracy = (correct_direction / (len(comparison_data) - 1)) * 100 if len(comparison_data) > 1 else 0
    
    # 勝率（誤差在 5% 以內）
    within_5_percent = sum(1 for e in error_percentages if e <= 5.0)
    win_rate = (within_5_percent / len(comparison_data)) * 100
    
    # 預測變化 vs 實際變化
    predicted_change = ((comparison_data[-1]['predicted_price'] - base_price) / base_price) * 100
    actual_change = ((comparison_data[-1]['actual_price'] - base_price) / base_price) * 100
    
    return {
        'mape': round(mape, 2),
        'rmse': round(rmse, 2),
        'mae': round(mae, 2),
        'direction_accuracy': round(direction_accuracy, 2),
        'win_rate': round(win_rate, 2),
        'predicted_change': round(predicted_change, 2),
        'actual_change': round(actual_change, 2),
        'total_predictions': len(comparison_data),
        'max_error': round(max(errors), 2),
        'min_error': round(min(errors), 2)
    }


def _find_best_backtest_model(results: Dict) -> Dict:
    """
    根據回測結果找出最佳模型
    
    評分標準:
    - 方向準確度 (40%)
    - MAPE - 越低越好 (30%)
    - 勝率 (30%)
    """
    best = {
        'by_direction': None,
        'by_accuracy': None,
        'by_winrate': None,
        'by_overall': None
    }
    
    successful_results = {
        k: v for k, v in results.items() 
        if v.get('success', False)
    }
    
    if not successful_results:
        return best
    
    # 最佳方向準確度
    best['by_direction'] = max(
        successful_results.items(),
        key=lambda x: x[1].get('metrics', {}).get('direction_accuracy', 0)
    )[0]
    
    # 最低 MAPE（最準確）
    best['by_accuracy'] = min(
        successful_results.items(),
        key=lambda x: x[1].get('metrics', {}).get('mape', float('inf'))
    )[0]
    
    # 最高勝率
    best['by_winrate'] = max(
        successful_results.items(),
        key=lambda x: x[1].get('metrics', {}).get('win_rate', 0)
    )[0]
    
    # 綜合評分
    scores = {}
    for model, data in successful_results.items():
        metrics = data.get('metrics', {})
        
        direction = metrics.get('direction_accuracy', 0)
        mape = metrics.get('mape', 100)
        winrate = metrics.get('win_rate', 0)
        
        # MAPE 轉換為分數（越低越好 -> 越高越好）
        # 假設 MAPE 在 0-50 之間，轉換為 100-0 分
        mape_score = max(0, 100 - (mape * 2))
        
        # 綜合評分
        overall_score = (direction * 0.4) + (mape_score * 0.3) + (winrate * 0.3)
        scores[model] = overall_score
    
    best['by_overall'] = max(scores.items(), key=lambda x: x[1])[0]
    
    return best
