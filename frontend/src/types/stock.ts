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