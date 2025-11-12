export interface StockTicker {
    ticker: string;  // 改為對應後端的 ticker
    name: string;
}

export interface StockListResponse {
    status: string;
    count: number;
    data: StockTicker[];
}

export interface StockPrice {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    adj_close: number;
    volume: number;
}

export interface StockData {
    ticker: string;
    name: string;
    prices: StockPrice[];
}

export interface CompanyInfo {
    ticker: string;
    name: string;
    sector?: string;
    industry?: string;
    market_cap?: number;
    employees?: number;
    website?: string;
    description?: string;
    ceo?: string;
    city?: string;
    state?: string;
    country?: string;
}

export interface NewsItem {
    title: string;
    publisher: string;
    link: string;
    published_at?: string;
    thumbnail?: string;
}

export interface FinancialData {
    data: Record<string, Record<string, number | null>>;
}

export interface CompanyDetail {
    info: CompanyInfo;
    news: NewsItem[];
    financials?: FinancialData;
    balance_sheet?: FinancialData;
}

export interface PredictionPoint {
    date: string;
    predicted_price: number;
    confidence: number;  // 0-1 之間
}

export interface HistoricalPoint {
    date: string;
    actual_price: number;
    ma5?: number;
    ma10?: number;
    ma20?: number;
}

export interface PredictionMetrics {
    r2_score: number;
    training_samples: number;
    model_type: string;
}

export interface StockPrediction {
    success: boolean;
    ticker?: string;
    predictions: PredictionPoint[];
    historical_data: HistoricalPoint[];
    metrics?: PredictionMetrics;
    current_price?: number;
    last_update?: string;
    message?: string;
}