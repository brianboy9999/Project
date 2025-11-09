export interface StockTicker {
    ticker: string;  // 改為對應後端的 ticker
    name: string;
}

export interface StockListResponse {
    status: string;
    count: number;
    data: StockTicker[];
}

export interface StockData {
    symbol: string;
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}