from pydantic import BaseModel
from typing import List

class StockPrice(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    adj_close: float
    volume: int

class StockData(BaseModel):
    ticker: str
    name: str
    prices: List[StockPrice]
