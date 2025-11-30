import { useState } from 'react';
import { StockList } from '../../../components/stock/StockList/StockList';
import PredictionChart from '../../../components/stock/PredictionChart/PredictionChart';
import ModelComparisonChart from '../../../components/stock/ModelComparisonChart/ModelComparisonChart';
import ModelComparisonTable from '../../../components/stock/ModelComparisonTable/ModelComparisonTable';
import BacktestChart from '../../../components/stock/BacktestChart/BacktestChart';
import BacktestMetrics from '../../../components/stock/BacktestMetrics/BacktestMetrics';
import TradingSignalPanelCompact from '../../../components/stock/TradingSignalPanel/TradingSignalPanelCompact';
import { stockService, type ModelType } from '../../../services/stock/stockService';
import type { StockTicker, StockPrediction as StockPredictionType } from '../../../types/stock/stock';
import './StockPrediction.css';

interface ComparisonData {
    success: boolean;
    ticker: string;
    days: number;
    period: string;
    comparisons: {
        [modelName: string]: {
            success: boolean;
            predictions?: Array<{
                date: string;
                predicted_price: number;
                confidence: number;
            }>;
            historical_data?: Array<{
                date: string;
                actual_price: number;
                ma5?: number | null;
                ma10?: number | null;
                ma20?: number | null;
            }>;
            current_price?: number;
            metrics?: any;
            elapsed_time?: number;
        };
    };
    summary: {
        [modelName: string]: {
            success: boolean;
            r2_score?: number;
            elapsed_time?: number;
            predicted_change?: number;
            predicted_price?: number;
            current_price?: number;
            model_description?: string;
            training_samples?: number;
            error?: string;
        };
    };
    best_model: {
        by_accuracy?: string;
        by_speed?: string;
        by_overall?: string;
    };
}

