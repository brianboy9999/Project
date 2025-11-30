// 交易訊號相關型別定義

export type SignalType = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';

export interface SignalIndicator {
  indicator: string;
  signal: string;
  description: string;
  strength: 'strong' | 'medium' | 'weak';
  impact: number;
}

export interface CategoryScores {
  trend: number;
  momentum: number;
  volume: number;
  volatility: number;
  ai_prediction: number;
}

export interface DetailedSignals {
  trend: SignalIndicator[];
  momentum: SignalIndicator[];
  volume: SignalIndicator[];
  volatility: SignalIndicator[];
  ai: SignalIndicator[];
}

export interface KeyLevels {
  current_price: number;
  support: number;
  resistance: number;
  stop_loss: number;
  take_profit: number;
}

export interface MarketInfo {
  latest_close: number;
  latest_volume: number;
  price_change_1d: number;
  price_change_5d: number;
  price_change_20d: number;
  volume_vs_avg: number;
}

export interface TradingSignal {
  ticker: string;
  timestamp: string;
  signal: SignalType;
  score: number;
  confidence: number;
  recommendation: string;
  category_scores: CategoryScores;
  detailed_signals: DetailedSignals;
  key_levels: KeyLevels;
  risk_reward_ratio: number;
  market_info?: MarketInfo;
}

export interface TradingSignalResponse {
  success: boolean;
  data: TradingSignal;
}

export interface SignalHistoryItem {
  date: string;
  signal: SignalType;
  score: number;
  confidence: number;
  price: number;
  volume: number;
}

export interface SignalStatistics {
  total_signals: number;
  correct_signals: number;
  accuracy: number;
  buy_signals: number;
  sell_signals: number;
  hold_signals: number;
}

export interface SignalHistoryResponse {
  success: boolean;
  ticker: string;
  period: string;
  history: SignalHistoryItem[];
  statistics: SignalStatistics;
}
