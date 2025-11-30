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
  ReferenceLine
} from 'recharts';
import './ModelComparisonChart.css';

interface ModelComparisonData {
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
    };
  };
  best_model: {
    by_accuracy?: string;
    by_speed?: string;
    by_overall?: string;
  };
}

interface Props {
  comparisonData: ModelComparisonData;
}

const ModelComparisonChart: React.FC<Props> = ({ comparisonData }) => {
  // 合併所有模型的數據到一個圖表
  const mergeChartData = () => {
    const { comparisons } = comparisonData;
    const dataMap = new Map<string, any>();

    // 1. 先加入歷史數據（所有模型共用）
    const firstModel = Object.values(comparisons).find(m => m.success);
    if (firstModel?.historical_data) {
      firstModel.historical_data.forEach(item => {
        dataMap.set(item.date, {
          date: item.date,
          actual: item.actual_price,
          ma5: item.ma5,
          ma10: item.ma10,
          ma20: item.ma20
        });
      });
    }

    // 2. 加入各模型的預測數據
    Object.entries(comparisons).forEach(([modelName, modelData]) => {
      if (modelData.success && modelData.predictions) {
        modelData.predictions.forEach(pred => {
          const existing = dataMap.get(pred.date) || { date: pred.date };
          existing[modelName] = pred.predicted_price;
          dataMap.set(pred.date, existing);
        });
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const chartData = mergeChartData();

  // 模型顏色配置
  const modelColors = {
    linear: '#22c55e',
    random_forest: '#f59e0b',
    lstm: '#a855f7'
  };

  const modelNames = {
    linear: '線性回歸',
    random_forest: '隨機森林',
    lstm: 'LSTM'
  };

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="comparison-tooltip">
          <p className="tooltip-date">{data.date}</p>
          {data.actual && <p className="actual">實際: ${data.actual.toFixed(2)}</p>}
          {Object.keys(modelColors).map(model => (
            data[model] && (
              <p key={model} style={{ color: modelColors[model as keyof typeof modelColors] }}>
                {modelNames[model as keyof typeof modelNames]}: ${data[model].toFixed(2)}
              </p>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  // 找出最後的歷史數據點位置
  const firstModel = Object.values(comparisonData.comparisons).find(m => m.success);
  const lastHistoricalDate = firstModel?.historical_data?.[
    firstModel.historical_data.length - 1
  ]?.date;

  return (
    <div className="model-comparison-chart-container">
      <div className="comparison-header">
        <h3>多模型預測比較 - {comparisonData.ticker}</h3>
        <div className="best-models">
          {comparisonData.best_model.by_overall && (
            <div className="best-badge overall">
              🏆 綜合最佳: {modelNames[comparisonData.best_model.by_overall as keyof typeof modelNames]}
            </div>
          )}
          {comparisonData.best_model.by_accuracy && (
            <div className="best-badge accuracy">
              🎯 最準確: {modelNames[comparisonData.best_model.by_accuracy as keyof typeof modelNames]}
            </div>
          )}
          {comparisonData.best_model.by_speed && (
            <div className="best-badge speed">
              ⚡ 最快速: {modelNames[comparisonData.best_model.by_speed as keyof typeof modelNames]}
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
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
            stroke="#94a3b8" 
            strokeWidth={1}
            dot={false}
            name="MA5"
            strokeDasharray="3 3"
          />
          <Line 
            type="monotone" 
            dataKey="ma10" 
            stroke="#64748b" 
            strokeWidth={1}
            dot={false}
            name="MA10"
            strokeDasharray="3 3"
          />
          <Line 
            type="monotone" 
            dataKey="ma20" 
            stroke="#475569" 
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
            name="歷史實際"
          />
          
          {/* 各模型預測 */}
          {Object.keys(modelColors).map(model => (
            comparisonData.comparisons[model]?.success && (
              <Line 
                key={model}
                type="monotone" 
                dataKey={model} 
                stroke={modelColors[model as keyof typeof modelColors]} 
                strokeWidth={2}
                dot={{ r: 3 }}
                name={modelNames[model as keyof typeof modelNames]}
                strokeDasharray="5 5"
              />
            )
          ))}
          
          {/* 分隔線 */}
          {lastHistoricalDate && (
            <ReferenceLine 
              x={lastHistoricalDate} 
              stroke="#666" 
              strokeDasharray="3 3"
              label="預測開始"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModelComparisonChart;