export const StockPrediction = () => {
    const [selectedStock, setSelectedStock] = useState<StockTicker | null>(null);
    const [prediction, setPrediction] = useState<StockPredictionType | null>(null);
    const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
    const [backtestData, setBacktestData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [backtestLoading, setBacktestLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [predictionDays, setPredictionDays] = useState<number>(30);
    const [trainingPeriod, setTrainingPeriod] = useState<string>('1y');
    const [modelType, setModelType] = useState<ModelType>('random_forest');
    const [activeTab, setActiveTab] = useState<'prediction' | 'comparison' | 'backtest'>('prediction');

    // 處理股票選擇（只允許選擇一支）
    const handleStockSelect = (stocks: StockTicker[]) => {
        if (stocks.length > 0) {
            setSelectedStock(stocks[0]);
            // 重置預測資料
            setPrediction(null);
            setComparisonData(null);
            setBacktestData(null);
            setError(null);
            setActiveTab('prediction');
        } else {
            setSelectedStock(null);
            setPrediction(null);
            setComparisonData(null);
            setBacktestData(null);
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
                trainingPeriod,
                modelType
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

    // 載入模型比較數據
    const loadComparison = async () => {
        if (!selectedStock) return;
        
        setComparisonLoading(true);
        setError(null);
        
        try {
            const data = await stockService.compareModels(
                selectedStock.ticker,
                predictionDays,
                trainingPeriod,
                ['linear', 'random_forest', 'lstm']
            );
            
            if (data.success) {
                setComparisonData(data);
            } else {
                setError('模型比較失敗');
            }
        } catch (err) {
            console.error('Error comparing models:', err);
            setError('無法載入模型比較資料，請稍後再試');
        } finally {
            setComparisonLoading(false);
        }
    };

    // 載入回測數據
    const loadBacktest = async () => {
        if (!selectedStock) return;
        
        setBacktestLoading(true);
        setError(null);
        
        try {
            const data = await stockService.compareBacktest(
                selectedStock.ticker,
                predictionDays,
                trainingPeriod,
                ['linear', 'random_forest', 'lstm']
            );
            
            if (data.success) {
                setBacktestData(data);
            } else {
                setError('回測失敗');
            }
        } catch (err) {
            console.error('Error running backtest:', err);
            setError('無法載入回測資料，請稍後再試');
        } finally {
            setBacktestLoading(false);
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
                        {/* 交易訊號面板 - 簡化版 */}
                        <TradingSignalPanelCompact ticker={selectedStock.ticker} />
                        
                        <div className="prediction-header">
                            <div className="stock-info">
                                <h2>{selectedStock.name}</h2>
                                <span className="ticker">{selectedStock.ticker}</span>
                            </div>
                        </div>

                        {/* 標籤頁選擇器 */}
                        <div className="tab-selector">
                            <button 
                                className={`tab-btn ${activeTab === 'prediction' ? 'active' : ''}`}
                                onClick={() => setActiveTab('prediction')}
                                disabled={loading || comparisonLoading || backtestLoading}
                            >
                                🤖 AI預測
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
                                onClick={() => setActiveTab('comparison')}
                                disabled={loading || comparisonLoading || backtestLoading}
                            >
                                ⚖️ 模型比較
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'backtest' ? 'active' : ''}`}
                                onClick={() => setActiveTab('backtest')}
                                disabled={loading || comparisonLoading || backtestLoading}
                            >
                                🔬 回測驗證
                            </button>
                        </div>

                        {/* AI預測標籤 */}
                        {activeTab === 'prediction' && (
                            <div className="tab-content">
                                <div className="prediction-controls">
                                    <div className="control-group">
                                        <label htmlFor="model-type">預測模型:</label>
                                        <select 
                                            id="model-type"
                                            value={modelType}
                                            onChange={(e) => setModelType(e.target.value as ModelType)}
                                            disabled={loading}
                                        >
                                            <option value="linear">⚡ 線性回歸 (最快)</option>
                                            <option value="random_forest">🌲 隨機森林 (推薦)</option>
                                            <option value="lstm">🧠 LSTM 神經網絡 (最準)</option>
                                        </select>
                                    </div>

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

                        {/* 模型比較標籤 */}
                        {activeTab === 'comparison' && (
                            <div className="tab-content">
                                <div className="prediction-controls">
                                    <div className="control-group">
                                        <label htmlFor="comparison-training-period">訓練數據期間:</label>
                                        <select 
                                            id="comparison-training-period"
                                            value={trainingPeriod}
                                            onChange={(e) => setTrainingPeriod(e.target.value)}
                                            disabled={comparisonLoading}
                                        >
                                            <option value="3mo">3個月</option>
                                            <option value="6mo">6個月</option>
                                            <option value="1y">1年</option>
                                            <option value="2y">2年</option>
                                            <option value="5y">5年</option>
                                        </select>
                                    </div>

                                    <div className="control-group">
                                        <label htmlFor="comparison-days">預測天數:</label>
                                        <select 
                                            id="comparison-days"
                                            value={predictionDays}
                                            onChange={(e) => setPredictionDays(Number(e.target.value))}
                                            disabled={comparisonLoading}
                                        >
                                            <option value={7}>7天</option>
                                            <option value={14}>14天</option>
                                            <option value={30}>30天</option>
                                            <option value={60}>60天</option>
                                            <option value={90}>90天</option>
                                        </select>
                                    </div>

                                    <button 
                                        onClick={loadComparison}
                                        className="compare-button"
                                        disabled={comparisonLoading}
                                    >
                                        {comparisonLoading ? '比較中...' : '⚖️ 比較所有模型'}
                                    </button>

                                    {comparisonData && (
                                        <button 
                                            onClick={() => {
                                                setComparisonData(null);
                                                setError(null);
                                            }}
                                            className="reset-button"
                                            disabled={comparisonLoading}
                                        >
                                            🔄 重新設定
                                        </button>
                                    )}
                                </div>

                                {comparisonLoading && (
                                    <div className="loading-container">
                                        <div className="loading-spinner"></div>
                                        <p>正在並行執行所有模型進行比較...</p>
                                        <p className="loading-hint">這可能需要 15-30 秒時間，請耐心等待</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="error-container">
                                        <div className="error-icon">⚠️</div>
                                        <p>{error}</p>
                                    </div>
                                )}

                                {comparisonData && comparisonData.success && !comparisonLoading && (
                                    <div className="comparison-result">
                                        <h3>📊 模型比較結果</h3>
                                        
                                        <ModelComparisonChart 
                                            comparisonData={comparisonData}
                                        />
                                        
                                        <ModelComparisonTable 
                                            summary={comparisonData.summary}
                                            bestModel={comparisonData.best_model}
                                        />
                                        
                                        <div className="prediction-disclaimer">
                                            <h4>⚠️ 重要聲明</h4>
                                            <ul>
                                                <li>本預測結果僅供參考，不構成投資建議</li>
                                                <li>不同模型有不同的優缺點，請根據具體情況選擇</li>
                                                <li>準確度指標 (R²) 越高表示模型越能解釋數據變化</li>
                                                <li>股市投資有風險，過去表現不代表未來結果</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 回測驗證標籤 */}
                        {activeTab === 'backtest' && (
                            <div className="tab-content">
                                <div className="prediction-controls">
                                    <div className="control-group">
                                        <label htmlFor="backtest-training-period">訓練數據期間:</label>
                                        <select 
                                            id="backtest-training-period"
                                            value={trainingPeriod}
                                            onChange={(e) => setTrainingPeriod(e.target.value)}
                                            disabled={backtestLoading}
                                        >
                                            <option value="3mo">3個月</option>
                                            <option value="6mo">6個月</option>
                                            <option value="1y">1年</option>
                                            <option value="2y">2年</option>
                                            <option value="5y">5年</option>
                                        </select>
                                    </div>

                                    <div className="control-group">
                                        <label htmlFor="backtest-days">回測天數:</label>
                                        <select 
                                            id="backtest-days"
                                            value={predictionDays}
                                            onChange={(e) => setPredictionDays(Number(e.target.value))}
                                            disabled={backtestLoading}
                                        >
                                            <option value={7}>7天</option>
                                            <option value={14}>14天</option>
                                            <option value={30}>30天</option>
                                            <option value={60}>60天</option>
                                            <option value={90}>90天</option>
                                        </select>
                                    </div>

                                    <button 
                                        onClick={loadBacktest}
                                        className="backtest-button"
                                        disabled={backtestLoading}
                                    >
                                        {backtestLoading ? '回測中...' : '📊 模型回測'}
                                    </button>

                                    {backtestData && (
                                        <button 
                                            onClick={() => {
                                                setBacktestData(null);
                                                setError(null);
                                            }}
                                            className="reset-button"
                                            disabled={backtestLoading}
                                        >
                                            🔄 重新設定
                                        </button>
                                    )}
                                </div>

                                {backtestLoading && (
                                    <div className="loading-container">
                                        <div className="loading-spinner"></div>
                                        <p>正在執行歷史回測驗證...</p>
                                        <p className="loading-hint">這可能需要 20-40 秒時間，請耐心等待</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="error-container">
                                        <div className="error-icon">⚠️</div>
                                        <p>{error}</p>
                                    </div>
                                )}

                                {backtestData && backtestData.success && !backtestLoading && (
                                    <div className="backtest-result">
                                        <h3>🔬 模型回測驗證</h3>
                                        
                                        {Object.entries(backtestData.results).map(([modelName, result]: [string, any]) => (
                                            result.success && (
                                                <BacktestChart 
                                                    key={modelName}
                                                    backtestResult={result}
                                                />
                                            )
                                        ))}
                                        
                                        <BacktestMetrics 
                                            results={backtestData.results}
                                            bestModel={backtestData.best_model}
                                        />
                                        
                                        <div className="prediction-disclaimer">
                                            <h4>⚠️ 重要聲明</h4>
                                            <ul>
                                                <li>回測結果基於歷史數據，僅供參考，不構成投資建議</li>
                                                <li>過去的表現不代表未來的結果，實際市場可能有不同表現</li>
                                                <li>回測使用歷史數據驗證模型準確度，幫助了解模型的可靠性</li>
                                                <li>建議結合多種分析方法和專業建議做出投資決策</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
