import pandas as pd
import yfinance as yf
from data.stock.stock_models import StockData, StockPrice, CompanyDetail, CompanyInfo, NewsItem, FinancialData
from typing import Optional
from datetime import datetime, timedelta

def get_stock(
    ticker: str, 
    period: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None
) -> StockData:
    try:
        # 下載股票資料
        stock = yf.Ticker(ticker)
        
        # 優先使用日期範圍，其次使用 period
        if start and end:
            # 將結束日期加一天，確保包含當天的資料
            end_date = datetime.strptime(end, '%Y-%m-%d') + timedelta(days=1)
            data = stock.history(start=start, end=end_date.strftime('%Y-%m-%d'))
        elif period:
            data = stock.history(period=period)
        else:
            # 預設為 1 個月
            data = stock.history(period="1mo")
        
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

def get_company_detail(ticker: str) -> CompanyDetail:
    """獲取公司詳細資訊，包含基本資訊、新聞、財務報表"""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # 1. 基本資訊
        company_info = CompanyInfo(
            ticker=ticker,
            name=info.get('longName', ticker),
            sector=info.get('sector'),
            industry=info.get('industry'),
            market_cap=info.get('marketCap'),
            employees=info.get('fullTimeEmployees'),
            website=info.get('website'),
            description=info.get('longBusinessSummary'),
            ceo=info.get('companyOfficers', [{}])[0].get('name') if info.get('companyOfficers') else None,
            city=info.get('city'),
            state=info.get('state'),
            country=info.get('country')
        )
        
        # 2. 新聞
        news_list = []
        try:
            news_data = stock.news
            for item in news_data[:10]:  # 只取前 10 則新聞
                # yfinance 的新聞格式已改變，資料在 content 物件中
                content = item.get('content', {})
                
                # 取得縮圖 URL
                thumbnail_url = None
                thumbnail = content.get('thumbnail', {})
                if thumbnail and 'resolutions' in thumbnail:
                    resolutions = thumbnail.get('resolutions', [])
                    if resolutions:
                        # 使用第一個解析度的圖片
                        thumbnail_url = resolutions[0].get('url')
                
                # 取得發布者
                provider = content.get('provider', {})
                publisher = provider.get('displayName', '')
                
                # 取得連結
                canonical_url = content.get('canonicalUrl', {})
                link = canonical_url.get('url', '')
                
                news_item = NewsItem(
                    title=content.get('title', ''),
                    publisher=publisher,
                    link=link,
                    published_at=content.get('pubDate', ''),
                    thumbnail=thumbnail_url
                )
                news_list.append(news_item)
        except Exception as e:
            print(f"Error fetching news: {e}")
            import traceback
            traceback.print_exc()
            news_list = []
        
        # 3. 財務報表（損益表）
        financials_data = None
        try:
            financials_df = stock.financials
            if not financials_df.empty:
                # 將 DataFrame 轉換成字典格式
                financials_dict = financials_df.to_dict()
                # 將日期轉換成字串
                formatted_dict = {}
                for date, values in financials_dict.items():
                    date_str = date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date)
                    formatted_dict[date_str] = {k: (float(v) if pd.notna(v) else None) for k, v in values.items()}
                financials_data = FinancialData(data=formatted_dict)
        except Exception as e:
            print(f"Error fetching financials: {e}")
        
        # 4. 資產負債表
        balance_sheet_data = None
        try:
            balance_sheet_df = stock.balance_sheet
            if not balance_sheet_df.empty:
                balance_sheet_dict = balance_sheet_df.to_dict()
                formatted_dict = {}
                for date, values in balance_sheet_dict.items():
                    date_str = date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date)
                    formatted_dict[date_str] = {k: (float(v) if pd.notna(v) else None) for k, v in values.items()}
                balance_sheet_data = FinancialData(data=formatted_dict)
        except Exception as e:
            print(f"Error fetching balance sheet: {e}")
        
        return CompanyDetail(
            info=company_info,
            news=news_list,
            financials=financials_data,
            balance_sheet=balance_sheet_data
        )
    except Exception as e:
        raise RuntimeError(f"Error fetching company detail for {ticker}: {e}")