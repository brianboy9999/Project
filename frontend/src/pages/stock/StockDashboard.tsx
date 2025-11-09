import { useState } from 'react';
import { StockList } from '../../components/stock/StockList';
import type { StockTicker } from '../../types/stock';

export const StockDashboard = () => {
    const [selectedStock, setSelectedStock] = useState<StockTicker | null>(null);

    return (
        <div className="stock-dashboard">
            <div className="dashboard-header">
                <h2>股票儀表板</h2>
                <div className="dashboard-controls">
                    <input
                        type="text"
                        placeholder="搜尋股票..."
                        className="search-input"
                    />
                </div>
            </div>
            
            <div className="dashboard-content">
                <div className="stock-list-container">
                    <StockList
                        onStockSelect={(stock) => setSelectedStock(stock)}
                    />
                </div>
                
                {selectedStock && (
                    <div className="stock-detail-container">
                        <h3>{selectedStock.symbol} - {selectedStock.name}</h3>
                        <div className="stock-details">
                            {/* 這裡之後會加入更多的股票詳細資訊組件 */}
                            <p>詳細資訊即將推出...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};