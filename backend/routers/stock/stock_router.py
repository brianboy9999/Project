from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Literal

from services.stock.stock_crawler import get_stock as fetch_stock, get_company_detail
from services.stock.stock_predictor import predict_stock_price
from data.stock.stock_models import StockPrediction

router = APIRouter(prefix = "/stock", tags = ["Stock"])

#單支股票 
@router.get("/{ticker}")
def get_stock_data(
    ticker: str,
    period: Optional[str] = Query(None, description="時間區間 (例如: 1mo, 1y)"),
    start: Optional[str] = Query(None, description="起始日期 (YYYY-MM-DD)"),
    end: Optional[str] = Query(None, description="結束日期 (YYYY-MM-DD)")
):
    try:
        data = fetch_stock(ticker, period=period, start=start, end=end)
        return data
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

# 公司詳細資訊
@router.get("/{ticker}/detail")
def get_company_info(ticker: str):
    try:
        data = get_company_detail(ticker)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 股價預測
@router.get("/{ticker}/predict", response_model=StockPrediction)
def predict_stock(
    ticker: str,
    days: int = Query(30, ge=1, le=90, description="預測天數 (1-90天)"),
    period: str = Query("1y", description="訓練數據期間 (1mo, 3mo, 6mo, 1y, 2y, 5y)"),
    model: Literal['linear', 'random_forest', 'lstm'] = Query('random_forest', description="預測模型類型")
):
    """
    多模型股票價格預測
    
    Args:
        ticker: 股票代碼
        days: 預測天數 (1-90)
        period: 用於訓練的歷史數據期間
        model: 預測模型類型
            - linear: 線性回歸 (速度最快，適合快速預覽)
            - random_forest: 隨機森林 (推薦，平衡速度與準確度)
            - lstm: LSTM 神經網絡 (準確度高，但速度較慢)
        
    Returns:
        包含預測結果、歷史數據和模型指標的 StockPrediction 物件
    """
    try:
        result = predict_stock_price(ticker, days=days, period=period, model_type=model)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))