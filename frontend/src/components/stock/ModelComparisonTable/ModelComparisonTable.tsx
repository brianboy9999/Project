import React from 'react';
import './ModelComparisonTable.css';

interface ModelSummary {
  success: boolean;
  r2_score?: number;
  elapsed_time?: number;
  predicted_change?: number;
  predicted_price?: number;
  current_price?: number;
  model_description?: string;
  training_samples?: number;
  error?: string;
}

interface Props {
  summary: {
    [modelName: string]: ModelSummary;
  };
  bestModel: {
    by_accuracy?: string;
    by_speed?: string;
    by_overall?: string;
  };
}

const ModelComparisonTable: React.FC<Props> = ({ summary, bestModel }) => {
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
    const classes = ['model-row'];
    if (modelKey === bestModel.by_overall) classes.push('best-overall');
    if (modelKey === bestModel.by_accuracy) classes.push('best-accuracy');
    if (modelKey === bestModel.by_speed) classes.push('best-speed');
    return classes.join(' ');
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    return `${seconds.toFixed(2)}s`;
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatChange = (change?: number) => {
    if (change === undefined) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    const className = change >= 0 ? 'positive' : 'negative';
    return <span className={className}>{sign}{change.toFixed(2)}%</span>;
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="model-comparison-table-container">
      <h3>模型性能比較</h3>
      
      <div className="table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>模型</th>
              <th>準確度 (R²)</th>
              <th>預測時間</th>
              <th>預測變化</th>
              <th>預測價格</th>
              <th>當前價格</th>
              <th>訓練樣本</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(summary).map(([modelKey, data]) => (
              <tr key={modelKey} className={getModelClass(modelKey)}>
                <td className="model-name">
                  <span className="model-emoji">{modelEmojis[modelKey]}</span>
                  <span>{modelNames[modelKey]}</span>
                  {modelKey === bestModel.by_overall && <span className="badge gold">🏆 最佳</span>}
                  {modelKey === bestModel.by_accuracy && <span className="badge purple">🎯</span>}
                  {modelKey === bestModel.by_speed && <span className="badge green">⚡</span>}
                </td>
                
                {data.success ? (
                  <>
                    <td className="accuracy">
                      <div className="metric-value">{formatPercentage(data.r2_score)}</div>
                      <div className="metric-bar">
                        <div 
                          className="bar-fill accuracy-bar"
                          style={{ width: `${(data.r2_score || 0) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td>{formatTime(data.elapsed_time)}</td>
                    <td>{formatChange(data.predicted_change)}</td>
                    <td>{formatPrice(data.predicted_price)}</td>
                    <td>{formatPrice(data.current_price)}</td>
                    <td>{data.training_samples || 'N/A'}</td>
                    <td><span className="status-badge success">✓ 成功</span></td>
                  </>
                ) : (
                  <>
                    <td colSpan={6} className="error-cell">
                      <span className="error-message">{data.error || '預測失敗'}</span>
                    </td>
                    <td><span className="status-badge error">✗ 失敗</span></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-legend">
        <div className="legend-item">
          <span className="legend-badge gold">🏆</span> 綜合最佳模型
        </div>
        <div className="legend-item">
          <span className="legend-badge purple">🎯</span> 準確度最高
        </div>
        <div className="legend-item">
          <span className="legend-badge green">⚡</span> 速度最快
        </div>
      </div>

      <div className="model-descriptions">
        {Object.entries(summary).map(([modelKey, data]) => (
          data.success && data.model_description && (
            <div key={modelKey} className="model-desc">
              <strong>{modelNames[modelKey]}:</strong> {data.model_description}
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ModelComparisonTable;
