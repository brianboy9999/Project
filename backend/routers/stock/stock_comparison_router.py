"""
股票預測模型比較 API
支援多模型同時預測並比較結果
"""
from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Literal
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor

from services.stock.stock_predictor import predict_stock_price

router = APIRouter(prefix="/stock", tags=["Stock Comparison"])


@router.get("/{ticker}/predict/compare")
async def compare_prediction_models(
    ticker: str,
    days: int = Query(30, ge=1, le=90, description="預測天數 (1-90天)"),
    period: str = Query("1y", description="訓練數據期間 (1mo, 3mo, 6mo, 1y, 2y, 5y)"),
    models: str = Query("linear,random_forest,lstm", description="要比較的模型，用逗號分隔")
):
    """
    多模型預測比較
    
    Args:
        ticker: 股票代碼
        days: 預測天數
        period: 訓練期間
        models: 要比較的模型列表 (逗號分隔)
                可選: linear, random_forest, lstm
                
    Returns:
        {
            'success': True,
            'ticker': 'AAPL',
            'comparisons': {
                'linear': {...},
                'random_forest': {...},
                'lstm': {...}
            },
            'summary': {模型比較摘要},
            'best_model': '最佳模型'
        }
    """
    try:
        # 解析要比較的模型
        model_list = [m.strip() for m in models.split(',')]
        valid_models = ['linear', 'random_forest', 'lstm']
        
        # 驗證模型名稱
        invalid_models = [m for m in model_list if m not in valid_models]
        if invalid_models:
            raise HTTPException(
                status_code=400, 
                detail=f"無效的模型: {', '.join(invalid_models)}"
            )
        
        # 並行執行多個模型預測
        results = await _run_models_parallel(ticker, days, period, model_list)
        
        # 計算比較摘要
        summary = _calculate_comparison_summary(results)
        
        # 找出最佳模型
        best_model = _find_best_model(summary)
        
        return {
            'success': True,
            'ticker': ticker,
            'days': days,
            'period': period,
            'comparisons': results,
            'summary': summary,
            'best_model': best_model,
            'total_models': len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _run_models_parallel(
    ticker: str, 
    days: int, 
    period: str, 
    models: List[str]
) -> Dict:
    """
    並行執行多個模型預測
    
    使用 ThreadPoolExecutor 來並行執行，提升速度
    """
    results = {}
    
    # 使用線程池並行執行
    with ThreadPoolExecutor(max_workers=len(models)) as executor:
        futures = {}
        
        for model in models:
            future = executor.submit(
                _run_single_model_with_timing,
                ticker, days, period, model
            )
            futures[model] = future
        
        # 收集結果
        for model, future in futures.items():
            try:
                results[model] = future.result()
            except Exception as e:
                results[model] = {
                    'success': False,
                    'error': str(e),
                    'elapsed_time': 0
                }
    
    return results


def _run_single_model_with_timing(
    ticker: str, 
    days: int, 
    period: str, 
    model: str
) -> Dict:
    """
    執行單一模型預測並計時
    """
    start_time = time.time()
    
    try:
        result = predict_stock_price(ticker, days, period, model)
        elapsed = time.time() - start_time
        
        if result.get('success'):
            result['elapsed_time'] = round(elapsed, 2)
            result['model_name'] = model
            return result
        else:
            return {
                'success': False,
                'error': result.get('message', 'Unknown error'),
                'elapsed_time': round(elapsed, 2),
                'model_name': model
            }
    except Exception as e:
        elapsed = time.time() - start_time
        return {
            'success': False,
            'error': str(e),
            'elapsed_time': round(elapsed, 2),
            'model_name': model
        }


def _calculate_comparison_summary(results: Dict) -> Dict:
    """
    計算模型比較摘要
    
    Returns:
        {
            'linear': {
                'r2_score': 0.75,
                'elapsed_time': 1.2,
                'predicted_change': 5.3,
                'predicted_price': 150.5,
                'success': True
            },
            ...
        }
    """
    summary = {}
    
    for model_name, result in results.items():
        if not result.get('success'):
            summary[model_name] = {
                'success': False,
                'error': result.get('error', 'Unknown error'),
                'elapsed_time': result.get('elapsed_time', 0)
            }
            continue
        
        # 計算預測變化
        predictions = result.get('predictions', [])
        current_price = result.get('current_price', 0)
        
        if predictions and current_price:
            last_prediction = predictions[-1]['predicted_price']
            change_pct = ((last_prediction - current_price) / current_price) * 100
            
            summary[model_name] = {
                'success': True,
                'r2_score': result.get('metrics', {}).get('r2_score', 0),
                'elapsed_time': result.get('elapsed_time', 0),
                'predicted_change': round(change_pct, 2),
                'predicted_price': round(last_prediction, 2),
                'current_price': round(current_price, 2),
                'model_description': result.get('metrics', {}).get('model_description', ''),
                'training_samples': result.get('metrics', {}).get('training_samples', 0)
            }
        else:
            summary[model_name] = {
                'success': False,
                'error': 'No predictions available'
            }
    
    return summary


def _find_best_model(summary: Dict) -> Dict:
    """
    根據多個指標找出最佳模型
    
    評分標準:
    - R² 分數 (40%)
    - 預測時間 (30% - 越快越好)
    - 訓練樣本數 (30% - 越多越好)
    """
    best = {
        'by_accuracy': None,
        'by_speed': None,
        'by_overall': None
    }
    
    successful_models = {
        k: v for k, v in summary.items() 
        if v.get('success', False)
    }
    
    if not successful_models:
        return best
    
    # 最高準確度
    best['by_accuracy'] = max(
        successful_models.items(),
        key=lambda x: x[1].get('r2_score', 0)
    )[0]
    
    # 最快速度
    best['by_speed'] = min(
        successful_models.items(),
        key=lambda x: x[1].get('elapsed_time', float('inf'))
    )[0]
    
    # 綜合評分
    scores = {}
    for model, data in successful_models.items():
        r2 = data.get('r2_score', 0)
        time_score = 1 / (data.get('elapsed_time', 1) + 0.1)  # 避免除以0
        samples = data.get('training_samples', 0)
        
        # 正規化分數 (0-1)
        max_time_score = max([1 / (m.get('elapsed_time', 1) + 0.1) for m in successful_models.values()])
        max_samples = max([m.get('training_samples', 1) for m in successful_models.values()])
        
        normalized_time = time_score / max_time_score if max_time_score > 0 else 0
        normalized_samples = samples / max_samples if max_samples > 0 else 0
        
        # 綜合評分
        overall_score = (r2 * 0.4) + (normalized_time * 0.3) + (normalized_samples * 0.3)
        scores[model] = overall_score
    
    best['by_overall'] = max(scores.items(), key=lambda x: x[1])[0]
    
    return best


# 擴充性設計：新增模型註冊機制
class ModelRegistry:
    """
    模型註冊表 - 方便未來新增模型
    
    使用方式:
        registry = ModelRegistry()
        registry.register('new_model', NewModelPredictor, 'GPU 加速模型')
    """
    
    def __init__(self):
        self._models = {
            'linear': {
                'class': 'LinearRegressionPredictor',
                'description': '線性回歸 - 速度快',
                'requires_gpu': False,
                'category': 'traditional'
            },
            'random_forest': {
                'class': 'RandomForestPredictor',
                'description': '隨機森林 - 推薦',
                'requires_gpu': False,
                'category': 'traditional'
            },
            'lstm': {
                'class': 'LSTMPredictor',
                'description': 'LSTM - 深度學習',
                'requires_gpu': False,  # CPU 也可以跑，但有 GPU 更快
                'category': 'deep_learning'
            }
        }
    
    def register(self, name: str, predictor_class: str, description: str, 
                 requires_gpu: bool = False, category: str = 'custom'):
        """註冊新模型"""
        self._models[name] = {
            'class': predictor_class,
            'description': description,
            'requires_gpu': requires_gpu,
            'category': category
        }
    
    def get_available_models(self, gpu_available: bool = False) -> List[str]:
        """取得可用的模型列表"""
        if gpu_available:
            return list(self._models.keys())
        else:
            return [
                name for name, info in self._models.items()
                if not info['requires_gpu']
            ]
    
    def get_model_info(self, name: str) -> Dict:
        """取得模型資訊"""
        return self._models.get(name, {})


# 全域模型註冊表
model_registry = ModelRegistry()


@router.get("/models/available")
def get_available_models():
    """
    取得所有可用的預測模型列表
    
    Returns:
        可用模型的詳細資訊
    """
    models = {}
    for model_name in ['linear', 'random_forest', 'lstm']:
        info = model_registry.get_model_info(model_name)
        models[model_name] = info
    
    return {
        'success': True,
        'models': models,
        'total': len(models)
    }
