import { useEffect, useState } from 'react';
import type { StockTicker } from '../../types/stock';
import { stockService } from '../../services/stockService';

interface StockListProps {
    onStockSelect?: (stock: StockTicker) => void;
}

export const StockList = ({ onStockSelect }: StockListProps) => {
    const [stocks, setStocks] = useState<StockTicker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const response = await stockService.getStockList();
                setStocks(response.data);
                setError(null);
            } catch (err) {
                setError('無法載入股票列表');
                console.error('Error fetching stocks:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStocks();
    }, []);

    // 篩選股票
    const filteredStocks = stocks.filter(stock => 
        stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="stock-list" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 搜尋欄固定在上方 */}
            <div className="search-container" style={{ flexShrink: 0, marginBottom: '12px' }}>
                <input
                    type="text"
                    placeholder="搜尋股票代碼或公司名稱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '14px' }}
                />
            </div>
            
            {/* 下拉選單區域 - 可滾動 */}
            <div className="stock-dropdown" style={{ flex: 1, overflow: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                {loading ? (
                    <div className="loading" style={{ padding: '20px', textAlign: 'center' }}>載入中...</div>
                ) : error ? (
                    <div className="error" style={{ padding: '20px', color: '#d32f2f' }}>{error}</div>
                ) : (
                    <div className="stock-grid">
                        {filteredStocks.map((stock) => (
                            <div
                                key={stock.ticker}
                                className="stock-item"
                                onClick={() => onStockSelect?.(stock)}
                                role="button"
                                tabIndex={0}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #eee',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{stock.ticker}</h3>
                                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{stock.name}</p>
                            </div>
                        ))}
                        {filteredStocks.length === 0 && (
                            <div className="no-results" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                找不到符合「{searchTerm}」的股票
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};