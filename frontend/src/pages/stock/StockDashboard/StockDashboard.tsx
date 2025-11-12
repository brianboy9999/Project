import { useState, useEffect, Fragment } from 'react';
import { StockList } from '../../../components/stock/StockList/StockList';
import { CandlestickChart } from '../../../components/stock/CandlestickChart/CandlestickChart';
import { CompanyDetail } from '../CompanyDetail/CompanyDetail';
import type { StockTicker, StockData } from '../../../types/stock/stock';
import { stockService } from '../../../services/stock/stockService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TabType = 'dashboard' | 'company-detail' | 'watchlist' | 'portfolio';
type ChartType = 'line' | 'candlestick'; // 新增圖表類型

// 計算預設日期（最近一個月）
const getDefaultDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    return {
        start: startDate.toISOString().split('T')[0], // YYYY-MM-DD 格式
        end: endDate.toISOString().split('T')[0]
    };
};

export const StockDashboard = () => {
    const defaultDates = getDefaultDates();
    
    const [selectedStocks, setSelectedStocks] = useState<StockTicker[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [chartType, setChartType] = useState<ChartType>('line'); // 新增圖表類型狀態
    const [stocksData, setStocksData] = useState<Map<string, StockData>>(new Map());
    const [loading, setLoading] = useState(false);
    
    // 查詢模式：'period' 或 'range'
    const [queryMode, setQueryMode] = useState<'period' | 'range'>('period');
    const [period, setPeriod] = useState('1mo');
    const [startDate, setStartDate] = useState(defaultDates.start);
    const [endDate, setEndDate] = useState(defaultDates.end);

    // 處理股票選擇
    const handleStockSelect = (stock: StockTicker) => {
        setSelectedStocks(prev => {
            const exists = prev.find(s => s.ticker === stock.ticker);
            if (exists) {
                // 如果已選擇，則取消選擇
                return prev.filter(s => s.ticker !== stock.ticker);
            } else {
                // 如果未選擇，則加入選擇
                return [...prev, stock];
            }
        });
    };

    // 當選擇股票或查詢條件改變時，呼叫 API 取得資料
    useEffect(() => {
        if (selectedStocks.length > 0) {
            setLoading(true);
            
            // 為每支股票呼叫 API
            const promises = selectedStocks.map(stock => {
                if (queryMode === 'period') {
                    return stockService.getStock(stock.ticker, period)
                        .then(data => ({ ticker: stock.ticker, data }));
                } else {
                    if (startDate && endDate) {
                        return stockService.getStock(stock.ticker, undefined, startDate, endDate)
                            .then(data => ({ ticker: stock.ticker, data }));
                    }
                    return null;
                }
            }).filter(p => p !== null);

            Promise.all(promises)
                .then(results => {
                    const newDataMap = new Map<string, StockData>();
                    results.forEach(result => {
                        if (result) {
                            newDataMap.set(result.ticker, result.data);
                        }
                    });
                    setStocksData(newDataMap);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching stock data:', error);
                    setLoading(false);
                });
        } else {
            setStocksData(new Map());
        }
    }, [selectedStocks, queryMode, period, startDate, endDate]);

    const tabs = [
        { id: 'dashboard' as TabType, label: '股票儀表板' },
        { id: 'company-detail' as TabType, label: '公司詳情' },
        { id: 'watchlist' as TabType, label: '關注清單' },
        { id: 'portfolio' as TabType, label: '投資組合' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="dashboard-content">
                        <div className="stock-list-container">
                            <StockList
                                onStockSelect={handleStockSelect}
                            />
                        </div>
                        
                        <div className="stock-detail-container">
                            {/* 查詢設定區 */}
                            <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1976d2' }}>查詢設定</h3>
                                
                                {/* 圖表類型選擇 */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontWeight: 'bold', marginRight: '15px', color: '#333' }}>圖表類型:</label>
                                    <button 
                                        onClick={() => setChartType('line')}
                                        style={{
                                            padding: '8px 20px',
                                            marginRight: '10px',
                                            backgroundColor: chartType === 'line' ? '#1976d2' : 'white',
                                            color: chartType === 'line' ? 'white' : '#333',
                                            border: '1px solid #1976d2',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: chartType === 'line' ? 'bold' : 'normal',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        📈 折線圖
                                    </button>
                                    <button 
                                        onClick={() => setChartType('candlestick')}
                                        style={{
                                            padding: '8px 20px',
                                            backgroundColor: chartType === 'candlestick' ? '#1976d2' : 'white',
                                            color: chartType === 'candlestick' ? 'white' : '#333',
                                            border: '1px solid #1976d2',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: chartType === 'candlestick' ? 'bold' : 'normal',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        🕯️ K線圖
                                    </button>
                                </div>

                                {/* 時間範圍選擇 */}
                                <div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ fontWeight: 'bold', marginRight: '20px', color: '#333' }}>時間範圍:</label>
                                        <label style={{ marginRight: '20px' }}>
                                            <input 
                                                type="radio" 
                                                value="period" 
                                                checked={queryMode === 'period'}
                                                onChange={(e) => setQueryMode(e.target.value as 'period' | 'range')}
                                                style={{ marginRight: '5px' }}
                                            />
                                            快速選擇
                                        </label>
                                        <label>
                                            <input 
                                                type="radio" 
                                                value="range" 
                                                checked={queryMode === 'range'}
                                                onChange={(e) => setQueryMode(e.target.value as 'period' | 'range')}
                                                style={{ marginRight: '5px' }}
                                            />
                                            自訂日期範圍
                                        </label>
                                    </div>

                                    {queryMode === 'period' ? (
                                        <div style={{ paddingLeft: '20px' }}>
                                            <label>時間區間: </label>
                                            <select 
                                                value={period} 
                                                onChange={(e) => setPeriod(e.target.value)}
                                                style={{ padding: '8px 12px', marginLeft: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                            >
                                                <option value="1d">1天</option>
                                                <option value="5d">5天</option>
                                                <option value="1mo">1個月</option>
                                                <option value="3mo">3個月</option>
                                                <option value="6mo">6個月</option>
                                                <option value="1y">1年</option>
                                                <option value="2y">2年</option>
                                                <option value="5y">5年</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div style={{ paddingLeft: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div>
                                                <label>起始日期: </label>
                                                <input 
                                                    type="date" 
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    style={{ padding: '8px', marginLeft: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                />
                                            </div>
                                            <div>
                                                <label>結束日期: </label>
                                                <input 
                                                    type="date" 
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    style={{ padding: '8px', marginLeft: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 已選股票清單 */}
                            <div style={{ marginBottom: '20px' }}>
                                <h3>已選股票</h3>
                                {selectedStocks.length === 0 ? (
                                    <p style={{ color: '#999' }}>請從左側列表選擇股票</p>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                        {selectedStocks.map(stock => (
                                            <div
                                                key={stock.ticker}
                                                onClick={() => handleStockSelect(stock)}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#1976d2',
                                                    color: 'white',
                                                    borderRadius: '20px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                                            >
                                                <span>{stock.ticker}</span>
                                                <span style={{ fontSize: '12px' }}>✕</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {loading && <p>載入中...</p>}
                                
                                {!loading && selectedStocks.length > 0 && (
                                    <div className="stock-details" style={{ marginTop: '20px' }}>
                                        {chartType === 'line' ? (
                                            <>
                                                {/* 收盤價折線圖 - 多支股票 */}
                                                <div style={{ marginBottom: '30px' }}>
                                                    <h4>收盤價走勢比較</h4>
                                                    <ResponsiveContainer width="100%" height={400}>
                                                        <LineChart margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} />
                                                            <YAxis width={50} />
                                                            <Tooltip />
                                                            <Legend />
                                                            {Array.from(stocksData.entries()).map(([ticker, data], index) => {
                                                                const colors = ['#1976d2', '#ff7300', '#82ca9d', '#ff4444', '#8884d8', '#ffc658'];
                                                                return (
                                                                    <Line 
                                                                        key={ticker}
                                                                        data={data.prices}
                                                                        type="monotone" 
                                                                        dataKey="close" 
                                                                        stroke={colors[index % colors.length]} 
                                                                        name={`${ticker} 收盤價`}
                                                                        strokeWidth={2}
                                                                    />
                                                                );
                                                            })}
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                {/* 成交量折線圖 - 多支股票 */}
                                                <div style={{ marginBottom: '30px' }}>
                                                    <h4>成交量比較</h4>
                                                    <ResponsiveContainer width="100%" height={400}>
                                                        <LineChart margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} />
                                                            <YAxis width={50} />
                                                            <Tooltip />
                                                            <Legend />
                                                            {Array.from(stocksData.entries()).map(([ticker, data], index) => {
                                                                const colors = ['#1976d2', '#ff7300', '#82ca9d', '#ff4444', '#8884d8', '#ffc658'];
                                                                return (
                                                                    <Line 
                                                                        key={ticker}
                                                                        data={data.prices}
                                                                        type="monotone" 
                                                                        dataKey="volume" 
                                                                        stroke={colors[index % colors.length]} 
                                                                        name={`${ticker} 成交量`}
                                                                        strokeWidth={2}
                                                                    />
                                                                );
                                                            })}
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                {/* 高低價折線圖 - 多支股票 */}
                                                <div style={{ marginBottom: '30px' }}>
                                                    <h4>價格範圍（高/低）比較</h4>
                                                    <ResponsiveContainer width="100%" height={400}>
                                                        <LineChart margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} />
                                                            <YAxis width={50} />
                                                            <Tooltip />
                                                            <Legend />
                                                            {Array.from(stocksData.entries()).map(([ticker, data], index) => {
                                                                const colors = ['#1976d2', '#ff7300', '#82ca9d', '#ff4444', '#8884d8', '#ffc658'];
                                                                return (
                                                                    <Fragment key={ticker}>
                                                                        <Line 
                                                                            key={`${ticker}-high`}
                                                                            data={data.prices}
                                                                            type="monotone" 
                                                                            dataKey="high" 
                                                                            stroke={colors[index % colors.length]} 
                                                                            name={`${ticker} 最高價`}
                                                                            strokeDasharray="5 5"
                                                                            strokeWidth={2}
                                                                        />
                                                                        <Line 
                                                                            key={`${ticker}-low`}
                                                                            data={data.prices}
                                                                            type="monotone" 
                                                                            dataKey="low" 
                                                                            stroke={colors[index % colors.length]} 
                                                                            name={`${ticker} 最低價`}
                                                                            strokeDasharray="3 3"
                                                                            strokeWidth={2}
                                                                        />
                                                                    </Fragment>
                                                                );
                                                            })}
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* K線圖 - 每支股票獨立顯示 */}
                                                {Array.from(stocksData.entries()).map(([ticker, data]) => {
                                                    const stockInfo = selectedStocks.find(s => s.ticker === ticker);
                                                    return (
                                                        <div 
                                                            key={ticker} 
                                                            style={{ 
                                                                marginBottom: '40px',
                                                                padding: '20px',
                                                                backgroundColor: '#fafafa',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0'
                                                            }}
                                                        >
                                                            <h3 style={{ 
                                                                marginTop: 0, 
                                                                marginBottom: '15px',
                                                                color: '#1976d2'
                                                            }}>
                                                                {ticker} - {stockInfo?.name || ''}
                                                            </h3>
                                                            <CandlestickChart data={data.prices} height={500} />
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'company-detail':
                return (
                    <div className="tab-content">
                        <CompanyDetail />
                    </div>
                );
            case 'watchlist':
                return (
                    <div className="tab-content">
                        <p>關注清單功能即將推出...</p>
                    </div>
                );
            case 'portfolio':
                return (
                    <div className="tab-content">
                        <p>投資組合功能即將推出...</p>
                    </div>
                );
        }
    };

    return (
        <div className="stock-dashboard">
            <div className="tabs-container" style={{ 
                borderBottom: '2px solid #e0e0e0',
                marginBottom: '20px'
            }}>
                <div className="tabs" style={{ 
                    display: 'flex',
                    gap: '4px'
                }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                            style={{
                                padding: '12px 24px',
                                border: 'none',
                                background: activeTab === tab.id ? '#1976d2' : 'transparent',
                                color: activeTab === tab.id ? '#fff' : '#666',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                borderRadius: '4px 4px 0 0',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== tab.id) {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== tab.id) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {renderTabContent()}
        </div>
    );
};