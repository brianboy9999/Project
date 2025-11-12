import { useEffect, useState } from 'react';
import type { StockTicker } from '../../../types/stock/stock';
import { stockService } from '../../../services/stock/stockService';

interface StockListProps {
    onStockSelect?: (stock: StockTicker) => void;
    onSelectionChange?: (stocks: StockTicker[]) => void;
    maxSelection?: number; // 最多可選幾支，undefined 表示無限制
}

export const StockList = ({ onStockSelect, onSelectionChange, maxSelection }: StockListProps) => {
    const [stocks, setStocks] = useState<StockTicker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStocks, setSelectedStocks] = useState<StockTicker[]>([]);

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

    // 處理股票點擊
    const handleStockClick = (stock: StockTicker) => {
        if (onSelectionChange) {
            // 多選模式
            const isSelected = selectedStocks.some(s => s.ticker === stock.ticker);
            let newSelection: StockTicker[];

            if (isSelected) {
                // 取消選擇
                newSelection = selectedStocks.filter(s => s.ticker !== stock.ticker);
            } else {
                // 新增選擇
                if (maxSelection === 1) {
                    // 單選模式：直接替換
                    newSelection = [stock];
                } else if (maxSelection && selectedStocks.length >= maxSelection) {
                    // 達到上限：不做任何事
                    return;
                } else {
                    // 加入選擇
                    newSelection = [...selectedStocks, stock];
                }
            }

            setSelectedStocks(newSelection);
            onSelectionChange(newSelection);
        } else if (onStockSelect) {
            // 舊版單選模式（向後兼容）
            onStockSelect(stock);
        }
    };

    // 檢查股票是否被選中
    const isStockSelected = (stock: StockTicker) => {
        return selectedStocks.some(s => s.ticker === stock.ticker);
    };

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
                        {filteredStocks.map((stock) => {
                            const selected = isStockSelected(stock);
                            return (
                                <div
                                    key={stock.ticker}
                                    className="stock-item"
                                    onClick={() => handleStockClick(stock)}
                                    role="button"
                                    tabIndex={0}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #eee',
                                        transition: 'background-color 0.2s',
                                        backgroundColor: selected ? '#e3f2fd' : 'transparent',
                                        borderLeft: selected ? '4px solid #1976d2' : '4px solid transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!selected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!selected) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{stock.ticker}</h3>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{stock.name}</p>
                                </div>
                            );
                        })}
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