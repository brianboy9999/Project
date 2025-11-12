import axios from 'axios';
import type { StockListResponse, StockData, CompanyDetail, StockPrediction } from '../../types/stock/stock';
import { stockList } from '../../data/stockList';

const API_BASE_URL = 'http://localhost:8000';

export const stockService = {
    // 獲取股票列表（使用本地資料）
    getStockList: async (): Promise<StockListResponse> => {
        // 模擬 API 回應格式
        return {
            status: 'success',
            count: stockList.length,
            data: stockList
        };
    },

    // 獲取股票資料
    getStock: async (
        ticker: string, 
        period?: string,
        start?: string,
        end?: string
    ): Promise<StockData> => {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        
        const response = await axios.get(`${API_BASE_URL}/stock/${ticker}?${params.toString()}`);
        return response.data;
    },

    // 獲取公司詳細資訊
    getCompanyDetail: async (ticker: string): Promise<CompanyDetail> => {
        const response = await axios.get(`${API_BASE_URL}/stock/${ticker}/detail`);
        return response.data;
    },

    // 獲取股價預測
    getStockPrediction: async (
        ticker: string,
        days: number = 30,
        period: string = '1y'
    ): Promise<StockPrediction> => {
        const params = new URLSearchParams();
        params.append('days', days.toString());
        params.append('period', period);
        
        const response = await axios.get(`${API_BASE_URL}/stock/${ticker}/predict?${params.toString()}`);
        return response.data;
    }
};