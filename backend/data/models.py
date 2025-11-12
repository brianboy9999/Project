"""
資料模型 - 為了向後兼容而保留
建議使用 data.stock_models 或直接從 data 導入
"""
# 為了向後兼容，從 stock_models 重新導出所有模型
from .stock_models import (
    StockPrice,
    StockData,
    CompanyInfo,
    NewsItem,
    FinancialData,
    CompanyDetail
)

__all__ = [
    'StockPrice',
    'StockData',
    'CompanyInfo',
    'NewsItem',
    'FinancialData',
    'CompanyDetail'
]
