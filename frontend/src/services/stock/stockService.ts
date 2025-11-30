import axios from 'axios';
import type { StockListResponse, StockData, CompanyDetail, StockPrediction } from '../../types/stock/stock';
import { stockList } from '../../data/stockList';

const API_BASE_URL = 'http://localhost:8000';

export type ModelType = 'linear' | 'random_forest' | 'lstm';

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

    // 獲取股價預測（支援多模型）
    getStockPrediction: async (
        ticker: string,
        days: number = 30,
        period: string = '1y',
        model: ModelType = 'random_forest'
    ): Promise<StockPrediction> => {
        const params = new URLSearchParams();
        params.append('days', days.toString());
        params.append('period', period);
        params.append('model', model);
        
        const response = await axios.get(`${API_BASE_URL}/stock/${ticker}/predict?${params.toString()}`);
        return response.data;
    },

    // 多模型預測比較
    compareModels: async (
        ticker: string,
        days: number = 30,
        period: string = '1y',
        models: ModelType[] = ['linear', 'random_forest', 'lstm']
    ) => {
        const params = new URLSearchParams();
        params.append('days', days.toString());
        params.append('period', period);
        // 添加多個 models 參數
        models.forEach(model => params.append('models', model));
        
        const response = await axios.get(`${API_BASE_URL}/stock/${ticker}/predict/compare?${params.toString()}`);
        return response.data;
    },

    // 取得可用的模型列表
    getAvailableModels: async () => {
        const response = await axios.get(`${API_BASE_URL}/stock/models/available`);
        return response.data;
    },

    // 回測單一模型
    backtestModel: async (
        ticker: string,
        model: ModelType = 'random_forest',
        backtestDays: number = 30,
        trainingPeriod: string = '1y'
    ) => {
        const params = new URLSearchParams();
        params.append('model', model);
        params.append('backtest_days', backtestDays.toString());
        params.append('training_period', trainingPeriod);
        
        const response = await axios.get(`${API_BASE_URL}/stock/${ticker}/backtest?${params.toString()}`);
        return response.data;
    },

    // 比較多個模型的回測結果
    compareBacktest: async (
        ticker: string,
        backtestDays: number = 30,
        trainingPeriod: string = '1y',
        models: ModelType[] = ['linear', 'random_forest', 'lstm']
    ) => {
        const params = new URLSearchParams();
        params.append('backtest_days', backtestDays.toString());
        params.append('training_period', trainingPeriod);
        // 添加多個 models 參數
        models.forEach(model => params.append('models', model));
        
        const response = await axios.get(`${API_BASE_URL}/stock/${ticker}/backtest/compare?${params.toString()}`);
        return response.data;
    }
};