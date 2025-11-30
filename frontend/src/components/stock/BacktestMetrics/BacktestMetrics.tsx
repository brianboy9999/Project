import React from 'react';
import './BacktestMetrics.css';

interface BacktestMetrics {
  mape: number;
  rmse: number;
  mae: number;
  direction_accuracy: number;
  win_rate: number;
  predicted_change: number;
  actual_change: number;
  total_predictions: number;
  max_error: number;
  min_error: number;
}

interface BacktestResult {
  success: boolean;
  ticker: string;
  model_type: string;
  backtest_days: number;
  metrics: BacktestMetrics;
}

interface Props {
  results: {
    [modelName: string]: BacktestResult;
  };
  bestModel: {
    by_direction?: string;
    by_accuracy?: string;
    by_winrate?: string;
    by_overall?: string;
  };
}

const BacktestMetrics: React.FC<Props> = ({ results, bestModel }) => {
  const modelNames: { [key: string]: string } = {
    linear: '線性回歸',
    random_forest: '隨機森林',
    lstm: 'LSTM 神經網絡'
  };

  const modelEmojis: { [key: string]: string } = {
    linear: '⚡',
    random_forest: '🌲',
    lstm: '🧠'
  };

  const getModelClass = (modelKey: string) => {
    const classes = ['metric-row'];
    if (modelKey === bestModel.by_overall) classes.push('best-overall');
    if (modelKey === bestModel.by_direction) classes.push('best-direction');
    if (modelKey === bestModel.by_accuracy) classes.push('best-accuracy');
    if (modelKey === bestModel.by_winrate) classes.push('best-winrate');
    return classes.join(' ');
  };

  const getRatingClass = (value: number, metric: string) => {
    if (metric === 'mape') {
      if (value < 5) return 'excellent';
      if (value < 10) return 'good';
      if (value < 20) return 'fair';
      return 'poor';
    }
    // direction_accuracy, win_rate
    if (value >= 80) return 'excellent';
    if (value >= 70) return 'good';
    if (value >= 60) return 'fair';
    return 'poor';
  };

  return (
    <div className="backtest-metrics-container">
      <h3>📊 回測指標詳細分析</h3>
      
      <div className="metrics-table-wrapper">
        <table className="backtest-metrics-table">
          <thead>
            <tr>
              <th>模型</th>
              <th>方向準確度</th>
              <th>MAPE</th>
              <th>勝率 (±5%)</th>
              <th>RMSE</th>
              <th>MAE</th>
              <th>預測變化</th>
              <th>實際變化</th>
              <th>預測次數</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(results).map(([modelKey, data]) => (
              data.success ? (
                <tr key={modelKey} className={getModelClass(modelKey)}>
                  <td className="model-name-cell">
                    <span className="model-emoji">{modelEmojis[modelKey]}</span>
                    <span>{modelNames[modelKey]}</span>
                    {modelKey === bestModel.by_overall && <span className="badge gold">🏆</span>}
                    {modelKey === bestModel.by_direction && <span className="badge purple">📈</span>}
                    {modelKey === bestModel.by_accuracy && <span className="badge blue">🎯</span>}
                    {modelKey === bestModel.by_winrate && <span className="badge green">✓</span>}
                  </td>
                  
                  <td>
                    <div className="metric-cell">
                      <span className={`metric-badge ${getRatingClass(data.metrics.direction_accuracy, 'direction')}`}>
                        {data.metrics.direction_accuracy}%
                      </span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill direction"
                          style={{ width: `${data.metrics.direction_accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <span className={`metric-badge ${getRatingClass(data.metrics.mape, 'mape')}`}>
                      {data.metrics.mape}%
                    </span>
                  </td>
                  
                  <td>
                    <div className="metric-cell">
                      <span className={`metric-badge ${getRatingClass(data.metrics.win_rate, 'winrate')}`}>
                        {data.metrics.win_rate}%
                      </span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill winrate"
                          style={{ width: `${data.metrics.win_rate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  
                  <td>${data.metrics.rmse.toFixed(2)}</td>
                  <td>${data.metrics.mae.toFixed(2)}</td>
                  
                  <td className={data.metrics.predicted_change >= 0 ? 'positive' : 'negative'}>
                    {data.metrics.predicted_change >= 0 ? '+' : ''}{data.metrics.predicted_change}%
                  </td>
                  
                  <td className={data.metrics.actual_change >= 0 ? 'positive' : 'negative'}>
                    {data.metrics.actual_change >= 0 ? '+' : ''}{data.metrics.actual_change}%
                  </td>
                  
                  <td>{data.metrics.total_predictions}</td>
                </tr>
              ) : (
                <tr key={modelKey}>
                  <td className="model-name-cell">
                    <span className="model-emoji">{modelEmojis[modelKey]}</span>
                    <span>{modelNames[modelKey]}</span>
                  </td>
                  <td colSpan={8} className="error-cell">
                    <span className="error-message">❌ 回測失敗</span>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      <div className="metrics-legend">
        <div className="legend-section">
          <h4>🏆 最佳模型標記</h4>
          <div className="legend-badges">
            <div className="legend-item">
              <span className="badge gold">🏆</span> 綜合最佳
            </div>
            <div className="legend-item">
              <span className="badge purple">📈</span> 最佳方向
            </div>
            <div className="legend-item">
              <span className="badge blue">🎯</span> 最低誤差
            </div>
            <div className="legend-item">
              <span className="badge green">✓</span> 最高勝率
            </div>
          </div>
        </div>

        <div className="legend-section">
          <h4>📈 評分等級</h4>
          <div className="legend-ratings">
            <div className="rating-item">
              <span className="metric-badge excellent">優秀</span>
              <span className="rating-desc">MAPE &lt; 5% 或 準確度 ≥ 80%</span>
            </div>
            <div className="rating-item">
              <span className="metric-badge good">良好</span>
              <span className="rating-desc">MAPE &lt; 10% 或 準確度 ≥ 70%</span>
            </div>
            <div className="rating-item">
              <span className="metric-badge fair">一般</span>
              <span className="rating-desc">MAPE &lt; 20% 或 準確度 ≥ 60%</span>
            </div>
            <div className="rating-item">
              <span className="metric-badge poor">待改進</span>
              <span className="rating-desc">其他情況</span>
            </div>
          </div>
        </div>
      </div>

      <div className="metrics-explanation">
        <h4>📖 指標說明</h4>
        <ul>
          <li><strong>方向準確度:</strong> 預測漲跌方向正確的百分比</li>
          <li><strong>MAPE (平均絕對百分比誤差):</strong> 越低越好，表示預測偏離實際價格的平均程度</li>
          <li><strong>勝率:</strong> 預測誤差在 ±5% 以內的比例</li>
          <li><strong>RMSE (均方根誤差):</strong> 衡量預測誤差的標準差</li>
          <li><strong>MAE (平均絕對誤差):</strong> 預測價格與實際價格的平均差距</li>
        </ul>
      </div>
    </div>
  );
};

export default BacktestMetrics;
