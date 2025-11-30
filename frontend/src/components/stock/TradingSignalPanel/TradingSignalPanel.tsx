import { useEffect, useState } from 'react';
import type { TradingSignal, SignalType } from '../../../types/stock/signal';
import { getTradingSignal } from '../../../services/stock/signalService';
import './TradingSignalPanel.css';

interface TradingSignalPanelProps {
  ticker: string;
}

const TradingSignalPanel = ({ ticker }: TradingSignalPanelProps) => {
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSignal();
  }, [ticker]);

  const loadSignal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTradingSignal(ticker, true, 7);
      setSignal(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入訊號失敗');
    } finally {
      setLoading(false);
    }
  };

  const getSignalConfig = (signalType: SignalType) => {
    const configs = {
      strong_buy: {
        label: '強烈買入',
        icon: '💚',
        color: '#10b981',
        bgColor: '#d1fae5',
        stars: 5
      },
      buy: {
        label: '買入',
        icon: '✅',
        color: '#22c55e',
        bgColor: '#dcfce7',
        stars: 4
      },
      hold: {
        label: '持有',
        icon: '⚠️',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        stars: 3
      },
      sell: {
        label: '賣出',
        icon: '⛔',
        color: '#ef4444',
        bgColor: '#fee2e2',
        stars: 2
      },
      strong_sell: {
        label: '強烈賣出',
        icon: '❌',
        color: '#dc2626',
        bgColor: '#fecaca',
        stars: 1
      }
    };
    return configs[signalType] || configs.hold;
  };

  const renderStars = (count: number) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#10b981';
    if (score >= 60) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    if (score >= 25) return '#ef4444';
    return '#dc2626';
  };

  const getStrengthLabel = (strength: string) => {
    const labels = {
      strong: '強',
      medium: '中',
      weak: '弱'
    };
    return labels[strength as keyof typeof labels] || strength;
  };

  if (loading) {
    return (
      <div className="trading-signal-panel loading">
        <div className="loading-spinner"></div>
        <p>分析交易訊號中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trading-signal-panel error">
        <p>❌ {error}</p>
        <button onClick={loadSignal}>重試</button>
      </div>
    );
  }

  if (!signal) {
    return null;
  }

  const config = getSignalConfig(signal.signal);

  return (
    <div className="trading-signal-panel">
      {/* 主要訊號顯示 */}
      <div className="signal-header">
        <h2>🎯 交易訊號分析</h2>
        <button onClick={loadSignal} className="refresh-btn" title="重新整理">
          🔄
        </button>
      </div>

      <div className="signal-main" style={{ borderColor: config.color }}>
        <div className="signal-badge" style={{ backgroundColor: config.bgColor, color: config.color }}>
          <span className="signal-icon">{config.icon}</span>
          <span className="signal-label">{config.label}</span>
        </div>

        <div className="signal-score">
          <div className="score-circle" style={{ borderColor: getScoreColor(signal.score) }}>
            <span className="score-value" style={{ color: getScoreColor(signal.score) }}>
              {signal.score.toFixed(0)}
            </span>
            <span className="score-max">/100</span>
          </div>
          <div className="score-stars" style={{ color: config.color }}>
            {renderStars(config.stars)}
          </div>
        </div>

        <div className="signal-confidence">
          <span className="confidence-label">信心度</span>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{
                width: `${signal.confidence * 100}%`,
                backgroundColor: config.color
              }}
            ></div>
          </div>
          <span className="confidence-value">{(signal.confidence * 100).toFixed(0)}%</span>
        </div>

        <div className="signal-recommendation">
          <p>{signal.recommendation}</p>
        </div>
      </div>

      {/* 分類評分 */}
      <div className="signal-categories">
        <h3>指標分類評分</h3>
        <div className="category-grid">
          {Object.entries(signal.category_scores).map(([category, score]) => {
            const categoryNames: Record<string, string> = {
              trend: '趨勢',
              momentum: '動能',
              volume: '成交量',
              volatility: '波動率',
              ai_prediction: 'AI預測'
            };
            return (
              <div key={category} className="category-item">
                <div className="category-header">
                  <span className="category-name">{categoryNames[category]}</span>
                  <span className="category-score">{score.toFixed(0)}</span>
                </div>
                <div className="category-bar">
                  <div
                    className="category-fill"
                    style={{
                      width: `${score}%`,
                      backgroundColor: getScoreColor(score)
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 關鍵價位 */}
      <div className="signal-levels">
        <h3>關鍵價位</h3>
        <div className="levels-grid">
          <div className="level-item">
            <span className="level-label">當前價格</span>
            <span className="level-value current">${signal.key_levels.current_price.toFixed(2)}</span>
          </div>
          <div className="level-item">
            <span className="level-label">壓力位</span>
            <span className="level-value resistance">${signal.key_levels.resistance.toFixed(2)}</span>
          </div>
          <div className="level-item">
            <span className="level-label">支撐位</span>
            <span className="level-value support">${signal.key_levels.support.toFixed(2)}</span>
          </div>
          <div className="level-item">
            <span className="level-label">停利點</span>
            <span className="level-value take-profit">${signal.key_levels.take_profit.toFixed(2)}</span>
          </div>
          <div className="level-item">
            <span className="level-label">停損點</span>
            <span className="level-value stop-loss">${signal.key_levels.stop_loss.toFixed(2)}</span>
          </div>
          <div className="level-item">
            <span className="level-label">風險報酬比</span>
            <span className="level-value ratio">1:{signal.risk_reward_ratio.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 詳細訊號說明 */}
      <div className="signal-details">
        <h3>詳細分析</h3>
        {Object.entries(signal.detailed_signals).map(([category, indicators]) => {
          if (!indicators || indicators.length === 0) return null;

          const categoryNames: Record<string, string> = {
            trend: '📈 趨勢指標',
            momentum: '⚡ 動能指標',
            volume: '📊 成交量指標',
            volatility: '📉 波動率指標',
            ai: '🤖 AI 分析'
          };

          // 只顯示有實際影響的訊號
          const significantSignals = indicators.filter((ind: { impact: number }) => Math.abs(ind.impact) > 0);
          if (significantSignals.length === 0) return null;

          return (
            <div key={category} className="detail-category">
              <h4>{categoryNames[category]}</h4>
              <div className="indicator-list">
                {significantSignals.map((indicator: any, index: number) => (
                  <div key={index} className="indicator-item">
                    <div className="indicator-header">
                      <span className="indicator-name">{indicator.indicator}</span>
                      <span className={`indicator-strength strength-${indicator.strength}`}>
                        {getStrengthLabel(indicator.strength)}
                      </span>
                      <span
                        className={`indicator-impact ${indicator.impact > 0 ? 'positive' : 'negative'}`}
                      >
                        {indicator.impact > 0 ? '+' : ''}{indicator.impact}
                      </span>
                    </div>
                    <p className="indicator-description">{indicator.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 市場資訊 */}
      {signal.market_info && (
        <div className="signal-market-info">
          <h3>市場資訊</h3>
          <div className="market-grid">
            <div className="market-item">
              <span className="market-label">日漲跌</span>
              <span className={`market-value ${signal.market_info.price_change_1d >= 0 ? 'positive' : 'negative'}`}>
                {signal.market_info.price_change_1d >= 0 ? '+' : ''}
                {signal.market_info.price_change_1d.toFixed(2)}%
              </span>
            </div>
            <div className="market-item">
              <span className="market-label">5日漲跌</span>
              <span className={`market-value ${signal.market_info.price_change_5d >= 0 ? 'positive' : 'negative'}`}>
                {signal.market_info.price_change_5d >= 0 ? '+' : ''}
                {signal.market_info.price_change_5d.toFixed(2)}%
              </span>
            </div>
            <div className="market-item">
              <span className="market-label">20日漲跌</span>
              <span className={`market-value ${signal.market_info.price_change_20d >= 0 ? 'positive' : 'negative'}`}>
                {signal.market_info.price_change_20d >= 0 ? '+' : ''}
                {signal.market_info.price_change_20d.toFixed(2)}%
              </span>
            </div>
            <div className="market-item">
              <span className="market-label">量能變化</span>
              <span className={`market-value ${signal.market_info.volume_vs_avg >= 0 ? 'positive' : 'negative'}`}>
                {signal.market_info.volume_vs_avg >= 0 ? '+' : ''}
                {signal.market_info.volume_vs_avg.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="signal-footer">
        <small>更新時間: {new Date(signal.timestamp).toLocaleString('zh-TW')}</small>
      </div>
    </div>
  );
};

export default TradingSignalPanel;
