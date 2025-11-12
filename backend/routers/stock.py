from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional

from services.stock_crawler import(
    get_single_stock as fetch_single_stock,
    get_multiple_stock as fetch_multiple_stock
)

router = APIRouter(prefix = "/stock", tags = ["Stock"])

#單支股票 
@router.get("/{ticker}")
def get_single_stock(
    ticker: str,
    period: Optional[str] = Query("1mo", description = "時間區間")
):
    try:
        data = fetch_single_stock(ticker, period)
        return data
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

# 多支股票
@router.get("/")
def get_multiple_stocks(
    ticker: List[str] = Query(..., desciption = "多個股票代碼")
):
    try:
        data = fetch_multiple_stock(ticker)
        return data
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))