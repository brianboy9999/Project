import React from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter
} from 'recharts';
import './BacktestChart.css';

interface ComparisonDataPoint {
  date: string;
  predicted_price: number;
  actual_price: number;
  error: number;
  error_percentage: number;
  confidence: number;
}

interface BacktestResult {
  success: boolean;
  ticker: string;
  model_type: string;
  backtest_days: number;
  split_date: string;
  comparison_data: ComparisonDataPoint[];
  metrics: {
    mape: number;
    rmse: number;
    mae: number;
    direction_accuracy: number;
    win_rate: number;
    predicted_change: number;
    actual_change: number;
  };
  training_end_price: number;
}

interface Props {
  backtestResult: BacktestResult;
}

const BacktestChart: React.FC<Props> = ({ backtestResult }) => {
  const { comparison_data, split_date, metrics, model_type } = backtestResult;

  const modelNames: { [key: string]: string } = {
    linear: '線性回歸',
    random_forest: '隨機森林',
    lstm: 'LSTM 神經網絡'
  };

  // 準備圖表數據
  const chartData = comparison_data.map(point => ({
    date: point.date.split(' ')[0],
    predicted: point.predicted_price,
    actual: point.actual_price,
    error: Math.abs(point.error),
    errorPct: Math.abs(point.error_percentage)
  }));

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="backtest-tooltip">
          <p className="tooltip-date">{data.date}</p>
          <div className="tooltip-row predicted">
            <span className="label">預測價格:</span>
            <span className="value">${data.predicted.toFixed(2)}</span>
          </div>
          <div className="tooltip-row actual">
            <span className="label">實際價格:</span>
            <span className="value">${data.actual.toFixed(2)}</span>
          </div>
          <div className="tooltip-row error">
            <span className="label">誤差:</span>
            <span className="value">
              ${data.error.toFixed(2)} ({data.errorPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="backtest-chart-container">
      <div className="chart-header">
        <h3>📉 回測結果 - {modelNames[model_type]}</h3>
        <div className="split-info">
          <span className="split-label">回測分割點:</span>
          <span className="split-date">{split_date}</span>
        </div>
      </div>

      <div className="metrics-summary">
        <div className="metric-card">
          <div className="metric-label">方向準確度</div>
          <div className="metric-value direction">{metrics.direction_accuracy}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">MAPE</div>
          <div className="metric-value mape">{metrics.mape}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">勝率 (±5%)</div>
          <div className="metric-value winrate">{metrics.win_rate}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">預測變化</div>
          <div className={`metric-value ${metrics.predicted_change >= 0 ? 'positive' : 'negative'}`}>
            {metrics.predicted_change >= 0 ? '+' : ''}{metrics.predicted_change}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">實際變化</div>
          <div className={`metric-value ${metrics.actual_change >= 0 ? 'positive' : 'negative'}`}>
            {metrics.actual_change >= 0 ? '+' : ''}{metrics.actual_change}%
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: '價格 ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          {/* 實際價格線 */}
          <Line 
            type="monotone"
            dataKey="actual" 
            stroke="#2196F3" 
            strokeWidth={3}
            name="實際價格"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          
          {/* 預測價格線 */}
          <Line 
            type="monotone"
            dataKey="predicted" 
            stroke="#FF9800" 
            strokeWidth={3}
            strokeDasharray="5 5"
            name="預測價格"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          
          {/* 誤差散點 */}
          <Scatter 
            dataKey="error" 
            fill="#f44336"
            name="絕對誤差"
            shape="circle"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="chart-legend-info">
        <div className="legend-item">
          <div className="legend-line actual"></div>
          <span>實際價格 - 歷史真實數據</span>
        </div>
        <div className="legend-item">
          <div className="legend-line predicted"></div>
          <span>預測價格 - 模型預測結果</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot error"></div>
          <span>誤差大小 - 預測與實際的差距</span>
        </div>
      </div>
    </div>
  );
};

export default BacktestChart;
