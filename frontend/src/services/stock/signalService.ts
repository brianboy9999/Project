// 交易訊號服務

import type { TradingSignalResponse, SignalHistoryResponse } from '../../types/stock/signal';

const API_BASE_URL = 'http://localhost:8000';

/**
 * 獲取股票的交易訊號
 */
export const getTradingSignal = async (
  ticker: string,
  includePrediction: boolean = true,
  predictionDays: number = 7
): Promise<TradingSignalResponse> => {
  const params = new URLSearchParams({
    include_prediction: includePrediction.toString(),
    prediction_days: predictionDays.toString()
  });

  const response = await fetch(
    `${API_BASE_URL}/stock/${ticker}/signal?${params}`
  );

  if (!response.ok) {
    throw new Error(`獲取交易訊號失敗: ${response.statusText}`);
  }

  return response.json();
};

/**
 * 獲取股票的歷史訊號
 */
export const getSignalHistory = async (
  ticker: string,
  days: number = 30
): Promise<SignalHistoryResponse> => {
  const params = new URLSearchParams({
    days: days.toString()
  });

  const response = await fetch(
    `${API_BASE_URL}/stock/${ticker}/signal/history?${params}`
  );

  if (!response.ok) {
    throw new Error(`獲取訊號歷史失敗: ${response.statusText}`);
  }

  return response.json();
};
