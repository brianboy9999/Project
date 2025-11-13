import { useState } from 'react';
import { StockList } from '../../../components/stock/StockList/StockList';
import PredictionChart from '../../../components/stock/PredictionChart/PredictionChart';
import { stockService } from '../../../services/stock/stockService';
import type { StockTicker, StockPrediction as StockPredictionType } from '../../../types/stock/stock';
import './StockPrediction.css';

export const StockPrediction = () => {
    const [selectedStock, setSelectedStock] = useState<StockTicker | null>(null);
    const [prediction, setPrediction] = useState<StockPredictionType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [predictionDays, setPredictionDays] = useState<number>(30);
    const [trainingPeriod, setTrainingPeriod] = useState<string>('1y');

    // 處理股票選擇（只允許選擇一支）
    const handleStockSelect = (stocks: StockTicker[]) => {
        if (stocks.length > 0) {
            setSelectedStock(stocks[0]);
            // 重置預測資料
            setPrediction(null);
            setError(null);
        } else {
            setSelectedStock(null);
            setPrediction(null);
        }
    };

    // 載入預測數據
    const loadPrediction = async () => {
        if (!selectedStock) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const predictionData = await stockService.getStockPrediction(
                selectedStock.ticker,
                predictionDays,
                trainingPeriod
            );
            
            if (predictionData.success) {
                setPrediction(predictionData);
            } else {
                setError(predictionData.message || '預測失敗');
            }
        } catch (err) {
            console.error('Error fetching prediction:', err);
            setError('無法載入預測資料，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="stock-prediction-container">
            <div className="prediction-sidebar">
                <StockList 
                    onSelectionChange={handleStockSelect}
                    maxSelection={1}
                />
            </div>

            <div className="prediction-main">
                {!selectedStock ? (
                    <div className="prediction-empty">
                        <div className="empty-icon">🔮</div>
                        <h2>股票價格預測</h2>
                        <p>請從左側列表選擇一支股票開始預測</p>
                        <div className="features-info">
                            <div className="feature-item">
                                <span className="icon">🤖</span>
                                <span>使用機器學習模型預測</span>
                            </div>
                            <div className="feature-item">
                                <span className="icon">📊</span>
                                <span>基於多種技術指標分析</span>
                            </div>
                            <div className="feature-item">
                                <span className="icon">📈</span>
                                <span>顯示歷史趨勢與預測走勢</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="prediction-content">
                        <div className="prediction-header">
                            <div className="stock-info">
                                <h2>{selectedStock.name}</h2>
                                <span className="ticker">{selectedStock.ticker}</span>
                            </div>
                        </div>

                        <div className="prediction-controls">
                            <div className="control-group">
                                <label htmlFor="training-period">訓練數據期間:</label>
                                <select 
                                    id="training-period"
                                    value={trainingPeriod}
                                    onChange={(e) => setTrainingPeriod(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="3mo">3個月</option>
                                    <option value="6mo">6個月</option>
                                    <option value="1y">1年</option>
                                    <option value="2y">2年</option>
                                    <option value="5y">5年</option>
                                </select>
                            </div>

                            <div className="control-group">
                                <label htmlFor="prediction-days">預測天數:</label>
                                <select 
                                    id="prediction-days"
                                    value={predictionDays}
                                    onChange={(e) => setPredictionDays(Number(e.target.value))}
                                    disabled={loading}
                                >
                                    <option value={7}>7天</option>
                                    <option value={14}>14天</option>
                                    <option value={30}>30天</option>
                                    <option value={60}>60天</option>
                                    <option value={90}>90天</option>
                                </select>
                            </div>

                            <button 
                                onClick={loadPrediction}
                                className="predict-button"
                                disabled={loading}
                            >
                                {loading ? '預測中...' : '🔮 開始預測'}
                            </button>

                            {prediction && (
                                <button 
                                    onClick={() => {
                                        setPrediction(null);
                                        setError(null);
                                    }}
                                    className="reset-button"
                                    disabled={loading}
                                >
                                    🔄 重新設定
                                </button>
                            )}
                        </div>

                        {loading && (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>正在分析歷史數據並進行預測...</p>
                                <p className="loading-hint">這可能需要幾秒鐘時間</p>
                            </div>
                        )}

                        {error && (
                            <div className="error-container">
                                <div className="error-icon">⚠️</div>
                                <p>{error}</p>
                            </div>
                        )}

                        {prediction && prediction.success && !loading && (
                            <div className="prediction-result">
                                <PredictionChart prediction={prediction} />
                                
                                <div className="prediction-disclaimer">
                                    <h4>⚠️ 重要聲明</h4>
                                    <ul>
                                        <li>本預測結果僅供參考，不構成投資建議</li>
                                        <li>股市投資有風險，過去表現不代表未來結果</li>
                                        <li>請結合其他分析工具和專業建議做出投資決策</li>
                                        <li>模型準確度受多種因素影響，實際價格可能有較大差異</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
