import { useEffect, useState } from 'react';
import type { TradingSignal, SignalType } from '../../../types/stock/signal';
import { getTradingSignal } from '../../../services/stock/signalService';
import './TradingSignalPanelCompact.css';

interface TradingSignalPanelCompactProps {
  ticker: string;
}

const TradingSignalPanelCompact = ({ ticker }: TradingSignalPanelCompactProps) => {
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

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
        bgColor: '#d1fae5'
      },
      buy: {
        label: '買入',
        icon: '✅',
        color: '#22c55e',
        bgColor: '#dcfce7'
      },
      hold: {
        label: '持有',
        icon: '⚠️',
        color: '#f59e0b',
        bgColor: '#fef3c7'
      },
      sell: {
        label: '賣出',
        icon: '⛔',
        color: '#ef4444',
        bgColor: '#fee2e2'
      },
      strong_sell: {
        label: '強烈賣出',
        icon: '❌',
        color: '#dc2626',
        bgColor: '#fecaca'
      }
    };
    return configs[signalType] || configs.hold;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#10b981';
    if (score >= 60) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    if (score >= 25) return '#ef4444';
    return '#dc2626';
  };

  if (loading) {
    return (
      <div className="signal-compact loading">
        <div className="loading-spinner-small"></div>
        <span>分析中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="signal-compact error">
        <span>❌ {error}</span>
        <button onClick={loadSignal} className="retry-btn-small">重試</button>
      </div>
    );
  }

  if (!signal) {
    return null;
  }

  const config = getSignalConfig(signal.signal);

  return (
    <div className="signal-compact">
      <div className="signal-compact-horizontal">
        {/* 左側：訊號摘要 */}
        <div className="signal-left">
          {/* 訊號徽章和評分 */}
          <div className="signal-badge-row">
            <div className="signal-badge-compact" style={{ backgroundColor: config.bgColor, color: config.color }}>
              <span className="signal-icon-compact">{config.icon}</span>
              <span className="signal-label-compact">{config.label}</span>
            </div>
            
            <div className="signal-score-compact">
              <span className="score-number" style={{ color: getScoreColor(signal.score) }}>
                {signal.score.toFixed(0)}
              </span>
              <span className="score-label">分</span>
            </div>

            <div className="signal-confidence-compact">
              <span className="confidence-label-small">信心</span>
              <span className="confidence-number" style={{ color: config.color }}>
                {(signal.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* 建議說明 */}
          <div className="signal-recommendation-compact">
            {signal.recommendation.split('。')[0] || signal.recommendation.split('\n')[0]}。
          </div>

          {/* 關鍵價位 - 卡片式 */}
          <div className="key-levels-card">
            <h4 className="card-title">關鍵價位</h4>
            <div className="key-levels-grid-horizontal">
              <div className="level-card">
                <span className="level-label-card">當前價</span>
                <span className="level-value-card current">${signal.key_levels.current_price.toFixed(2)}</span>
              </div>
              <div className="level-card">
                <span className="level-label-card">支撐位</span>
                <span className="level-value-card support">${signal.key_levels.support.toFixed(2)}</span>
              </div>
              <div className="level-card">
                <span className="level-label-card">阻力位</span>
                <span className="level-value-card resistance">${signal.key_levels.resistance.toFixed(2)}</span>
              </div>
              <div className="level-card">
                <span className="level-label-card">止損價</span>
                <span className="level-value-card stop-loss">${signal.key_levels.stop_loss.toFixed(2)}</span>
              </div>
              <div className="level-card">
                <span className="level-label-card">止盈價</span>
                <span className="level-value-card take-profit">${signal.key_levels.take_profit.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 展開按鈕 */}
          <button 
            className="expand-toggle-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲ 收起' : '▼ 詳細'}
          </button>
        </div>
      </div>

      {/* 展開的詳細內容 */}
      {expanded && (
        <div className="signal-expanded-content">
          {/* 指標評分 */}
          <div className="category-scores-compact">
                <h4>指標評分</h4>
                <div className="category-grid-compact">
                  {Object.entries(signal.category_scores).map(([category, score]) => {
                    const categoryNames: Record<string, string> = {
                      trend: '📈 趨勢',
                      momentum: '⚡ 動能',
                      volume: '📊 成交量',
                      volatility: '📉 波動',
                      ai_prediction: '🤖 AI'
                    };
                    return (
                      <div key={category} className="category-item-compact">
                        <span className="category-name-compact">{categoryNames[category]}</span>
                        <div className="category-bar-container">
                          <div className="category-bar-compact">
                            <div
                              className="category-fill-compact"
                              style={{
                                width: `${score}%`,
                                backgroundColor: getScoreColor(score)
                              }}
                            ></div>
                          </div>
                          <span className="category-score-compact">{score.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 市場資訊 - 卡片式 */}
              {signal.market_info && (
                <div className="market-info-card">
                  <h4 className="card-title">市場資訊</h4>
                  <div className="market-stats-grid">
                    <div className="market-stat-card">
                      <span className="stat-label-card">日漲跌</span>
                      <span className={`stat-value-card ${signal.market_info.price_change_1d >= 0 ? 'positive' : 'negative'}`}>
                        {signal.market_info.price_change_1d >= 0 ? '+' : ''}
                        {signal.market_info.price_change_1d.toFixed(2)}%
                      </span>
                    </div>
                    <div className="market-stat-card">
                      <span className="stat-label-card">5日</span>
                      <span className={`stat-value-card ${signal.market_info.price_change_5d >= 0 ? 'positive' : 'negative'}`}>
                        {signal.market_info.price_change_5d >= 0 ? '+' : ''}
                        {signal.market_info.price_change_5d.toFixed(2)}%
                      </span>
                    </div>
                    <div className="market-stat-card">
                      <span className="stat-label-card">20日</span>
                      <span className={`stat-value-card ${signal.market_info.price_change_20d >= 0 ? 'positive' : 'negative'}`}>
                        {signal.market_info.price_change_20d >= 0 ? '+' : ''}
                        {signal.market_info.price_change_20d.toFixed(2)}%
                      </span>
                    </div>
                    <div className="market-stat-card">
                      <span className="stat-label-card">量能</span>
                      <span className={`stat-value-card ${signal.market_info.volume_vs_avg >= 0 ? 'positive' : 'negative'}`}>
                        {signal.market_info.volume_vs_avg >= 0 ? '+' : ''}
                        {signal.market_info.volume_vs_avg.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 主要訊號說明 */}
              <div className="main-signals-compact">
                <h4>主要訊號</h4>
                {Object.entries(signal.detailed_signals).map(([category, indicators]) => {
                  if (!indicators || indicators.length === 0) return null;
                  
                  const categoryNames: Record<string, string> = {
                    trend: '📈 趨勢',
                    momentum: '⚡ 動能',
                    volume: '📊 成交量',
                    volatility: '📉 波動',
                    ai: '🤖 AI'
                  };

                  // 只顯示影響較大的訊號 (impact >= 10 或 <= -10)
                  const importantSignals = indicators.filter((ind: any) => Math.abs(ind.impact) >= 10);
                  if (importantSignals.length === 0) return null;

                  return (
                    <div key={category} className="signal-category-compact">
                      <div className="category-title-compact">{categoryNames[category]}</div>
                      <ul className="signal-list-compact">
                        {importantSignals.slice(0, 3).map((indicator: any, index: number) => (
                          <li key={index} className="signal-item-compact">
                            <span className={`impact-badge ${indicator.impact > 0 ? 'positive' : 'negative'}`}>
                              {indicator.impact > 0 ? '+' : ''}{indicator.impact}
                            </span>
                            <span className="signal-description-compact">{indicator.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 右側：市場資訊 */}
            <div className="expanded-right">
              {signal.market_info && (
                <div className="market-info-compact">
                  <h4>市場資訊</h4>
                  <div className="market-stats-compact">
                    <div className="market-stat-item">
                      <span className="stat-label">日漲跌</span>
                      <span className={`stat-value ${signal.market_info.price_change_1d >= 0 ? 'positive' : 'negative'}`}>
                        {signal.market_info.price_change_1d >= 0 ? '+' : ''}
                        {signal.market_info.price_change_1d.toFixed(2)}%
                      </span>
                    </div>
                    <div className="market-stat-item">
                      <span className="stat-label">5日</span>
                      <span className={`stat-value ${signal.market_info.price_change_5d >= 0 ? 'positive' : 'negative'}`}>
                        {signal.market_info.price_change_5d >= 0 ? '+' : ''}
                        {signal.market_info.price_change_5d.toFixed(2)}%
                      </span>
                    </div>
                    <div className="market-stat-item">
                      <span className="stat-label">20日</span>
                      <span className={`stat-value ${signal.market_info.price_change_20d >= 0 ? 'positive' : 'negative'}`}>
                        {signal.market_info.price_change_20d >= 0 ? '+' : ''}
                        {signal.market_info.price_change_20d.toFixed(2)}%
                      </span>
                    </div>
                    <div className="market-stat-item">
                      <span className="stat-label">量能</span>
                      <span className={`stat-value ${signal.market_info.volume_vs_avg >= 0 ? 'positive' : 'negative'}`}>
                        {signal.market_info.volume_vs_avg >= 0 ? '+' : ''}
                        {signal.market_info.volume_vs_avg.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingSignalPanelCompact;
