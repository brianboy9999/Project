import React from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import type { StockPrediction } from '../../../types/stock/stock';
import './PredictionChart.css';

interface PredictionChartProps {
  prediction: StockPrediction;
}

interface ChartDataPoint {
  date: string;
  actual?: number;
  predicted?: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  confidence?: number;
}

const PredictionChart: React.FC<PredictionChartProps> = ({ prediction }) => {
  // 合併歷史數據和預測數據
  const chartData: ChartDataPoint[] = [
    // 歷史數據
    ...prediction.historical_data.map(item => ({
      date: item.date,
      actual: item.actual_price,
      ma5: item.ma5,
      ma10: item.ma10,
      ma20: item.ma20
    })),
    // 預測數據
    ...prediction.predictions.map(item => ({
      date: item.date,
      predicted: item.predicted_price,
      confidence: item.confidence
    }))
  ];

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="date">{data.date}</p>
          {data.actual && <p className="actual">實際價格: ${data.actual.toFixed(2)}</p>}
          {data.predicted && (
            <>
              <p className="predicted">預測價格: ${data.predicted.toFixed(2)}</p>
              {data.confidence && (
                <p className="confidence">信心度: {(data.confidence * 100).toFixed(0)}%</p>
              )}
            </>
          )}
          {data.ma5 && <p className="ma5">MA5: ${data.ma5.toFixed(2)}</p>}
          {data.ma10 && <p className="ma10">MA10: ${data.ma10.toFixed(2)}</p>}
          {data.ma20 && <p className="ma20">MA20: ${data.ma20.toFixed(2)}</p>}
        </div>
      );
    }
    return null;
  };

  // 計算預測變化百分比
  const currentPrice = prediction.current_price || 0;
  const lastPrediction = prediction.predictions[prediction.predictions.length - 1];
  const priceChange = lastPrediction ? ((lastPrediction.predicted_price - currentPrice) / currentPrice) * 100 : 0;

  return (
    <div className="prediction-chart-container">
      <div className="prediction-header">
        <h3>股價預測分析</h3>
        <div className="prediction-summary">
          <div className="metric">
            <span className="label">當前價格:</span>
            <span className="value">${currentPrice.toFixed(2)}</span>
          </div>
          <div className="metric">
            <span className="label">預測價格 ({prediction.predictions.length}天後):</span>
            <span className={`value ${priceChange >= 0 ? 'positive' : 'negative'}`}>
              ${lastPrediction?.predicted_price.toFixed(2)}
              <span className="change">
                ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%)
              </span>
            </span>
          </div>
          {prediction.metrics && (
            <div className="metric">
              <span className="label">模型準確度 (R²):</span>
              <span className="value">{(prediction.metrics.r2_score * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* 移動平均線 */}
          <Line 
            type="monotone" 
            dataKey="ma5" 
            stroke="#ffc658" 
            strokeWidth={1}
            dot={false}
            name="MA5"
            strokeDasharray="3 3"
          />
          <Line 
            type="monotone" 
            dataKey="ma10" 
            stroke="#ff7300" 
            strokeWidth={1}
            dot={false}
            name="MA10"
            strokeDasharray="3 3"
          />
          <Line 
            type="monotone" 
            dataKey="ma20" 
            stroke="#8884d8" 
            strokeWidth={1}
            dot={false}
            name="MA20"
            strokeDasharray="3 3"
          />
          
          {/* 實際價格 */}
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={false}
            name="實際價格"
          />
          
          {/* 預測價格 */}
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#dc2626" 
            strokeWidth={2}
            dot={{ r: 3 }}
            name="預測價格"
            strokeDasharray="5 5"
          />
          
          {/* 分隔線 - 標記預測開始的位置 */}
          <ReferenceLine 
            x={prediction.historical_data[prediction.historical_data.length - 1]?.date} 
            stroke="#666" 
            strokeDasharray="3 3"
            label="預測開始"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="prediction-info">
        <div className="info-item">
          <span className="icon">ℹ️</span>
          <span>使用 {prediction.metrics?.model_type || 'Linear Regression'} 模型</span>
        </div>
        <div className="info-item">
          <span className="icon">📊</span>
          <span>基於 {prediction.metrics?.training_samples || 0} 個歷史數據點訓練</span>
        </div>
        <div className="info-item">
          <span className="icon">⚠️</span>
          <span>預測僅供參考，投資有風險，請謹慎決策</span>
        </div>
      </div>
    </div>
  );
};

export default PredictionChart;
