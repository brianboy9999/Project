import pandas as pd
import yfinance as yf

# 取得股票公司清單
def get_all_nasdaq_tickers() -> pd.DataFrame:
    nasdaq_url = "https://ftp.nasdaqtrader.com/dynamic/SymDir/nasdaqtraded.txt"
    df = pd.read_csv(nasdaq_url, sep="|")
    df = df[df["Test Issue"] == "N"][["Symbol", "Security Name"]]
    df = df.dropna()
    df = df.rename(columns={"Symbol": "ticker", "Security Name": "name"})
    return df

def get_single_stock(ticker: str, period: str = "1mo") -> pd.DataFrame:
    try:
        data = yf.download(ticker, period = period)
        if data.empty:
            raise ValueError(f"No data found for {ticker}")
        return data
    except Exception as e:
        raise RuntimeError(f"Error fetching {ticker}: {e}")

def get_multiple_stock(ticker:str, start = None, end = None) -> pd.DataFrame:
    try:
        data = yf.download(ticker, start = start, end = end, group_by = "ticker")
        return data
    except Exception as e:
        raise RuntimeError(f"Error fetching multiple tickers: {e}")