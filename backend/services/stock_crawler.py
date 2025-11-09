import pandas as pd
import yfinance as yf

# 取得股票公司清單
def get_all_nasdaq_tickers():
    try:
        # 從 NASDAQ 網站獲取股票清單
        df_nasdaq = pd.read_html('https://www.nasdaq.com/market-activity/stocks/screener')[0]
        
        # 處理和清理數據
        df = df_nasdaq[['Symbol', 'Name']]
        df = df.rename(columns={
            'Symbol': 'ticker',
            'Name': 'name'
        })
        
        # 移除任何空值並確保數據乾淨
        df = df.dropna()
        df = df[df['ticker'].str.len() <= 5]  # 通常股票代碼不會超過 5 個字符
        
        # 移除任何特殊字符
        df['ticker'] = df['ticker'].str.strip()
        df['name'] = df['name'].str.strip()
        
        # 只保留普通股票（排除特殊證券）
        df = df[~df['ticker'].str.contains(r'[\^\$\.]')]
        
        print(f"成功獲取 {len(df)} 支股票資訊")
        return df.to_dict('records')
    except Exception as e:
        print(f"爬取股票列表時發生錯誤: {str(e)}")
        # 如果爬取失敗，嘗試使用 yfinance 的方法
        try:
            print("嘗試使用 yfinance 獲取主要股票列表...")
            # 獲取主要指數成分股
            indices = ['^GSPC']  # S&P 500
            stocks = []
            
            for index in indices:
                try:
                    index_ticker = yf.Ticker(index)
                    # 獲取指數成分股
                    if hasattr(index_ticker, 'components'):
                        for symbol in index_ticker.components:
                            try:
                                stock = yf.Ticker(symbol)
                                info = stock.info
                                stocks.append({
                                    'ticker': symbol,
                                    'name': info.get('longName', info.get('shortName', symbol))
                                })
                            except:
                                continue
                except:
                    continue
            
            if not stocks:
                # 如果還是無法獲取，返回一些主要的股票作為備選
                stocks = [
                    {"ticker": "AAPL", "name": "Apple Inc."},
                    {"ticker": "MSFT", "name": "Microsoft Corporation"},
                    {"ticker": "GOOGL", "name": "Alphabet Inc."},
                    {"ticker": "AMZN", "name": "Amazon.com Inc."},
                    # ... 其他主要股票 ...
                ]
            
            print(f"成功獲取 {len(stocks)} 支股票資訊")
            return stocks
            
        except Exception as inner_e:
            print(f"備用方法也失敗: {str(inner_e)}")
            raise RuntimeError(f"無法獲取股票列表: {str(e)} -> {str(inner_e)}")

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