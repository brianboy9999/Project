import axios from 'axios';
import type { StockListResponse, StockData } from '../types/stock';
import { stockList } from '../data/stockList';

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

    // 獲取單一股票資料
    getSingleStock: async (ticker: string, period: string = '1mo'): Promise<StockData> => {
        const response = await axios.get(`${API_BASE_URL}/stock/${ticker}?period=${period}`);
        return response.data;
    }
};