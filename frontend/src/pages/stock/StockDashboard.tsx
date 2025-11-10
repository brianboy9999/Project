import { useState } from 'react';
import { StockList } from '../../components/stock/StockList';
import type { StockTicker } from '../../types/stock';

type TabType = 'dashboard' | 'watchlist' | 'portfolio' | 'analysis';

export const StockDashboard = () => {
    const [selectedStock, setSelectedStock] = useState<StockTicker | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');

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
                                <div className="stock-details">
                                    {/* 這裡之後會加入更多的股票詳細資訊組件 */}
                                    <p>詳細資訊即將推出...</p>
                                </div>
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