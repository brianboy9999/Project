"""
股票相關的資料模型
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class StockPrice(BaseModel):
    """單日股價資料"""
    date: str
    open: float
    high: float
    low: float
    close: float
    adj_close: float
    volume: int


class StockData(BaseModel):
    """股票歷史價格資料"""
    ticker: str
    name: str
    prices: List[StockPrice]


class CompanyInfo(BaseModel):
    """公司基本資訊"""
    ticker: str
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    employees: Optional[int] = None
    website: Optional[str] = None
    description: Optional[str] = None
    ceo: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class NewsItem(BaseModel):
    """新聞項目"""
    title: str
    publisher: str
    link: str
    published_at: Optional[str] = None
    thumbnail: Optional[str] = None


class FinancialData(BaseModel):
    """財務數據（以字典形式存儲，因為欄位名稱是動態的）"""
    data: Dict[str, Any]  # key 是日期，value 是該日期的財務數據


class CompanyDetail(BaseModel):
    """公司詳細資訊（包含基本資訊、新聞、財務報表）"""
    info: CompanyInfo
    news: List[NewsItem]
    financials: Optional[FinancialData] = None
    balance_sheet: Optional[FinancialData] = None


class PredictionPoint(BaseModel):
    """單一預測點"""
    date: str
    predicted_price: float
    confidence: float  # 0-1 之間，表示預測信心度


class HistoricalPoint(BaseModel):
    """歷史數據點（含技術指標）"""
    date: str
    actual_price: float
    ma5: Optional[float] = None
    ma10: Optional[float] = None
    ma20: Optional[float] = None


class PredictionMetrics(BaseModel):
    """預測模型評估指標"""
    r2_score: float  # R² 決定係數
    training_samples: int  # 訓練樣本數
    model_type: str  # 模型類型


class StockPrediction(BaseModel):
    """股價預測結果"""
    success: bool
    ticker: Optional[str] = None
    predictions: List[PredictionPoint] = []
    historical_data: List[HistoricalPoint] = []
    metrics: Optional[PredictionMetrics] = None
    current_price: Optional[float] = None
    last_update: Optional[str] = None
    message: Optional[str] = None  # 錯誤訊息或提示
