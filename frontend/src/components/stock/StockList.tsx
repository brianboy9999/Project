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

    if (loading) {
        return <div>載入中...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="stock-list">
            <h2>股票列表</h2>
            <div className="stock-grid">
                {stocks.map((stock) => (
                    <div
                        key={stock.ticker}
                        className="stock-item"
                        onClick={() => onStockSelect?.(stock)}
                        role="button"
                        tabIndex={0}
                    >
                        <h3>{stock.ticker}</h3>
                        <p>{stock.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};