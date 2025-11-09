import axios from 'axios';
import type { StockListResponse, StockData } from '../types/stock';

const API_BASE_URL = 'http://localhost:8000';

export const stockService = {
    // 獲取股票列表
    getStockList: async (): Promise<StockListResponse> => {
        const response = await axios.get(`${API_BASE_URL}/stock/list`);
        return response.data;
    },

    // 獲取單一股票資料
    getSingleStock: async (symbol: string): Promise<StockData[]> => {
        const response = await axios.get(`${API_BASE_URL}/stock/${symbol}`);
        return response.data;
    }
};