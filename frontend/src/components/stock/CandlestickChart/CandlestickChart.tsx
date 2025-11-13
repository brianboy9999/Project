import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { StockPrice } from '../../../types/stock/stock';
import './CandlestickChart.css';

interface CandlestickChartProps {
    data: StockPrice[];
    height?: number;
}

// 計算移動平均線
const calculateMA = (data: StockPrice[], period: number) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data
            .slice(i - period + 1, i + 1)
            .reduce((total, item) => total + item.close, 0);
        result.push({
            time: data[i].date,
            value: sum / period
        });
    }
    return result;
};

// 檢查是否為週末或最近的數據
const getDataWarning = (data: StockPrice[]): string | null => {
    if (data.length === 0) return null;
    
    const latestDate = new Date(data[data.length - 1].date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // 檢查是否為週末
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return '⚠️ 今天是週末，美股休市，數據為上個交易日資料';
    }
    
    // 檢查數據是否過舊（超過3天）
    if (daysDiff > 3) {
        return '⚠️ 可能遇到假期或休市日，顯示最近交易日資料';
    }
    
    return null;
};

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ 
    data, 
    height = 400 
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        // 創建圖表
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'white' },
                textColor: '#333',
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
            grid: {
                vertLines: { color: '#e0e0e0' },
                horzLines: { color: '#e0e0e0' },
            },
            rightPriceScale: {
                borderColor: '#cccccc',
            },
            timeScale: {
                borderColor: '#cccccc',
                timeVisible: true,
                secondsVisible: false,
                // 限制縮放範圍
                minBarSpacing: 0.5,  // 最小柱間距（最多能縮小到什麼程度）
                // 防止滾動超出數據範圍
                rightOffset: 0,      // 右側不留空白
                fixLeftEdge: true,   // 固定左邊界
                fixRightEdge: true,  // 固定右邊界
            },
        });

        // 添加 K線圖系列
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        // 轉換資料格式
        const candlestickData = data.map(item => ({
            time: item.date,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
        }));

        candlestickSeries.setData(candlestickData);

        // 添加成交量圖（柱狀圖）
        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        const volumeData = data.map(item => ({
            time: item.date,
            value: item.volume,
            color: item.close >= item.open ? '#26a69a80' : '#ef535080',
        }));

        volumeSeries.setData(volumeData);

        // 添加移動平均線
        const ma5Data = calculateMA(data, 5);
        const ma10Data = calculateMA(data, 10);
        const ma20Data = calculateMA(data, 20);

        // MA5 線 (藍色)
        const ma5Series = chart.addLineSeries({
            color: '#2196F3',
            lineWidth: 2,
            title: 'MA5',
            priceLineVisible: false,
            lastValueVisible: false,
        });
        ma5Series.setData(ma5Data);

        // MA10 線 (橙色)
        const ma10Series = chart.addLineSeries({
            color: '#FF9800',
            lineWidth: 2,
            title: 'MA10',
            priceLineVisible: false,
            lastValueVisible: false,
        });
        ma10Series.setData(ma10Data);

        // MA20 線 (紫色)
        const ma20Series = chart.addLineSeries({
            color: '#9C27B0',
            lineWidth: 2,
            title: 'MA20',
            priceLineVisible: false,
            lastValueVisible: false,
        });
        ma20Series.setData(ma20Data);

        // 自動調整時間範圍並鎖定
        const timeScale = chart.timeScale();
        timeScale.fitContent();
        
        // 禁用時間軸的平移和縮放超出數據範圍
        timeScale.applyOptions({
            lockVisibleTimeRangeOnResize: true,  // 調整大小時鎖定範圍
            shiftVisibleRangeOnNewBar: false,    // 新數據時不自動移動
        });

        // 創建數據映射表，方便查詢（包含MA數據）
        const dataMap = new Map(data.map(item => [item.date, item]));
        const ma5Map = new Map(ma5Data.map(item => [item.time, item.value]));
        const ma10Map = new Map(ma10Data.map(item => [item.time, item.value]));
        const ma20Map = new Map(ma20Data.map(item => [item.time, item.value]));

        // 十字游標移動事件 - 顯示詳細數據
        chart.subscribeCrosshairMove((param) => {
            if (!tooltipRef.current || !param.time || !param.point) {
                if (tooltipRef.current) {
                    tooltipRef.current.style.display = 'none';
                }
                return;
            }

            const dateStr = param.time as string;
            const dataPoint = dataMap.get(dateStr);
            
            if (!dataPoint) {
                tooltipRef.current.style.display = 'none';
                return;
            }

            // 計算漲跌
            const change = dataPoint.close - dataPoint.open;
            const changePercent = (change / dataPoint.open) * 100;
            const isUp = change >= 0;

            // 格式化成交量
            const formatVolume = (vol: number) => {
                if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
                if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
                if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
                return vol.toString();
            };

            // 獲取MA數值
            const ma5Value = ma5Map.get(dateStr);
            const ma10Value = ma10Map.get(dateStr);
            const ma20Value = ma20Map.get(dateStr);

            // 更新提示框內容
            tooltipRef.current.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;">
                    ${dateStr}
                </div>
                <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 13px;">
                    <span style="color: #666;">開盤:</span>
                    <span style="font-weight: 500;">$${dataPoint.open.toFixed(2)}</span>
                    
                    <span style="color: #666;">最高:</span>
                    <span style="font-weight: 500; color: #26a69a;">$${dataPoint.high.toFixed(2)}</span>
                    
                    <span style="color: #666;">最低:</span>
                    <span style="font-weight: 500; color: #ef5350;">$${dataPoint.low.toFixed(2)}</span>
                    
                    <span style="color: #666;">收盤:</span>
                    <span style="font-weight: 500;">$${dataPoint.close.toFixed(2)}</span>
                    
                    <span style="color: #666;">成交量:</span>
                    <span style="font-weight: 500; color: #1976d2;">${formatVolume(dataPoint.volume)}</span>
                    
                    <span style="color: #666;">漲跌:</span>
                    <span style="font-weight: 600; color: ${isUp ? '#26a69a' : '#ef5350'};">
                        ${isUp ? '+' : ''}$${change.toFixed(2)} (${isUp ? '+' : ''}${changePercent.toFixed(2)}%)
                    </span>
                    ${ma5Value ? `
                    <span style="color: #666; margin-top: 4px; padding-top: 4px; border-top: 1px solid #f0f0f0;">MA5:</span>
                    <span style="font-weight: 500; color: #2196F3;">$${ma5Value.toFixed(2)}</span>
                    ` : ''}
                    ${ma10Value ? `
                    <span style="color: #666;">MA10:</span>
                    <span style="font-weight: 500; color: #FF9800;">$${ma10Value.toFixed(2)}</span>
                    ` : ''}
                    ${ma20Value ? `
                    <span style="color: #666;">MA20:</span>
                    <span style="font-weight: 500; color: #9C27B0;">$${ma20Value.toFixed(2)}</span>
                    ` : ''}
                </div>
            `;

            // 定位提示框
            tooltipRef.current.style.display = 'block';
            tooltipRef.current.style.left = `${param.point.x + 15}px`;
            tooltipRef.current.style.top = `${param.point.y + 15}px`;
        });

        // 響應式調整
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ 
                    width: chartContainerRef.current.clientWidth 
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, height]);

    const warning = getDataWarning(data);

    return (
        <div className="candlestick-chart-container" style={{ position: 'relative' }}>
            {warning && (
                <div style={{
                    padding: '10px 15px',
                    marginBottom: '10px',
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    borderRadius: '5px',
                    fontSize: '14px',
                    border: '1px solid #ffc107'
                }}>
                    {warning}
                </div>
            )}
            <div ref={chartContainerRef} className="candlestick-chart" />
            
            {/* 自訂工具提示框 */}
            <div
                ref={tooltipRef}
                style={{
                    position: 'absolute',
                    display: 'none',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    fontSize: '14px',
                    minWidth: '200px',
                    backdropFilter: 'blur(4px)'
                }}
            />
        </div>
    );
};
