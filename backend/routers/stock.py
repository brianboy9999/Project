from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional

from services.stock_crawler import(
    get_all_nasdaq_tickers,
    get_single_stock,
    get_multiple_stock
)

router = APIRouter(prefix = "/stock", tags = ["Stock"])

# 股票列表路由已移除，改用前端本地資料

#單支股票 
@router.get("/{ticker}")
def get_single_stock(
    ticker: str,
    period: Optional[str] = Query("1mo", description = "時間區間")
):
    try:
        data = get_single_stock(ticker, period)
        return data
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

# 多支股票
@router.get("/")
def get_multiple_stocks(
    ticker: List[str] = Query(..., desciption = "多個股票代碼")
):
    try:
        data = get_multiple_stock(ticker)
        return data
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))