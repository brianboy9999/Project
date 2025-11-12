import pandas as pd
import yfinance as yf
from data.models import StockData, StockPrice

def get_single_stock(ticker: str, period: str = "1mo") -> StockData:
    try:
        # 下載股票資料
        stock = yf.Ticker(ticker)
        data = stock.history(period=period)
        
        if data.empty:
            raise ValueError(f"No data found for {ticker}")
        
        # 將 DataFrame 轉換成 StockPrice 列表
        prices = []
        for date, row in data.iterrows():
            price = StockPrice(
                date=date.strftime('%Y-%m-%d'),
                open=float(row['Open']),
                high=float(row['High']),
                low=float(row['Low']),
                close=float(row['Close']),
                adj_close=float(row['Close']),  # yfinance history 已經是調整後的價格
                volume=int(row['Volume'])
            )
            prices.append(price)
        
        # 取得股票名稱
        info = stock.info
        name = info.get('longName', ticker)
        
        return StockData(ticker=ticker, name=name, prices=prices)
    except Exception as e:
        raise RuntimeError(f"Error fetching {ticker}: {e}")

def get_multiple_stock(ticker:str, start = None, end = None) -> pd.DataFrame:
    try:
        data = yf.download(ticker, start = start, end = end, group_by = "ticker")
        return data
    except Exception as e:
        raise RuntimeError(f"Error fetching multiple tickers: {e}")