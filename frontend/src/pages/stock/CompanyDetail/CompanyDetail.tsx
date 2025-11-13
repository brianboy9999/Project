import { useState, useEffect } from 'react';
import { StockList } from '../../../components/stock/StockList/StockList';
import { stockService } from '../../../services/stock/stockService';
import type { CompanyDetail as CompanyDetailType, StockTicker } from '../../../types/stock/stock';
import './CompanyDetail.css';

export const CompanyDetail = () => {
    const [selectedStock, setSelectedStock] = useState<StockTicker | null>(null);
    const [companyData, setCompanyData] = useState<CompanyDetailType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 處理股票選擇（只允許選擇一支）
    const handleStockSelect = (stocks: StockTicker[]) => {
        if (stocks.length > 0) {
            // 只取第一支股票
            setSelectedStock(stocks[0]);
        } else {
            setSelectedStock(null);
        }
    };

    useEffect(() => {
        if (selectedStock) {
            setLoading(true);
            setError(null);
            
            stockService.getCompanyDetail(selectedStock.ticker)
                .then(data => {
                    setCompanyData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching company detail:', err);
                    setError('無法載入公司資料');
                    setLoading(false);
                });
        } else {
            setCompanyData(null);
        }
    }, [selectedStock]);

    if (!selectedStock) {
        return (
            <div className="company-detail-container">
                <div className="company-stock-list">
                    <StockList 
                        onSelectionChange={handleStockSelect}
                        maxSelection={1}
                    />
                </div>
                <div className="company-detail-empty">
                    <p>請從左側列表選擇一間公司以查看詳細資訊</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="company-detail-container">
                <div className="company-stock-list">
                    <StockList 
                        onSelectionChange={handleStockSelect}
                        maxSelection={1}
                    />
                </div>
                <div className="company-detail-loading">載入中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="company-detail-container">
                <div className="company-stock-list">
                    <StockList 
                        onSelectionChange={handleStockSelect}
                        maxSelection={1}
                    />
                </div>
                <div className="company-detail-error">{error}</div>
            </div>
        );
    }

    if (!companyData) {
        return null;
    }

    const { info, news, financials, balance_sheet } = companyData;

    // 格式化市值
    const formatMarketCap = (value?: number) => {
        if (!value) return 'N/A';
        if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        return `$${value.toLocaleString()}`;
    };

    // 格式化數字
    const formatNumber = (value?: number) => {
        if (!value) return 'N/A';
        return value.toLocaleString();
    };

    return (
        <div className="company-detail-container">
            <div className="company-stock-list">
                <StockList 
                    onSelectionChange={handleStockSelect}
                    maxSelection={1}
                />
            </div>
            <div className="company-detail">
                <h2>{info.name} ({info.ticker})</h2>

            {/* 基本資訊 */}
            <section className="info-section">
                <h3>基本資訊</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <label>產業</label>
                        <span>{info.sector || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>行業</label>
                        <span>{info.industry || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>市值</label>
                        <span>{formatMarketCap(info.market_cap)}</span>
                    </div>
                    <div className="info-item">
                        <label>員工數</label>
                        <span>{formatNumber(info.employees)}</span>
                    </div>
                    <div className="info-item">
                        <label>CEO</label>
                        <span>{info.ceo || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>總部</label>
                        <span>{[info.city, info.state, info.country].filter(Boolean).join(', ') || 'N/A'}</span>
                    </div>
                    {info.website && (
                        <div className="info-item full-width">
                            <label>網站</label>
                            <a href={info.website} target="_blank" rel="noopener noreferrer">{info.website}</a>
                        </div>
                    )}
                </div>
                {info.description && (
                    <div className="description">
                        <h4>公司簡介</h4>
                        <p>{info.description}</p>
                    </div>
                )}
            </section>

            {/* 最新新聞 */}
            <section className="news-section">
                <h3>最新新聞</h3>
                {news && news.length > 0 ? (
                    <div className="news-list">
                        {news.map((item, index) => (
                            <div key={index} className="news-item">
                                {item.thumbnail && (
                                    <img src={item.thumbnail} alt={item.title} className="news-thumbnail" />
                                )}
                                <div className="news-content">
                                    <h4>
                                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                                            {item.title}
                                        </a>
                                    </h4>
                                    <div className="news-meta">
                                        <span className="publisher">{item.publisher}</span>
                                        {item.published_at && (
                                            <span className="date">{new Date(item.published_at).toLocaleString('zh-TW')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>暫無新聞</p>
                )}
            </section>

            {/* 財務報表 */}
            {financials && Object.keys(financials.data).length > 0 && (
                <section className="financials-section">
                    <h3>損益表（最近年度）</h3>
                    <div className="financials-table-container">
                        <table className="financials-table">
                            <thead>
                                <tr>
                                    <th>項目</th>
                                    {Object.keys(financials.data).slice(0, 4).map(date => (
                                        <th key={date}>{date}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* 取得所有財務項目 */}
                                {(() => {
                                    const firstDate = Object.keys(financials.data)[0];
                                    const items = Object.keys(financials.data[firstDate] || {});
                                    return items.slice(0, 10).map(item => (
                                        <tr key={item}>
                                            <td>{item}</td>
                                            {Object.keys(financials.data).slice(0, 4).map(date => (
                                                <td key={date}>
                                                    {financials.data[date][item] !== null 
                                                        ? financials.data[date][item]?.toLocaleString() 
                                                        : 'N/A'}
                                                </td>
                                            ))}
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* 資產負債表 */}
            {balance_sheet && Object.keys(balance_sheet.data).length > 0 && (
                <section className="balance-sheet-section">
                    <h3>資產負債表（最近年度）</h3>
                    <div className="financials-table-container">
                        <table className="financials-table">
                            <thead>
                                <tr>
                                    <th>項目</th>
                                    {Object.keys(balance_sheet.data).slice(0, 4).map(date => (
                                        <th key={date}>{date}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const firstDate = Object.keys(balance_sheet.data)[0];
                                    const items = Object.keys(balance_sheet.data[firstDate] || {});
                                    return items.slice(0, 10).map(item => (
                                        <tr key={item}>
                                            <td>{item}</td>
                                            {Object.keys(balance_sheet.data).slice(0, 4).map(date => (
                                                <td key={date}>
                                                    {balance_sheet.data[date][item] !== null 
                                                        ? balance_sheet.data[date][item]?.toLocaleString() 
                                                        : 'N/A'}
                                                </td>
                                            ))}
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
            </div>
        </div>
    );
};
