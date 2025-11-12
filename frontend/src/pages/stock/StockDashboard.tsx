import { useState, useEffect } from 'react';
import { StockList } from '../../components/stock/StockList';
import type { StockTicker, StockData } from '../../types/stock';
import { stockService } from '../../services/stockService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TabType = 'dashboard' | 'watchlist' | 'portfolio' | 'analysis';

export const StockDashboard = () => {
    const [selectedStock, setSelectedStock] = useState<StockTicker | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [stockData, setStockData] = useState<StockData | null>(null);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState('1mo');

    // 當選擇股票時，呼叫 API 取得資料
    useEffect(() => {
        if (selectedStock) {
            setLoading(true);
            stockService.getSingleStock(selectedStock.ticker, period)
                .then(data => {
                    setStockData(data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching stock data:', error);
                    setLoading(false);
                });
        }
    }, [selectedStock, period]);

    const tabs = [
        { id: 'dashboard' as TabType, label: '股票儀表板' },
        { id: 'watchlist' as TabType, label: '關注清單' },
        { id: 'portfolio' as TabType, label: '投資組合' },
        { id: 'analysis' as TabType, label: '分析工具' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="dashboard-content">
                        <div className="stock-list-container">
                            <StockList
                                onStockSelect={(stock) => setSelectedStock(stock)}
                            />
                        </div>
                        
                        {selectedStock && (
                            <div className="stock-detail-container">
                                <h3>{selectedStock.ticker} - {selectedStock.name}</h3>
                                
                                {/* 時間區間選擇 */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label>時間區間: </label>
                                    <select 
                                        value={period} 
                                        onChange={(e) => setPeriod(e.target.value)}
                                        style={{ padding: '8px', marginLeft: '10px' }}
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

                                {loading && <p>載入中...</p>}
                                
                                {!loading && stockData && (
                                    <div className="stock-details">
                                        {/* 收盤價折線圖 */}
                                        <div style={{ marginBottom: '30px' }}>
                                            <h4>收盤價走勢</h4>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={stockData.prices} margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis width={50} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="close" stroke="#1976d2" name="收盤價" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* 成交量折線圖 */}
                                        <div style={{ marginBottom: '30px' }}>
                                            <h4>成交量</h4>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={stockData.prices} margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis width={50} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="volume" stroke="#ff7300" name="成交量" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* 高低價折線圖 */}
                                        <div>
                                            <h4>價格範圍（高/低）</h4>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={stockData.prices} margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis width={50} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="high" stroke="#82ca9d" name="最高價" />
                                                    <Line type="monotone" dataKey="low" stroke="#ff4444" name="最低價" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
            case 'analysis':
                return (
                    <div className="tab-content">
                        <p>分析工具功能即將推出...</p>
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